using System.Text;
using System.Text.Json;
using Engine.Core.Enums;
using Engine.Core.Interfaces;
using Engine.Core.Messages;
using Engine.Core.Segments;
using Engine.Infrastructure.Messaging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Engine.Worker.Services;

/// <summary>
/// Consumes tasks from queue and executes them
/// </summary>
public class TaskConsumerService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly RabbitMqConnectionFactory _connectionFactory;
    private readonly WorkerConfig _config;
    private readonly TaskTrackerService _taskTracker;
    private readonly ILogger<TaskConsumerService> _logger;
    private IModel? _channel;

    public TaskConsumerService(
        IServiceScopeFactory scopeFactory,
        RabbitMqConnectionFactory connectionFactory,
        IOptions<WorkerConfig> config,
        TaskTrackerService taskTracker,
        ILogger<TaskConsumerService> logger)
    {
        _scopeFactory = scopeFactory;
        _connectionFactory = connectionFactory;
        _config = config.Value;
        _taskTracker = taskTracker;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Yield();

        try
        {
            _channel = _connectionFactory.CreateChannel();
            _channel.BasicQos(prefetchSize: 0, prefetchCount: (ushort)_config.MaxConcurrentTasks, global: false);

            var consumer = new EventingBasicConsumer(_channel);

            consumer.Received += async (_, ea) =>
            {
                var body = Encoding.UTF8.GetString(ea.Body.ToArray());
                try
                {
                    await ProcessTask(body);
                    _channel.BasicAck(ea.DeliveryTag, multiple: false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing task");
                    _channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
                }
            };

            _channel.BasicConsume(queue: RabbitMqConfig.TasksQueue, autoAck: false, consumer: consumer);
            _logger.LogInformation("Task consumer started for worker {WorkerId}", _config.WorkerId);

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
            _logger.LogError(ex, "Task consumer error");
        }
    }

    private async Task ProcessTask(string json)
    {
        var task = JsonSerializer.Deserialize<TaskMessage>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (task == null) return;

        _logger.LogInformation("Received task {TaskId}: {Objective}", task.TaskId, task.Objective);
        _taskTracker.TaskStarted(task.TaskId);

        var startTime = DateTime.UtcNow;
        Status resultStatus;
        Dictionary<string, object> outputs;
        string? errorMessage = null;

        try
        {
            // Execute the task (placeholder - would call Claude API here)
            outputs = await RunTaskAsync(task);
            resultStatus = Status.COMPLETED;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Task {TaskId} failed", task.TaskId);
            resultStatus = Status.FAIL;
            outputs = new Dictionary<string, object>();
            errorMessage = ex.Message;
        }
        finally
        {
            _taskTracker.TaskCompleted(task.TaskId);
        }

        var executionTimeMs = (int)(DateTime.UtcNow - startTime).TotalMilliseconds;

        // Publish result
        using var scope = _scopeFactory.CreateScope();
        var publisher = scope.ServiceProvider.GetRequiredService<IMessagePublisher>();

        var now = DateTimeOffset.UtcNow;
        var result = new TaskResultMessage
        {
            Header = new HDR
            {
                MessageId = Guid.NewGuid(),
                MessageType = MessageType.TRS,
                Timestamp = now,
                CorrelationId = Guid.Parse(task.TaskId)
            },
            Context = new CTX
            {
                Source = _config.WorkerId,
                Destination = "controlplane",
                Domain = task.Domain
            },
            Audit = new AUD
            {
                CreatedBy = _config.WorkerId,
                CreatedAt = now
            },
            Status = new STA
            {
                Status = resultStatus,
                FailureReason = errorMessage
            },
            TaskId = task.TaskId,
            WorkerId = _config.WorkerId,
            Outputs = outputs,
            ErrorMessage = errorMessage,
            ExecutionTimeMs = executionTimeMs
        };

        await publisher.PublishTaskResultAsync(result);
        _logger.LogInformation("Task {TaskId} completed with status {Status} in {Ms}ms",
            task.TaskId, resultStatus, executionTimeMs);
    }

    private async Task<Dictionary<string, object>> RunTaskAsync(TaskMessage task)
    {
        // Placeholder implementation
        // In production, this would call the Claude API
        await Task.Delay(100); // Simulate some work

        _logger.LogDebug("Executing task: {Objective}", task.Objective);

        return new Dictionary<string, object>
        {
            ["status"] = "executed",
            ["objective"] = task.Objective,
            ["worker"] = _config.WorkerId,
            ["note"] = "Claude API integration pending"
        };
    }

    public override void Dispose()
    {
        _channel?.Close();
        _channel?.Dispose();
        base.Dispose();
    }
}
