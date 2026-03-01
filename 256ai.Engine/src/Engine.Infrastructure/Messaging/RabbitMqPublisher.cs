using System.Text;
using System.Text.Json;
using Engine.Core.Interfaces;
using Engine.Core.Messages;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;

namespace Engine.Infrastructure.Messaging;

/// <summary>
/// Publishes messages to RabbitMQ
/// </summary>
public class RabbitMqPublisher : IMessagePublisher
{
    private readonly RabbitMqConnectionFactory _connectionFactory;
    private readonly ILogger<RabbitMqPublisher> _logger;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public RabbitMqPublisher(RabbitMqConnectionFactory connectionFactory, ILogger<RabbitMqPublisher> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    public Task PublishAsync<T>(T message, string routingKey, CancellationToken cancellationToken = default) where T : IMessage
    {
        using var channel = _connectionFactory.CreateChannel();

        var json = JsonSerializer.Serialize(message, _jsonOptions);
        var body = Encoding.UTF8.GetBytes(json);

        var properties = channel.CreateBasicProperties();
        properties.Persistent = true;
        properties.ContentType = "application/json";
        properties.MessageId = message.Header.MessageId.ToString();
        properties.CorrelationId = message.Header.CorrelationId?.ToString();
        properties.Timestamp = new AmqpTimestamp(message.Header.Timestamp.ToUnixTimeSeconds());
        properties.Type = message.Header.MessageType.ToString();

        channel.BasicPublish(
            exchange: RabbitMqConfig.ExchangeName,
            routingKey: routingKey,
            basicProperties: properties,
            body: body);

        _logger.LogDebug("Published {MessageType} with ID {MessageId} to {RoutingKey}",
            message.Header.MessageType, message.Header.MessageId, routingKey);

        return Task.CompletedTask;
    }

    public Task PublishTaskAsync(TaskMessage task, CancellationToken cancellationToken = default)
        => PublishAsync(task, RabbitMqConfig.TaskRoutingKey, cancellationToken);

    public Task PublishTaskResultAsync(TaskResultMessage result, CancellationToken cancellationToken = default)
        => PublishAsync(result, RabbitMqConfig.ResultRoutingKey, cancellationToken);

    public Task PublishHeartbeatAsync(AgentHeartbeat heartbeat, CancellationToken cancellationToken = default)
        => PublishAsync(heartbeat, RabbitMqConfig.HealthAgentRoutingKey, cancellationToken);

    public Task PublishAppHealthAsync(AppHealthStatus health, CancellationToken cancellationToken = default)
        => PublishAsync(health, RabbitMqConfig.HealthAppRoutingKey, cancellationToken);

    public Task PublishSyntheticCheckAsync(SyntheticCheckResult check, CancellationToken cancellationToken = default)
        => PublishAsync(check, RabbitMqConfig.HealthSyntheticRoutingKey, cancellationToken);

    public Task PublishEscalationAsync(EscalationMessage escalation, CancellationToken cancellationToken = default)
        => PublishAsync(escalation, RabbitMqConfig.EscalationRoutingKey, cancellationToken);
}
