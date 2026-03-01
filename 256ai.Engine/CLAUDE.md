# CLAUDE.md - 256ai.Engine

> **START HERE.** Read this file first in every session.

## Project Status

**Current Phase:** Phase 3 - Worker Integration
**Full Plan:** [PROJECT_PLAN.md](PROJECT_PLAN.md)

---

## This Machine (YOU ARE THE LEAD)

| Field | Value |
|-------|-------|
| **Role** | **Swarm Lead** (Lead Dev / Team Lead) |
| **Machine** | MainWin (10.0.1.235) |
| **Machine Config** | [docs/machines/MainWin.md](docs/machines/MainWin.md) |

Plan WITH the human, decompose into tasks, dispatch to swarm, coordinate workers, ensure correctness.

---

## Required Reading

**Before planning:** [SWARM_WORKFLOW.md](spec/SWARM_WORKFLOW.md) | [AGENT_ROLES.md](spec/AGENT_ROLES.md)
**Before building:** [ENGINE_SPEC.md](spec/ENGINE_SPEC.md) — Authoritative HL7-style architecture spec
**Before updating docs:** [DOC_STRUCTURE.md](docs/DOC_STRUCTURE.md)
**Workers read:** [AGENT_ROLES.md](spec/AGENT_ROLES.md) | [PROTOCOLS.md](spec/PROTOCOLS.md)

---

## Reference Docs (Read When Needed)

| Topic | Doc |
|-------|-----|
| Agent roles & swarm | [AGENT_ROLES.md](spec/AGENT_ROLES.md) |
| Swarm workflow | [SWARM_WORKFLOW.md](spec/SWARM_WORKFLOW.md) |
| App build playbook | [APP_BUILD_PLAYBOOK.md](docs/APP_BUILD_PLAYBOOK.md) |
| Message protocols | [PROTOCOLS.md](spec/PROTOCOLS.md) / [PROTOCOL_FLOWS.md](spec/PROTOCOL_FLOWS.md) |
| System architecture | [00_SYSTEM_OVERVIEW.md](docs/shared/00_SYSTEM_OVERVIEW.md) |
| Escalation protocol | [07_ESCALATION_PROTOCOL.md](docs/shared/07_ESCALATION_PROTOCOL.md) |
| App lifecycle | [08_LAUNCH_AND_KILL_RULES.md](docs/shared/08_LAUNCH_AND_KILL_RULES.md) |
| API & MCP reference | [API_REFERENCE.md](docs/ControlPlane/API_REFERENCE.md) |
| Task schema | [06_TASK_SCHEMA.md](docs/ControlPlane/06_TASK_SCHEMA.md) |
| Control Plane role | [02_CONTROL_PLANE.md](docs/ControlPlane/02_CONTROL_PLANE.md) |
| Worker connection | [04_WORKER_CONNECTION.md](docs/Worker/04_WORKER_CONNECTION.md) |
| Execution nodes | [03_EXECUTION_NODES.md](docs/Worker/03_EXECUTION_NODES.md) |
| Sound Engine | [SOUND_ENGINE.md](docs/SoundEngine/SOUND_ENGINE.md) |
| Machines | [MainWin](docs/machines/MainWin.md) / [256AI](docs/machines/256AI.md) / [Template](docs/machines/TEMPLATE_MACHINE.md) |

---

## Running the Engine

```bash
# Control Plane (API on port 5100)
dotnet run --project src/Engine.ControlPlane --urls "http://localhost:5100"

# Worker
dotnet run --project src/Engine.Worker

# Sound API (Python, port 5200)
cd src/Engine.SoundApi && .venv/Scripts/python.exe main.py

# Sound Worker (separate instance)
cd publish/sound-worker-win-x64 && Engine.Worker.exe

# Health check
curl http://localhost:5100/health/summary
curl http://localhost:5200/health
```

**API:** `http://10.0.1.147:5100` | **MCP SSE:** `http://10.0.1.147:5100/sse` | **Sound API:** `http://10.0.1.147:5200`
**Full API docs:** [API_REFERENCE.md](docs/ControlPlane/API_REFERENCE.md) | **Sound Engine:** [SOUND_ENGINE.md](docs/SoundEngine/SOUND_ENGINE.md)

---

## Project Structure

```
256ai.Engine/
├── spec/ENGINE_SPEC.md              # Authoritative spec
├── docs/{shared,ControlPlane,Worker,machines}/  # Role-based docs
├── src/
│   ├── Engine.Core/                 # Message schemas, interfaces
│   ├── Engine.Infrastructure/       # Database, RabbitMQ
│   ├── Engine.ControlPlane/         # API + MCP server (Controllers/, McpTools/)
│   ├── Engine.Dashboard/            # Static HTML dashboard (port 8080)
│   ├── Engine.SoundApi/            # Python/FastAPI sound generation (port 5200)
│   └── Engine.Worker/               # Worker host (multi-provider)
├── scripts/{generate-docs,benchmark}.ps1
└── 256ai.Engine.sln
```

---

## Architecture (5 Layers)

Strategy (Human/Mark) → **Control Plane (This Engine)** → Execution Nodes (Worker Claudes) → Model & Compute (Ollama, for apps) → Monitoring

The engine orchestrates **Claude Code instances**, NOT Ollama. Ollama is Layer 4 compute for apps only.
**Sound Engine** runs on Dragon (port 5200) — generates voice, SFX, and music via local AI models. See [SOUND_ENGINE.md](docs/SoundEngine/SOUND_ENGINE.md).
Full diagram: [00_SYSTEM_OVERVIEW.md](docs/shared/00_SYSTEM_OVERVIEW.md)

---

## Documentation Rules (MANDATORY)

| If you change... | Update... |
|------------------|-----------|
| API controller / Message class | Run `scripts/generate-docs.ps1` |
| Database entity | EF migration, then `generate-docs.ps1` |
| Worker behavior | `docs/Worker/*.md` (manual) |
| Sound Engine | `docs/SoundEngine/SOUND_ENGINE.md` (manual) |
| Escalation rules | `docs/shared/07_ESCALATION_PROTOCOL.md` |
| Architecture | `docs/shared/00_SYSTEM_OVERVIEW.md` |
| Core spec | `spec/ENGINE_SPEC.md` (requires Mark approval) |

**Failure to update docs = incomplete task**

---

## Git Backup (MANDATORY)

**Repo:** `git@github.com:256aidev/Projects.git` (private)
**Root:** `C:\Projects` is the repo root.

**After making changes, always commit and push:**
```bash
cd C:/Projects
git add -A
git commit -m "Brief description of changes"
git push
```

- Commit after completing each task or logical set of changes
- Write clear commit messages describing what changed
- The `.gitignore` protects secrets (`.env`, `CREDENTIALS.md`, databases, build output)
- **Never commit credentials or API keys** — check `git diff --cached` if unsure

---

## Golden Rules

1. **If it's not written down, it doesn't exist**
2. **Health is a MESSAGE STREAM, not a dashboard**
3. **Every escalation must receive a disposition**
4. **Apps are disposable; the engine is permanent**
5. **If uncertain → escalate to Strategy Layer**
6. **Always commit and push changes to GitHub**

---

## Related Projects

All apps: `C:\Projects\256ai-projects\{app-name}\` — See [APP_BUILD_PLAYBOOK.md](docs/APP_BUILD_PLAYBOOK.md)
Dashboard: `C:\Projects\256ai-dashboard\`

---

*Last updated: 2026-02-22*
