using Engine.Core.Segments;

namespace Engine.Core.Messages;

/// <summary>
/// TAS - Task dispatch message from Control Plane to Worker
/// Per 06_TASK_SCHEMA: One task, one objective
/// </summary>
public record TaskMessage : IMessage
{
    public required HDR Header { get; init; }
    public required CTX Context { get; init; }
    public required AUD Audit { get; init; }

    // Task envelope fields per spec
    public required string TaskId { get; init; }
    public required string Objective { get; init; }
    public required string Domain { get; init; }
    public List<string> Constraints { get; init; } = new();
    public Dictionary<string, object> Inputs { get; init; } = new();
    public required string ExpectedOutputs { get; init; }
    public string? ValidationCriteria { get; init; }
    public int? TimeLimitSeconds { get; init; }
    public int? BatchLimit { get; init; }
}
