using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace Engine.Worker.Services;

/// <summary>
/// Polls Control Plane for tasks and executes them using configured provider.
/// Providers: claude-code (CLI subprocess), claude-api (HTTP), ollama (local LLM)
/// </summary>
public class TaskPollingService : BackgroundService
{
    private readonly ILogger<TaskPollingService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly WorkerConfig _workerConfig;
    private readonly ClaudeConfig _claudeConfig;
    private readonly string _controlPlaneUrl;

    public TaskPollingService(
        ILogger<TaskPollingService> logger,
        IHttpClientFactory httpClientFactory,
        IOptions<WorkerConfig> workerConfig,
        IOptions<ClaudeConfig> claudeConfig,
        IConfiguration configuration)
    {
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _workerConfig = workerConfig.Value;
        _claudeConfig = claudeConfig.Value;
        _controlPlaneUrl = configuration["ControlPlane:ControlPlaneUrl"] ?? "http://localhost:5100";
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Task polling service started for worker {WorkerId}", _workerConfig.WorkerId);
        _logger.LogInformation("Provider: {Provider}", _workerConfig.Provider);
        _logger.LogInformation("Domains: {Domains}", string.Join(", ", _workerConfig.Domains));

        if (_workerConfig.Provider == "claude-api" && string.IsNullOrEmpty(_claudeConfig.ApiKey))
        {
            _logger.LogWarning("Claude API key not configured - tasks will be echoed only");
        }

        if (_workerConfig.Provider == "claude-code")
        {
            // Verify claude CLI is available
            try
            {
                var (fileName, baseArgs) = ResolveClaudeCli();
                var psi = new ProcessStartInfo
                {
                    FileName = fileName,
                    Arguments = baseArgs + " --version",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                // Remove CLAUDECODE env var to prevent nested session blocking
                psi.Environment.Remove("CLAUDECODE");
                // Add npm bin to PATH on Windows
                if (OperatingSystem.IsWindows())
                {
                    var npmBin = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "npm");
                    if (Directory.Exists(npmBin))
                    {
                        var path = psi.Environment.ContainsKey("PATH")
                            ? psi.Environment["PATH"]
                            : Environment.GetEnvironmentVariable("PATH") ?? "";
                        psi.Environment["PATH"] = npmBin + ";" + path;
                    }
                }
                using var proc = Process.Start(psi);
                if (proc != null)
                {
                    var version = await proc.StandardOutput.ReadToEndAsync(stoppingToken);
                    await proc.WaitForExitAsync(stoppingToken);
                    _logger.LogInformation("Claude Code CLI version: {Version}", version.Trim());
                }
            }
            catch (Exception ex)
            {
                _logger.LogError("Claude Code CLI not found: {Error}", ex.Message);
                _logger.LogWarning("Falling back to claude-api provider");
            }
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PollAndExecuteTask(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in task polling loop");
            }

            // Poll every 5 seconds
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }

    private async Task PollAndExecuteTask(CancellationToken stoppingToken)
    {
        var client = _httpClientFactory.CreateClient();
        var domains = string.Join(",", _workerConfig.Domains);
        var pollUrl = $"{_controlPlaneUrl}/tasks/poll?workerId={_workerConfig.WorkerId}&domains={domains}";

        var response = await client.GetAsync(pollUrl, stoppingToken);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Failed to poll for tasks: {StatusCode}", response.StatusCode);
            return;
        }

        var content = await response.Content.ReadAsStringAsync(stoppingToken);
        var taskResponse = JsonSerializer.Deserialize<TaskPollResponse>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        if (taskResponse?.HasTask != true)
        {
            return; // No task available
        }

        _logger.LogInformation("Received task {TaskId}: {Objective}", taskResponse.TaskId, taskResponse.Objective);

        // Send ACK to confirm receipt before executing
        var ackUrl = $"{_controlPlaneUrl}/tasks/{taskResponse.TaskId}/ack";
        var ackPayload = new { workerId = _workerConfig.WorkerId };
        var ackContent = new StringContent(
            JsonSerializer.Serialize(ackPayload),
            Encoding.UTF8,
            "application/json");
        var ackResponse = await client.PostAsync(ackUrl, ackContent, stoppingToken);
        if (!ackResponse.IsSuccessStatusCode)
        {
            _logger.LogWarning("Failed to ACK task {TaskId}: {Status}", taskResponse.TaskId, ackResponse.StatusCode);
            return; // Don't execute if we can't ACK
        }
        _logger.LogInformation("Task {TaskId} ACKed", taskResponse.TaskId);

        // Execute the task
        var stopwatch = Stopwatch.StartNew();
        string result;
        bool success = true;
        string? errorMessage = null;

        try
        {
            // Dispatch based on provider
            var workingDir = taskResponse.Inputs?.ContainsKey("workingDirectory") == true
                ? taskResponse.Inputs["workingDirectory"]?.ToString()
                : null;
            var timeout = taskResponse.TimeLimitSeconds ?? _workerConfig.DefaultTimeoutSeconds;
            // Coordination tasks need more time (plan + dispatch many sub-tasks)
            if (taskResponse.Domain?.Equals("coordination", StringComparison.OrdinalIgnoreCase) == true && timeout < 1800)
                timeout = 1800; // 30 minutes

            result = _workerConfig.Provider switch
            {
                "claude-code" => await ExecuteWithClaudeCode(
                    taskResponse.Objective!,
                    taskResponse.Inputs,
                    workingDir,
                    timeout,
                    taskResponse.TaskId,
                    taskResponse.ProjectId,
                    stoppingToken,
                    taskResponse.Domain),

                "ollama" => await ExecuteWithOllama(
                    taskResponse.Objective!,
                    taskResponse.Inputs,
                    timeout,
                    stoppingToken),

                "claude-api" => await ExecuteWithClaudeApi(
                    taskResponse.Objective!,
                    taskResponse.Inputs,
                    stoppingToken),

                "sound-gen" => await ExecuteWithSoundGen(
                    taskResponse.Objective!,
                    taskResponse.Inputs,
                    timeout,
                    stoppingToken),

                _ => $"[Error] Unknown provider: {_workerConfig.Provider}"
            };
        }
        catch (TimeoutException ex)
        {
            _logger.LogWarning("Task {TaskId} timed out: {Message}", taskResponse.TaskId, ex.Message);
            result = string.Empty;
            success = false;
            errorMessage = ex.Message;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to execute task {TaskId}", taskResponse.TaskId);
            result = string.Empty;
            success = false;
            errorMessage = ex.Message;
        }

        stopwatch.Stop();

        // Detect error results that weren't thrown as exceptions
        // (e.g. Claude Code returned empty output with stderr errors)
        if (success && result.StartsWith("[Error]", StringComparison.OrdinalIgnoreCase))
        {
            success = false;
            errorMessage = result;
            _logger.LogWarning("Task {TaskId} produced error result: {Error}",
                taskResponse.TaskId, result.Length > 200 ? result[..200] : result);
        }

        // Submit result
        var resultUrl = $"{_controlPlaneUrl}/tasks/{taskResponse.TaskId}/result";
        var resultPayload = new
        {
            workerId = _workerConfig.WorkerId,
            success,
            outputs = new { response = result },
            errorMessage,
            executionTimeMs = (int)stopwatch.ElapsedMilliseconds
        };

        var resultContent = new StringContent(
            JsonSerializer.Serialize(resultPayload),
            Encoding.UTF8,
            "application/json");

        // Retry result submission up to 3 times (ControlPlane may have restarted)
        for (int attempt = 1; attempt <= 3; attempt++)
        {
            try
            {
                var resultResponse = await client.PostAsync(resultUrl,
                    new StringContent(JsonSerializer.Serialize(resultPayload), Encoding.UTF8, "application/json"),
                    stoppingToken);

                if (resultResponse.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Task {TaskId} completed in {Ms}ms (provider: {Provider})",
                        taskResponse.TaskId, stopwatch.ElapsedMilliseconds, _workerConfig.Provider);
                    break;
                }

                _logger.LogWarning("Failed to submit result for task {TaskId} (attempt {Attempt}/3): {StatusCode}",
                    taskResponse.TaskId, attempt, resultResponse.StatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Result submission error for task {TaskId} (attempt {Attempt}/3): {Error}",
                    taskResponse.TaskId, attempt, ex.Message);
            }

            if (attempt < 3)
                await Task.Delay(TimeSpan.FromSeconds(5 * attempt), stoppingToken);
        }
    }

    // =========================================================================
    // PROVIDER 1: Claude Code CLI (Tier 1 — full autonomous agent)
    // =========================================================================

    /// <summary>
    /// Spawns `claude --task` as a subprocess. This gives the worker full autonomous
    /// capability: file I/O, bash, code generation, testing, web search.
    /// When Role is "lead", prepends decomposition instructions so Claude breaks
    /// the objective into sub-tasks and dispatches them via the Control Plane API.
    /// </summary>
    private async Task<string> ExecuteWithClaudeCode(
        string objective,
        Dictionary<string, object>? inputs,
        string? workingDirectory,
        int timeoutSeconds,
        string? taskId,
        string? projectId,
        CancellationToken stoppingToken,
        string? taskDomain = null)
    {
        // Build the full prompt with context
        var prompt = new StringBuilder();

        // Lead workers decompose coordination tasks; execute all other domains directly
        var isCoordinationTask = taskDomain?.Equals("coordination", StringComparison.OrdinalIgnoreCase) == true;
        if (_workerConfig.Role.Equals("lead", StringComparison.OrdinalIgnoreCase) && isCoordinationTask)
        {
            prompt.AppendLine(BuildLeadPrompt(objective, taskId, projectId, workingDirectory));
        }
        else
        {
            prompt.AppendLine(objective);
        }

        if (inputs != null && inputs.Count > 0)
        {
            prompt.AppendLine();
            prompt.AppendLine("Inputs:");
            prompt.AppendLine(JsonSerializer.Serialize(inputs, new JsonSerializerOptions { WriteIndented = true }));
        }

        // Escape the prompt for command line — write to temp file to avoid shell escaping issues
        var promptFile = Path.GetTempFileName();
        await File.WriteAllTextAsync(promptFile, prompt.ToString(), stoppingToken);

        try
        {
            var (fileName, baseArgs) = ResolveClaudeCli();
            var taskArgs = "-p --output-format json --dangerously-skip-permissions";
            var fullArgs = string.IsNullOrEmpty(baseArgs) ? taskArgs : $"{baseArgs} {taskArgs}";

            var psi = new ProcessStartInfo
            {
                FileName = fileName,
                Arguments = fullArgs,
                WorkingDirectory = !string.IsNullOrEmpty(workingDirectory) ? workingDirectory : _workerConfig.DefaultWorkingDirectory,
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            // If working directory is empty or invalid, don't set it (use current dir)
            if (string.IsNullOrEmpty(psi.WorkingDirectory) || !Directory.Exists(psi.WorkingDirectory))
            {
                psi.WorkingDirectory = null;
            }

            // Remove CLAUDECODE env var to prevent nested session blocking
            psi.Environment.Remove("CLAUDECODE");

            // Ensure npm global bin is on PATH (Windows) so claude CLI can be found
            if (OperatingSystem.IsWindows())
            {
                var npmBin = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "npm");
                if (Directory.Exists(npmBin))
                {
                    var existingPath = psi.Environment.ContainsKey("PATH")
                        ? psi.Environment["PATH"]
                        : Environment.GetEnvironmentVariable("PATH") ?? "";
                    if (!existingPath.Contains(npmBin, StringComparison.OrdinalIgnoreCase))
                        psi.Environment["PATH"] = npmBin + ";" + existingPath;
                }
            }

            // Set environment variables for context
            psi.Environment["TASK_WORKER_ID"] = _workerConfig.WorkerId;
            psi.Environment["TASK_CONTROL_PLANE"] = _controlPlaneUrl;
            if (!string.IsNullOrEmpty(taskId))
                psi.Environment["TASK_ID"] = taskId;
            if (!string.IsNullOrEmpty(projectId))
                psi.Environment["TASK_PROJECT_ID"] = projectId;

            _logger.LogInformation("Spawning Claude Code CLI: {Path} {Args}",
                psi.FileName, psi.Arguments);

            using var process = new Process { StartInfo = psi };
            var stdout = new StringBuilder();
            var stderr = new StringBuilder();

            process.OutputDataReceived += (_, e) =>
            {
                if (e.Data != null) stdout.AppendLine(e.Data);
            };
            process.ErrorDataReceived += (_, e) =>
            {
                if (e.Data != null)
                {
                    stderr.AppendLine(e.Data);
                    _logger.LogDebug("[claude stderr] {Line}", e.Data);
                }
            };

            process.Start();

            // Write the prompt to stdin then close it
            await process.StandardInput.WriteAsync(prompt.ToString());
            process.StandardInput.Close();

            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            // Wait with timeout
            var timeout = TimeSpan.FromSeconds(timeoutSeconds > 0 ? timeoutSeconds : _workerConfig.DefaultTimeoutSeconds);
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
            timeoutCts.CancelAfter(timeout);

            try
            {
                await process.WaitForExitAsync(timeoutCts.Token);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Claude Code CLI timed out after {Timeout}s, killing process", timeout.TotalSeconds);
                try { process.Kill(entireProcessTree: true); } catch { }
                throw new TimeoutException($"Task execution timed out after {timeout.TotalSeconds} seconds");
            }

            var output = stdout.ToString().Trim();
            var errors = stderr.ToString().Trim();

            if (process.ExitCode != 0)
            {
                _logger.LogWarning("Claude Code CLI exited with code {Code}. Stderr: {Errors}",
                    process.ExitCode, errors);
            }

            if (string.IsNullOrEmpty(output))
            {
                return errors.Length > 0
                    ? $"[Error] Claude Code returned no output. Stderr: {errors}"
                    : "[Error] Claude Code returned no output";
            }

            // Try to parse JSON output for structured result
            try
            {
                using var doc = JsonDocument.Parse(output);
                // Valid JSON — return as-is (structured result)
                return output;
            }
            catch (JsonException)
            {
                // Not JSON, return as plain text
                return output;
            }
        }
        finally
        {
            // Clean up temp file
            try { File.Delete(promptFile); } catch { }
        }
    }

    // =========================================================================
    // CLI Resolution Helper
    // =========================================================================

    /// <summary>
    /// Resolves how to invoke the Claude CLI. Returns (FileName, BaseArgs).
    /// Tries in order:
    /// 1. Configured ClaudeCodePath (if .js, uses NodePath)
    /// 2. claude.cmd in npm global bin (Windows)
    /// 3. "claude" on PATH (Linux/Mac)
    /// </summary>
    private (string FileName, string BaseArgs) ResolveClaudeCli()
    {
        var cliPath = _workerConfig.ClaudeCodePath;
        _logger.LogDebug("Resolving Claude CLI: configured path = '{Path}'", cliPath);

        // If it's a .js file, run it via node
        if (cliPath.EndsWith(".js", StringComparison.OrdinalIgnoreCase))
        {
            var nodePath = _workerConfig.NodePath;
            if (!string.IsNullOrEmpty(nodePath) && File.Exists(nodePath) && File.Exists(cliPath))
            {
                _logger.LogInformation("Using Node.js CLI: {Node} \"{Cli}\"", nodePath, cliPath);
                return (nodePath, $"\"{cliPath}\"");
            }
            _logger.LogWarning("Configured .js CLI path not found, trying fallbacks. NodePath={Node}, CliPath={Cli}",
                nodePath, cliPath);
        }

        // Windows fallback: look for claude.cmd in npm global bin
        if (OperatingSystem.IsWindows())
        {
            var npmBin = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "npm");
            var claudeCmd = Path.Combine(npmBin, "claude.cmd");
            if (File.Exists(claudeCmd))
            {
                _logger.LogInformation("Using claude.cmd at: {Path}", claudeCmd);
                return (claudeCmd, "");
            }
        }

        // Direct binary (e.g. "claude" on PATH)
        _logger.LogInformation("Using claude CLI directly: {Path}", cliPath);
        return (cliPath, "");
    }

    // =========================================================================
    // Lead Prompt Builder
    // =========================================================================

    /// <summary>
    /// Builds a prompt that instructs Claude Code to act as the Swarm Lead:
    /// 1. Plan — analyze the task and create an execution plan
    /// 2. Decompose — break it into sub-tasks for workers
    /// 3. Dispatch — submit sub-tasks via the Control Plane API
    /// </summary>
    private string BuildLeadPrompt(string objective, string? parentTaskId, string? projectId = null, string? workingDirectory = null)
    {
        // Map local path to network path for remote workers
        var dispatchWorkingDir = workingDirectory;
        if (!string.IsNullOrEmpty(dispatchWorkingDir) && !string.IsNullOrEmpty(_workerConfig.NetworkBasePath)
            && !string.IsNullOrEmpty(_workerConfig.DefaultWorkingDirectory))
        {
            dispatchWorkingDir = dispatchWorkingDir.Replace(
                _workerConfig.DefaultWorkingDirectory,
                _workerConfig.NetworkBasePath,
                StringComparison.OrdinalIgnoreCase);
        }

        var sb = new StringBuilder();
        sb.AppendLine("You are the SWARM LEAD for 256ai.Engine — the coordinator of a distributed AI worker swarm.");
        sb.AppendLine("Your job is to PLAN, DECOMPOSE, and DISPATCH. Do NOT execute the work yourself.");
        sb.AppendLine();
        sb.AppendLine("## Your Workflow");
        sb.AppendLine();
        sb.AppendLine("### Step 1: Plan");
        sb.AppendLine("Analyze the objective. Think about:");
        sb.AppendLine("- What needs to be built/done?");
        sb.AppendLine("- What are the components or phases?");
        sb.AppendLine("- What order should things happen in?");
        sb.AppendLine("- Which workers are best suited for each piece?");
        sb.AppendLine("Write out your plan before dispatching anything.");
        sb.AppendLine();
        sb.AppendLine("### Step 2: Decompose");
        sb.AppendLine("Break the plan into specific, actionable sub-tasks. Each sub-task should:");
        sb.AppendLine("- Be self-contained — workers have NO context beyond what you provide");
        sb.AppendLine("- Have a clear, detailed objective (include file paths, tech stack, specs)");
        sb.AppendLine("- Target the right domain so it routes to the right worker");
        sb.AppendLine("- Include dependencies if tasks must run in sequence");
        sb.AppendLine();
        sb.AppendLine("### Step 3: Dispatch");
        sb.AppendLine("Submit each sub-task to the Control Plane API using curl.");
        sb.AppendLine();
        sb.AppendLine("## Available Workers & Domains");
        sb.AppendLine();
        sb.AppendLine("| Domain | Worker | Capabilities |");
        sb.AppendLine("|--------|--------|--------------|");
        sb.AppendLine("| `code` | worker-ai02-claude (Claude Code) | Full autonomous coding — file I/O, bash, testing, multi-step |");
        sb.AppendLine("| `file-editing` | worker-ai02-claude (Claude Code) | Same as code — use for tasks needing file system access |");
        sb.AppendLine("| `code` | worker-ai02-coder-001 (Qwen 32B) | Code generation, transforms — text in/out only, no file I/O |");
        sb.AppendLine("| `data` | worker-ai02-coder-002 (Qwen 32B) | Data processing, analysis — text in/out only |");
        sb.AppendLine("| `ios-frontend` | worker-mac-001 (Claude Code on Mac) | iOS/Swift, frontend UI, mobile development |");
        sb.AppendLine("| `ui` | worker-mac-001 (Claude Code on Mac) | Web frontend, UI components |");
        sb.AppendLine("| `sound` | worker-dragon-sound-001 (Sound Engine) | AI audio — voice TTS, sound effects, music generation |");
        sb.AppendLine();
        sb.AppendLine("**Important:** For tasks that need to create/edit files, use domain `code` — this routes to Claude Code workers.");
        sb.AppendLine("For simple code generation (no file I/O), `code` also works but may route to Qwen which is faster.");
        sb.AppendLine();
        sb.AppendLine("## How to Dispatch");
        sb.AppendLine();
        sb.AppendLine("Submit each sub-task via curl:");
        sb.AppendLine("```bash");
        sb.AppendLine($"curl -X POST {_controlPlaneUrl}/tasks \\");
        sb.AppendLine("  -H \"Content-Type: application/json\" \\");
        sb.AppendLine("  -d '{");
        sb.AppendLine("    \"objective\": \"<detailed task description>\",");
        sb.AppendLine("    \"domain\": \"<code|data|sound|ios-frontend|ui>\",");
        sb.AppendLine("    \"expectedOutputs\": \"<what the worker should produce>\",");

        if (!string.IsNullOrEmpty(parentTaskId))
        {
            sb.AppendLine($"    \"parentTaskId\": \"{parentTaskId}\",");
        }

        if (!string.IsNullOrEmpty(projectId))
        {
            sb.AppendLine($"    \"projectId\": \"{projectId}\",");
        }

        if (!string.IsNullOrEmpty(dispatchWorkingDir))
        {
            // Escape backslashes for JSON
            var jsonPath = dispatchWorkingDir.Replace("\\", "\\\\");
            sb.AppendLine($"    \"inputs\": {{\"workingDirectory\": \"{jsonPath}\"}},");
        }

        sb.AppendLine("    \"dependsOn\": []");
        sb.AppendLine("  }'");
        sb.AppendLine("```");
        sb.AppendLine();
        sb.AppendLine("**dependsOn:** Pass an array of task IDs that must complete first. Get the task ID from the curl response.");
        sb.AppendLine("Example: Task B depends on Task A → create Task A first, get its ID, then pass it in Task B's dependsOn.");
        sb.AppendLine();

        if (!string.IsNullOrEmpty(dispatchWorkingDir))
        {
            sb.AppendLine($"**IMPORTANT:** Always include `\"inputs\": {{\"workingDirectory\": \"{dispatchWorkingDir.Replace("\\", "\\\\")}\"}}` in EVERY sub-task you dispatch.");
            sb.AppendLine("This ensures workers create files in the correct project directory.");
            sb.AppendLine();
        }

        sb.AppendLine("## Rules");
        sb.AppendLine("1. ALWAYS read SPEC.md in the working directory first — it contains the implementation plan");
        sb.AppendLine("2. Follow the plan's phase structure — create ONE task per phase (Phase 0, Phase 1, etc.)");
        sb.AppendLine("3. Do NOT lump multiple phases into a single task. Each phase = one dispatched task.");
        sb.AppendLine("4. Start each task objective with the phase name, e.g.: \"Phase 0 — Project Initialization: ...\"");
        sb.AppendLine("5. Make sub-task objectives DETAILED — include everything the worker needs to know");
        sb.AppendLine("6. Include ALL relevant specs, file paths, schemas, and requirements from the plan in each task objective");
        sb.AppendLine("7. Use `dependsOn` for sequential phases (e.g. Phase 1 depends on Phase 0)");
        sb.AppendLine("8. After dispatching, return a summary: your plan + each task ID, phase, domain, and objective");
        sb.AppendLine();
        sb.AppendLine("## Objective");
        sb.AppendLine();
        sb.AppendLine(objective);

        return sb.ToString();
    }

    // =========================================================================
    // PROVIDER 2: Ollama (Tier 0-local — fast local LLM for batch coding)
    // =========================================================================

    /// <summary>
    /// Calls a local Ollama instance (Qwen 2.5 Coder 32B) via HTTP API.
    /// No tool use — just prompt in, text out. Good for code generation tasks
    /// that don't need file system access.
    /// </summary>
    private async Task<string> ExecuteWithOllama(
        string objective,
        Dictionary<string, object>? inputs,
        int timeoutSeconds,
        CancellationToken stoppingToken)
    {
        var prompt = objective;
        if (inputs != null && inputs.Count > 0)
        {
            prompt += "\n\nInputs:\n" + JsonSerializer.Serialize(inputs, new JsonSerializerOptions { WriteIndented = true });
        }

        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(timeoutSeconds > 0 ? timeoutSeconds : _workerConfig.DefaultTimeoutSeconds);

        var requestBody = new
        {
            model = _workerConfig.OllamaModel,
            prompt = prompt,
            system = $"You are a worker agent (ID: {_workerConfig.WorkerId}) in a distributed AI coding system. " +
                     "Execute the given task concisely. Return clean, working code when asked for code. " +
                     "Be precise and avoid unnecessary commentary.",
            stream = false,
            options = new
            {
                num_ctx = 16384,   // Context window — default is ~4K which is too small for code tasks
                num_predict = 4096,
                temperature = 0.1  // Low temp for code accuracy
            }
        };

        var content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");

        _logger.LogInformation("Calling Ollama at {Url} with model {Model}",
            _workerConfig.OllamaUrl, _workerConfig.OllamaModel);

        var ollamaUrl = $"{_workerConfig.OllamaUrl}/api/generate";
        var ollamaResponse = await client.PostAsync(ollamaUrl, content, stoppingToken);
        var responseBody = await ollamaResponse.Content.ReadAsStringAsync(stoppingToken);

        if (!ollamaResponse.IsSuccessStatusCode)
        {
            _logger.LogError("Ollama API error: {Response}", responseBody);
            throw new Exception($"Ollama API error: {ollamaResponse.StatusCode} - {responseBody}");
        }

        // Parse Ollama response
        using var doc = JsonDocument.Parse(responseBody);
        var text = doc.RootElement.GetProperty("response").GetString();

        _logger.LogInformation("Ollama response received ({Chars} chars)", text?.Length ?? 0);

        return text ?? "[Error] Ollama returned no response";
    }

    // =========================================================================
    // PROVIDER 3: Claude API (Tier 0-api — simple single-shot, original behavior)
    // =========================================================================

    /// <summary>
    /// Original execution method — calls Claude API with a single prompt.
    /// No tools, no multi-step. Good as a fallback.
    /// </summary>
    private async Task<string> ExecuteWithClaudeApi(
        string objective,
        Dictionary<string, object>? inputs,
        CancellationToken stoppingToken)
    {
        if (string.IsNullOrEmpty(_claudeConfig.ApiKey))
        {
            // Echo mode — just acknowledge the task
            return $"[Worker {_workerConfig.WorkerId}] Received objective: {objective}";
        }

        // Build the prompt
        var prompt = objective;
        if (inputs != null && inputs.Count > 0)
        {
            prompt += "\n\nInputs:\n" + JsonSerializer.Serialize(inputs, new JsonSerializerOptions { WriteIndented = true });
        }

        // Call Claude API using HttpClient directly
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("x-api-key", _claudeConfig.ApiKey);
        client.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

        var requestBody = new
        {
            model = _claudeConfig.Model,
            max_tokens = 4096,
            system = $"You are a worker agent (ID: {_workerConfig.WorkerId}) in a distributed AI system. Execute the given task concisely and return results.",
            messages = new[]
            {
                new { role = "user", content = prompt }
            }
        };

        var content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");

        var response = await client.PostAsync("https://api.anthropic.com/v1/messages", content, stoppingToken);
        var responseBody = await response.Content.ReadAsStringAsync(stoppingToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Claude API error: {Response}", responseBody);
            throw new Exception($"Claude API error: {response.StatusCode}");
        }

        // Parse response
        using var doc = JsonDocument.Parse(responseBody);
        var textContent = doc.RootElement
            .GetProperty("content")
            .EnumerateArray()
            .FirstOrDefault(c => c.GetProperty("type").GetString() == "text");

        return textContent.GetProperty("text").GetString() ?? "No response generated";
    }

    // =========================================================================
    // PROVIDER 4: Sound Generation (local AI audio via Sound API)
    // =========================================================================

    /// <summary>
    /// Calls the local Sound API server to generate audio (voice, SFX, or music).
    /// Parses the objective to determine audio type and parameters.
    /// </summary>
    private async Task<string> ExecuteWithSoundGen(
        string objective,
        Dictionary<string, object>? inputs,
        int timeoutSeconds,
        CancellationToken stoppingToken)
    {
        var client = _httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(timeoutSeconds > 0 ? timeoutSeconds : _workerConfig.DefaultTimeoutSeconds);

        var soundApiUrl = _workerConfig.SoundApiUrl;
        var objectiveLower = objective.ToLowerInvariant();

        // Determine audio type from objective or inputs
        var audioType = "sfx"; // default
        if (inputs?.ContainsKey("type") == true)
        {
            audioType = inputs["type"]?.ToString()?.ToLowerInvariant() ?? "sfx";
        }
        else if (objectiveLower.Contains("voice") || objectiveLower.Contains("speak") ||
                 objectiveLower.Contains("say") || objectiveLower.Contains("tts") ||
                 objectiveLower.Contains("narrat"))
        {
            audioType = "voice";
        }
        else if (objectiveLower.Contains("music") || objectiveLower.Contains("song") ||
                 objectiveLower.Contains("melody") || objectiveLower.Contains("beat"))
        {
            audioType = "music";
        }

        // Parse duration from objective text (e.g. "30 second", "30s", "1 minute")
        var parsedDuration = ParseDurationFromText(objectiveLower);

        _logger.LogInformation("Sound generation: type={Type}, parsedDuration={Duration}s, objective='{Objective}'",
            audioType, parsedDuration, objective);

        string endpoint;
        object requestBody;

        switch (audioType)
        {
            case "voice":
                endpoint = $"{soundApiUrl}/generate/voice";
                var voiceText = inputs?.ContainsKey("text") == true
                    ? inputs["text"]?.ToString() ?? objective
                    : StripVoicePrefix(objective);
                var voice = inputs?.ContainsKey("voice") == true
                    ? inputs["voice"]?.ToString() ?? "af_heart"
                    : "af_heart";
                var speed = 1.0;
                if (inputs?.ContainsKey("speed") == true && double.TryParse(inputs["speed"]?.ToString(), out var s))
                    speed = s;
                requestBody = new { text = voiceText, voice, speed };
                break;

            case "music":
                endpoint = $"{soundApiUrl}/generate/music";
                var tags = inputs?.ContainsKey("tags") == true
                    ? inputs["tags"]?.ToString() ?? objective
                    : objective;
                var lyrics = inputs?.ContainsKey("lyrics") == true
                    ? inputs["lyrics"]?.ToString() ?? "[instrumental]"
                    : "[instrumental]";
                var musicDuration = parsedDuration > 0 ? parsedDuration : 30.0;
                if (inputs?.ContainsKey("duration") == true && double.TryParse(inputs["duration"]?.ToString(), out var md))
                    musicDuration = md;
                requestBody = new { tags, lyrics, duration_seconds = musicDuration };
                break;

            default: // sfx
                endpoint = $"{soundApiUrl}/generate/sfx";
                var prompt = inputs?.ContainsKey("prompt") == true
                    ? inputs["prompt"]?.ToString() ?? objective
                    : objective;
                var sfxDuration = parsedDuration > 0 ? parsedDuration : 15.0;
                if (inputs?.ContainsKey("duration") == true && double.TryParse(inputs["duration"]?.ToString(), out var sd))
                    sfxDuration = sd;
                requestBody = new { prompt, duration_seconds = sfxDuration };
                break;
        }

        var content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");

        var response = await client.PostAsync(endpoint, content, stoppingToken);
        var responseBody = await response.Content.ReadAsStringAsync(stoppingToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Sound API error: {Response}", responseBody);
            throw new Exception($"Sound API error: {response.StatusCode} - {responseBody}");
        }

        _logger.LogInformation("Sound generated successfully: {Response}", responseBody);
        return responseBody;
    }

    /// <summary>
    /// Parse duration from natural language text.
    /// Handles: "30 seconds", "30s", "2 minutes", "1.5 min", "30-second", etc.
    /// Returns 0 if no duration found.
    /// </summary>
    private static double ParseDurationFromText(string text)
    {
        // Match patterns like "30 seconds", "30s", "30-second", "30 sec"
        var secMatch = System.Text.RegularExpressions.Regex.Match(text,
            @"(\d+(?:\.\d+)?)\s*[-]?\s*(?:seconds?|sec|s)\b");
        if (secMatch.Success && double.TryParse(secMatch.Groups[1].Value, out var secs))
            return Math.Clamp(secs, 0.5, 300);

        // Match patterns like "2 minutes", "1.5 min", "2-minute"
        var minMatch = System.Text.RegularExpressions.Regex.Match(text,
            @"(\d+(?:\.\d+)?)\s*[-]?\s*(?:minutes?|min)\b");
        if (minMatch.Success && double.TryParse(minMatch.Groups[1].Value, out var mins))
            return Math.Clamp(mins * 60, 0.5, 300);

        return 0;
    }

    /// <summary>
    /// Strips voice instruction prefixes from an objective so only the actual
    /// text to speak remains. E.g. "Say hello world" → "hello world",
    /// "Speak the following text: Welcome" → "Welcome".
    /// </summary>
    private static string StripVoicePrefix(string objective)
    {
        // Try regex patterns from most specific to least
        var patterns = new[]
        {
            @"^(?:speak|say|narrate|read|voice|tts)\s+(?:the\s+)?(?:following\s+)?(?:text\s*)?[:\-]\s*",
            @"^(?:speak|say|narrate|read|voice|tts)\s+(?:the\s+)?(?:following\s*)?[:\-]\s*",
            @"^(?:speak|say|narrate|read)\s+(?:this|that)\s*[:\-]?\s*",
            @"^(?:generate\s+)?(?:a\s+)?(?:voice|tts|speech)\s+(?:saying|of|for)\s*[:\-]?\s*",
            @"^(?:speak|say|narrate|read)\s+",
        };

        foreach (var pattern in patterns)
        {
            var match = System.Text.RegularExpressions.Regex.Match(
                objective, pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            if (match.Success)
            {
                var stripped = objective[match.Length..].Trim();
                // Remove surrounding quotes if present
                if (stripped.Length >= 2 &&
                    ((stripped[0] == '"' && stripped[^1] == '"') ||
                     (stripped[0] == '\'' && stripped[^1] == '\'')))
                {
                    stripped = stripped[1..^1].Trim();
                }
                return stripped.Length > 0 ? stripped : objective;
            }
        }

        return objective;
    }
}

// =========================================================================
// Response models
// =========================================================================

public class TaskPollResponse
{
    public bool HasTask { get; set; }
    public string? TaskId { get; set; }
    public string? Objective { get; set; }
    public string? Domain { get; set; }
    public List<string>? Constraints { get; set; }
    public Dictionary<string, object>? Inputs { get; set; }
    public string? ExpectedOutputs { get; set; }
    public int? TimeLimitSeconds { get; set; }
    public string? ProjectId { get; set; }
}
