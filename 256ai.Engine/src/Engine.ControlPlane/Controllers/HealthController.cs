using System.Text.Json;
using Engine.Core.Enums;
using Engine.Infrastructure.Data;
using Engine.Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Engine.ControlPlane.Controllers;

/// <summary>
/// Health endpoints per spec - Operator Visibility (No SSH Required)
/// </summary>
[ApiController]
[Route("health")]
public class HealthController : ControllerBase
{
    private readonly EngineDbContext _db;

    public HealthController(EngineDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// GET /health/workers - List worker health
    /// </summary>
    [HttpGet("workers")]
    public async Task<IActionResult> GetWorkers()
    {
        var now = DateTimeOffset.UtcNow;
        var workers = await _db.WorkerHeartbeats.ToListAsync();

        var result = workers
            .OrderByDescending(w => w.LastSeenAt)
            .Select(w => new
            {
                w.WorkerId,
                w.Role,
                w.Provider,
                Status = w.Status.ToString(),
                w.Version,
                w.LastTaskId,
                w.IpAddress,
                w.LastSeenAt,
                IsOnline = w.LastSeenAt > now.AddMinutes(-1)
            })
            .ToList();

        return Ok(result);
    }

    /// <summary>
    /// GET /health/apps - List app health
    /// </summary>
    [HttpGet("apps")]
    public async Task<IActionResult> GetApps()
    {
        var now = DateTimeOffset.UtcNow;
        var apps = await _db.AppHealth.ToListAsync();

        var result = apps
            .OrderByDescending(a => a.LastSeenAt)
            .Select(a => new
            {
                a.AppId,
                a.InstanceId,
                a.Environment,
                Status = a.OverallStatus.ToString(),
                a.LatencyP95,
                a.ErrorRate,
                a.LastSeenAt,
                IsHealthy = a.LastSeenAt > now.AddMinutes(-2)
            })
            .ToList();

        return Ok(result);
    }

    /// <summary>
    /// GET /health/synthetic - List synthetic check results
    /// </summary>
    [HttpGet("synthetic")]
    public async Task<IActionResult> GetSyntheticChecks([FromQuery] int limit = 50)
    {
        var checks = await _db.SyntheticChecks.ToListAsync();

        var result = checks
            .OrderByDescending(c => c.CreatedAt)
            .Take(limit)
            .Select(c => new
            {
                c.Id,
                c.ScenarioId,
                Status = c.Status.ToString(),
                c.FailureReason,
                c.CorrelationId,
                c.CreatedAt
            })
            .ToList();

        return Ok(result);
    }

    /// <summary>
    /// GET /health/summary - Overall system health
    /// Goal: An operator can understand system health WITHOUT logging into a box.
    /// </summary>
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var now = DateTimeOffset.UtcNow;
        var oneMinuteAgo = now.AddMinutes(-1);
        var twoMinutesAgo = now.AddMinutes(-2);
        var oneHourAgo = now.AddHours(-1);

        var workers = await _db.WorkerHeartbeats.ToListAsync();
        var apps = await _db.AppHealth.ToListAsync();
        var syntheticChecks = await _db.SyntheticChecks.ToListAsync();
        var escalations = await _db.Escalations.ToListAsync();

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

        return Ok(new
        {
            OverallStatus = overallStatus,
            Timestamp = now,
            Workers = new
            {
                Online = workersOnline,
                Degraded = workersDegraded,
                Total = workers.Count
            },
            Apps = new
            {
                Healthy = appsHealthy,
                Degraded = appsDegraded,
                Total = apps.Count
            },
            SyntheticChecks = new
            {
                PassesLastHour = recentSyntheticPasses,
                FailsLastHour = recentSyntheticFails
            },
            Escalations = new
            {
                Pending = pendingEscalations,
                Total = escalations.Count
            }
        });
    }

    /// <summary>
    /// DELETE /health/workers/{workerId} - Remove a dead/stale worker
    /// </summary>
    [HttpDelete("workers/{workerId}")]
    public async Task<IActionResult> DeleteWorker(string workerId)
    {
        var worker = await _db.WorkerHeartbeats.FindAsync(workerId);

        if (worker == null)
            return NotFound(new { error = "Worker not found", workerId });

        _db.WorkerHeartbeats.Remove(worker);
        await _db.SaveChangesAsync();

        return Ok(new { deleted = true, workerId });
    }

    /// <summary>
    /// POST /health/heartbeat - Worker sends heartbeat (AHE message via HTTP)
    /// </summary>
    [HttpPost("heartbeat")]
    public async Task<IActionResult> PostHeartbeat([FromBody] WorkerHeartbeatRequest request)
    {
        var now = DateTimeOffset.UtcNow;
        var remoteIp = HttpContext.Connection.RemoteIpAddress?.MapToIPv4().ToString();
        // Prefer worker-reported IP (avoids loopback for local workers), fall back to connection IP
        var workerIp = !string.IsNullOrEmpty(request.IpAddress) ? request.IpAddress : remoteIp;

        // Find existing or create new
        var existing = await _db.WorkerHeartbeats.FindAsync(request.WorkerId);

        if (existing == null)
        {
            var entity = new WorkerHeartbeatEntity
            {
                WorkerId = request.WorkerId,
                Status = Enum.TryParse<Status>(request.Status, out var s) ? s : Status.OK,
                CapacityJson = JsonSerializer.Serialize(request.Capacity),
                LastTaskId = request.LastTaskId,
                Version = request.Version ?? "1.0.0",
                IpAddress = workerIp,
                Role = request.Role,
                Provider = request.Provider,
                LastSeenAt = now
            };
            _db.WorkerHeartbeats.Add(entity);
        }
        else
        {
            existing.Status = Enum.TryParse<Status>(request.Status, out var s) ? s : Status.OK;
            existing.CapacityJson = JsonSerializer.Serialize(request.Capacity);
            existing.LastTaskId = request.LastTaskId;
            existing.Version = request.Version ?? existing.Version;
            existing.IpAddress = workerIp;
            existing.Role = request.Role ?? existing.Role;
            existing.Provider = request.Provider ?? existing.Provider;
            existing.LastSeenAt = now;
        }

        await _db.SaveChangesAsync();

        return Ok(new { received = true, workerId = request.WorkerId, timestamp = now });
    }
}

/// <summary>
/// Request model for worker heartbeat
/// </summary>
public class WorkerHeartbeatRequest
{
    public required string WorkerId { get; set; }
    public string Status { get; set; } = "OK";
    public string? LastTaskId { get; set; }
    public string? Version { get; set; }
    public string? Role { get; set; }
    public string? Provider { get; set; }
    public string? IpAddress { get; set; }
    public WorkerCapacity? Capacity { get; set; }
}

public class WorkerCapacity
{
    public int MaxConcurrent { get; set; } = 5;
    public int CurrentInflight { get; set; } = 0;
    public List<string> Domains { get; set; } = new() { "general" };
}
