namespace Engine.Core.Enums;

/// <summary>
/// Health and operational status values
/// </summary>
public enum Status
{
    // Health statuses
    OK,
    DEGRADED,
    DOWN,

    // Task result statuses
    FAIL,
    PASS,

    // Task lifecycle statuses
    PENDING,        // Task created, waiting for worker
    LEASED,         // Worker claimed via poll, awaiting ACK (60s timeout)
    ACKED,          // Worker confirmed receipt
    IN_PROGRESS,    // Execution actively running (legacy compat)
    RUNNING,        // Execution actively running (new preferred name)
    COMPLETED,      // Task finished successfully
    CLOSED,         // Validated and archived
    REJECTED,       // Task rejected by worker
    CANCELLED,      // Task cancelled by user
    DLQ             // Dead letter queue — retry budget exceeded
}
