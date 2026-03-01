# Escalation Protocol

## Purpose

Surface risks and inconsistencies without fragmenting authority.

## Escalation Levels

| Level | Icon | Meaning |
|-------|------|---------|
| **Concern** | 🟡 | Potential future issue |
| **Risk** | 🟠 | Likely to cause failure under scale |
| **Blocker** | 🔴 | Immediate correctness or reliability failure |

## Required Evidence

Every escalation MUST include:

1. **What** — What was observed
2. **Where** — Where it occurs (file, component, endpoint)
3. **Why** — Why it matters
4. **Conditions** — Under which it fails

## Escalation Format

```
ESCALATION
Level: [Concern | Risk | Blocker]
Source: [AHE | AHS | ASC | Code Review | Other]

What was observed:
[Description]

Where it occurs:
[File path, component, or endpoint]

Why it matters:
[Impact on reliability, correctness, or performance]

Conditions for failure:
[When/how this will cause problems]

Evidence:
[Logs, payloads, timestamps, screenshots]

Recommendation:
[Suggested fix or investigation]
```

## Rules

1. **Escalation is mandatory** when confidence is high that something is wrong
2. **Escalation does not grant decision authority** — you're surfacing, not deciding
3. **Every escalation must receive a disposition:**
   - **Accepted** — Will be addressed
   - **Rejected** (with reason) — Not a real issue
   - **Deferred** (with review date) — Address later

## API Endpoint

```
POST /escalations
{
  "level": "Risk",
  "source_message_type": "ASC",
  "what_observed": "...",
  "where_occurs": "...",
  "why_matters": "...",
  "conditions": "...",
  "evidence": "...",
  "recommendation": "..."
}
```

## Warning

**Unacknowledged escalations are system debt.**

Silence is failure.
