using System.Text.Json;
using Engine.Core.Enums;
using Engine.Infrastructure.Data;
using Engine.Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Engine.ControlPlane.Controllers;

/// <summary>
/// Task management endpoints - HTTP polling based
/// Workers poll GET /tasks/poll, submit results via POST /tasks/{id}/result
/// </summary>
[ApiController]
[Route("tasks")]
public class TasksController : ControllerBase
{
    private readonly EngineDbContext _db;

    public TasksController(EngineDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// POST /tasks - Submit new task
    /// Per spec: One task, one objective
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateTask([FromBody] CreateTaskRequest request)
    {
        var taskId = Guid.NewGuid().ToString();
        var now = DateTimeOffset.UtcNow;

        // Auto-detect sound domain from objective keywords
        var domain = DomainAutoDetector.Detect(request.Domain, request.Objective);

        // Create task entity
        var taskEntity = new TaskEntity
        {
            TaskId = taskId,
            Objective = request.Objective,
            Domain = domain,
            ConstraintsJson = request.Constraints != null ? JsonSerializer.Serialize(request.Constraints) : null,
            InputsJson = request.Inputs != null ? JsonSerializer.Serialize(request.Inputs) : null,
            ExpectedOutputs = request.ExpectedOutputs,
            ValidationCriteria = request.ValidationCriteria,
            Status = Status.PENDING,
            CreatedAt = now,
            ParentTaskId = request.ParentTaskId,
            ExecutionMode = request.ExecutionMode,
            DependsOnJson = request.DependsOn != null ? JsonSerializer.Serialize(request.DependsOn) : null,
            ProjectId = request.ProjectId,
            FailedWorkersJson = request.ExcludeWorkers != null ? JsonSerializer.Serialize(request.ExcludeWorkers) : null
        };

        _db.Tasks.Add(taskEntity);
        await _db.SaveChangesAsync();

        // Task is now in database with PENDING status
        // Workers poll GET /tasks/poll to claim and execute tasks

        return CreatedAtAction(nameof(GetTask), new { id = taskId }, new
        {
            TaskId = taskId,
            Status = "PENDING",
            CreatedAt = now
        });
    }

    /// <summary>
    /// GET /tasks/{id} - Get task status
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetTask(string id)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.TaskId == id);

        if (task == null)
            return NotFound(new { Error = "Task not found", TaskId = id });

        return Ok(new
        {
            task.TaskId,
            task.Objective,
            task.Domain,
            Status = task.Status.ToString(),
            task.AssignedWorkerId,
            task.CreatedAt,
            task.CompletedAt,
            task.ProjectId,
            task.ParentTaskId,
            task.ExecutionMode,
            Progress = task.ProgressJson != null ? JsonSerializer.Deserialize<object>(task.ProgressJson) : null,
            Result = task.ResultJson != null ? JsonSerializer.Deserialize<object>(task.ResultJson) : null
        });
    }

    /// <summary>
    /// GET /tasks - List tasks
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ListTasks(
        [FromQuery] string? status = null,
        [FromQuery] string? parentTaskId = null,
        [FromQuery] string? projectId = null,
        [FromQuery] int limit = 50)
    {
        var query = _db.Tasks.AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<Status>(status, true, out var statusEnum))
        {
            query = query.Where(t => t.Status == statusEnum);
        }

        if (!string.IsNullOrEmpty(parentTaskId))
        {
            query = query.Where(t => t.ParentTaskId == parentTaskId);
        }

        if (!string.IsNullOrEmpty(projectId))
        {
            query = query.Where(t => t.ProjectId == projectId);
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
                t.ParentTaskId,
                t.ProjectId
            })
            .ToList();

        return Ok(tasks);
    }

    /// <summary>
    /// GET /tasks/poll - Worker polls for available tasks
    /// Returns first PENDING task matching worker's domains
    /// </summary>
    [HttpGet("poll")]
    public async Task<IActionResult> PollForTask([FromQuery] string workerId, [FromQuery] string? domains = null)
    {
        var domainList = domains?.Split(',').Select(d => d.Trim()).ToList() ?? new List<string> { "general" };

        // Find oldest PENDING task matching any of worker's domains
        // SQLite doesn't support DateTimeOffset ordering, so we load then sort in memory
        var pendingTasks = await _db.Tasks
            .Where(t => t.Status == Status.PENDING && domainList.Contains(t.Domain))
            .ToListAsync();

        // Filter out tasks whose dependencies aren't met or where this worker already failed
        TaskEntity? task = null;
        foreach (var candidate in pendingTasks.OrderBy(t => t.CreatedAt))
        {
            // Skip tasks this worker already failed
            if (!string.IsNullOrEmpty(candidate.FailedWorkersJson))
            {
                var failedWorkers = JsonSerializer.Deserialize<List<string>>(candidate.FailedWorkersJson);
                if (failedWorkers != null && failedWorkers.Contains(workerId))
                    continue;
            }

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
            task = candidate;
            break;
        }

        if (task == null)
            return Ok(new { hasTask = false });

        // Claim the task — LEASED until worker ACKs
        task.Status = Status.LEASED;
        task.AssignedWorkerId = workerId;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            hasTask = true,
            taskId = task.TaskId,
            objective = task.Objective,
            domain = task.Domain,
            constraints = task.ConstraintsJson != null ? JsonSerializer.Deserialize<List<string>>(task.ConstraintsJson) : new List<string>(),
            inputs = task.InputsJson != null ? JsonSerializer.Deserialize<Dictionary<string, object>>(task.InputsJson) : new Dictionary<string, object>(),
            expectedOutputs = task.ExpectedOutputs,
            validationCriteria = task.ValidationCriteria,
            projectId = task.ProjectId
        });
    }

    /// <summary>
    /// POST /tasks/{id}/cancel - Cancel a pending or in-progress task
    /// </summary>
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelTask(string id)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.TaskId == id);

        if (task == null)
            return NotFound(new { error = "Task not found", taskId = id });

        if (task.Status != Status.PENDING && task.Status != Status.LEASED && task.Status != Status.ACKED
            && task.Status != Status.IN_PROGRESS && task.Status != Status.RUNNING)
            return BadRequest(new { error = $"Cannot cancel task in {task.Status} status", taskId = id });

        task.Status = Status.CANCELLED;
        task.CompletedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            taskId = id,
            status = "CANCELLED",
            cancelledAt = task.CompletedAt
        });
    }

    /// <summary>
    /// POST /tasks/{id}/retry - Retry a failed or cancelled task
    /// Resets status to PENDING, clears worker assignment and result
    /// </summary>
    [HttpPost("{id}/retry")]
    public async Task<IActionResult> RetryTask(string id)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.TaskId == id);

        if (task == null)
            return NotFound(new { error = "Task not found", taskId = id });

        if (task.Status != Status.FAIL && task.Status != Status.CANCELLED)
            return BadRequest(new { error = $"Can only retry FAIL or CANCELLED tasks, current status: {task.Status}", taskId = id });

        // Track the failed worker so polling skips it next time
        if (!string.IsNullOrEmpty(task.AssignedWorkerId))
        {
            var failedWorkers = !string.IsNullOrEmpty(task.FailedWorkersJson)
                ? JsonSerializer.Deserialize<List<string>>(task.FailedWorkersJson) ?? new List<string>()
                : new List<string>();
            if (!failedWorkers.Contains(task.AssignedWorkerId))
                failedWorkers.Add(task.AssignedWorkerId);
            task.FailedWorkersJson = JsonSerializer.Serialize(failedWorkers);
        }

        task.Status = Status.PENDING;
        task.AssignedWorkerId = null;
        task.ResultJson = null;
        task.ProgressJson = null;
        task.CompletedAt = null;
        task.LastProgressAt = null;
        task.RetryCount++;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            taskId = id,
            status = "PENDING",
            retryCount = task.RetryCount,
            excludedWorkers = task.FailedWorkersJson,
            retriedAt = DateTimeOffset.UtcNow
        });
    }

    /// <summary>
    /// DELETE /tasks/{id} - Delete a task (only completed, failed, or cancelled)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(string id)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.TaskId == id);

        if (task == null)
            return NotFound(new { error = "Task not found", taskId = id });

        if (task.Status == Status.PENDING || task.Status == Status.LEASED ||
            task.Status == Status.ACKED || task.Status == Status.IN_PROGRESS || task.Status == Status.RUNNING)
            return BadRequest(new { error = $"Cannot delete active task in {task.Status} status. Cancel it first.", taskId = id });

        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync();

        return Ok(new { taskId = id, deleted = true });
    }

    /// <summary>
    /// POST /tasks/{id}/result - Worker submits task result
    /// </summary>
    [HttpPost("{id}/result")]
    public async Task<IActionResult> SubmitResult(string id, [FromBody] TaskResultRequest request)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.TaskId == id);

        if (task == null)
            return NotFound(new { error = "Task not found", taskId = id });

        if (task.AssignedWorkerId != request.WorkerId)
            return BadRequest(new { error = "Task not assigned to this worker" });

        task.Status = request.Success ? Status.COMPLETED : Status.FAIL;
        task.ResultJson = JsonSerializer.Serialize(new
        {
            request.Outputs,
            request.ErrorMessage,
            request.ExecutionTimeMs,
            completedBy = request.WorkerId,
            completedAt = DateTimeOffset.UtcNow
        });
        task.CompletedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            taskId = id,
            status = task.Status.ToString(),
            completedAt = task.CompletedAt
        });
    }

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

        // Update status to RUNNING if still in ACKED/IN_PROGRESS
        if (task.Status == Status.ACKED || task.Status == Status.IN_PROGRESS)
        {
            task.Status = Status.RUNNING;
        }

        await _db.SaveChangesAsync();

        return Ok(new { taskId = id, status = task.Status.ToString() });
    }
}

public record TaskResultRequest
{
    public required string WorkerId { get; init; }
    public bool Success { get; init; } = true;
    public Dictionary<string, object>? Outputs { get; init; }
    public string? ErrorMessage { get; init; }
    public int ExecutionTimeMs { get; init; }
}

public record AckRequest
{
    public required string WorkerId { get; init; }
}

public record ProgressRequest
{
    public required string WorkerId { get; init; }
    public string? Message { get; init; }
    public int? PercentComplete { get; init; }
    public string? CurrentStep { get; init; }
}

// ── Domain auto-detection ──────────────────────────────────────────────

public static class DomainAutoDetector
{
    private static readonly string[] SoundDomains = { "sound", "audio", "sfx", "voice", "music", "tts" };

    // Only trigger sound auto-detection on very explicit phrases (avoid false positives)
    private static readonly string[] SoundKeywords =
    {
        "text to speech", "text-to-speech", "tts",
        "generate voice", "voice synthesis", "voice generation",
        "generate music", "create music", "music generation",
        "sound effect", "sfx",
        "generate audio", "create audio", "audio generation",
        "generate sound", "create sound", "sound generation",
    };

    /// <summary>
    /// If the submitted domain is generic (general/code) but the objective
    /// explicitly describes a sound/audio generation task, auto-route to "sound" domain.
    /// Uses tight keyword matching to avoid false positives on code tasks.
    /// </summary>
    public static string Detect(string submittedDomain, string objective)
    {
        // Already targeting sound — leave it
        if (SoundDomains.Contains(submittedDomain.ToLowerInvariant()))
            return submittedDomain;

        // Only re-route from generic domains, not from specific ones like "docs" or "ai-compute"
        var generic = submittedDomain.ToLowerInvariant() is "general" or "code";
        if (!generic) return submittedDomain;

        var lower = objective.ToLowerInvariant();
        foreach (var kw in SoundKeywords)
        {
            if (lower.Contains(kw))
                return "sound";
        }

        return submittedDomain;
    }
}

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

    // Project grouping
    public string? ProjectId { get; init; }

    // Decomposition support
    public string? ParentTaskId { get; init; }
    public string ExecutionMode { get; init; } = "auto";
    public List<string>? DependsOn { get; init; }

    // Worker routing
    public List<string>? ExcludeWorkers { get; init; }
}
