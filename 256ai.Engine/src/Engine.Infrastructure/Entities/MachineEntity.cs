namespace Engine.Infrastructure.Entities;

/// <summary>
/// Machine registry entry — connection info for every machine in the swarm.
/// The Lead AI queries this to know how to reach any machine.
/// </summary>
public class MachineEntity
{
    /// <summary>Human-friendly slug: "dragon", "mainwin", "mac", "ai02"</summary>
    public required string MachineId { get; set; }

    /// <summary>Display name: "256AI (Dragon)"</summary>
    public required string DisplayName { get; set; }

    /// <summary>Actual hostname: "256AI", "NucBox_EVO-X2"</summary>
    public required string Hostname { get; set; }

    /// <summary>IP address: "10.0.1.147"</summary>
    public required string IpAddress { get; set; }

    /// <summary>OS: "Windows 11", "macOS"</summary>
    public required string Os { get; set; }

    /// <summary>Role: "coordinator", "worker", "coordinator+worker"</summary>
    public required string Role { get; set; }

    /// <summary>Is this machine always running?</summary>
    public bool AlwaysOn { get; set; }

    /// <summary>SSH connection string: "marklombardi@10.0.1.237" (null if no SSH)</summary>
    public string? SshConnection { get; set; }

    /// <summary>RDP connection string: "mark@10.0.1.178" (null if no RDP)</summary>
    public string? RdpConnection { get; set; }

    /// <summary>JSON array of services: [{"name":"Control Plane","port":5100,"url":"http://10.0.1.147:5100"}]</summary>
    public string ServicesJson { get; set; } = "[]";

    /// <summary>JSON array of worker IDs: ["worker-dragon-001"]</summary>
    public string? WorkerIdsJson { get; set; }

    /// <summary>JSON array of domains: ["general","infrastructure"]</summary>
    public string? DomainsJson { get; set; }

    /// <summary>Key local paths for this machine</summary>
    public string? ProjectPaths { get; set; }

    /// <summary>Free-text notes (quirks, sync file locations, etc.)</summary>
    public string? Notes { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }
}
