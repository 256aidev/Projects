namespace Engine.Core.Enums;

/// <summary>
/// HL7-style message type codes
/// </summary>
public enum MessageType
{
    /// <summary>Task dispatch (Control Plane → Worker)</summary>
    TAS,

    /// <summary>Task result (Worker → Control Plane)</summary>
    TRS,

    /// <summary>Agent Heartbeat (Worker liveness)</summary>
    AHE,

    /// <summary>Application Health Status (Service health)</summary>
    AHS,

    /// <summary>Synthetic Check Result (End-to-end truth)</summary>
    ASC,

    /// <summary>Escalation message</summary>
    ESC
}
