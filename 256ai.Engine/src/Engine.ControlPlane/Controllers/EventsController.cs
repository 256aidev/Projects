using Engine.Core.Enums;
using Engine.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Engine.ControlPlane.Controllers;

/// <summary>
/// Events endpoint - Activity log for dashboard
/// Aggregates events from tasks, workers, escalations
/// </summary>
[ApiController]
[Route("events")]
public class EventsController : ControllerBase
{
    private readonly EngineDbContext _db;

    public EventsController(EngineDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// GET /events - Get recent activity events
    /// Aggregates: task lifecycle, worker heartbeats, escalations
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetEvents([FromQuery] int limit = 50)
    {
        var events = new List<ActivityEvent>();

        // Get recent tasks
        var tasks = await _db.Tasks.ToListAsync();
        var recentTasks = tasks.OrderByDescending(t => t.CreatedAt).Take(limit).ToList();

        foreach (var task in recentTasks)
        {
            // Task created event
            events.Add(new ActivityEvent
            {
                Timestamp = task.CreatedAt,
                Type = "TASK_CREATED",
                Icon = "📋",
                Message = $"Task created: {Truncate(task.Objective, 50)}",
                TaskId = task.TaskId,
                Domain = task.Domain
            });

            // Task claimed event (if assigned)
            if (!string.IsNullOrEmpty(task.AssignedWorkerId) && task.Status != Status.PENDING)
            {
                events.Add(new ActivityEvent
                {
                    Timestamp = task.CreatedAt.AddSeconds(1), // Approximation
                    Type = "TASK_CLAIMED",
                    Icon = "⚡",
                    Message = $"Task claimed by {task.AssignedWorkerId}",
                    TaskId = task.TaskId,
                    WorkerId = task.AssignedWorkerId
                });
            }

            // Task completed/failed event
            if (task.CompletedAt.HasValue)
            {
                var isSuccess = task.Status == Status.COMPLETED;
                events.Add(new ActivityEvent
                {
                    Timestamp = task.CompletedAt.Value,
                    Type = isSuccess ? "TASK_COMPLETED" : "TASK_FAILED",
                    Icon = isSuccess ? "✅" : "❌",
                    Message = $"Task {(isSuccess ? "completed" : "failed")}: {Truncate(task.Objective, 40)}",
                    TaskId = task.TaskId,
                    WorkerId = task.AssignedWorkerId
                });
            }
        }

        // Get recent worker heartbeats
        var workers = await _db.WorkerHeartbeats.ToListAsync();
        foreach (var worker in workers.OrderByDescending(w => w.LastSeenAt).Take(20))
        {
            events.Add(new ActivityEvent
            {
                Timestamp = worker.LastSeenAt,
                Type = "WORKER_HEARTBEAT",
                Icon = "💓",
                Message = $"Heartbeat from {worker.WorkerId}",
                WorkerId = worker.WorkerId
            });
        }

        // Get recent escalations
        var escalations = await _db.Escalations.ToListAsync();
        foreach (var esc in escalations.OrderByDescending(e => e.CreatedAt).Take(10))
        {
            events.Add(new ActivityEvent
            {
                Timestamp = esc.CreatedAt,
                Type = "ESCALATION",
                Icon = "🚨",
                Message = $"Escalation ({esc.Level}): {Truncate(esc.Recommendation, 40)}",
                EscalationId = esc.Id.ToString()
            });
        }

        // Sort all events by timestamp, most recent first
        var sortedEvents = events
            .OrderByDescending(e => e.Timestamp)
            .Take(limit)
            .ToList();

        return Ok(sortedEvents);
    }

    private static string Truncate(string text, int maxLength)
    {
        if (string.IsNullOrEmpty(text)) return "";
        return text.Length <= maxLength ? text : text.Substring(0, maxLength) + "...";
    }
}

public class ActivityEvent
{
    public DateTimeOffset Timestamp { get; set; }
    public string Type { get; set; } = "";
    public string Icon { get; set; } = "";
    public string Message { get; set; } = "";
    public string? TaskId { get; set; }
    public string? WorkerId { get; set; }
    public string? Domain { get; set; }
    public string? EscalationId { get; set; }
}
