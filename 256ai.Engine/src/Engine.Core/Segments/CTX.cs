namespace Engine.Core.Segments;

/// <summary>
/// Context segment - routing and domain information
/// </summary>
public record CTX
{
    public required string Source { get; init; }
    public required string Destination { get; init; }
    public required string Domain { get; init; }
    public string? Environment { get; init; }
}
