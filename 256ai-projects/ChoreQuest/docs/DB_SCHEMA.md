# ChoreQuest — Database Schema

## Overview

PostgreSQL 16 database managed via Prisma ORM. All tables use UUID primary keys and snake_case naming.

## Entity Relationship Diagram

```
Household 1──* User
Household 1──* Chore
Household 1──* ChoreAssignment
Household 1──* HouseholdMembership
Household 1──* NotificationPreference
Household 1──* NotificationEvent
Household 1──* AuditLog

User 1──* HouseholdMembership
User 1──* ChoreAssignment (assigned_child)
User 1──* ChoreAssignment (approver)
User 1──* PointsLedgerEntry
User 1──* RotationMember
User 1──* NotificationPreference
User 1──* NotificationEvent
User 1──* RefreshTokenSession
User 1──* AuditLog

Chore 1──* ChoreAssignment
Chore 1──? RotationGroup 1──* RotationMember

ChoreAssignment 1──? PointsLedgerEntry (unique, prevents double-award)
```

## Entities

### Household (`households`)
Top-level tenant. All data is scoped to a household for multi-family isolation.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK, auto-generated |
| name | String | Household display name |
| timezone | String | Default: `America/New_York` |
| settings | JSON | Flexible config (approval defaults, points enabled, etc.) |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto-updated |

### User (`users`)
Unified user model for both parents and children. Parents have email+password; children may not.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| household_id | UUID | FK → Household |
| email | String? | Unique. Required for parents |
| password_hash | String? | Argon2id hash. Required for parents |
| display_name | String | |
| role | UserRole | `parent` or `child` |
| avatar_color | String? | Hex color for child avatar |
| avatar_icon | String? | Icon name for child avatar |
| age | Int? | Optional child age |
| is_active | Boolean | Soft-delete flag |
| created_at | DateTime | Auto |

### HouseholdMembership (`household_memberships`)
Explicit join table tracking which users belong to which household with their role.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| household_id | UUID | FK → Household |
| user_id | UUID | FK → User |
| role | UserRole | Role within this household |
| joined_at | DateTime | Auto |

**Unique constraint**: `(household_id, user_id)`

### Chore (`chores`)
Template defining a recurring or one-time chore.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| household_id | UUID | FK → Household |
| title | String | |
| description | String? | |
| points | Int | Default: 0 |
| due_time | String? | Time-of-day string (e.g. `"17:00"`) |
| recurrence_type | RecurrenceType | `once`, `daily`, `weekly`, `weekdays`, `custom` |
| recurrence_config | JSON | Array of day numbers for weekly/custom |
| assignee_mode | AssigneeMode | `single` or `rotation` |
| assigned_child_id | UUID? | FK → User. Null if rotation mode |
| approval_required | Boolean | Default: true |
| is_active | Boolean | Soft-delete flag |
| is_archived | Boolean | Archive flag |
| created_at | DateTime | Auto |
| updated_at | DateTime | Auto-updated |

**Index**: `(household_id, is_active)` — fast lookup of active chores per household.

### ChoreAssignment (`chore_assignments`)
Concrete instance of a chore for a specific child on a specific date.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| household_id | UUID | FK → Household |
| chore_id | UUID | FK → Chore |
| assigned_child_id | UUID | FK → User |
| effective_date | Date | The date this assignment is for |
| due_at | DateTime? | Optional specific deadline |
| status | AssignmentStatus | `pending`, `completed`, `awaiting_approval`, `approved`, `rejected`, `overdue` |
| generated_by_rotation | Boolean | Whether created by rotation logic |
| completed_at | DateTime? | When the child marked it done |
| completion_note | String? | Optional note from child |
| approved_at | DateTime? | When parent approved |
| approver_id | UUID? | FK → User (parent who approved) |
| rejected_at | DateTime? | When parent rejected |
| rejection_reason | String? | Why it was rejected |
| created_at | DateTime | Auto |

**Unique constraint**: `(chore_id, effective_date, assigned_child_id)` — prevents duplicate assignments.

**Indexes**:
- `(household_id, effective_date, status)` — dashboard queries (today's chores by status)
- `(assigned_child_id, effective_date)` — child's assignment list

### RotationGroup (`rotation_groups`)
Tracks round-robin rotation state for a chore.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| chore_id | UUID | FK → Chore. **Unique** — one group per chore |
| current_index | Int | Default: 0. Points to current child in rotation |
| created_at | DateTime | Auto |

### RotationMember (`rotation_members`)
Ordered list of children in a rotation group.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| rotation_group_id | UUID | FK → RotationGroup |
| child_id | UUID | FK → User |
| order_index | Int | Position in rotation order |
| created_at | DateTime | Auto |

### PointsLedgerEntry (`points_ledger`)
Append-only log of point awards. Points are summed at read time for auditability.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| household_id | UUID | FK → Household |
| child_id | UUID | FK → User |
| assignment_id | UUID? | FK → ChoreAssignment. **Unique** — prevents double-award |
| points | Int | Can be negative for manual adjustments |
| reason | String? | Human-readable reason |
| awarded_at | DateTime | Auto |
| event_type | PointsEventType | `chore_approved` or `manual_adjustment` |

**Indexes**:
- `(child_id, awarded_at)` — child's points history
- `(household_id, awarded_at)` — household-wide leaderboard

### NotificationPreference (`notification_preferences`)
Per-user notification settings within a household.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| household_id | UUID | FK → Household |
| user_id | UUID | FK → User |
| reminders_enabled | Boolean | Default: true |
| overdue_alerts_enabled | Boolean | Default: true |
| approval_alerts_enabled | Boolean | Default: true |

**Unique constraint**: `(household_id, user_id)`

### NotificationEvent (`notification_events`)
In-app notification log. Read status tracked per event.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| household_id | UUID | FK → Household |
| target_user_id | UUID | FK → User |
| type | NotificationType | `due_reminder`, `overdue`, `completion_alert`, `approval_alert`, `rejection_alert` |
| title | String | Notification title |
| body | String | Notification body text |
| related_assignment_id | UUID? | Optional link to relevant assignment |
| is_read | Boolean | Default: false |
| created_at | DateTime | Auto |

**Index**: `(target_user_id, is_read)` — unread notification count and listing.

### RefreshTokenSession (`refresh_token_sessions`)
Tracks active refresh tokens for session management and revocation.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → User |
| token | String | Hashed refresh token |
| device_name | String? | Optional device identifier |
| expires_at | DateTime | Token expiration |
| created_at | DateTime | Auto |
| revoked_at | DateTime? | Set when token is revoked |

**Index**: `(user_id)` — list sessions for a user.

### AuditLog (`audit_logs`)
Immutable log of significant actions for security and debugging.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| household_id | UUID | FK → Household |
| user_id | UUID | FK → User |
| action | String | Action identifier (e.g. `chore.created`, `assignment.approved`) |
| details | JSON | Structured action details |
| ip_address | String? | Client IP if available |
| created_at | DateTime | Auto |

**Index**: `(household_id, created_at)` — chronological audit trail per household.

## Enums

| Enum | Values |
|------|--------|
| UserRole | `parent`, `child` |
| RecurrenceType | `once`, `daily`, `weekly`, `weekdays`, `custom` |
| AssigneeMode | `single`, `rotation` |
| AssignmentStatus | `pending`, `completed`, `awaiting_approval`, `approved`, `rejected`, `overdue` |
| PointsEventType | `chore_approved`, `manual_adjustment` |
| NotificationType | `due_reminder`, `overdue`, `completion_alert`, `approval_alert`, `rejection_alert` |

## Index Strategy

Indexes are designed for the most common query patterns:

1. **Dashboard queries**: `chore_assignments(household_id, effective_date, status)` — fetch today's assignments by status for the household view.
2. **Child view**: `chore_assignments(assigned_child_id, effective_date)` — a child's assignments for a given date range.
3. **Dedup guard**: `chore_assignments(chore_id, effective_date, assigned_child_id)` unique — prevents duplicate assignment generation.
4. **Active chores**: `chores(household_id, is_active)` — list active chores for management UI.
5. **Points leaderboard**: `points_ledger(household_id, awarded_at)` — sum points across children within a date range.
6. **Points history**: `points_ledger(child_id, awarded_at)` — individual child's earning history.
7. **Unread notifications**: `notification_events(target_user_id, is_read)` — badge count and notification list.
8. **Audit trail**: `audit_logs(household_id, created_at)` — chronological log per household.
9. **Double-award prevention**: `points_ledger(assignment_id)` unique — ensures one point entry per assignment.
