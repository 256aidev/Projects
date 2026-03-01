namespace Engine.Core.Segments;

/// <summary>
/// Capacity segment - worker capacity information
/// </summary>
public record CAP
{
    public required int MaxConcurrentTasks { get; init; }
    public required int CurrentInflight { get; init; }
    public List<string> DomainCapabilities { get; init; } = new();
}
