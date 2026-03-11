using System.Text.Json;
using System.Text.RegularExpressions;
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
    private readonly string? _projectsBasePath;

    public ProjectsController(EngineDbContext db, IConfiguration configuration)
    {
        _db = db;
        _projectsBasePath = configuration["Projects:BasePath"];
    }

    /// <summary>
    /// POST /projects - Create a new project
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectRequest request)
    {
        var projectId = Guid.NewGuid().ToString();
        var now = DateTimeOffset.UtcNow;

        // Auto-generate working directory from project name if not provided
        var workingDirectory = request.WorkingDirectory;
        if (string.IsNullOrEmpty(workingDirectory) && !string.IsNullOrEmpty(_projectsBasePath))
        {
            // Sanitize project name for use as folder name
            var folderName = Regex.Replace(request.Name, @"[^\w\-. ]", "").Trim();
            folderName = Regex.Replace(folderName, @"\s+", "-"); // spaces to hyphens
            workingDirectory = Path.Combine(_projectsBasePath, folderName);
        }

        // Create the project directory with standard scaffold
        if (!string.IsNullOrEmpty(workingDirectory))
        {
            try
            {
                Directory.CreateDirectory(workingDirectory);
                Directory.CreateDirectory(Path.Combine(workingDirectory, "docs"));
                Directory.CreateDirectory(Path.Combine(workingDirectory, "src"));
                Directory.CreateDirectory(Path.Combine(workingDirectory, "config"));
                Directory.CreateDirectory(Path.Combine(workingDirectory, "assets"));
            }
            catch { /* log but don't fail project creation */ }

            // Write spec/description to the project folder for worker reference
            var spec = request.SpecMarkdown ?? request.Description;
            if (!string.IsNullOrEmpty(spec))
            {
                try { System.IO.File.WriteAllText(Path.Combine(workingDirectory, "SPEC.md"), spec); }
                catch { /* log but don't fail project creation */ }
            }

            // Write PROJECT.json — project metadata for worker reference
            try
            {
                var projectMeta = new
                {
                    projectId,
                    name = request.Name,
                    description = request.Description,
                    domain = request.Domain,
                    createdAt = now,
                    workingDirectory,
                    templateId = request.TemplateId
                };
                System.IO.File.WriteAllText(
                    Path.Combine(workingDirectory, "PROJECT.json"),
                    JsonSerializer.Serialize(projectMeta, new JsonSerializerOptions { WriteIndented = true }));
            }
            catch { }

            // Copy reference files from the inbound folder
            ScaffoldReferenceFiles(workingDirectory);
        }

        var project = new ProjectEntity
        {
            ProjectId = projectId,
            Name = request.Name,
            Description = request.Description,
            Domain = request.Domain,
            Status = Status.PENDING,
            TemplateId = request.TemplateId,
            ConfigJson = request.Config != null ? JsonSerializer.Serialize(request.Config) : null,
            WorkingDirectory = workingDirectory,
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
            if (!string.IsNullOrEmpty(workingDirectory))
                objective += $"\nWorking Directory: {workingDirectory}";
            objective += $"\n\n{specContent}";

            var leadTask = new TaskEntity
            {
                TaskId = Guid.NewGuid().ToString(),
                Objective = objective,
                Domain = "coordination",
                ProjectId = projectId,
                ExpectedOutputs = "Decomposed sub-tasks dispatched to appropriate workers",
                Status = Status.PENDING,
                CreatedAt = now,
                InputsJson = !string.IsNullOrEmpty(workingDirectory)
                    ? JsonSerializer.Serialize(new Dictionary<string, string> { ["workingDirectory"] = workingDirectory })
                    : null
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
            WorkingDirectory = workingDirectory,
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
    /// POST /projects/{id}/terminate - Cancel all active tasks and mark project as CANCELLED
    /// </summary>
    [HttpPost("{id}/terminate")]
    public async Task<IActionResult> TerminateProject(string id)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == id);
        if (project == null)
            return NotFound(new { error = "Project not found", projectId = id });

        // Cancel all non-terminal tasks
        var activeTasks = await _db.Tasks
            .Where(t => t.ProjectId == id &&
                t.Status != Status.COMPLETED &&
                t.Status != Status.FAIL &&
                t.Status != Status.CANCELLED &&
                t.Status != Status.CLOSED)
            .ToListAsync();

        foreach (var task in activeTasks)
        {
            task.Status = Status.CANCELLED;
            task.CompletedAt = DateTimeOffset.UtcNow;
        }

        project.Status = Status.CANCELLED;
        project.CompletedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            projectId = id,
            status = "CANCELLED",
            tasksCancelled = activeTasks.Count,
            terminatedAt = project.CompletedAt
        });
    }

    /// <summary>
    /// DELETE /projects/{id} - Delete a project (only if no tasks exist)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProject(string id, [FromQuery] bool force = false)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.ProjectId == id);

        if (project == null)
            return NotFound(new { error = "Project not found", projectId = id });

        var tasks = await _db.Tasks.Where(t => t.ProjectId == id).ToListAsync();
        if (tasks.Count > 0)
        {
            if (!force)
                return BadRequest(new { error = $"Cannot delete project with {tasks.Count} tasks. Use ?force=true to delete with tasks.", projectId = id });

            _db.Tasks.RemoveRange(tasks);
        }

        _db.Projects.Remove(project);
        await _db.SaveChangesAsync();

        return Ok(new { projectId = id, deleted = true, tasksDeleted = tasks.Count });
    }

    /// <summary>
    /// Copies reference files into a new project directory.
    /// Sources:
    /// 1. Inbound folder ({ProjectsBasePath}/_inbound/) — user-managed reference files
    /// 2. Swarm info — auto-generated from the database (machines, workers)
    /// </summary>
    private void ScaffoldReferenceFiles(string workingDirectory)
    {
        try
        {
            // 1. Copy everything from _inbound folder if it exists
            if (!string.IsNullOrEmpty(_projectsBasePath))
            {
                var inboundPath = Path.Combine(_projectsBasePath, "_inbound");
                if (Directory.Exists(inboundPath))
                {
                    CopyDirectory(inboundPath, workingDirectory);
                }
            }

            // 2. Write SWARM.md — available workers and capabilities
            var workers = _db.WorkerHeartbeats.ToList();
            var machines = _db.Machines.ToList();

            var swarmInfo = new System.Text.StringBuilder();
            swarmInfo.AppendLine("# Swarm Reference");
            swarmInfo.AppendLine();
            swarmInfo.AppendLine("Auto-generated at project creation. Lists available workers and machines.");
            swarmInfo.AppendLine();
            swarmInfo.AppendLine("## Workers");
            swarmInfo.AppendLine();
            swarmInfo.AppendLine("| Worker ID | Role | Provider | Status |");
            swarmInfo.AppendLine("|-----------|------|----------|--------|");
            foreach (var w in workers)
            {
                swarmInfo.AppendLine($"| {w.WorkerId} | {w.Role} | {w.Provider} | {w.Status} |");
            }
            swarmInfo.AppendLine();

            if (machines.Count > 0)
            {
                swarmInfo.AppendLine("## Machines");
                swarmInfo.AppendLine();
                swarmInfo.AppendLine("| Machine | Hostname | IP | Role | OS |");
                swarmInfo.AppendLine("|---------|----------|----|------|----|");
                foreach (var m in machines)
                {
                    swarmInfo.AppendLine($"| {m.DisplayName} | {m.Hostname} | {m.IpAddress} | {m.Role} | {m.Os} |");
                }
            }

            System.IO.File.WriteAllText(
                Path.Combine(workingDirectory, "docs", "SWARM.md"),
                swarmInfo.ToString());
        }
        catch { /* don't fail project creation */ }
    }

    /// <summary>
    /// Recursively copy directory contents, skipping files that already exist.
    /// </summary>
    private static void CopyDirectory(string source, string destination)
    {
        foreach (var file in Directory.GetFiles(source))
        {
            var destFile = Path.Combine(destination, Path.GetFileName(file));
            if (!System.IO.File.Exists(destFile))
                System.IO.File.Copy(file, destFile);
        }
        foreach (var dir in Directory.GetDirectories(source))
        {
            var dirName = Path.GetFileName(dir);
            if (dirName.StartsWith(".") || dirName.StartsWith("_")) continue; // skip hidden/system
            var destDir = Path.Combine(destination, dirName);
            Directory.CreateDirectory(destDir);
            CopyDirectory(dir, destDir);
        }
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
