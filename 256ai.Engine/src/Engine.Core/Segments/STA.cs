using Engine.Core.Enums;

namespace Engine.Core.Segments;

/// <summary>
/// Status segment - current status and reason
/// </summary>
public record STA
{
    public required Status Status { get; init; }
    public string? Reason { get; init; }
    public string? FailureReason { get; init; }
}
