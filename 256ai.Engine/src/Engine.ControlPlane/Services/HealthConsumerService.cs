using System.Text.Json;
using Engine.Core.Enums;
using Engine.Core.Messages;
using Engine.Infrastructure.Data;
using Engine.Infrastructure.Entities;
using Engine.Infrastructure.Messaging;
using Microsoft.EntityFrameworkCore;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;

namespace Engine.ControlPlane.Services;

/// <summary>
/// Processes health messages (AHE/AHS/ASC) and updates DB state
/// </summary>
public class HealthConsumerService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly RabbitMqConnectionFactory _connectionFactory;
    private readonly ILogger<HealthConsumerService> _logger;
    private IModel? _channel;

    public HealthConsumerService(
        IServiceScopeFactory scopeFactory,
        RabbitMqConnectionFactory connectionFactory,
        ILogger<HealthConsumerService> logger)
    {
        _scopeFactory = scopeFactory;
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Yield(); // Don't block startup

        try
        {
            _channel = _connectionFactory.CreateChannel();
            _channel.BasicQos(prefetchSize: 0, prefetchCount: 10, global: false);

            // Consume from all health queues
            ConsumeQueue(RabbitMqConfig.HealthAgentQueue, ProcessAgentHeartbeat);
            ConsumeQueue(RabbitMqConfig.HealthAppQueue, ProcessAppHealth);
            ConsumeQueue(RabbitMqConfig.HealthSyntheticQueue, ProcessSyntheticCheck);

            _logger.LogInformation("Health consumer service started");

            // Keep running until cancelled
            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(1000, stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            // Expected on shutdown
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Health consumer service error");
        }
    }

    private void ConsumeQueue(string queueName, Func<string, Task> handler)
    {
        var consumer = new EventingBasicConsumer(_channel);

        consumer.Received += async (_, ea) =>
        {
            var body = Encoding.UTF8.GetString(ea.Body.ToArray());
            try
            {
                await handler(body);
                _channel!.BasicAck(ea.DeliveryTag, multiple: false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing message from {Queue}", queueName);
                _channel!.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
            }
        };

        _channel!.BasicConsume(queue: queueName, autoAck: false, consumer: consumer);
        _logger.LogInformation("Consuming from {Queue}", queueName);
    }

    private async Task ProcessAgentHeartbeat(string json)
    {
        var heartbeat = JsonSerializer.Deserialize<AgentHeartbeat>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (heartbeat == null) return;

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<EngineDbContext>();

        var existing = await db.WorkerHeartbeats.FirstOrDefaultAsync(w => w.WorkerId == heartbeat.WorkerId);

        if (existing != null)
        {
            existing.Status = heartbeat.Status.Status;
            existing.CapacityJson = JsonSerializer.Serialize(heartbeat.Capacity);
            existing.LastTaskId = heartbeat.LastTaskId;
            existing.Version = heartbeat.Version.WorkerVersion;
            existing.LastSeenAt = heartbeat.EmittedAt;
        }
        else
        {
            db.WorkerHeartbeats.Add(new WorkerHeartbeatEntity
            {
                WorkerId = heartbeat.WorkerId,
                Status = heartbeat.Status.Status,
                CapacityJson = JsonSerializer.Serialize(heartbeat.Capacity),
                LastTaskId = heartbeat.LastTaskId,
                Version = heartbeat.Version.WorkerVersion,
                LastSeenAt = heartbeat.EmittedAt
            });
        }

        await db.SaveChangesAsync();
        _logger.LogDebug("Updated heartbeat for worker {WorkerId}", heartbeat.WorkerId);
    }

    private async Task ProcessAppHealth(string json)
    {
        var health = JsonSerializer.Deserialize<AppHealthStatus>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (health == null) return;

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<EngineDbContext>();

        var existing = await db.AppHealth
            .FirstOrDefaultAsync(a => a.AppId == health.AppId && a.InstanceId == health.InstanceId);

        if (existing != null)
        {
            existing.OverallStatus = health.Status.Status;
            existing.Environment = health.Environment;
            existing.ChecksJson = JsonSerializer.Serialize(health.Checks);
            existing.LatencyP95 = health.LatencyP95;
            existing.ErrorRate = health.ErrorRate;
            existing.LastSeenAt = health.EmittedAt;
        }
        else
        {
            db.AppHealth.Add(new AppHealthEntity
            {
                Id = Guid.NewGuid(),
                AppId = health.AppId,
                InstanceId = health.InstanceId,
                Environment = health.Environment,
                OverallStatus = health.Status.Status,
                ChecksJson = JsonSerializer.Serialize(health.Checks),
                LatencyP95 = health.LatencyP95,
                ErrorRate = health.ErrorRate,
                LastSeenAt = health.EmittedAt
            });
        }

        await db.SaveChangesAsync();
        _logger.LogDebug("Updated health for app {AppId}/{InstanceId}", health.AppId, health.InstanceId);
    }

    private async Task ProcessSyntheticCheck(string json)
    {
        var check = JsonSerializer.Deserialize<SyntheticCheckResult>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (check == null) return;

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<EngineDbContext>();

        db.SyntheticChecks.Add(new SyntheticCheckEntity
        {
            Id = check.Header.MessageId,
            ScenarioId = check.Scenario.ScenarioId,
            Status = check.Status.Status,
            TimingsJson = JsonSerializer.Serialize(check.Metrics),
            FailureReason = check.Status.FailureReason,
            CorrelationId = check.Header.CorrelationId,
            CreatedAt = check.ExecutedAt
        });

        await db.SaveChangesAsync();

        // Log warning for failures per spec: "Any ASC failure is high signal"
        if (check.Status.Status == Status.FAIL)
        {
            _logger.LogWarning("Synthetic check FAILED: {ScenarioId} - {Reason}",
                check.Scenario.ScenarioId, check.Status.FailureReason);
        }
        else
        {
            _logger.LogDebug("Synthetic check passed: {ScenarioId}", check.Scenario.ScenarioId);
        }
    }

    public override void Dispose()
    {
        _channel?.Close();
        _channel?.Dispose();
        base.Dispose();
    }
}
