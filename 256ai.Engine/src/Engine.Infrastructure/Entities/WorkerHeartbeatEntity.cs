using Engine.Core.Enums;

namespace Engine.Infrastructure.Entities;

/// <summary>
/// Worker heartbeat state - derived from AHE messages
/// </summary>
public class WorkerHeartbeatEntity
{
    public required string WorkerId { get; set; }
    public Status Status { get; set; }
    public required string CapacityJson { get; set; }
    public string? LastTaskId { get; set; }
    public required string Version { get; set; }
    public string? IpAddress { get; set; }
    public string? Role { get; set; }
    public string? Provider { get; set; }
    public DateTimeOffset LastSeenAt { get; set; }
}
