# Message Schemas

> **AUTO-GENERATED** from C# classes in `Engine.Core/Messages/`
> Regenerate with: `pwsh -File scripts/generate-docs.ps1`

## Message Types

| Code | Class | Purpose |
|------|-------|---------|
| TAS | TaskMessage | Task dispatch from Control Plane to Worker |
| TRS | TaskResultMessage | Task result from Worker to Control Plane |
| AHE | AgentHeartbeat | Worker liveness signal |
| AHS | AppHealthStatus | Application health check |
| ASC | SyntheticCheckResult | End-to-end system verification |
| ESC | EscalationMessage | Surface risks to Strategy Layer |

## Classes

### AgentHeartbeat

```csharp
// File: src/Engine.Core/Messages/AgentHeartbeat.cs
public required HDR Header { get; init;
```

### AppHealthStatus

```csharp
// File: src/Engine.Core/Messages/AppHealthStatus.cs
public required HDR Header { get; init;
```

### EscalationMessage

```csharp
// File: src/Engine.Core/Messages/EscalationMessage.cs
public required HDR Header { get; init;
```

### SyntheticCheckResult

```csharp
// File: src/Engine.Core/Messages/SyntheticCheckResult.cs
public required HDR Header { get; init;
```

### TaskMessage

```csharp
// File: src/Engine.Core/Messages/TaskMessage.cs
public required HDR Header { get; init;
```

### TaskResultMessage

```csharp
// File: src/Engine.Core/Messages/TaskResultMessage.cs
public required HDR Header { get; init;
```

---
*Generated: 2026-01-29 19:13*

