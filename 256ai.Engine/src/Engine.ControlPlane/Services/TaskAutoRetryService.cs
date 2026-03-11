using System.Text.Json;
using Engine.Core.Enums;
using Engine.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Engine.ControlPlane.Services;

/// <summary>
/// Background service that auto-retries failed tasks.
/// Checks every 30 seconds for FAIL tasks under MaxRetries, resets them to PENDING
/// with the failed worker excluded from future polling.
/// </summary>
public class TaskAutoRetryService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TaskAutoRetryService> _logger;

    public TaskAutoRetryService(IServiceScopeFactory scopeFactory, ILogger<TaskAutoRetryService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("TaskAutoRetryService started");

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<EngineDbContext>();

                var failedTasks = await db.Tasks
                    .Where(t => t.Status == Status.FAIL && t.RetryCount < t.MaxRetries)
                    .ToListAsync(stoppingToken);

                foreach (var task in failedTasks)
                {
                    // Track the failed worker
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

                    _logger.LogInformation(
                        "Auto-retrying task {TaskId} (attempt {Retry}/{Max}), excluded workers: {Excluded}",
                        task.TaskId, task.RetryCount, task.MaxRetries, task.FailedWorkersJson);
                }

                if (failedTasks.Count > 0)
                    await db.SaveChangesAsync(stoppingToken);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in TaskAutoRetryService");
            }
        }
    }
}
