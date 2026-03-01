namespace Engine.Core.Enums;

/// <summary>
/// Escalation severity levels per protocol
/// </summary>
public enum EscalationLevel
{
    /// <summary>Potential future issue</summary>
    Concern,

    /// <summary>Likely to cause failure under scale</summary>
    Risk,

    /// <summary>Immediate correctness or reliability failure</summary>
    Blocker
}
