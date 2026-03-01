using System.ComponentModel;
using System.Text.Json;
using Engine.Infrastructure.Data;
using Engine.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using ModelContextProtocol.Server;

namespace Engine.ControlPlane.McpTools;

[McpServerToolType]
public class MachineTools
{
    [McpServerTool(Name = "list_machines", ReadOnly = true), Description("List all machines in the swarm with their IPs, roles, and connection info. Use this to find out what machines exist and how to reach them.")]
    public static async Task<string> ListMachines(
        EngineDbContext db,
        CancellationToken cancellationToken = default)
    {
        var machines = await db.Machines.ToListAsync(cancellationToken);

        var result = machines
            .OrderBy(m => m.MachineId)
            .Select(m => new
            {
                m.MachineId,
                m.DisplayName,
                m.IpAddress,
                m.Os,
                m.Role,
                m.AlwaysOn,
                m.SshConnection,
                m.RdpConnection,
                WorkerIds = m.WorkerIdsJson != null ? JsonSerializer.Deserialize<object>(m.WorkerIdsJson) : null,
                Domains = m.DomainsJson != null ? JsonSerializer.Deserialize<object>(m.DomainsJson) : null
            })
            .ToList();

        return JsonSerializer.Serialize(result);
    }

    [McpServerTool(Name = "get_machine", ReadOnly = true), Description("Get full connection details for a specific machine by its ID (e.g., 'dragon', 'mac', 'ai02', 'mainwin'). Returns SSH/RDP connection strings, services with ports, worker IDs, domains, project paths, and notes.")]
    public static async Task<string> GetMachine(
        EngineDbContext db,
        [Description("Machine ID slug: dragon, mainwin, mac, ai02")] string machineId,
        CancellationToken cancellationToken = default)
    {
        var machine = await db.Machines.FirstOrDefaultAsync(
            m => m.MachineId == machineId.ToLower(),
            cancellationToken);

        if (machine == null)
            return JsonSerializer.Serialize(new { error = "Machine not found", machineId });

        return JsonSerializer.Serialize(new
        {
            machine.MachineId,
            machine.DisplayName,
            machine.Hostname,
            machine.IpAddress,
            machine.Os,
            machine.Role,
            machine.AlwaysOn,
            machine.SshConnection,
            machine.RdpConnection,
            Services = machine.ServicesJson != null ? JsonSerializer.Deserialize<object>(machine.ServicesJson) : null,
            WorkerIds = machine.WorkerIdsJson != null ? JsonSerializer.Deserialize<object>(machine.WorkerIdsJson) : null,
            Domains = machine.DomainsJson != null ? JsonSerializer.Deserialize<object>(machine.DomainsJson) : null,
            machine.ProjectPaths,
            machine.Notes,
            machine.UpdatedAt
        });
    }

    [McpServerTool(Name = "update_machine"), Description("Update connection details for a machine. Only provided fields are updated; null fields are left unchanged.")]
    public static async Task<string> UpdateMachine(
        EngineDbContext db,
        [Description("Machine ID slug: dragon, mainwin, mac, ai02")] string machineId,
        [Description("New IP address (or null to keep current)")] string? ipAddress = null,
        [Description("SSH connection string, e.g. 'user@ip' (or null)")] string? sshConnection = null,
        [Description("RDP connection string, e.g. 'user@ip' (or null)")] string? rdpConnection = null,
        [Description("Free-text notes (or null)")] string? notes = null,
        [Description("Project paths on this machine (or null)")] string? projectPaths = null,
        CancellationToken cancellationToken = default)
    {
        var machine = await db.Machines.FirstOrDefaultAsync(
            m => m.MachineId == machineId.ToLower(),
            cancellationToken);

        if (machine == null)
            return JsonSerializer.Serialize(new { error = "Machine not found", machineId });

        if (ipAddress != null) machine.IpAddress = ipAddress;
        if (sshConnection != null) machine.SshConnection = sshConnection;
        if (rdpConnection != null) machine.RdpConnection = rdpConnection;
        if (notes != null) machine.Notes = notes;
        if (projectPaths != null) machine.ProjectPaths = projectPaths;

        machine.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return JsonSerializer.Serialize(new
        {
            machineId = machine.MachineId,
            machine.IpAddress,
            machine.UpdatedAt,
            updated = true
        });
    }
}
