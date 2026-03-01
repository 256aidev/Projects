# Subagent Implementation Plan

> **FOR:** Claude Code on 256AI (10.0.1.147)
> **FROM:** MainWin (10.0.1.235) — Mark / Swarm Lead
> **DATE:** 2026-02-15
> **PROJECT:** `256ai.Engine` — should already be cloned/copied to this machine
> **PRIORITY:** Phase 1 first, then Phase 2, then Phase 3. Do NOT skip ahead.

---

## TL;DR — What You're Doing

The `Engine.Worker` is **dumb** right now. It calls the Claude API with a single prompt and returns text. No file access, no bash, no tools. You're upgrading it so workers can:

1. **Spawn `claude --task` as a subprocess** (Tier 1 — primary mode)
2. **Call Ollama/Qwen locally** (Tier 0-local — for AI02's coding workers)
3. **Keep the existing Claude API call** (Tier 0-api — fallback)

After this, workers become **autonomous agents** that can read files, write code, run tests, and execute multi-step tasks.

---

## Prerequisites Checklist

Before you start coding, verify:

- [ ] `claude --version` works (Claude Code CLI installed)
- [ ] `dotnet --version` works (.NET 8+ SDK)
- [ ] Control Plane is running: `curl http://localhost:5100/health/summary`
- [ ] Dashboard is running: open `http://localhost:8080` in browser
- [ ] The engine source is on this machine (check for `256ai.Engine/256ai.Engine.sln`)
- [ ] Solution builds cleanly: `cd 256ai.Engine && dotnet build`

**Read these files for context:**
- `256ai.Engine/CLAUDE.md` — Project orientation
- `256ai.Engine/spec/ENGINE_SPEC.md` — Authoritative spec
- `256ai.Engine/spec/AGENT_ROLES.md` — Agent types and routing

---

## What Exists Today

```
256ai.Engine/
├── src/
│   ├── Engine.Core/              # Enums, messages, interfaces
│   │   └── Enums/Status.cs       # OK, DEGRADED, DOWN, FAIL, PASS, PENDING, IN_PROGRESS, COMPLETED, REJECTED
│   ├── Engine.Infrastructure/    # DB context, entities, messaging
│   │   ├── Data/EngineDbContext.cs
│   │   └── Entities/TaskEntity.cs
│   ├── Engine.ControlPlane/      # API server (runs on this box at :5100)
│   │   └── Controllers/TasksController.cs
│   ├── Engine.Worker/            # Worker process — THIS IS WHAT YOU'RE CHANGING
│   │   ├── WorkerConfig.cs       # Currently: WorkerId, MaxConcurrentTasks, HeartbeatIntervalSeconds, Domains
│   │   ├── appsettings.json
│   │   ├── Program.cs
│   │   └── Services/
│   │       ├── HeartbeatService.cs
│   │       ├── TaskPollingService.cs  # THE MAIN FILE TO MODIFY
│   │       ├── TaskConsumerService.cs
│   │       └── TaskTrackerService.cs
│   └── Engine.Dashboard/        # HTML dashboard (runs on this box at :8080)
├── spec/                        # Authoritative specs
├── docs/                        # This file lives here
└── scripts/                     # PowerShell heartbeat/worker scripts
```

### Current Worker Flow (the problem)

In `src/Engine.Worker/Services/TaskPollingService.cs`:

1. Polls `GET /tasks/poll?workerId=X&domains=Y` every 5 seconds
2. Gets a task with `objective`, `domain`, `inputs`
3. Calls `https://api.anthropic.com/v1/messages` with a simple prompt — **no tools, no file access, no multi-step reasoning**
4. Returns raw text as result
5. Posts result to `POST /tasks/{id}/result`

**The `ExecuteWithClaude()` method (lines 130-183) is the dumb method. You will ADD new methods alongside it, not replace it.**

### Current WorkerConfig.cs

```csharp
namespace Engine.Worker;

public class WorkerConfig
{
    public string WorkerId { get; set; } = $"worker-{Guid.NewGuid():N}";
    public int MaxConcurrentTasks { get; set; } = 5;
    public int HeartbeatIntervalSeconds { get; set; } = 20;
    public List<string> Domains { get; set; } = new() { "general" };
}

public class ClaudeConfig
{
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "claude-sonnet-4-20250514";
}
```

### Current TaskEntity.cs

```csharp
public class TaskEntity
{
    public required string TaskId { get; set; }
    public required string Objective { get; set; }
    public required string Domain { get; set; }
    public string? ConstraintsJson { get; set; }
    public string? InputsJson { get; set; }
    public required string ExpectedOutputs { get; set; }
    public string? ValidationCriteria { get; set; }
    public Status Status { get; set; }
    public string? AssignedWorkerId { get; set; }
    public string? ResultJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
}
```

### Current Status Enum

```csharp
public enum Status
{
    OK, DEGRADED, DOWN, FAIL, PASS, PENDING, IN_PROGRESS, COMPLETED, REJECTED
}
```

---

## Architecture After All Phases

```
┌─────────────────────────────────────────────────────────────────┐
│                      STRATEGY LAYER                             │
│                   (Human + Claude Chat)                         │
│         Dashboard at http://10.0.1.147:8080                     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              CONTROL PLANE (10.0.1.147:5100)                    │
│              DUMB router — queue, state, health                 │
│              Endpoints: /tasks, /tasks/poll, /tasks/{id}/ack,   │
│                         /tasks/{id}/result, /health/*           │
└──────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Engine.Worker   │ │  Engine.Worker   │ │  Engine.Worker   │
│  (C# supervisor) │ │  (C# supervisor) │ │  (C# supervisor) │
│       │          │ │       │          │ │       │          │
│  Execution:      │ │  Execution:      │ │  Execution:      │
│  claude --task   │ │  claude --task   │ │  Ollama/Qwen     │
│  (subprocess)    │ │  (subprocess)    │ │  (HTTP API)      │
│                  │ │                  │ │                  │
│  256AI/MainWin   │ │  Mac             │ │  AI02 (x3)       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Three Execution Providers

| Provider | Config Value | When Used | How It Works |
|----------|-------------|-----------|--------------|
| `claude-api` | `"Provider": "claude-api"` | Simple Q&A, summaries | Existing `ExecuteWithClaude()` — single API call |
| `claude-code` | `"Provider": "claude-code"` | Code gen, file editing, testing | **NEW** `ExecuteWithClaudeCode()` — spawns `claude --task` subprocess |
| `ollama` | `"Provider": "ollama"` | Batch coding on AI02 | **NEW** `ExecuteWithOllama()` — HTTP call to local Ollama |

---

## Machine Assignments (Final)

### 256AI / AI01 (this box) — Coordinator
- **IP:** 10.0.1.147
- **Worker ID:** `worker-256ai-001`
- **Domains:** `general`, `ai-compute`, `coordination`,
- **Provider:** `claude-code`
- **Runs:** Control Plane (:5100) + Dashboard (:8080) + 1 Worker

### MainWin — Swarm Lead
- **IP:** 10.0.1.235
- **Worker ID:** `worker-mainwin-001`
- **Domains:** `Andriod fontend`, `ui`, `mobile` 
- **Provider:** `claude-code`
- **Role:** Decomposes complex tasks into subtasks, dispatches to swarm

### AI02 / NucBox_EVO-X2 — MAIN CODING BOX (128GB DDR5 / 96GB VRAM)
- **IP:** 10.0.1.178
- **3 workers on this box:**

| Worker ID | Provider | Model | VRAM | Domains |
|-----------|----------|-------|------|---------|
| `worker-ai02-coder-001` | `ollama` | Qwen 2.5 Coder 32B (Q8) | ~34 GB | `code`, `transforms` |
| `worker-ai02-coder-002` | `ollama` | Qwen 2.5 Coder 32B (Q8) | ~34 GB | `data`, `general` |
| `worker-ai02-claude` | `claude-code` | Claude (via CLI) | minimal | `code` (complex), file editing |

### Mac — Frontend Specialist
- **IP:** 10.0.1.237
- **Worker ID:** `worker-mac-001`
- **Domains:** `ios frontend`, `ui`, `mobile`
- **Provider:** `claude-code`

### Full Roster: 6 workers across 4 machines

| # | Worker ID | Machine | Provider | Domains |
|---|-----------|---------|----------|---------|
| 1 | `worker-256ai-001` | 256AI (10.0.1.147) | claude-code | coordination, general, ai-compute, code, docs|
| 2 | `worker-mainwin-001` | MainWin (10.0.1.235) | claude-code | Andriod fontend, ui, mobile |
| 3 | `worker-ai02-coder-001` | AI02 (10.0.1.178) | ollama - Qwen 2.5 Coder 32B (Q8) | code, transforms |
| 4 | `worker-ai02-coder-002` | AI02 (10.0.1.178) | ollama - Qwen 2.5 Coder 32B (Q8) | data, general |
| 5 | `worker-ai02-claude` | AI02 (10.0.1.178) | claude-code | code (complex), file editing |
| 6 | `worker-mac-001` | Mac (10.0.1.237) | claude-code | iOS frontend, ui, mobile |

---

## PHASE 1: Multi-Provider Execution Engine

**Goal:** Workers can use Claude Code CLI, Ollama, or Claude API based on config. This is the most important phase.

### Step 1.1: Update WorkerConfig.cs

**File:** `src/Engine.Worker/WorkerConfig.cs`

**Replace the entire file with:**

```csharp
namespace Engine.Worker;

public class WorkerConfig
{
    // Identity
    public string WorkerId { get; set; } = $"worker-{Environment.MachineName.ToLower()}-001";
    public List<string> Domains { get; set; } = new() { "general" };
    public int MaxConcurrentTasks { get; set; } = 5;
    public int HeartbeatIntervalSeconds { get; set; } = 20;

    // Execution provider: "claude-code" | "claude-api" | "ollama"
    public string Provider { get; set; } = "claude-code";

    // Claude Code CLI settings (Provider = "claude-code")
    public string ClaudeCodePath { get; set; } = "claude";
    public int MaxTurns { get; set; } = 50;

    // Ollama settings (Provider = "ollama")
    public string OllamaUrl { get; set; } = "http://localhost:11434";
    public string OllamaModel { get; set; } = "qwen2.5-coder:32b-instruct-q8_0";

    // General execution settings
    public string DefaultWorkingDirectory { get; set; } = "";
    public int DefaultTimeoutSeconds { get; set; } = 300;
}

public class ClaudeConfig
{
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "claude-sonnet-4-20250514";
}
```

### Step 1.2: Update appsettings.json

**File:** `src/Engine.Worker/appsettings.json`

**Replace the entire file with:**

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.Hosting.Lifetime": "Information"
    }
  },
  "ControlPlane": {
    "ControlPlaneUrl": "http://localhost:5100"
  },
  "Worker": {
    "WorkerId": "worker-256ai-001",
    "Domains": ["general", "ai-compute"],
    "MaxConcurrentTasks": 5,
    "HeartbeatIntervalSeconds": 20,
    "Provider": "claude-code",
    "ClaudeCodePath": "claude",
    "MaxTurns": 50,
    "OllamaUrl": "http://localhost:11434",
    "OllamaModel": "qwen2.5-coder:32b-instruct-q8_0",
    "DefaultWorkingDirectory": "",
    "DefaultTimeoutSeconds": 300
  },
  "Claude": {
    "ApiKey": "",
    "Model": "claude-sonnet-4-20250514"
  }
}
```

**NOTE:** When deploying to AI02 with Ollama, the appsettings for each Qwen worker would look like:

```json
{
  "Worker": {
    "WorkerId": "worker-ai02-coder-001",
    "Domains": ["code", "transforms"],
    "Provider": "ollama",
    "OllamaUrl": "http://localhost:11434",
    "OllamaModel": "qwen2.5-coder:32b-instruct-q8_0",
    "DefaultTimeoutSeconds": 600
  }
}
```

### Step 1.3: Rewrite TaskPollingService.cs

**File:** `src/Engine.Worker/Services/TaskPollingService.cs`

**Replace the entire file with:**

```csharp
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
                var psi = new ProcessStartInfo
                {
                    FileName = _workerConfig.ClaudeCodePath,
                    Arguments = "--version",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
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
                _logger.LogError("Claude Code CLI not found at '{Path}': {Error}", _workerConfig.ClaudeCodePath, ex.Message);
                _logger.LogWarning("Falling back to claude-api provider");
                // Could set a fallback flag here, but for now just log
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

            result = _workerConfig.Provider switch
            {
                "claude-code" => await ExecuteWithClaudeCode(
                    taskResponse.Objective!,
                    taskResponse.Inputs,
                    workingDir,
                    timeout,
                    stoppingToken),

                "ollama" => await ExecuteWithOllama(
                    taskResponse.Objective!,
                    taskResponse.Inputs,
                    timeout,
                    stoppingToken),

                "claude-api" => await ExecuteWithClaudeApi(
                    taskResponse.Objective!,
                    taskResponse.Inputs,
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

        var resultResponse = await client.PostAsync(resultUrl, resultContent, stoppingToken);

        if (resultResponse.IsSuccessStatusCode)
        {
            _logger.LogInformation("Task {TaskId} completed in {Ms}ms (provider: {Provider})",
                taskResponse.TaskId, stopwatch.ElapsedMilliseconds, _workerConfig.Provider);
        }
        else
        {
            _logger.LogWarning("Failed to submit result for task {TaskId}: {StatusCode}",
                taskResponse.TaskId, resultResponse.StatusCode);
        }
    }

    // =========================================================================
    // PROVIDER 1: Claude Code CLI (Tier 1 — full autonomous agent)
    // =========================================================================

    /// <summary>
    /// Spawns `claude --task` as a subprocess. This gives the worker full autonomous
    /// capability: file I/O, bash, code generation, testing, web search.
    /// </summary>
    private async Task<string> ExecuteWithClaudeCode(
        string objective,
        Dictionary<string, object>? inputs,
        string? workingDirectory,
        int timeoutSeconds,
        CancellationToken stoppingToken)
    {
        // Build the full prompt with context
        var prompt = new StringBuilder();
        prompt.AppendLine(objective);

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
            var psi = new ProcessStartInfo
            {
                FileName = _workerConfig.ClaudeCodePath,
                // Use stdin for the prompt to avoid shell escaping issues
                Arguments = $"--task - --output-format json --max-turns {_workerConfig.MaxTurns}",
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

            // Set environment variables for context
            psi.Environment["TASK_WORKER_ID"] = _workerConfig.WorkerId;
            psi.Environment["TASK_CONTROL_PLANE"] = _controlPlaneUrl;

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
        var response = await client.PostAsync(ollamaUrl, content, stoppingToken);
        var responseBody = await response.Content.ReadAsStringAsync(stoppingToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Ollama API error: {Response}", responseBody);
            throw new Exception($"Ollama API error: {response.StatusCode} - {responseBody}");
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
}
```

### Step 1.4: Build and Test

```bash
cd 256ai.Engine
dotnet build

# Verify claude CLI works
claude --version

# Start the worker (Control Plane should already be running at :5100)
dotnet run --project src/Engine.Worker
```

Then from another terminal, submit a test task:

```bash
# Simple test — should use claude --task
curl -X POST http://localhost:5100/tasks \
  -H "Content-Type: application/json" \
  -d '{"objective": "What is 2 + 2? Reply with just the number.", "domain": "general", "expectedOutputs": "The number 4"}'

# Watch worker logs — should see:
#   Spawning Claude Code CLI: claude --task - --output-format json --max-turns 50
#   Task abc123 completed in XXXms (provider: claude-code)

# Check the result
curl http://localhost:5100/tasks
```

### Step 1.5: Test with a Real File Task

```bash
curl -X POST http://localhost:5100/tasks \
  -H "Content-Type: application/json" \
  -d '{"objective": "Create a Python file at /tmp/hello.py that prints Hello World, then verify it runs correctly", "domain": "general", "expectedOutputs": "File created and verified"}'
```

This should spawn Claude Code, which will use its tools to create the file and test it.

---

## PHASE 2: ACK Protocol + Improved State Machine

**Goal:** Workers acknowledge tasks before executing. Full lifecycle tracking.

**DO NOT START THIS UNTIL PHASE 1 WORKS.**

### Step 2.1: Add new status values

**File:** `src/Engine.Core/Enums/Status.cs`

**Replace with:**

```csharp
namespace Engine.Core.Enums;

/// <summary>
/// Health and operational status values
/// </summary>
public enum Status
{
    // Health statuses
    OK,
    DEGRADED,
    DOWN,

    // Task result statuses
    FAIL,
    PASS,

    // Task lifecycle statuses
    PENDING,        // Task created, waiting for worker
    LEASED,         // Worker claimed via poll, awaiting ACK (60s timeout)
    ACKED,          // Worker confirmed receipt
    IN_PROGRESS,    // Execution actively running (legacy compat)
    RUNNING,        // Execution actively running (new preferred name)
    COMPLETED,      // Task finished successfully
    CLOSED,         // Validated and archived
    REJECTED,       // Task rejected by worker
    DLQ             // Dead letter queue — retry budget exceeded
}
```

### Step 2.2: Add ACK endpoint to Control Plane

**File:** `src/Engine.ControlPlane/Controllers/TasksController.cs`

Add this new endpoint method inside the `TasksController` class (after the `SubmitResult` method):

```csharp
/// <summary>
/// POST /tasks/{id}/ack - Worker acknowledges task receipt
/// Must be called within 60 seconds of polling, or task returns to PENDING
/// </summary>
[HttpPost("{id}/ack")]
public async Task<IActionResult> AcknowledgeTask(string id, [FromBody] AckRequest request)
{
    var task = await _db.Tasks.FirstOrDefaultAsync(t => t.TaskId == id);

    if (task == null)
        return NotFound(new { error = "Task not found", taskId = id });

    if (task.AssignedWorkerId != request.WorkerId)
        return BadRequest(new { error = "Task not assigned to this worker" });

    if (task.Status != Status.LEASED && task.Status != Status.IN_PROGRESS)
        return BadRequest(new { error = $"Task cannot be ACKed in status {task.Status}" });

    task.Status = Status.ACKED;
    await _db.SaveChangesAsync();

    return Ok(new { taskId = id, status = "ACKED" });
}
```

And add this record at the bottom of the file (with the other request records):

```csharp
public record AckRequest
{
    public required string WorkerId { get; init; }
}
```

### Step 2.3: Update PollForTask to use LEASED

In the same file, in the `PollForTask()` method, change:

```csharp
// BEFORE:
task.Status = Status.IN_PROGRESS;

// AFTER:
task.Status = Status.LEASED;
```

### Step 2.4: Worker sends ACK before executing

In `src/Engine.Worker/Services/TaskPollingService.cs`, in the `PollAndExecuteTask()` method, add ACK right after receiving the task and before execution:

```csharp
// After: _logger.LogInformation("Received task {TaskId}...");
// Before: try { result = _workerConfig.Provider switch { ... }

// Send ACK
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
```

### Step 2.5: Build and test

```bash
dotnet build
dotnet run --project src/Engine.Worker

# Submit task and watch status progression:
# PENDING -> LEASED -> ACKED -> COMPLETED
curl -X POST http://localhost:5100/tasks \
  -H "Content-Type: application/json" \
  -d '{"objective": "Say hello", "domain": "general", "expectedOutputs": "A greeting"}'

# Check status
curl http://localhost:5100/tasks
```

---

## PHASE 3: Task Decomposition (Parent/Child)

**Goal:** The Swarm Lead (MainWin) can break complex tasks into subtasks dispatched to other workers. Control Plane tracks parent/child relationships and dependencies.

**DO NOT START THIS UNTIL PHASE 2 WORKS.**

### Step 3.1: Add fields to TaskEntity

**File:** `src/Engine.Infrastructure/Entities/TaskEntity.cs`

**Replace with:**

```csharp
using Engine.Core.Enums;

namespace Engine.Infrastructure.Entities;

/// <summary>
/// Task tracking - per 06_TASK_SCHEMA
/// Supports parent/child decomposition and dependency tracking
/// </summary>
public class TaskEntity
{
    // Identity
    public required string TaskId { get; set; }
    public required string Objective { get; set; }
    public required string Domain { get; set; }

    // Task details
    public string? ConstraintsJson { get; set; }
    public string? InputsJson { get; set; }
    public required string ExpectedOutputs { get; set; }
    public string? ValidationCriteria { get; set; }

    // Lifecycle
    public Status Status { get; set; }
    public string? AssignedWorkerId { get; set; }
    public string? ResultJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }

    // NEW: Parent/child decomposition
    public string? ParentTaskId { get; set; }

    // NEW: Execution mode hint — workers can override based on their config
    public string ExecutionMode { get; set; } = "auto";  // "auto" | "cli" | "api" | "ollama"

    // NEW: Dependencies — JSON array of task IDs that must complete first
    public string? DependsOnJson { get; set; }

    // NEW: Retry tracking
    public int RetryCount { get; set; } = 0;
    public int MaxRetries { get; set; } = 3;

    // NEW: Progress tracking
    public string? ProgressJson { get; set; }
    public DateTimeOffset? LastProgressAt { get; set; }
}
```

### Step 3.2: Update EngineDbContext

**File:** `src/Engine.Infrastructure/Data/EngineDbContext.cs`

In the `OnModelCreating` method, find the `TaskEntity` configuration and add the new columns. If there's already a section like `modelBuilder.Entity<TaskEntity>(...)`, add the new properties. If not, add:

```csharp
modelBuilder.Entity<TaskEntity>(entity =>
{
    entity.HasKey(e => e.TaskId);
    entity.Property(e => e.ParentTaskId).IsRequired(false);
    entity.Property(e => e.ExecutionMode).HasDefaultValue("auto");
    entity.Property(e => e.DependsOnJson).IsRequired(false);
    entity.Property(e => e.RetryCount).HasDefaultValue(0);
    entity.Property(e => e.MaxRetries).HasDefaultValue(3);
    entity.Property(e => e.ProgressJson).IsRequired(false);
    entity.Property(e => e.LastProgressAt).IsRequired(false);

    // Index for fast parent/child queries
    entity.HasIndex(e => e.ParentTaskId);
    entity.HasIndex(e => e.Status);
});
```

### Step 3.3: Create and apply DB migration

```bash
cd 256ai.Engine

# Create migration
dotnet ef migrations add AddSubagentFields \
  --project src/Engine.Infrastructure \
  --startup-project src/Engine.ControlPlane

# Apply migration
dotnet ef database update \
  --project src/Engine.Infrastructure \
  --startup-project src/Engine.ControlPlane
```

**If `dotnet ef` is not installed:**
```bash
dotnet tool install --global dotnet-ef
```

### Step 3.4: Update CreateTaskRequest and CreateTask endpoint

**File:** `src/Engine.ControlPlane/Controllers/TasksController.cs`

Update the `CreateTaskRequest` record at the bottom of the file:

```csharp
public record CreateTaskRequest
{
    public required string Objective { get; init; }
    public required string Domain { get; init; }
    public List<string>? Constraints { get; init; }
    public Dictionary<string, object>? Inputs { get; init; }
    public required string ExpectedOutputs { get; init; }
    public string? ValidationCriteria { get; init; }
    public int? TimeLimitSeconds { get; init; }
    public int? BatchLimit { get; init; }

    // NEW: Decomposition support
    public string? ParentTaskId { get; init; }
    public string ExecutionMode { get; init; } = "auto";
    public List<string>? DependsOn { get; init; }
}
```

Update the `CreateTask()` method to save new fields:

```csharp
var taskEntity = new TaskEntity
{
    TaskId = taskId,
    Objective = request.Objective,
    Domain = request.Domain,
    ConstraintsJson = request.Constraints != null ? JsonSerializer.Serialize(request.Constraints) : null,
    InputsJson = request.Inputs != null ? JsonSerializer.Serialize(request.Inputs) : null,
    ExpectedOutputs = request.ExpectedOutputs,
    ValidationCriteria = request.ValidationCriteria,
    Status = Status.PENDING,
    CreatedAt = now,
    // NEW fields
    ParentTaskId = request.ParentTaskId,
    ExecutionMode = request.ExecutionMode,
    DependsOnJson = request.DependsOn != null ? JsonSerializer.Serialize(request.DependsOn) : null,
};
```

### Step 3.5: Add parent/child filtering to ListTasks

In the `ListTasks()` method, add `parentTaskId` filter:

```csharp
[HttpGet]
public async Task<IActionResult> ListTasks(
    [FromQuery] string? status = null,
    [FromQuery] string? parentTaskId = null,  // NEW
    [FromQuery] int limit = 50)
{
    var query = _db.Tasks.AsQueryable();

    if (!string.IsNullOrEmpty(status) && Enum.TryParse<Status>(status, true, out var statusEnum))
    {
        query = query.Where(t => t.Status == statusEnum);
    }

    if (!string.IsNullOrEmpty(parentTaskId))  // NEW
    {
        query = query.Where(t => t.ParentTaskId == parentTaskId);
    }

    // SQLite doesn't support DateTimeOffset ordering, load then sort in memory
    var allTasks = await query.ToListAsync();

    var tasks = allTasks
        .OrderByDescending(t => t.CreatedAt)
        .Take(limit)
        .Select(t => new
        {
            t.TaskId,
            t.Objective,
            t.Domain,
            Status = t.Status.ToString(),
            t.AssignedWorkerId,
            t.CreatedAt,
            t.CompletedAt,
            t.ParentTaskId  // NEW: include in response
        })
        .ToList();

    return Ok(tasks);
}
```

### Step 3.6: Add dependency checking in PollForTask

In the `PollForTask()` method, after finding pending tasks, add dependency checking:

```csharp
// Find oldest PENDING task matching any of worker's domains
// SQLite doesn't support DateTimeOffset ordering, so we load then sort in memory
var pendingTasks = await _db.Tasks
    .Where(t => t.Status == Status.PENDING && domainList.Contains(t.Domain))
    .ToListAsync();

// NEW: Filter out tasks whose dependencies aren't met
var eligibleTasks = new List<TaskEntity>();
foreach (var candidate in pendingTasks.OrderBy(t => t.CreatedAt))
{
    if (!string.IsNullOrEmpty(candidate.DependsOnJson))
    {
        var deps = JsonSerializer.Deserialize<List<string>>(candidate.DependsOnJson);
        if (deps != null && deps.Count > 0)
        {
            var depTasks = await _db.Tasks.Where(t => deps.Contains(t.TaskId)).ToListAsync();
            var allComplete = depTasks.All(t => t.Status == Status.COMPLETED || t.Status == Status.CLOSED);
            if (!allComplete)
                continue; // Dependencies not met, skip
        }
    }
    eligibleTasks.Add(candidate);
}

var task = eligibleTasks.FirstOrDefault();
```

### Step 3.7: Add progress endpoint

Add this new endpoint to `TasksController.cs`:

```csharp
/// <summary>
/// POST /tasks/{id}/progress - Worker reports progress on a long-running task
/// </summary>
[HttpPost("{id}/progress")]
public async Task<IActionResult> ReportProgress(string id, [FromBody] ProgressRequest request)
{
    var task = await _db.Tasks.FirstOrDefaultAsync(t => t.TaskId == id);

    if (task == null)
        return NotFound(new { error = "Task not found", taskId = id });

    if (task.AssignedWorkerId != request.WorkerId)
        return BadRequest(new { error = "Task not assigned to this worker" });

    task.ProgressJson = JsonSerializer.Serialize(new
    {
        request.Message,
        request.PercentComplete,
        request.CurrentStep,
        updatedAt = DateTimeOffset.UtcNow
    });
    task.LastProgressAt = DateTimeOffset.UtcNow;

    // Optionally update status to RUNNING
    if (task.Status == Status.ACKED || task.Status == Status.IN_PROGRESS)
    {
        task.Status = Status.RUNNING;
    }

    await _db.SaveChangesAsync();

    return Ok(new { taskId = id, status = task.Status.ToString() });
}

public record ProgressRequest
{
    public required string WorkerId { get; init; }
    public string? Message { get; init; }
    public int? PercentComplete { get; init; }
    public string? CurrentStep { get; init; }
}
```

### Step 3.8: Build, migrate, and test

```bash
dotnet build
dotnet ef database update --project src/Engine.Infrastructure --startup-project src/Engine.ControlPlane

# Test parent/child tasks
# 1. Create parent task
curl -X POST http://localhost:5100/tasks \
  -H "Content-Type: application/json" \
  -d '{"objective": "Build a calculator app", "domain": "coordination", "expectedOutputs": "Working calculator"}'

# Note the taskId from response, then create child tasks:
curl -X POST http://localhost:5100/tasks \
  -H "Content-Type: application/json" \
  -d '{"objective": "Create add function", "domain": "code", "expectedOutputs": "add(a,b) function", "parentTaskId": "PARENT_TASK_ID"}'

curl -X POST http://localhost:5100/tasks \
  -H "Content-Type: application/json" \
  -d '{"objective": "Create tests for calculator", "domain": "code", "expectedOutputs": "Passing tests", "parentTaskId": "PARENT_TASK_ID", "dependsOn": ["CHILD_1_TASK_ID"]}'

# List child tasks
curl "http://localhost:5100/tasks?parentTaskId=PARENT_TASK_ID"
```

---

## AI02 Setup Guide (For Later — After Phases 1-3 Are Done)

This section is for setting up AI02 (10.0.1.178) as the main coding box with Ollama + Qwen.

### Install Ollama on AI02

```powershell
# On AI02 (RDP in as mark, password: 00king)
# Download and install Ollama from https://ollama.com/download/windows

# After install, pull the Qwen model (this will download ~34GB)
ollama pull qwen2.5-coder:32b-instruct-q8_0

# Verify
ollama list
```

### Configure Ollama for Network Access

By default Ollama only listens on localhost. To allow other machines to reach it:

```powershell
# Set environment variable
[System.Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0:11434", "Machine")

# Restart Ollama service
# (Close and reopen Ollama, or restart the service)
```

### Open Firewall on AI02

```powershell
New-NetFirewallRule -DisplayName "Ollama API" -Direction Inbound -Port 11434 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "256ai Engine Worker" -Direction Inbound -Port 5100 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "SSH" -Direction Inbound -Port 22 -Protocol TCP -Action Allow
```

### Deploy 3 Workers on AI02

Copy the Engine.Worker project to AI02, then create 3 separate config files:

**worker1-appsettings.json** (Qwen Coder #1):
```json
{
  "ControlPlane": { "ControlPlaneUrl": "http://10.0.1.147:5100" },
  "Worker": {
    "WorkerId": "worker-ai02-coder-001",
    "Domains": ["code", "transforms"],
    "Provider": "ollama",
    "OllamaUrl": "http://localhost:11434",
    "OllamaModel": "qwen2.5-coder:32b-instruct-q8_0",
    "DefaultTimeoutSeconds": 600
  }
}
```

**worker2-appsettings.json** (Qwen Coder #2):
```json
{
  "ControlPlane": { "ControlPlaneUrl": "http://10.0.1.147:5100" },
  "Worker": {
    "WorkerId": "worker-ai02-coder-002",
    "Domains": ["data", "general"],
    "Provider": "ollama",
    "OllamaUrl": "http://localhost:11434",
    "OllamaModel": "qwen2.5-coder:32b-instruct-q8_0",
    "DefaultTimeoutSeconds": 600
  }
}
```

**worker3-appsettings.json** (Claude Code for complex tasks):
```json
{
  "ControlPlane": { "ControlPlaneUrl": "http://10.0.1.147:5100" },
  "Worker": {
    "WorkerId": "worker-ai02-claude",
    "Domains": ["code"],
    "Provider": "claude-code",
    "ClaudeCodePath": "claude",
    "MaxTurns": 50,
    "DefaultTimeoutSeconds": 600
  }
}
```

Run each worker in a separate terminal:
```bash
# Terminal 1
dotnet run --project src/Engine.Worker -- --Worker:WorkerId=worker-ai02-coder-001 --Worker:Domains:0=code --Worker:Domains:1=transforms --Worker:Provider=ollama

# Terminal 2
dotnet run --project src/Engine.Worker -- --Worker:WorkerId=worker-ai02-coder-002 --Worker:Domains:0=data --Worker:Domains:1=general --Worker:Provider=ollama

# Terminal 3
dotnet run --project src/Engine.Worker -- --Worker:WorkerId=worker-ai02-claude --Worker:Domains:0=code --Worker:Provider=claude-code
```

Or use `nssm` to run them as Windows services.

---

## Verification Checklist

### Phase 1 Complete When:
- [ ] Worker starts with `Provider: claude-code` in logs
- [ ] `claude --version` shows in startup logs
- [ ] Submitting a task causes `Spawning Claude Code CLI` in worker logs
- [ ] Task completes with result visible at `GET /tasks`
- [ ] File creation tasks actually create files on disk

### Phase 2 Complete When:
- [ ] Task status progresses: PENDING -> LEASED -> ACKED -> COMPLETED
- [ ] Worker logs show `Task {id} ACKed` before execution
- [ ] If worker dies between LEASED and ACKED, task eventually returns to PENDING (not implemented yet — bonus)

### Phase 3 Complete When:
- [ ] Tasks with `parentTaskId` are created successfully
- [ ] `GET /tasks?parentTaskId=X` returns only child tasks
- [ ] Tasks with `dependsOn` don't get polled until dependencies complete
- [ ] Progress endpoint updates task progress visible in API

---

## Important Notes

1. **The Control Plane (port 5100) should already be running on this box.** If not:
   ```bash
   dotnet run --project src/Engine.ControlPlane --urls "http://0.0.0.0:5100"
   ```

2. **Claude Code CLI must be installed.** Verify: `claude --version`

3. **Do NOT delete the existing `ExecuteWithClaude()` behavior.** The new code replaces the file but keeps the same logic as `ExecuteWithClaudeApi()`.

4. **Build after each phase:**
   ```bash
   dotnet build 256ai.Engine.sln
   ```

5. **Firewall on this box must allow inbound TCP 5100 and 8080:**
   ```powershell
   New-NetFirewallRule -DisplayName "256ai Engine" -Direction Inbound -Port 5100 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "256ai Dashboard" -Direction Inbound -Port 8080 -Protocol TCP -Action Allow
   ```

6. **Start with Phase 1 ONLY.** Get it working end-to-end before moving on. Each phase builds on the previous.

7. **If you get stuck, escalate:**
   ```bash
   curl -X POST http://localhost:5100/escalations \
     -H "Content-Type: application/json" \
     -d '{"level": "Risk", "title": "Description of blocker", "whatWasObserved": "...", "whereItOccurs": "...", "whyItMatters": "...", "conditionsForFailure": "..."}'
   ```
   Mark will see it on the dashboard.

---

## Summary of All Files to Touch

| Phase | File | Action |
|-------|------|--------|
| 1 | `src/Engine.Worker/WorkerConfig.cs` | **Replace** — add Provider, Ollama, timeout fields |
| 1 | `src/Engine.Worker/appsettings.json` | **Replace** — add new config values |
| 1 | `src/Engine.Worker/Services/TaskPollingService.cs` | **Replace** — multi-provider execution engine |
| 2 | `src/Engine.Core/Enums/Status.cs` | **Replace** — add LEASED, ACKED, RUNNING, CLOSED, DLQ |
| 2 | `src/Engine.ControlPlane/Controllers/TasksController.cs` | **Edit** — add ACK endpoint, change poll to LEASED |
| 3 | `src/Engine.Infrastructure/Entities/TaskEntity.cs` | **Replace** — add ParentTaskId, DependsOn, Progress |
| 3 | `src/Engine.Infrastructure/Data/EngineDbContext.cs` | **Edit** — add entity config for new columns |
| 3 | `src/Engine.ControlPlane/Controllers/TasksController.cs` | **Edit** — parent/child filtering, dependencies, progress |
| 3 | Migration | **Create** — `dotnet ef migrations add AddSubagentFields` |
