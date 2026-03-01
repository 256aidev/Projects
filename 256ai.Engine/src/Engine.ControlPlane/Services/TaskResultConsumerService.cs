using System.Text;
using System.Text.Json;
using Engine.Core.Enums;
using Engine.Core.Messages;
using Engine.Infrastructure.Data;
using Engine.Infrastructure.Messaging;
using Microsoft.EntityFrameworkCore;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Engine.ControlPlane.Services;

/// <summary>
/// Processes task results from workers and updates task state
/// </summary>
public class TaskResultConsumerService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly RabbitMqConnectionFactory _connectionFactory;
    private readonly ILogger<TaskResultConsumerService> _logger;
    private IModel? _channel;

    public TaskResultConsumerService(
        IServiceScopeFactory scopeFactory,
        RabbitMqConnectionFactory connectionFactory,
        ILogger<TaskResultConsumerService> logger)
    {
        _scopeFactory = scopeFactory;
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Yield();

        try
        {
            _channel = _connectionFactory.CreateChannel();
            _channel.BasicQos(prefetchSize: 0, prefetchCount: 5, global: false);

            var consumer = new EventingBasicConsumer(_channel);

            consumer.Received += async (_, ea) =>
            {
                var body = Encoding.UTF8.GetString(ea.Body.ToArray());
                try
                {
                    await ProcessTaskResult(body);
                    _channel.BasicAck(ea.DeliveryTag, multiple: false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing task result");
                    _channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
                }
            };

            _channel.BasicConsume(queue: RabbitMqConfig.ResultsQueue, autoAck: false, consumer: consumer);
            _logger.LogInformation("Task result consumer started");

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
            _logger.LogError(ex, "Task result consumer error");
        }
    }

    private async Task ProcessTaskResult(string json)
    {
        var result = JsonSerializer.Deserialize<TaskResultMessage>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (result == null) return;

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<EngineDbContext>();

        var task = await db.Tasks.FirstOrDefaultAsync(t => t.TaskId == result.TaskId);

        if (task == null)
        {
            _logger.LogWarning("Received result for unknown task {TaskId}", result.TaskId);
            return;
        }

        task.Status = result.Status.Status;
        task.ResultJson = JsonSerializer.Serialize(result.Outputs);
        task.CompletedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();

        _logger.LogInformation("Task {TaskId} completed with status {Status} by worker {WorkerId}",
            result.TaskId, result.Status.Status, result.WorkerId);
    }

    public override void Dispose()
    {
        _channel?.Close();
        _channel?.Dispose();
        base.Dispose();
    }
}
