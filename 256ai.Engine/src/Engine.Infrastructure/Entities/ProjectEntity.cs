using Engine.Core.Enums;

namespace Engine.Infrastructure.Entities;

/// <summary>
/// Project tracking - groups related tasks into a cohesive build unit.
/// Each app built by the swarm is a project with layers and waves.
/// </summary>
public class ProjectEntity
{
    public required string ProjectId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required string Domain { get; set; }
    public Status Status { get; set; }
    public string? TemplateId { get; set; }
    public string? ConfigJson { get; set; }
    public string? WorkingDirectory { get; set; }
    public string? SpecMarkdown { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
}
