# Task Envelope Specification

All tasks dispatched from Control Plane must follow this schema.

## Required Fields
- Task ID
- Objective (one sentence)
- Domain
- Constraints
- Inputs
- Expected Outputs
- Validation Criteria
- Time or Batch Limits

## Rules
- One task, one objective
- No implied scope
- No architectural change unless explicit
- No open-ended tasks

Tasks not following this schema are invalid.
