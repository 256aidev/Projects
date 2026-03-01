using RabbitMQ.Client;

namespace Engine.Infrastructure.Messaging;

/// <summary>
/// Sets up RabbitMQ exchanges and queues per routing spec
/// </summary>
public class RabbitMqSetup
{
    private readonly RabbitMqConnectionFactory _connectionFactory;

    public RabbitMqSetup(RabbitMqConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public void Initialize()
    {
        using var channel = _connectionFactory.CreateChannel();

        // Declare the main exchange (topic type for flexible routing)
        channel.ExchangeDeclare(
            exchange: RabbitMqConfig.ExchangeName,
            type: "topic",
            durable: true,
            autoDelete: false);

        // Declare dead-letter exchange
        channel.ExchangeDeclare(
            exchange: "engine.dlx",
            type: "direct",
            durable: true,
            autoDelete: false);

        // Dead-letter queue
        channel.QueueDeclare(
            queue: RabbitMqConfig.DeadLetterQueue,
            durable: true,
            exclusive: false,
            autoDelete: false);
        channel.QueueBind(RabbitMqConfig.DeadLetterQueue, "engine.dlx", "");

        var queueArgs = new Dictionary<string, object>
        {
            { "x-dead-letter-exchange", "engine.dlx" }
        };

        // Tasks queue (task.*)
        DeclareAndBindQueue(channel, RabbitMqConfig.TasksQueue, "task.*", queueArgs);

        // Results queue (result.*)
        DeclareAndBindQueue(channel, RabbitMqConfig.ResultsQueue, "result.*", queueArgs);

        // Health queues
        DeclareAndBindQueue(channel, RabbitMqConfig.HealthAgentQueue, "health.agent", queueArgs);
        DeclareAndBindQueue(channel, RabbitMqConfig.HealthAppQueue, "health.app", queueArgs);
        DeclareAndBindQueue(channel, RabbitMqConfig.HealthSyntheticQueue, "health.synthetic", queueArgs);

        // Escalations queue
        DeclareAndBindQueue(channel, RabbitMqConfig.EscalationsQueue, "escalation.*", queueArgs);
    }

    private static void DeclareAndBindQueue(IModel channel, string queueName, string routingKey, IDictionary<string, object> args)
    {
        channel.QueueDeclare(
            queue: queueName,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: args);

        channel.QueueBind(queueName, RabbitMqConfig.ExchangeName, routingKey);
    }
}
