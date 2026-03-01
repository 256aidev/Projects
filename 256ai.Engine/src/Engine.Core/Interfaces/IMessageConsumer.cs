namespace Engine.Core.Interfaces;

/// <summary>
/// Consumes messages from the message bus
/// </summary>
public interface IMessageConsumer
{
    Task StartConsumingAsync(string queueName, Func<string, Task<bool>> messageHandler, CancellationToken cancellationToken = default);
    Task StopConsumingAsync(CancellationToken cancellationToken = default);
}
