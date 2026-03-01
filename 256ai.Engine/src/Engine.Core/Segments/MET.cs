namespace Engine.Core.Segments;

/// <summary>
/// Metrics segment - timing and performance data
/// </summary>
public record MET
{
    public int? ApiMs { get; init; }
    public int? DbMs { get; init; }
    public int? QueueMs { get; init; }
    public int? WorkerMs { get; init; }
    public int? CacheMs { get; init; }
    public required int TotalMs { get; init; }
}
