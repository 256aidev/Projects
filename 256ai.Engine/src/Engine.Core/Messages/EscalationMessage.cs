using Engine.Core.Enums;
using Engine.Core.Segments;

namespace Engine.Core.Messages;

/// <summary>
/// ESC - Escalation message per 07_ESCALATION_PROTOCOL
/// Surfaces risks and inconsistencies without fragmenting authority
/// </summary>
public record EscalationMessage : IMessage
{
    public required HDR Header { get; init; }
    public required CTX Context { get; init; }
    public required AUD Audit { get; init; }

    public required EscalationLevel Level { get; init; }
    public required MessageType SourceMessageType { get; init; }
    public required string WhatWasObserved { get; init; }
    public required string WhereItOccurs { get; init; }
    public required string WhyItMatters { get; init; }
    public required string ConditionsForFailure { get; init; }
    public string? Evidence { get; init; }
    public string? Impact { get; init; }
    public string? Recommendation { get; init; }
}
