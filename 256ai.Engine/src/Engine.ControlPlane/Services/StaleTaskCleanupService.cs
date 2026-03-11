using Engine.Core.Enums;
using Engine.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Engine.ControlPlane.Services;

/// <summary>
/// Detects and recovers stuck tasks. If a task has been in LEASED/ACKED/RUNNING
/// for too long without progress, it gets reset to PENDING so another worker can pick it up.
/// Checks every 60 seconds.
/// </summary>
public class StaleTaskCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<StaleTaskCleanupService> _logger;

    // LEASED tasks should be ACKed within 60s
    private static readonly TimeSpan LeasedTimeout = TimeSpan.FromMinutes(2);
    // ACKED/RUNNING tasks should show progress or complete within 35 min
    private static readonly TimeSpan ActiveTimeout = TimeSpan.FromMinutes(35);

    public StaleTaskCleanupService(IServiceScopeFactory scopeFactory, ILogger<StaleTaskCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("StaleTaskCleanupService started (leased timeout: {Leased}m, active timeout: {Active}m)",
            LeasedTimeout.TotalMinutes, ActiveTimeout.TotalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<EngineDbContext>();
                var now = DateTimeOffset.UtcNow;

                // Find tasks stuck in non-terminal states
                var stuckTasks = await db.Tasks
                    .Where(t => t.Status == Status.LEASED ||
                                t.Status == Status.ACKED ||
                                t.Status == Status.IN_PROGRESS ||
                                t.Status == Status.RUNNING)
                    .ToListAsync(stoppingToken);

                var recovered = 0;
                foreach (var task in stuckTasks)
                {
                    var lastActivity = task.LastProgressAt ?? task.CreatedAt;
                    var timeout = task.Status == Status.LEASED ? LeasedTimeout : ActiveTimeout;

                    if (now - lastActivity <= timeout)
                        continue;

                    _logger.LogWarning(
                        "Recovering stale task {TaskId} (status={Status}, worker={Worker}, idle for {Minutes:F0}m)",
                        task.TaskId, task.Status, task.AssignedWorkerId,
                        (now - lastActivity).TotalMinutes);

                    task.Status = Status.PENDING;
                    task.AssignedWorkerId = null;
                    task.ProgressJson = null;
                    task.LastProgressAt = null;
                    recovered++;
                }

                if (recovered > 0)
                {
                    await db.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation("Recovered {Count} stale task(s)", recovered);
                }
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in StaleTaskCleanupService");
            }
        }
    }
}
