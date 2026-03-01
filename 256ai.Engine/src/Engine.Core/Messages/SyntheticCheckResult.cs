using Engine.Core.Segments;

namespace Engine.Core.Messages;

/// <summary>
/// ASC - Synthetic Check Result message
/// "We executed a real scenario through the system. This is what actually happened."
/// This is the MOST IMPORTANT health signal per spec.
/// Heartbeat can lie; ASC cannot.
/// </summary>
public record SyntheticCheckResult : IMessage
{
    public required HDR Header { get; init; }
    public required CTX Context { get; init; }
    public required AUD Audit { get; init; }
    public required STA Status { get; init; }
    public required SCN Scenario { get; init; }
    public required MET Metrics { get; init; }

    public required DateTimeOffset ExecutedAt { get; init; }
}
