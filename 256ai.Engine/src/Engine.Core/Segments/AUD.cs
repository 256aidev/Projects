namespace Engine.Core.Segments;

/// <summary>
/// Audit segment - tracking who created the message and when
/// </summary>
public record AUD
{
    public required string CreatedBy { get; init; }
    public required DateTimeOffset CreatedAt { get; init; }
    public string? ModifiedBy { get; init; }
    public DateTimeOffset? ModifiedAt { get; init; }
}
