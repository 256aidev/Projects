using System.ComponentModel;
using System.Text.Json;
using Engine.Core.Enums;
using Engine.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using ModelContextProtocol.Server;

namespace Engine.ControlPlane.McpTools;

[McpServerToolType]
public class HealthTools
{
    [McpServerTool(Name = "system_health", ReadOnly = true), Description("Get overall 256ai Engine system health: workers, apps, synthetic checks, and escalations summary.")]
    public static async Task<string> SystemHealth(
        EngineDbContext db,
        CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var oneMinuteAgo = now.AddMinutes(-1);
        var twoMinutesAgo = now.AddMinutes(-2);
        var oneHourAgo = now.AddHours(-1);

        var workers = await db.WorkerHeartbeats.ToListAsync(cancellationToken);
        var apps = await db.AppHealth.ToListAsync(cancellationToken);
        var syntheticChecks = await db.SyntheticChecks.ToListAsync(cancellationToken);
        var escalations = await db.Escalations.ToListAsync(cancellationToken);

        var workersOnline = workers.Count(w => w.LastSeenAt > oneMinuteAgo);
        var workersDegraded = workers.Count(w => w.Status == Status.DEGRADED && w.LastSeenAt > oneMinuteAgo);

        var appsHealthy = apps.Count(a => a.OverallStatus == Status.OK && a.LastSeenAt > twoMinutesAgo);
        var appsDegraded = apps.Count(a => a.OverallStatus == Status.DEGRADED && a.LastSeenAt > twoMinutesAgo);

        var recentSyntheticPasses = syntheticChecks.Count(c => c.Status == Status.PASS && c.CreatedAt > oneHourAgo);
        var recentSyntheticFails = syntheticChecks.Count(c => c.Status == Status.FAIL && c.CreatedAt > oneHourAgo);

        var pendingEscalations = escalations.Count(e => e.Disposition == EscalationDisposition.Pending);

        var overallStatus = "OK";
        if (recentSyntheticFails > 0 || workersDegraded > 0 || appsDegraded > 0)
            overallStatus = "DEGRADED";
        if (workersOnline == 0)
            overallStatus = "DOWN";

        return JsonSerializer.Serialize(new
        {
            OverallStatus = overallStatus,
            Timestamp = now,
            Workers = new { Online = workersOnline, Degraded = workersDegraded, Total = workers.Count },
            Apps = new { Healthy = appsHealthy, Degraded = appsDegraded, Total = apps.Count },
            SyntheticChecks = new { PassesLastHour = recentSyntheticPasses, FailsLastHour = recentSyntheticFails },
            Escalations = new { Pending = pendingEscalations, Total = escalations.Count }
        });
    }

    [McpServerTool(Name = "list_workers", ReadOnly = true), Description("List all registered workers with their status, role, IP, and online state.")]
    public static async Task<string> ListWorkers(
        EngineDbContext db,
        CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        var workers = await db.WorkerHeartbeats.ToListAsync(cancellationToken);

        var result = workers
            .OrderByDescending(w => w.LastSeenAt)
            .Select(w => new
            {
                w.WorkerId,
                w.Role,
                Status = w.Status.ToString(),
                w.Version,
                w.LastTaskId,
                w.IpAddress,
                w.LastSeenAt,
                IsOnline = w.LastSeenAt > now.AddMinutes(-1)
            })
            .ToList();

        return JsonSerializer.Serialize(result);
    }

    [McpServerTool(Name = "remove_worker", Destructive = true), Description("Remove a stale or dead worker from the registry.")]
    public static async Task<string> RemoveWorker(
        EngineDbContext db,
        [Description("The worker ID to remove")] string workerId,
        CancellationToken cancellationToken = default)
    {
        var worker = await db.WorkerHeartbeats.FindAsync([workerId], cancellationToken);

        if (worker == null)
            return JsonSerializer.Serialize(new { error = "Worker not found", workerId });

        db.WorkerHeartbeats.Remove(worker);
        await db.SaveChangesAsync(cancellationToken);

        return JsonSerializer.Serialize(new { deleted = true, workerId });
    }
}
