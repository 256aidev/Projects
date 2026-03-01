using System.ComponentModel;
using System.Text.Json;
using Engine.Core.Enums;
using Engine.Infrastructure.Data;
using Engine.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using ModelContextProtocol.Server;

namespace Engine.ControlPlane.McpTools;

[McpServerToolType]
public class TaskTools
{
    [McpServerTool(Name = "submit_task"), Description("Submit a new task to the 256ai Engine for worker execution.")]
    public static async Task<string> SubmitTask(
        EngineDbContext db,
        [Description("What the task should accomplish")] string objective,
        [Description("Task domain: general, code, docs, ai-compute, data")] string domain,
        [Description("What output is expected from the task")] string expectedOutputs,
        [Description("Execution mode: auto, manual, or batch")] string? executionMode = "auto",
        [Description("Project ID to group related tasks together")] string? projectId = null,
        CancellationToken cancellationToken = default)
    {
        var taskId = Guid.NewGuid().ToString();
        var now = DateTimeOffset.UtcNow;

        var entity = new TaskEntity
        {
            TaskId = taskId,
            Objective = objective,
            Domain = domain,
            ExpectedOutputs = expectedOutputs,
            ExecutionMode = executionMode ?? "auto",
            ProjectId = projectId,
            Status = Status.PENDING,
            CreatedAt = now
        };

        db.Tasks.Add(entity);
        await db.SaveChangesAsync(cancellationToken);

        return JsonSerializer.Serialize(new
        {
            taskId,
            status = "PENDING",
            createdAt = now
        });
    }

    [McpServerTool(Name = "get_task"), Description("Get the status and result of a task by its ID.")]
    public static async Task<string> GetTask(
        EngineDbContext db,
        [Description("The task ID (GUID string)")] string taskId,
        CancellationToken cancellationToken = default)
    {
        var task = await db.Tasks.FirstOrDefaultAsync(t => t.TaskId == taskId, cancellationToken);

        if (task == null)
            return JsonSerializer.Serialize(new { error = "Task not found", taskId });

        return JsonSerializer.Serialize(new
        {
            task.TaskId,
            task.Objective,
            task.Domain,
            Status = task.Status.ToString(),
            task.AssignedWorkerId,
            task.CreatedAt,
            task.CompletedAt,
            task.ParentTaskId,
            task.ExecutionMode,
            Progress = task.ProgressJson != null ? JsonSerializer.Deserialize<object>(task.ProgressJson) : null,
            Result = task.ResultJson != null ? JsonSerializer.Deserialize<object>(task.ResultJson) : null
        });
    }

    [McpServerTool(Name = "list_tasks"), Description("List tasks in the engine, optionally filtered by status or project.")]
    public static async Task<string> ListTasks(
        EngineDbContext db,
        [Description("Filter by status: PENDING, LEASED, ACKED, RUNNING, COMPLETED, FAIL, CANCELLED")] string? status = null,
        [Description("Filter by project ID")] string? projectId = null,
        [Description("Maximum number of tasks to return (default 20)")] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        var query = db.Tasks.AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<Status>(status, true, out var statusEnum))
        {
            query = query.Where(t => t.Status == statusEnum);
        }

        if (!string.IsNullOrEmpty(projectId))
        {
            query = query.Where(t => t.ProjectId == projectId);
        }

        var allTasks = await query.ToListAsync(cancellationToken);

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
                t.ProjectId
            })
            .ToList();

        return JsonSerializer.Serialize(tasks);
    }

    [McpServerTool(Name = "cancel_task"), Description("Cancel a pending or in-progress task.")]
    public static async Task<string> CancelTask(
        EngineDbContext db,
        [Description("The task ID to cancel")] string taskId,
        CancellationToken cancellationToken = default)
    {
        var task = await db.Tasks.FirstOrDefaultAsync(t => t.TaskId == taskId, cancellationToken);

        if (task == null)
            return JsonSerializer.Serialize(new { error = "Task not found", taskId });

        if (task.Status != Status.PENDING && task.Status != Status.LEASED && task.Status != Status.ACKED
            && task.Status != Status.IN_PROGRESS && task.Status != Status.RUNNING)
            return JsonSerializer.Serialize(new { error = $"Cannot cancel task in {task.Status} status", taskId });

        task.Status = Status.CANCELLED;
        task.CompletedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return JsonSerializer.Serialize(new
        {
            taskId,
            status = "CANCELLED",
            cancelledAt = task.CompletedAt
        });
    }
}
