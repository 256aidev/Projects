using Engine.Core.Enums;

namespace Engine.Infrastructure.Entities;

/// <summary>
/// Task tracking - per 06_TASK_SCHEMA
/// Supports parent/child decomposition and dependency tracking
/// </summary>
public class TaskEntity
{
    // Identity
    public required string TaskId { get; set; }
    public required string Objective { get; set; }
    public required string Domain { get; set; }

    // Task details
    public string? ConstraintsJson { get; set; }
    public string? InputsJson { get; set; }
    public required string ExpectedOutputs { get; set; }
    public string? ValidationCriteria { get; set; }

    // Lifecycle
    public Status Status { get; set; }
    public string? AssignedWorkerId { get; set; }
    public string? ResultJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }

    // Project grouping
    public string? ProjectId { get; set; }

    // Parent/child decomposition
    public string? ParentTaskId { get; set; }

    // Execution mode hint — workers can override based on their config
    public string ExecutionMode { get; set; } = "auto";  // "auto" | "cli" | "api" | "ollama"

    // Dependencies — JSON array of task IDs that must complete first
    public string? DependsOnJson { get; set; }

    // Retry tracking
    public int RetryCount { get; set; } = 0;
    public int MaxRetries { get; set; } = 3;

    // JSON array of worker IDs that failed this task — excluded from future polling
    public string? FailedWorkersJson { get; set; }

    // Progress tracking
    public string? ProgressJson { get; set; }
    public DateTimeOffset? LastProgressAt { get; set; }
}
