using Engine.Core.Enums;

namespace Engine.Infrastructure.Entities;

/// <summary>
/// Core message log - stores raw messages
/// </summary>
public class MessageEntity
{
    public Guid Id { get; set; }
    public MessageType MessageType { get; set; }
    public required string PayloadJson { get; set; }
    public Guid? CorrelationId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
