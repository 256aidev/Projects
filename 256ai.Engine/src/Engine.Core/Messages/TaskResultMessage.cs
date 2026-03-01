using Engine.Core.Segments;

namespace Engine.Core.Messages;

/// <summary>
/// TRS - Task result message from Worker to Control Plane
/// </summary>
public record TaskResultMessage : IMessage
{
    public required HDR Header { get; init; }
    public required CTX Context { get; init; }
    public required AUD Audit { get; init; }
    public required STA Status { get; init; }

    public required string TaskId { get; init; }
    public required string WorkerId { get; init; }
    public Dictionary<string, object> Outputs { get; init; } = new();
    public string? ErrorMessage { get; init; }
    public int ExecutionTimeMs { get; init; }
}
