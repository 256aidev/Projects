namespace Engine.Core.Segments;

/// <summary>
/// Scenario segment - synthetic check scenario definition
/// </summary>
public record SCN
{
    public required string ScenarioId { get; init; }
    public required string Description { get; init; }
    public required string ExpectedOutcome { get; init; }
}
