using System.ComponentModel;
using System.Text.Json;
using Engine.Core.Enums;
using Engine.Infrastructure.Data;
using Engine.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using ModelContextProtocol.Server;

namespace Engine.ControlPlane.McpTools;

[McpServerToolType]
public class BenchmarkTools
{
    [McpServerTool(Name = "run_benchmark"), Description("Run a throughput benchmark by submitting N synthetic tasks and returning a projectId to track results.")]
    public static async Task<string> RunBenchmark(
        EngineDbContext db,
        [Description("Number of benchmark tasks to submit (default 10)")] int taskCount = 10,
        [Description("Target domain: general, code, docs, ai-compute, data")] string domain = "general",
        CancellationToken cancellationToken = default)
    {
        var projectId = $"benchmark-{DateTimeOffset.UtcNow:yyyyMMdd-HHmmss}";
        var now = DateTimeOffset.UtcNow;
        var taskIds = new List<string>();

        for (var i = 1; i <= taskCount; i++)
        {
            var taskId = Guid.NewGuid().ToString();
            db.Tasks.Add(new TaskEntity
            {
                TaskId = taskId,
                Objective = $"Benchmark task {i}/{taskCount} - respond with 'OK' and nothing else",
                Domain = domain,
                ExpectedOutputs = "OK",
                ProjectId = projectId,
                ExecutionMode = "auto",
                Status = Status.PENDING,
                CreatedAt = now
            });
            taskIds.Add(taskId);
        }

        await db.SaveChangesAsync(cancellationToken);

        return JsonSerializer.Serialize(new
        {
            projectId,
            taskCount,
            domain,
            submittedAt = now,
            message = $"Submitted {taskCount} benchmark tasks. Use benchmark_results with projectId '{projectId}' to check progress."
        });
    }

    [McpServerTool(Name = "benchmark_results", ReadOnly = true), Description("Get live results for a benchmark run by its projectId.")]
    public static async Task<string> BenchmarkResults(
        EngineDbContext db,
        [Description("The projectId from run_benchmark")] string projectId,
        CancellationToken cancellationToken = default)
    {
        var tasks = await db.Tasks
            .Where(t => t.ProjectId == projectId)
            .ToListAsync(cancellationToken);

        if (tasks.Count == 0)
            return JsonSerializer.Serialize(new { error = "No tasks found for this projectId", projectId });

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

        var throughputPerSec = wallTimeSec > 0 ? Math.Round(completed.Count / wallTimeSec, 2) : 0;

        // Per-worker distribution
        var workerDist = tasks
            .Where(t => t.AssignedWorkerId != null)
            .GroupBy(t => t.AssignedWorkerId!)
            .ToDictionary(g => g.Key, g => g.Count());

        var result = new
        {
            projectId,
            total = tasks.Count,
            completed = completed.Count,
            failed = failed.Count,
            pending = pending.Count,
            wallTimeSec = Math.Round(wallTimeSec, 1),
            throughputTasksPerSec = throughputPerSec,
            throughputTasksPerMin = Math.Round(throughputPerSec * 60, 1),
            latencyMs = latencies.Count > 0 ? new
            {
                avg = Math.Round(latencies.Average()),
                p50 = Math.Round(latencies[(int)(latencies.Count * 0.50)]),
                p95 = Math.Round(latencies[Math.Min((int)(latencies.Count * 0.95), latencies.Count - 1)]),
                max = Math.Round(latencies[^1])
            } : null,
            workerDistribution = workerDist
        };

        return JsonSerializer.Serialize(result);
    }
}
