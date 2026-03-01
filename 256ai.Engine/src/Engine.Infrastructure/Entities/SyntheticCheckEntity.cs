using Engine.Core.Enums;

namespace Engine.Infrastructure.Entities;

/// <summary>
/// Synthetic check results - derived from ASC messages
/// </summary>
public class SyntheticCheckEntity
{
    public Guid Id { get; set; }
    public required string ScenarioId { get; set; }
    public Status Status { get; set; }
    public required string TimingsJson { get; set; }
    public string? FailureReason { get; set; }
    public Guid? CorrelationId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
