using Engine.Core.Enums;

namespace Engine.Core.Segments;

/// <summary>
/// Header segment - present in all messages
/// </summary>
public record HDR
{
    public required Guid MessageId { get; init; }
    public required MessageType MessageType { get; init; }
    public required DateTimeOffset Timestamp { get; init; }
    public Guid? CorrelationId { get; init; }
    public int Version { get; init; } = 1;
}
