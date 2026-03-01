using System.Text.Json;
using Engine.Core.Enums;
using Engine.Infrastructure.Data;
using Engine.Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Engine.ControlPlane.Controllers;

[ApiController]
[Route("benchmark")]
public class BenchmarkController : ControllerBase
{
    private readonly EngineDbContext _db;

    public BenchmarkController(EngineDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// POST /benchmark/run - Submit a batch of benchmark tasks
    /// </summary>
    [HttpPost("run")]
    public async Task<IActionResult> RunBenchmark([FromBody] BenchmarkRequest request)
    {
        var taskCount = request.TaskCount > 0 ? request.TaskCount : 10;
        var domain = request.Domain ?? "general";
        var projectId = request.ProjectId ?? $"benchmark-{DateTimeOffset.UtcNow:yyyyMMdd-HHmmss}";
        var now = DateTimeOffset.UtcNow;

        var taskIds = new List<string>();

        for (var i = 1; i <= taskCount; i++)
        {
            var taskId = Guid.NewGuid().ToString();
            var entity = new TaskEntity
            {
                TaskId = taskId,
                Objective = $"Benchmark task {i}/{taskCount} - respond with 'OK' and nothing else",
                Domain = domain,
                ExpectedOutputs = "OK",
                ProjectId = projectId,
                ExecutionMode = "auto",
                Status = Status.PENDING,
                CreatedAt = now
            };
            _db.Tasks.Add(entity);
            taskIds.Add(taskId);
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            projectId,
            taskCount,
            domain,
            submittedAt = now,
            taskIds
        });
    }

    /// <summary>
    /// GET /benchmark/{projectId} - Get live benchmark results
    /// </summary>
    [HttpGet("{projectId}")]
    public async Task<IActionResult> GetResults(string projectId)
    {
        var tasks = await _db.Tasks
            .Where(t => t.ProjectId == projectId)
            .ToListAsync();

        if (tasks.Count == 0)
            return NotFound(new { error = "No tasks found for this projectId", projectId });

        var now = DateTimeOffset.UtcNow;
        var completed = tasks.Where(t => t.Status == Status.COMPLETED).ToList();
        var failed = tasks.Where(t => t.Status == Status.FAIL || t.Status == Status.CANCELLED).ToList();
        var pending = tasks.Where(t => t.Status != Status.COMPLETED && t.Status != Status.FAIL && t.Status != Status.CANCELLED).ToList();

        var firstSubmit = tasks.Min(t => t.CreatedAt);
        var lastComplete = completed.Any() ? completed.Max(t => t.CompletedAt ?? now) : now;
        var wallTimeSec = (lastComplete - firstSubmit).TotalSeconds;

        // Latencies
        var latencies = completed
            .Where(t => t.CompletedAt.HasValue)
            .Select(t => (t.CompletedAt!.Value - t.CreatedAt).TotalMilliseconds)
            .OrderBy(l => l)
            .ToList();

        double? avgLatency = null, p50 = null, p95 = null, p99 = null, minLatency = null, maxLatency = null;
        if (latencies.Count > 0)
        {
            avgLatency = latencies.Average();
            minLatency = latencies[0];
            maxLatency = latencies[^1];
            p50 = latencies[(int)(latencies.Count * 0.50)];
            p95 = latencies[Math.Min((int)(latencies.Count * 0.95), latencies.Count - 1)];
            p99 = latencies[Math.Min((int)(latencies.Count * 0.99), latencies.Count - 1)];
        }

        // Execution times
        var execTimes = new List<int>();
        foreach (var t in completed)
        {
            if (t.ResultJson != null)
            {
                try
                {
                    using var doc = JsonDocument.Parse(t.ResultJson);
                    if (doc.RootElement.TryGetProperty("executionTimeMs", out var etProp) ||
                        doc.RootElement.TryGetProperty("ExecutionTimeMs", out etProp))
                    {
                        execTimes.Add(etProp.GetInt32());
                    }
                }
                catch { }
            }
        }

        // Per-worker distribution
        var workerDist = tasks
            .Where(t => t.AssignedWorkerId != null)
            .GroupBy(t => t.AssignedWorkerId!)
            .ToDictionary(g => g.Key, g => g.Count());

        var throughputPerSec = wallTimeSec > 0 ? Math.Round(completed.Count / wallTimeSec, 2) : 0;
        var throughputPerMin = Math.Round(throughputPerSec * 60, 1);

        return Ok(new
        {
            projectId,
            total = tasks.Count,
            completed = completed.Count,
            failed = failed.Count,
            pending = pending.Count,
            wallTimeSec = Math.Round(wallTimeSec, 1),
            throughput = new { tasksPerSec = throughputPerSec, tasksPerMin = throughputPerMin },
            latencyMs = latencies.Count > 0 ? new
            {
                min = Math.Round(minLatency!.Value),
                avg = Math.Round(avgLatency!.Value),
                p50 = Math.Round(p50!.Value),
                p95 = Math.Round(p95!.Value),
                p99 = Math.Round(p99!.Value),
                max = Math.Round(maxLatency!.Value)
            } : null,
            execTimeMs = execTimes.Count > 0 ? new
            {
                min = execTimes.Min(),
                avg = (int)execTimes.Average(),
                max = execTimes.Max()
            } : null,
            workerDistribution = workerDist
        });
    }
}

public record BenchmarkRequest
{
    public int TaskCount { get; init; } = 10;
    public string? Domain { get; init; }
    public string? ProjectId { get; init; }
}
