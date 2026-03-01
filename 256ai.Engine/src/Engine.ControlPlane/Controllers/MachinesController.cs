using System.Text.Json;
using Engine.Infrastructure.Data;
using Engine.Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Engine.ControlPlane.Controllers;

/// <summary>
/// Machine registry — connection info for every machine in the swarm.
/// The Lead AI queries this to know how to reach any machine.
/// </summary>
[ApiController]
[Route("machines")]
public class MachinesController : ControllerBase
{
    private readonly EngineDbContext _db;

    public MachinesController(EngineDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// GET /machines — List all machines
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ListMachines()
    {
        var machines = await _db.Machines.ToListAsync();

        var result = machines
            .OrderBy(m => m.MachineId)
            .Select(m => new
            {
                m.MachineId,
                m.DisplayName,
                m.Hostname,
                m.IpAddress,
                m.Os,
                m.Role,
                m.AlwaysOn,
                m.SshConnection,
                m.RdpConnection,
                Services = DeserializeJson(m.ServicesJson),
                WorkerIds = DeserializeJson(m.WorkerIdsJson),
                Domains = DeserializeJson(m.DomainsJson),
                m.ProjectPaths,
                m.Notes,
                m.UpdatedAt
            })
            .ToList();

        return Ok(result);
    }

    /// <summary>
    /// GET /machines/{id} — Get full details for one machine
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetMachine(string id)
    {
        var machine = await _db.Machines.FirstOrDefaultAsync(m => m.MachineId == id);

        if (machine == null)
            return NotFound(new { error = "Machine not found", machineId = id });

        return Ok(new
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
            Services = DeserializeJson(machine.ServicesJson),
            WorkerIds = DeserializeJson(machine.WorkerIdsJson),
            Domains = DeserializeJson(machine.DomainsJson),
            machine.ProjectPaths,
            machine.Notes,
            machine.UpdatedAt
        });
    }

    /// <summary>
    /// POST /machines — Register a new machine
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateMachine([FromBody] CreateMachineRequest request)
    {
        var existing = await _db.Machines.FirstOrDefaultAsync(m => m.MachineId == request.MachineId);
        if (existing != null)
            return BadRequest(new { error = $"Machine '{request.MachineId}' already exists", machineId = request.MachineId });

        var machine = new MachineEntity
        {
            MachineId = request.MachineId,
            DisplayName = request.DisplayName,
            Hostname = request.Hostname,
            IpAddress = request.IpAddress,
            Os = request.Os,
            Role = request.Role,
            AlwaysOn = request.AlwaysOn,
            SshConnection = request.SshConnection,
            RdpConnection = request.RdpConnection,
            ServicesJson = request.Services != null ? JsonSerializer.Serialize(request.Services) : "[]",
            WorkerIdsJson = request.WorkerIds != null ? JsonSerializer.Serialize(request.WorkerIds) : null,
            DomainsJson = request.Domains != null ? JsonSerializer.Serialize(request.Domains) : null,
            ProjectPaths = request.ProjectPaths,
            Notes = request.Notes,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _db.Machines.Add(machine);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMachine), new { id = machine.MachineId }, new
        {
            machine.MachineId,
            machine.DisplayName,
            machine.IpAddress,
            created = true
        });
    }

    /// <summary>
    /// PUT /machines/{id} — Update machine info
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMachine(string id, [FromBody] UpdateMachineRequest request)
    {
        var machine = await _db.Machines.FirstOrDefaultAsync(m => m.MachineId == id);

        if (machine == null)
            return NotFound(new { error = "Machine not found", machineId = id });

        if (request.DisplayName != null) machine.DisplayName = request.DisplayName;
        if (request.Hostname != null) machine.Hostname = request.Hostname;
        if (request.IpAddress != null) machine.IpAddress = request.IpAddress;
        if (request.Os != null) machine.Os = request.Os;
        if (request.Role != null) machine.Role = request.Role;
        if (request.AlwaysOn.HasValue) machine.AlwaysOn = request.AlwaysOn.Value;
        if (request.SshConnection != null) machine.SshConnection = request.SshConnection;
        if (request.RdpConnection != null) machine.RdpConnection = request.RdpConnection;
        if (request.Services != null) machine.ServicesJson = JsonSerializer.Serialize(request.Services);
        if (request.WorkerIds != null) machine.WorkerIdsJson = JsonSerializer.Serialize(request.WorkerIds);
        if (request.Domains != null) machine.DomainsJson = JsonSerializer.Serialize(request.Domains);
        if (request.ProjectPaths != null) machine.ProjectPaths = request.ProjectPaths;
        if (request.Notes != null) machine.Notes = request.Notes;

        machine.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            machine.MachineId,
            machine.DisplayName,
            machine.IpAddress,
            machine.UpdatedAt,
            updated = true
        });
    }

    /// <summary>
    /// DELETE /machines/{id} — Remove a machine from the registry
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMachine(string id)
    {
        var machine = await _db.Machines.FirstOrDefaultAsync(m => m.MachineId == id);

        if (machine == null)
            return NotFound(new { error = "Machine not found", machineId = id });

        _db.Machines.Remove(machine);
        await _db.SaveChangesAsync();

        return Ok(new { machineId = id, deleted = true });
    }

    private static object? DeserializeJson(string? json)
    {
        if (string.IsNullOrEmpty(json)) return null;
        try { return JsonSerializer.Deserialize<object>(json); }
        catch { return json; }
    }
}

public record CreateMachineRequest
{
    public required string MachineId { get; init; }
    public required string DisplayName { get; init; }
    public required string Hostname { get; init; }
    public required string IpAddress { get; init; }
    public required string Os { get; init; }
    public required string Role { get; init; }
    public bool AlwaysOn { get; init; }
    public string? SshConnection { get; init; }
    public string? RdpConnection { get; init; }
    public List<object>? Services { get; init; }
    public List<string>? WorkerIds { get; init; }
    public List<string>? Domains { get; init; }
    public string? ProjectPaths { get; init; }
    public string? Notes { get; init; }
}

public record UpdateMachineRequest
{
    public string? DisplayName { get; init; }
    public string? Hostname { get; init; }
    public string? IpAddress { get; init; }
    public string? Os { get; init; }
    public string? Role { get; init; }
    public bool? AlwaysOn { get; init; }
    public string? SshConnection { get; init; }
    public string? RdpConnection { get; init; }
    public List<object>? Services { get; init; }
    public List<string>? WorkerIds { get; init; }
    public List<string>? Domains { get; init; }
    public string? ProjectPaths { get; init; }
    public string? Notes { get; init; }
}
