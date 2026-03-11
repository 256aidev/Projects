Absolutely. Below is a **second markdown file** you can hand directly to Claude as the execution document.

---

# `IMPLEMENTATION_PLAN.md`

# Family Chore App — AI Swarm Implementation Plan

## Project Codename

**ChoreFlow**

## Purpose of This Document

This file converts the product specification into an **execution plan** for Claude AI swarm.

This document is not the product vision file.
This is the **build order, work breakdown, implementation sequence, deliverables, task ownership, and done criteria** file.

The goal is to help multiple Claude agents work in parallel without stepping on each other, while still keeping the product small and coherent.

---

# 1. Build Objective

Build a **small lovable V1** of a family chore mobile app that supports:

* household creation
* parent + child roles
* chore CRUD
* recurring chores
* rotating chores
* completion flow
* parent approval
* points
* streaks
* weekly leaderboard
* reminders / notifications

The app must be functional, stable, and easy to understand.

---

# 2. Execution Rules

## 2.1 Global Build Rules

### Rule 1

Do not overbuild V1.

### Rule 2

Every feature must tie directly back to the MVP.

### Rule 3

Do not let future premium concepts distort present architecture.

### Rule 4

Business logic must live in clean, testable modules.

### Rule 5

Permissions must be role-safe from the start.

### Rule 6

Prefer simple stable flows over clever abstractions.

### Rule 7

Avoid building features “just in case.”

### Rule 8

All agents must keep naming and data contracts consistent.

---

# 3. Swarm Operating Model

Use six primary agents.

## Agent A — Product / Orchestrator

Owns:

* scope control
* doc consistency
* ticket ordering
* cross-agent decision arbitration
* final MVP verification

## Agent B — Mobile UI / UX

Owns:

* screen scaffolding
* navigation
* components
* forms
* visual consistency
* empty states
* child/parent dashboard presentation

## Agent C — Backend / Data

Owns:

* database schema
* data access patterns
* auth integration
* CRUD operations
* role-safe queries
* assignment generation
* points ledger persistence

## Agent D — Logic / Engine

Owns:

* recurrence logic
* rotation logic
* overdue logic
* streak logic
* leaderboard calculations
* approval state transitions

## Agent E — Notifications / Device Services

Owns:

* local notification scheduling
* reminder triggers
* due/overdue notification orchestration
* parent completion alerts
* settings integration for alerts

## Agent F — QA / Edge Case / Test Auditor

Owns:

* test plan
* core workflow validation
* role safety validation
* time/date edge cases
* rejection scenarios
* empty-state scenarios
* regression checklist

---

# 4. Primary Build Phases

Build in this exact order.

---

# Phase 0 — Project Initialization

## Goal

Stand up the codebase and create the baseline project structure.

## Tasks

* initialize mobile app project
* define stack and package choices
* configure TypeScript
* configure linting and formatting
* create environment variable pattern
* create folder structure
* add navigation foundation
* define design tokens
* define app theme
* set up state management baseline
* set up backend connection
* set up auth provider wiring
* create docs folder and initial architecture files

## Deliverables

* bootable mobile app
* project structure committed
* navigation shell working
* backend connected
* lint/typecheck passing

## Done Criteria

* app launches
* no broken imports
* no placeholder stack confusion
* project can be built locally by another agent without rework

---

# Phase 1 — Domain Modeling and Data Contracts

## Goal

Lock the data model before screens drift.

## Tasks

* define entities
* define enums
* define core types
* define API/data service interfaces
* define household ownership model
* define user role model
* define chore recurrence model
* define assignment status model
* define points ledger model
* define notification event model

## Required Outputs

Create:

* `DB_SCHEMA.md`
* `TYPES.md`
* `STATE_MODEL.md`

## Core Entities

* Household
* User
* Chore
* ChoreAssignment
* RotationGroup
* RotationMember
* PointsLedger
* NotificationPreference
* NotificationEvent

## Done Criteria

* all agents use same schema
* role boundaries are explicit
* recurrence config shape is agreed
* assignment status values are finalized

---

# Phase 2 — Authentication and Household Foundation

## Goal

Let a parent create and access a household.

## Tasks

* build auth screens
* build sign up flow
* build sign in flow
* persist session
* create household on first-run onboarding
* associate parent user to household
* create first child profile
* create role-safe route guards

## Screens

* Splash / Boot
* Sign Up
* Sign In
* Household Setup
* Add First Child
* App Entry Router

## Functional Requirements

* first authenticated parent can create a household
* parent becomes household admin
* child profile can be created without email
* session persists across app restarts
* household context loads before dashboard

## Done Criteria

* parent can sign up
* create household
* add first child
* enter dashboard shell successfully

---

# Phase 3 — Household Member Management

## Goal

Allow parents to manage children and eventually multiple parents.

## Tasks

* build household members screen
* add child flow
* edit child profile
* deactivate child profile
* optional placeholder spouse invite structure
* enforce role permissions on member management

## Screens

* Household Members
* Add Child
* Edit Child

## Fields for Child

* display name
* avatar color/icon
* optional age
* optional PIN placeholder support
* active/inactive status

## Done Criteria

* parent can add multiple children
* children appear in dashboards and assignment lists
* inactive children do not appear in new assignment selections by default

---

# Phase 4 — Chore CRUD

## Goal

Allow parents to create, edit, archive, and delete chores safely.

## Tasks

* build chore list screen
* build create chore screen
* build edit chore screen
* build archive/delete flow
* support assignment to one child or rotation group
* support points value
* support due time
* support recurrence configuration
* support approval-required toggle
* support active/inactive state

## Screens

* Chore List
* Create Chore
* Edit Chore
* Chore Detail

## Required Fields

* title
* description optional
* points
* due time optional
* recurrence type
* recurrence config
* assigned child OR rotation enabled
* approval required
* active

## Validation Rules

* title required
* points must be integer >= 0
* recurrence must be valid
* cannot select both single assignee and invalid empty rotation group
* archived chores must not generate new assignments

## Done Criteria

* parent can create recurring and non-recurring chores
* chores persist correctly
* chore detail view shows current configuration clearly

---

# Phase 5 — Assignment Generation Engine

## Goal

Generate dated chore assignments from chore definitions.

## Important

Do not leave recurring chores as abstract definitions only.
The app needs real daily assignment instances.

## Tasks

* define assignment generation rules
* build assignment generator service
* support one-time chores
* support daily chores
* support weekly chores
* support weekdays
* support custom weekday chores
* generate assignments for a rolling time window
* avoid duplicate assignment generation
* generate today’s assignments on load if missing

## Recommended Approach

Use one of these:

* on-demand generation when household dashboard loads
* scheduled background process if backend setup makes that easy

Preferred for MVP:
**on-demand generation + idempotent creation**

## Output Rules

Each assignment instance must include:

* household_id
* chore_id
* assigned_user_id
* effective_date
* due timestamp if applicable
* status
* generated_by_rotation flag

## Done Criteria

* today’s chores appear correctly
* recurring chores create real instances
* duplicate assignments are not created on repeated refreshes

---

# Phase 6 — Rotation Engine

## Goal

Support fair chore sharing across siblings.

## Tasks

* create rotation group model
* create ordered rotation membership
* build reorder capability
* build selection logic for next assignee
* support daily rotation
* support weekly rotation
* skip inactive children
* persist rotation index safely
* ensure generated assignments use correct child

## UI Requirements

Parent must be able to:

* toggle rotation on for a chore
* choose participating children
* reorder children in sequence
* preview the next assignee

## Logic Rules

* rotation order must be deterministic
* assignment generation must pull the correct next child
* removing a child must not corrupt index logic
* if only one active child remains, system should still work

## Done Criteria

* rotated chore assigns to correct child on correct cycle
* order persists between app restarts
* inactive child is skipped safely

---

# Phase 7 — Parent and Child Dashboards

## Goal

Create useful, role-based main screens.

## Tasks

* build parent dashboard
* build child dashboard
* show today’s chores
* show pending approvals
* show overdue chores
* show weekly points snapshot
* show streak snapshot
* show quick actions

## Parent Dashboard Must Show

* child summary cards
* today’s pending chores by child
* overdue chores
* pending approval count
* quick add chore
* leaderboard preview

## Child Dashboard Must Show

* my chores today
* completed today
* awaiting approval
* points total
* streak
* leaderboard preview

## Done Criteria

* role-based dashboard renders correctly
* empty states exist
* dashboard data is understandable at a glance

---

# Phase 8 — Completion and Approval Flow

## Goal

Support the core household loop:
child does chore → parent reviews → system updates score/status

## Tasks

* child opens assignment
* child marks complete
* optional note support
* parent receives pending approval entry
* parent can approve
* parent can reject
* rejection reason optional
* approved chores award points
* rejected chores do not award points
* auto-approval path if household disables approval mode

## Assignment Statuses

Use stable states:

* pending
* completed
* awaiting_approval
* approved
* rejected
* overdue

You may simplify internally if needed, but user-facing states must be clear.

## Logic Requirements

* completion timestamp stored
* approval timestamp stored
* approver stored
* rejection reason stored if used
* approved points applied once only
* repeated approvals cannot double-credit

## Done Criteria

* child can complete
* parent can approve/reject
* points update once and correctly
* status transitions remain valid

---

# Phase 9 — Points Ledger and Totals

## Goal

Turn approvals into a simple reward system.

## Tasks

* build points ledger write logic
* build household points totals
* build per-child lifetime totals
* build per-child weekly totals
* prevent double-awards
* support manual recalculation if needed
* expose points summary to dashboards

## Rules

* points are event-based, not just stored as mutable totals
* totals should be derived from ledger or safely cached
* ledger entries must identify source assignment

## Done Criteria

* approval adds points once
* totals match ledger
* leaderboard can use weekly totals reliably

---

# Phase 10 — Streak Engine

## Goal

Add motivation without turning the app into a game mess.

## Recommended V1 Rule

A child keeps a streak if they completed all assigned chores for that day by end of day.

If this proves too heavy for first build, fallback rule:
A child keeps a streak if they received at least one approved chore on that day.

Choose one rule, document it, and keep it consistent.

## Tasks

* define streak rule formally
* build streak calculator
* store or derive current streak
* display streak on child and parent dashboard
* display broken streak state cleanly

## Done Criteria

* streak values are deterministic
* no random UI mismatches
* streak logic matches documented rule

---

# Phase 11 — Weekly Leaderboard

## Goal

Add sibling motivation.

## Tasks

* build weekly leaderboard query
* rank by approved weekly points
* display ties simply
* show chore count as secondary metric if useful
* show child names and totals
* surface leaderboard preview on dashboard
* create dedicated leaderboard screen

## Leaderboard Window

Use household-local week boundaries.

## Done Criteria

* weekly totals match points ledger
* leaderboard ordering is stable
* resets naturally by time window, not manual admin action

---

# Phase 12 — Notifications and Reminders

## Goal

Reduce parent nagging and keep chores visible.

## Tasks

* define notification preferences
* build reminder scheduling abstraction
* child reminder before due time
* overdue reminder after missed due time
* parent notification when child marks complete
* child notification when parent approves or rejects
* avoid duplicate notifications
* support local notifications first

## Required Settings

* reminders on/off
* overdue alerts on/off
* approval alerts on/off

## MVP Guidance

Prefer:

* local notifications
* one reminder before due
* one overdue reminder after due

Do not build a complicated escalation chain in V1.

## Done Criteria

* reminders fire once
* parent receives completion alert
* child receives outcome alert if enabled
* duplicate spam is prevented

---

# Phase 13 — Settings and Household Controls

## Goal

Give the parent simple control over household behavior.

## Tasks

* household settings screen
* edit household name
* toggle approval-required default
* toggle points system
* toggle reminders
* manage basic notification preferences
* member management link
* archived chores access

## Done Criteria

* parents can change household-level behavior
* children cannot access parent settings

---

# Phase 14 — Empty States, UX Polish, and Microcopy

## Goal

Make the app feel finished instead of raw.

## Tasks

* add empty states everywhere needed
* add helpful button labels
* add friendly but clean microcopy
* add loading states
* add error states
* add success confirmation states
* add subtle celebration on approved completion
* reduce visual clutter
* ensure parent and child views feel distinct

## Required Empty States

* no chores yet
* no children yet
* no pending approvals
* no leaderboard data yet
* no chores today
* no overdue chores

## Done Criteria

* app never looks broken when data is empty
* microcopy is clean and neutral
* no harsh or confusing status messages

---

# Phase 15 — QA, Testing, and Stability Pass

## Goal

Prove the app works for core household flows.

## Test Categories

## A. Auth

* sign up
* sign in
* logout
* session restore

## B. Household

* create household
* add child
* edit child
* deactivate child

## C. Chores

* create one-time chore
* create daily chore
* create custom-weekday chore
* edit chore
* archive chore

## D. Assignments

* generate today’s chores
* prevent duplicates
* show overdue correctly

## E. Rotation

* rotate across 2+ children
* reorder rotation
* skip inactive child
* preserve sequence

## F. Completion/Approval

* child completes
* parent approves
* parent rejects
* no double credit
* rejected chores don’t award points

## G. Motivation

* leaderboard updates
* streak displays correctly
* weekly totals reset correctly by date window

## H. Notifications

* due reminder
* overdue reminder
* parent completion alert
* no duplicate notification spam

## I. Permissions

* child cannot edit chores
* child cannot approve chores
* child cannot open parent settings
* child only sees permitted data

## Done Criteria

* critical flows pass
* no role leaks
* no duplicate assignment bug
* no double points bug
* no crash on empty data

---

# 5. Engineering Task Breakdown

Below is the task-level execution list Claude swarm should work through.

---

## Task Group A — Foundation

### A1

Set up mobile project and repo structure

### A2

Configure TypeScript, linting, formatting, and env handling

### A3

Set up navigation shell and route groups

### A4

Set up theme, tokens, spacing, color, and typography primitives

### A5

Connect backend and auth provider

### A6

Create shared types and constants package/module

---

## Task Group B — Schema and Services

### B1

Define database schema and migrations

### B2

Define enum constants and shared type contracts

### B3

Build household service

### B4

Build child/member service

### B5

Build chore service

### B6

Build assignment service

### B7

Build points ledger service

### B8

Build leaderboard query service

### B9

Build notification preference service

---

## Task Group C — Core Logic Engines

### C1

Build recurrence parser and validator

### C2

Build recurrence-to-date matcher

### C3

Build assignment generation engine

### C4

Build rotation engine

### C5

Build overdue detector

### C6

Build approval state transition engine

### C7

Build points award engine

### C8

Build streak calculator

### C9

Build leaderboard calculator/query

---

## Task Group D — Auth and Onboarding UI

### D1

Sign up screen

### D2

Sign in screen

### D3

Session boot loader

### D4

Create household flow

### D5

Add first child flow

### D6

App entry routing by auth + setup state

---

## Task Group E — Household UI

### E1

Members list screen

### E2

Add child screen

### E3

Edit child screen

### E4

Deactivate child flow

---

## Task Group F — Chore UI

### F1

Chore list screen

### F2

Create chore screen

### F3

Edit chore screen

### F4

Chore detail screen

### F5

Archive/delete confirmation flow

### F6

Rotation members editor

---

## Task Group G — Dashboard UI

### G1

Parent dashboard

### G2

Child dashboard

### G3

Child summary card component

### G4

Pending approval module

### G5

Overdue module

### G6

Leaderboard preview module

---

## Task Group H — Completion and Approval UI

### H1

Assignment detail screen

### H2

Mark complete action

### H3

Approval queue screen

### H4

Approve action

### H5

Reject action + reason capture

### H6

Status chip and timeline component

---

## Task Group I — Motivation UI

### I1

Points summary component

### I2

Streak display component

### I3

Leaderboard screen

### I4

Weekly rank visualization

---

## Task Group J — Notifications

### J1

Notification permission request flow

### J2

Notification preferences screen section

### J3

Due reminder scheduling

### J4

Overdue reminder scheduling

### J5

Parent completion alert

### J6

Child approval/rejection alert

### J7

Duplicate notification suppression

---

## Task Group K — QA and Hardening

### K1

Unit tests for recurrence logic

### K2

Unit tests for rotation logic

### K3

Unit tests for approval logic

### K4

Unit tests for points ledger logic

### K5

Unit tests for streak logic

### K6

Permission tests

### K7

Manual QA checklist run

### K8

Performance sweep on dashboard and assignment generation

---

# 6. Recommended Parallelization Strategy

To keep agents from colliding, use this parallel plan.

## Wave 1

* Agent A: finalize docs and scope controls
* Agent C: schema and service contracts
* Agent B: navigation shell and screen map

## Wave 2

* Agent C: auth + household persistence
* Agent B: onboarding + member screens
* Agent D: recurrence and rotation engine spec

## Wave 3

* Agent C: chore CRUD services
* Agent B: chore CRUD screens
* Agent D: assignment generation engine

## Wave 4

* Agent B: dashboards
* Agent C: approval persistence
* Agent D: approval, points, streak, leaderboard logic

## Wave 5

* Agent E: notifications
* Agent F: QA, test pass, edge-case audit
* Agent A: scope enforcement and polish review

---

# 7. Required Technical Decisions to Lock Early

Claude swarm must decide and document these early.

## Decision 1

Backend choice:

* Supabase or Firebase

Recommended:
**Supabase**

## Decision 2

Auth mode:

* email/password
* magic link optional later

## Decision 3

Child login strategy:

* parent-managed child profiles for V1

## Decision 4

Assignment generation strategy:

* on-demand idempotent generation preferred for MVP

## Decision 5

Streak rule:

* all chores completed that day OR at least one approved chore that day

## Decision 6

Points timing:

* award on approval timestamp

## Decision 7

Time zone model:

* household-local time zone

---

# 8. Acceptance Scenario Script

Claude must validate against this scenario.

## Scenario

1. Parent signs up
2. Parent creates household
3. Parent adds two children
4. Parent creates:

   * one daily chore assigned to child A
   * one rotating trash chore between both children
5. Today’s assignments generate correctly
6. Child A marks chore complete
7. Parent sees pending approval
8. Parent approves
9. Points are added once
10. Leaderboard updates
11. Due reminder fires for uncompleted chore
12. Overdue chore appears if missed
13. Next day rotation assigns trash chore to child B

If this scenario fails, MVP is not done.

---

# 9. Definition of Done for V1

V1 is done only when all of the following are true:

* parent can create and manage a household
* parent can add children
* parent can create chores
* recurring chores generate correct daily assignments
* rotating chores assign fairly and predictably
* child can complete a chore
* parent can approve/reject
* points update correctly
* leaderboard updates correctly
* streak logic works consistently
* reminders function
* child permissions are restricted correctly
* no critical crash occurs in main user journey

---

# 10. Post-V1 Parking Lot

These ideas are intentionally deferred.
Do not build them during V1 unless explicitly reopened.

* photo proof
* allowance payout accounting
* reward marketplace
* badges/achievements
* spouse invite completion flow
* advanced analytics
* AI chore suggestions
* voice assistant features
* real-time family chat
* smart home integrations
* calendar sync
* deep offline mode
* multi-household support

---

# 11. Final Instructions to Claude Swarm

Build the product in layers.

Do not jump to fancy features.
Do not bloat the schema.
Do not create speculative systems.
Do not let the UI become cluttered.
Do not make recurrence logic fragile.
Do not make rotation logic random.
Do not let points award twice.
Do not leak parent permissions to child accounts.

The heart of the app is:

* household
* chores
* scheduling
* rotation
* completion
* approval
* points
* leaderboard
* reminders

Ship that first.

---

If you want, I can also do the **third markdown file** now: `ARCHITECTURE.md` for this app, written in the same style as your past project docs.
