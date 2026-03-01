using Engine.Core.Enums;

namespace Engine.Core.Segments;

/// <summary>
/// Check segment - individual health check result
/// </summary>
public record CHK
{
    public required string CheckName { get; init; }
    public required Status Status { get; init; }
    public int? LatencyMs { get; init; }
    public string? ErrorMessage { get; init; }
}
