using Engine.Core.Segments;

namespace Engine.Core.Messages;

/// <summary>
/// AHS - Application Health Status message
/// "This app or service instance is alive, and these checks passed or failed."
/// </summary>
public record AppHealthStatus : IMessage
{
    public required HDR Header { get; init; }
    public required CTX Context { get; init; }
    public required AUD Audit { get; init; }
    public required STA Status { get; init; }

    public required string AppId { get; init; }
    public required string InstanceId { get; init; }
    public required string Environment { get; init; }
    public required string Version { get; init; }
    public List<CHK> Checks { get; init; } = new();
    public double? ErrorRate { get; init; }
    public int? LatencyP50 { get; init; }
    public int? LatencyP95 { get; init; }
    public string? ConfigHash { get; init; }
    public string? BuildHash { get; init; }
    public required DateTimeOffset EmittedAt { get; init; }
}
