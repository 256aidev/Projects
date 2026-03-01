# Documentation Structure

> **How the docs are organized and where to put things.**

---

## Overview

```
256ai.Engine/
├── CLAUDE.md                    ← START HERE (every session)
├── PROJECT_PLAN.md              ← Development roadmap
├── README.md                    ← Human-readable overview
│
├── spec/                        ← AUTHORITATIVE SPECS
│   ├── ENGINE_SPEC.md           ← Master design (from GPT)
│   ├── PROTOCOLS.md             ← Message specs, gap analysis
│   └── PROTOCOL_FLOWS.md        ← Visual diagrams
│
├── docs/
│   ├── DOC_STRUCTURE.md         ← YOU ARE HERE
│   │
│   ├── shared/                  ← ALL ROLES READ THESE
│   │   ├── 00_SYSTEM_OVERVIEW.md
│   │   ├── 07_ESCALATION_PROTOCOL.md
│   │   └── 08_LAUNCH_AND_KILL_RULES.md
│   │
│   ├── ControlPlane/            ← CONTROL PLANE ROLE
│   │   ├── 02_CONTROL_PLANE.md
│   │   ├── 06_TASK_SCHEMA.md
│   │   ├── API_REFERENCE.md
│   │   ├── API_ENDPOINTS.md     ← (auto-generated)
│   │   └── DATABASE_SCHEMA.md   ← (auto-generated)
│   │
│   ├── Worker/                  ← WORKER ROLE
│   │   ├── 03_EXECUTION_NODES.md
│   │   └── 04_WORKER_CONNECTION.md
│   │
│   ├── SoundEngine/             ← SOUND ENGINE
│   │   └── SOUND_ENGINE.md
│   │
│   ├── machines/                ← PER-MACHINE CONFIGS
│   │   ├── TEMPLATE_MACHINE.md
│   │   ├── MainWin.md
│   │   └── 256AI.md
│   │
│   └── testing/                 ← TEST & BENCHMARK DOCS
│       └── TEST_USERS.md
│
└── scripts/
    ├── generate-docs.ps1        ← Auto-generates docs from code
    ├── benchmark.ps1            ← Engine task benchmark
    └── bazi-throughput-test.ps1  ← BaZi API throughput test
```

---

## Document Types

### Entry Points
| File | Purpose | Who Reads |
|------|---------|-----------|
| CLAUDE.md | Start here every session | Claude |
| README.md | Project overview | Humans |
| PROJECT_PLAN.md | Development phases | Both |

### Specs (spec/)
| File | Purpose | When to Update |
|------|---------|----------------|
| ENGINE_SPEC.md | Master architecture | Rarely (needs Mark approval) |
| PROTOCOLS.md | Message specs, gaps | When protocols change |
| PROTOCOL_FLOWS.md | Visual message flows | When flows change |

### Shared Docs (docs/shared/)
All roles must read these.
| File | Purpose |
|------|---------|
| 00_SYSTEM_OVERVIEW.md | Architecture layers |
| 07_ESCALATION_PROTOCOL.md | How to escalate issues |
| 08_LAUNCH_AND_KILL_RULES.md | App lifecycle |

### Role Docs (docs/ControlPlane/, docs/Worker/, docs/SoundEngine/)
Role-specific documentation.
| Folder | Who Reads |
|--------|-----------|
| ControlPlane/ | Control Plane instances |
| Worker/ | Worker instances |
| SoundEngine/ | Sound generation workers, lead agent |

### Machine Docs (docs/machines/)
One file per physical machine.
| File | Purpose |
|------|---------|
| TEMPLATE_MACHINE.md | Copy for new machines |
| MainWin.md | This dev machine |
| 256AI.md | AI compute server |

---

## Naming Conventions

### Numbered Files (##_NAME.md)
Files with number prefixes are read in order:
- `00_` = Overview / start here
- `02_` = Control Plane
- `03_` = Workers
- `06_` = Schemas
- `07_` = Escalation
- `08_` = Lifecycle

### Auto-Generated Files
Files that are generated from code:
- `API_ENDPOINTS.md` - From Swagger
- `DATABASE_SCHEMA.md` - From EF Core
- `MESSAGE_SCHEMAS.md` - From C# classes

**Don't edit these directly.** Run `scripts/generate-docs.ps1` instead.

---

## Where to Put New Docs

| If you're documenting... | Put it in... |
|--------------------------|--------------|
| New message type | spec/PROTOCOLS.md |
| New API endpoint | docs/ControlPlane/API_REFERENCE.md |
| Worker behavior | docs/Worker/ |
| New machine | docs/machines/ (copy template) |
| Architecture change | docs/shared/00_SYSTEM_OVERVIEW.md |
| New escalation rule | docs/shared/07_ESCALATION_PROTOCOL.md |
| App building workflow | docs/APP_BUILD_PLAYBOOK.md |
| Sound/audio generation | docs/SoundEngine/SOUND_ENGINE.md |
| Visual generation | docs/SoundEngine/ (future) |

---

## Cross-Referencing

**Always link related docs:**
```markdown
**See also:** [Other Doc](path/to/doc.md) — Brief description
```

**CLAUDE.md must link to everything.** If it's not in CLAUDE.md, Claude won't find it.

---

## Updating Docs

### When Code Changes
| If you change... | Update... |
|------------------|-----------|
| API controller | Run `generate-docs.ps1` |
| Message class | Run `generate-docs.ps1` |
| Database entity | Run EF migration, then `generate-docs.ps1` |
| Protocol behavior | spec/PROTOCOLS.md (manual) |
| Architecture | docs/shared/00_SYSTEM_OVERVIEW.md (manual) |

### Golden Rule
> **Failure to update docs = incomplete task**

---

## Adding a New Machine

1. Copy `docs/machines/TEMPLATE_MACHINE.md`
2. Rename to `{MachineName}.md`
3. Fill in all fields
4. Add link to CLAUDE.md under "Machine-Specific"

---

## Template for New Docs

```markdown
# Document Title

> **One-line description of what this doc covers.**

**See also:** [Related Doc](path.md) — Description

---

## Section 1

Content here.

---

## Section 2

Content here.

---

*Last updated: YYYY-MM-DD*
```

---

*Last updated: 2026-02-22*
