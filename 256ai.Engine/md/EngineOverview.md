# ADDENDUM — Nervous System & Health Messaging
# This section is NON-OPTIONAL and part of the core architecture.
# Treat health, heartbeat, and synthetic checks as first-class messages.

## A) Philosophy (Read This First)
The engine MUST know when:
- a worker is alive
- an app is alive
- the system is lying about being alive
- the core loop is broken even though services are “up”

Health is not a dashboard.
Health is a MESSAGE STREAM.

This mirrors how interface engines monitor:
- channels
- endpoints
- downstream systems
- message backlogs
- ACK failures

The nervous system is implemented using message types, schemas, routing rules, state, and alerting — NOT ad-hoc polling.

---

## B) Health Message Families (HL7-style)

You MUST implement the following additional message types:

### 1) AHE — Agent Heartbeat (Worker / Process)
Purpose:
> “This worker/process is alive and here is its current capacity.”

Analogy:
- HL7: channel heartbeat / adapter status

Required segments:
- HDR
- CTX
- AUD
- STA
- CAP
- VER

Key fields:
- worker_id
- domain_caps
- status: OK | DEGRADED | DOWN
- capacity:
  - max_concurrent_tasks
  - current_inflight
- uptime_seconds
- last_task_id
- version (worker + model if applicable)
- emitted_at

Rules:
- Emitted on a fixed interval (e.g., every 15–30 seconds)
- Missing heartbeat beyond threshold = worker OFFLINE
- Heartbeat ≠ proof of correctness (only liveness)

---

### 2) AHS — Application Health Status (Service / App Instance)
Purpose:
> “This app or service instance is alive, and these checks passed or failed.”

Analogy:
- HL7: downstream system status / endpoint availability

Required segments:
- HDR
- CTX
- AUD
- STA
- CHK

CHK segment structure:
- check_name (db, broker, cache, model_endpoint, filesystem)
- status: OK | DEGRADED | FAIL
- latency_ms (optional)
- error_message (optional)

Key fields:
- app_id
- env
- version
- instance_id
- overall_status: OK | DEGRADED | DOWN
- error_rate
- p50 / p95 latency (if applicable)
- config_hash / build_hash
- emitted_at

Rules:
- Emitted by every app/service on a fixed cadence
- Overall status is derived from checks
- Used to detect partial failures

---

### 3) ASC — Synthetic Check Result (End-to-End Truth)
Purpose:
> “We executed a real scenario through the system. This is what actually happened.”

This is the MOST IMPORTANT health signal.

Analogy:
- HL7: test messages / probe orders sent through interfaces

Required segments:
- HDR
- CTX
- AUD
- STA
- SCN
- MET

SCN (scenario) fields:
- scenario_id (e.g. `daily_reading_cache_hit`)
- description
- expected_outcome

STA fields:
- pass | fail
- failure_reason (if fail)

MET fields:
- step_timings:
  - api_ms
  - db_ms
  - queue_ms
  - worker_ms
  - cache_ms
- total_ms

Rules:
- Synthetic checks MUST traverse the real system path
- Heartbeat can lie; ASC cannot
- Any ASC failure is high signal
- ASC messages MUST carry correlation_id so full trace is possible

---

## C) Routing Rules (Like Interface Channels)

You MUST add these routing rules to the message bus:

- AHE → `q.controlplane.health.agent`
- AHS → `q.controlplane.health.app`
- ASC → `q.controlplane.health.synthetic`

Dead-letter rules:
- Any malformed health message → DLQ with reason
- Missing required segments → reject + log

---

## D) Database Tables (Health-Specific)

You MUST implement dedicated tables.  
Do NOT overload the general message table for querying.

### worker_heartbeat
- worker_id
- status
- capacity_json
- last_task_id
- version
- last_seen_at

### app_health
- app_id
- instance_id
- env
- overall_status
- checks_json
- latency_p95
- error_rate
- last_seen_at

### synthetic_check
- scenario_id
- status (PASS/FAIL)
- timings_json
- failure_reason
- correlation_id
- created_at

Retention:
- Raw health messages: 7–30 days
- Aggregates/rollups: longer (configurable)

---

## E) Alert Semantics (Rules, Not Vibes)

Alerts MUST be derived from message streams, not ad-hoc polling.

### Required alerts
- Missing AHE heartbeat beyond threshold
- Missing AHS heartbeat beyond threshold
- Worker or app in DEGRADED > X minutes
- Any ASC failure
- N consecutive ASC failures
- Health queue backlog > threshold

Alerts MUST include:
- what failed
- when
- correlation_id (if available)
- last known good state

---

## F) Operator Visibility (No SSH Required)

You MUST expose operator endpoints:

- GET `/health/workers`
- GET `/health/apps`
- GET `/health/synthetic`
- GET `/health/summary`

These endpoints read from DB state derived from messages.

Goal:
> An operator can understand system health WITHOUT logging into a box.

---

## G) Escalation Rules (Mandatory)

You MUST escalate to Mark if:
- Synthetic checks contradict heartbeat health
- Heartbeat schema or cadence is unclear
- Alert thresholds are ambiguous
- A system reports OK but synthetic checks fail
- You are unsure how to classify DEGRADED vs DOWN

Escalation format:
- Level: Concern | Risk | Blocker
- Which message type exposed the issue (AHE/AHS/ASC)
- Evidence (payload excerpt, timestamps)
- Impact
- Recommendation

---

## H) Build Order Update (Important)

You MUST adjust build order:

1) Message schemas (including AHE/AHS/ASC)
2) DB tables for health
3) Message routing
4) Worker heartbeat emission
5) App health emission
6) Synthetic check framework
7) Alerts + dashboards

Do NOT leave health “for later”.

---

## I) Non-Negotiable Rule
If a component does not emit health messages:
> It does not exist.

END ADDENDUM
