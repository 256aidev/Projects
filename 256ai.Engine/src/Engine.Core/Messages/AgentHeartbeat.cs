using Engine.Core.Segments;

namespace Engine.Core.Messages;

/// <summary>
/// AHE - Agent Heartbeat message
/// "This worker/process is alive and here is its current capacity."
/// Emitted every 15-30 seconds per spec
/// </summary>
public record AgentHeartbeat : IMessage
{
    public required HDR Header { get; init; }
    public required CTX Context { get; init; }
    public required AUD Audit { get; init; }
    public required STA Status { get; init; }
    public required CAP Capacity { get; init; }
    public required VER Version { get; init; }

    public required string WorkerId { get; init; }
    public string? LastTaskId { get; init; }
    public string? Role { get; init; }
    public string? Provider { get; init; }
    public string? IpAddress { get; init; }
    public required DateTimeOffset EmittedAt { get; init; }
}
