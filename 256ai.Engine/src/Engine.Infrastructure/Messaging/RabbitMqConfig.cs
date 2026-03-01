namespace Engine.Infrastructure.Messaging;

public class RabbitMqConfig
{
    public string HostName { get; set; } = "localhost";
    public int Port { get; set; } = 5672;
    public string UserName { get; set; } = "guest";
    public string Password { get; set; } = "guest";
    public string VirtualHost { get; set; } = "/";

    // Exchange and queue names per spec
    public const string ExchangeName = "engine.messages";
    public const string TasksQueue = "q.controlplane.tasks";
    public const string ResultsQueue = "q.controlplane.results";
    public const string HealthAgentQueue = "q.controlplane.health.agent";
    public const string HealthAppQueue = "q.controlplane.health.app";
    public const string HealthSyntheticQueue = "q.controlplane.health.synthetic";
    public const string EscalationsQueue = "q.controlplane.escalations";
    public const string DeadLetterQueue = "q.dlq";

    // Routing keys
    public const string TaskRoutingKey = "task.dispatch";
    public const string ResultRoutingKey = "result.completed";
    public const string HealthAgentRoutingKey = "health.agent";
    public const string HealthAppRoutingKey = "health.app";
    public const string HealthSyntheticRoutingKey = "health.synthetic";
    public const string EscalationRoutingKey = "escalation.new";
}
