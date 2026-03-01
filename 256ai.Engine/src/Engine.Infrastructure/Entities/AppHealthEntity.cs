using Engine.Core.Enums;

namespace Engine.Infrastructure.Entities;

/// <summary>
/// App health state - derived from AHS messages
/// </summary>
public class AppHealthEntity
{
    public Guid Id { get; set; }
    public required string AppId { get; set; }
    public required string InstanceId { get; set; }
    public required string Environment { get; set; }
    public Status OverallStatus { get; set; }
    public required string ChecksJson { get; set; }
    public int? LatencyP95 { get; set; }
    public double? ErrorRate { get; set; }
    public DateTimeOffset LastSeenAt { get; set; }
}
