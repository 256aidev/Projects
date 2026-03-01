namespace Engine.Core.Segments;

/// <summary>
/// Version segment - software and model version information
/// </summary>
public record VER
{
    public required string WorkerVersion { get; init; }
    public string? ModelVersion { get; init; }
    public string? ModelId { get; init; }
    public long UptimeSeconds { get; init; }
}
