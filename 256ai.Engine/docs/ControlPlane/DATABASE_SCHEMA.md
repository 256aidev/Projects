# Database Schema

> **AUTO-GENERATED** from EF Core entities in `Engine.Infrastructure/Entities/`
> Regenerate with: `pwsh -File scripts/generate-docs.ps1`

## Tables

| Table | Entity Class | Purpose |
|-------|--------------|---------|
| messages | MessageEntity | Core message log |
| worker_heartbeat | WorkerHeartbeatEntity | Worker health state |
| app_health | AppHealthEntity | App health state |
| synthetic_check | SyntheticCheckEntity | Synthetic check results |
| tasks | TaskEntity | Task tracking |
| escalations | EscalationEntity | Escalation tracking |

## Entity Details

### AppHealthEntity

```csharp
// File: src/Engine.Infrastructure/Entities/AppHealthEntity.cs
```

### EscalationEntity

```csharp
// File: src/Engine.Infrastructure/Entities/EscalationEntity.cs
```

### MessageEntity

```csharp
// File: src/Engine.Infrastructure/Entities/MessageEntity.cs
```

### SyntheticCheckEntity

```csharp
// File: src/Engine.Infrastructure/Entities/SyntheticCheckEntity.cs
```

### TaskEntity

```csharp
// File: src/Engine.Infrastructure/Entities/TaskEntity.cs
```

### WorkerHeartbeatEntity

```csharp
// File: src/Engine.Infrastructure/Entities/WorkerHeartbeatEntity.cs
```

---
*Generated: 2026-01-29 19:13*

