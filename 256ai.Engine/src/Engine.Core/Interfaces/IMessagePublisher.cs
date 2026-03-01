using Engine.Core.Messages;

namespace Engine.Core.Interfaces;

/// <summary>
/// Publishes messages to the message bus
/// </summary>
public interface IMessagePublisher
{
    Task PublishAsync<T>(T message, string routingKey, CancellationToken cancellationToken = default) where T : IMessage;
    Task PublishTaskAsync(TaskMessage task, CancellationToken cancellationToken = default);
    Task PublishTaskResultAsync(TaskResultMessage result, CancellationToken cancellationToken = default);
    Task PublishHeartbeatAsync(AgentHeartbeat heartbeat, CancellationToken cancellationToken = default);
    Task PublishAppHealthAsync(AppHealthStatus health, CancellationToken cancellationToken = default);
    Task PublishSyntheticCheckAsync(SyntheticCheckResult check, CancellationToken cancellationToken = default);
    Task PublishEscalationAsync(EscalationMessage escalation, CancellationToken cancellationToken = default);
}
