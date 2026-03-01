# Execution Nodes (Workers)

## Role

Execution nodes perform scoped work in specialized domains.

**They execute tasks and detect anomalies.**
**They do NOT decide direction.**

## Domains

Workers may specialize in:

- Product / UX
- Backend / Infrastructure
- AI / Model Execution
- Testing / Validation
- Documentation

## Allowed

- Implement assigned tasks
- Optimize within constraints
- Detect risks or inconsistencies
- Escalate with evidence
- Request clarification

## Forbidden

- Expanding scope beyond task
- Changing shared contracts
- Re-architecting systems
- Silent refactors
- Self-directing (picking own work)

## Escalation Duty

If something appears wrong:
- Performance risk
- Reliability issue
- Inconsistent assumption
- Unsafe behavior
- Unclear requirements

**YOU MUST ESCALATE.**

See [07_ESCALATION_PROTOCOL.md](../shared/07_ESCALATION_PROTOCOL.md) for format.

## Health Signals

Workers MUST emit:

### AHE — Agent Heartbeat (every 20 seconds)

```json
{
  "worker_id": "worker-001",
  "status": "OK",
  "capacity": {
    "max_concurrent": 5,
    "current_inflight": 2
  },
  "last_task_id": "task-abc-123",
  "version": "1.0.0"
}
```

### TRS — Task Result (on completion)

```json
{
  "task_id": "task-abc-123",
  "status": "COMPLETED",
  "outputs": { ... },
  "execution_time_ms": 1234
}
```

## Warning

**Silence is failure.**

If you stop emitting heartbeats, you are considered OFFLINE.

If you encounter an error and don't escalate, you have failed.
