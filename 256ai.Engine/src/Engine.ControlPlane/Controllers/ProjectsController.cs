using System.Text.Json;
using Engine.Core.Enums;
using Engine.Infrastructure.Data;
using Engine.Infrastructure.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Engine.ControlPlane.Controllers;

/// <summary>
/// Project management endpoints.
/// Projects group related tasks into a cohesive build unit.
/// </summary>
[ApiController]
[Route("projects")]
public class ProjectsController : ControllerBase
{
    private readonly EngineDbContext _db;

    public ProjectsController(EngineDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// POST /projects - Create a new project
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectRequest request)
    {
        var projectId = Guid.NewGuid().ToString();
        var now = DateTimeOffset.UtcNow;

        var project = new ProjectEntity
        {
            ProjectId = projectId,
            Name = request.Name,
            Description = request.Description,
            Domain = request.Domain,
            Status = Status.PENDING,
            TemplateId = request.TemplateId,
            ConfigJson = request.Config != null ? JsonSerializer.Serialize(request.Config) : null,
            WorkingDirectory = request.WorkingDirectory,
            SpecMarkdown = request.SpecMarkdown,
            CreatedAt = now
        };

        _db.Projects.Add(project);
        await _db.SaveChangesAsync();

        // Auto-dispatch to Lead AI if spec or description provided
        string? leadTaskId = null;
        var specContent = request.SpecMarkdown ?? request.Description;
        if (!string.IsNullOrEmpty(specContent))
        {
            var objective = $"Project: {request.Name}";
            if (!string.IsNullOrEmpty(request.WorkingDirectory))
                objective += $"\nWorking Directory: {request.WorkingDirectory}";
            objective += $"\n\n{specContent}";

            var leadTask = new TaskEntity
            {
                TaskId = Guid.NewGuid().ToString(),
                Objective = objective,
                Domain = "general",
                ProjectId = projectId,
                ExpectedOutputs = "Decomposed sub-tasks dispatched to appropriate workers",
                Status = Status.PENDING,
                CreatedAt = now
            };
            _db.Tasks.Add(leadTask);
            await _db.SaveChangesAsync();
            leadTaskId = leadTask.TaskId;
        }

        return CreatedAtAction(nameof(GetProject), new { id = projectId }, new
        {
            ProjectId = projectId,
            project.Name,
            project.Domain,
            Status = "PENDING",
            CreatedAt = now,
            LeadTaskId = leadTaskId
        });
    }

    /// <summary>
    /// GET /projects/{id} - Get project details with task summary
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetProject(string id)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == id);

        if (project == null)
            return NotFound(new { error = "Project not found", projectId = id });

        // Get task counts by status
        var tasks = await _db.Tasks.Where(t => t.ProjectId == id).ToListAsync();
        var taskSummary = tasks
            .GroupBy(t => t.Status.ToString())
            .ToDictionary(g => g.Key, g => g.Count());

        return Ok(new
        {
            project.ProjectId,
            project.Name,
            project.Description,
            project.Domain,
            Status = project.Status.ToString(),
            project.TemplateId,
            Config = project.ConfigJson != null ? JsonSerializer.Deserialize<object>(project.ConfigJson) : null,
            project.WorkingDirectory,
            project.SpecMarkdown,
            project.CreatedAt,
            project.CompletedAt,
            Tasks = new
            {
                Total = tasks.Count,
                ByStatus = taskSummary
            }
        });
    }

    /// <summary>
    /// GET /projects - List all projects
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> ListProjects(
        [FromQuery] string? status = null,
        [FromQuery] int limit = 50)
    {
        var query = _db.Projects.AsQueryable();

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<Status>(status, true, out var statusEnum))
        {
            query = query.Where(p => p.Status == statusEnum);
        }

        // SQLite doesn't support DateTimeOffset ordering, load then sort in memory
        var allProjects = await query.ToListAsync();

        var projects = allProjects
            .OrderByDescending(p => p.CreatedAt)
            .Take(limit)
            .Select(p => new
            {
                p.ProjectId,
                p.Name,
                p.Description,
                p.Domain,
                Status = p.Status.ToString(),
                p.TemplateId,
                p.WorkingDirectory,
                HasSpec = p.SpecMarkdown != null,
                p.CreatedAt,
                p.CompletedAt
            })
            .ToList();

        return Ok(projects);
    }

    /// <summary>
    /// PUT /projects/{id} - Update project status or config
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProject(string id, [FromBody] UpdateProjectRequest request)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == id);

        if (project == null)
            return NotFound(new { error = "Project not found", projectId = id });

        if (!string.IsNullOrEmpty(request.Name))
            project.Name = request.Name;

        if (request.Description != null)
            project.Description = request.Description;

        if (!string.IsNullOrEmpty(request.Status) && Enum.TryParse<Status>(request.Status, true, out var statusEnum))
        {
            project.Status = statusEnum;
            if (statusEnum == Status.COMPLETED || statusEnum == Status.CLOSED)
                project.CompletedAt = DateTimeOffset.UtcNow;
        }

        if (request.Config != null)
            project.ConfigJson = JsonSerializer.Serialize(request.Config);

        if (request.WorkingDirectory != null)
            project.WorkingDirectory = request.WorkingDirectory;

        if (request.SpecMarkdown != null)
            project.SpecMarkdown = request.SpecMarkdown;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            project.ProjectId,
            project.Name,
            project.Domain,
            Status = project.Status.ToString(),
            project.CompletedAt
        });
    }

    /// <summary>
    /// GET /projects/{id}/tasks - List all tasks belonging to a project
    /// </summary>
    [HttpGet("{id}/tasks")]
    public async Task<IActionResult> GetProjectTasks(string id, [FromQuery] string? status = null)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == id);
        if (project == null)
            return NotFound(new { error = "Project not found", projectId = id });

        var query = _db.Tasks.Where(t => t.ProjectId == id);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<Status>(status, true, out var statusEnum))
        {
            query = query.Where(t => t.Status == statusEnum);
        }

        var allTasks = await query.ToListAsync();

        var tasks = allTasks
            .OrderBy(t => t.CreatedAt)
            .Select(t => new
            {
                t.TaskId,
                t.Objective,
                t.Domain,
                Status = t.Status.ToString(),
                t.AssignedWorkerId,
                t.ParentTaskId,
                t.CreatedAt,
                t.CompletedAt,
                DependsOn = t.DependsOnJson != null ? JsonSerializer.Deserialize<List<string>>(t.DependsOnJson) : null,
                Progress = t.ProgressJson != null ? JsonSerializer.Deserialize<object>(t.ProgressJson) : null
            })
            .ToList();

        return Ok(tasks);
    }

    /// <summary>
    /// DELETE /projects/{id} - Delete a project (only if no tasks exist)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProject(string id)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == id);

        if (project == null)
            return NotFound(new { error = "Project not found", projectId = id });

        var taskCount = await _db.Tasks.CountAsync(t => t.ProjectId == id);
        if (taskCount > 0)
            return BadRequest(new { error = $"Cannot delete project with {taskCount} tasks. Cancel or remove tasks first.", projectId = id });

        _db.Projects.Remove(project);
        await _db.SaveChangesAsync();

        return Ok(new { projectId = id, deleted = true });
    }
}

public record CreateProjectRequest
{
    public required string Name { get; init; }
    public string? Description { get; init; }
    public required string Domain { get; init; }
    public string? TemplateId { get; init; }
    public Dictionary<string, object>? Config { get; init; }
    public string? WorkingDirectory { get; init; }
    public string? SpecMarkdown { get; init; }
}

public record UpdateProjectRequest
{
    public string? Name { get; init; }
    public string? Description { get; init; }
    public string? Status { get; init; }
    public Dictionary<string, object>? Config { get; init; }
    public string? WorkingDirectory { get; init; }
    public string? SpecMarkdown { get; init; }
}
