using Engine.Core.Enums;

namespace Engine.Infrastructure.Entities;

/// <summary>
/// Escalation tracking - per 07_ESCALATION_PROTOCOL
/// </summary>
public class EscalationEntity
{
    public Guid Id { get; set; }
    public EscalationLevel Level { get; set; }
    public MessageType SourceMessageType { get; set; }
    public required string EvidenceJson { get; set; }
    public required string Impact { get; set; }
    public required string Recommendation { get; set; }
    public EscalationDisposition Disposition { get; set; }
    public string? DispositionReason { get; set; }
    public DateTimeOffset? ReviewDate { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
