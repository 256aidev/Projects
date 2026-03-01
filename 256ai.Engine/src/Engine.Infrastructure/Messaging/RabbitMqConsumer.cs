using System.Text;
using Engine.Core.Interfaces;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Engine.Infrastructure.Messaging;

/// <summary>
/// Consumes messages from RabbitMQ queues
/// </summary>
public class RabbitMqConsumer : IMessageConsumer, IDisposable
{
    private readonly RabbitMqConnectionFactory _connectionFactory;
    private readonly ILogger<RabbitMqConsumer> _logger;
    private IModel? _channel;
    private string? _consumerTag;

    public RabbitMqConsumer(RabbitMqConnectionFactory connectionFactory, ILogger<RabbitMqConsumer> logger)
    {
        _connectionFactory = connectionFactory;
        _logger = logger;
    }

    public Task StartConsumingAsync(string queueName, Func<string, Task<bool>> messageHandler, CancellationToken cancellationToken = default)
    {
        _channel = _connectionFactory.CreateChannel();
        _channel.BasicQos(prefetchSize: 0, prefetchCount: 1, global: false);

        var consumer = new EventingBasicConsumer(_channel);

        consumer.Received += async (_, ea) =>
        {
            var body = Encoding.UTF8.GetString(ea.Body.ToArray());
            var messageId = ea.BasicProperties.MessageId;

            try
            {
                _logger.LogDebug("Received message {MessageId} from {Queue}", messageId, queueName);

                var success = await messageHandler(body);

                if (success)
                {
                    _channel.BasicAck(ea.DeliveryTag, multiple: false);
                    _logger.LogDebug("Acknowledged message {MessageId}", messageId);
                }
                else
                {
                    // Reject and send to DLQ
                    _channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
                    _logger.LogWarning("Rejected message {MessageId} to DLQ", messageId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing message {MessageId}", messageId);
                _channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
            }
        };

        _consumerTag = _channel.BasicConsume(
            queue: queueName,
            autoAck: false,
            consumer: consumer);

        _logger.LogInformation("Started consuming from {Queue}", queueName);
        return Task.CompletedTask;
    }

    public Task StopConsumingAsync(CancellationToken cancellationToken = default)
    {
        if (_channel != null && _consumerTag != null)
        {
            _channel.BasicCancel(_consumerTag);
            _logger.LogInformation("Stopped consuming");
        }
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        _channel?.Close();
        _channel?.Dispose();
    }
}
