# 256ai.Engine

> **Apps are disposable. The engine is permanent.**

A distributed AI orchestration framework for building and managing applications with Claude agents.

## What is this?

256ai.Engine is the central nervous system for your AI-powered applications:

- **Control Plane** - API that receives tasks and dispatches them to workers
- **Workers** - Claude agents on different machines that execute tasks
- **Health Monitoring** - Real-time visibility into workers, apps, and system health
- **Escalation System** - When AI is uncertain, it asks for help instead of guessing

## Quick Start

### Prerequisites

- .NET 8 SDK
- (Optional) RabbitMQ for message queuing

### Run the Control Plane

```bash
cd 256ai.Engine
dotnet run --project src/Engine.ControlPlane --urls "http://localhost:5100"
```

### Check Health

```bash
curl http://localhost:5100/health/summary
```

### Submit a Task

```bash
curl -X POST http://localhost:5100/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "Summarize this text in 50 words",
    "domain": "text-processing",
    "inputs": {"text": "Your text here..."},
    "expectedOutputs": "Plain text summary"
  }'
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Strategy Layer                        │
│              (Human decision making)                     │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │ Escalations
                           │
┌─────────────────────────────────────────────────────────┐
│                    Control Plane                         │
│         (Task dispatch, health aggregation)              │
│                  localhost:5100                          │
└─────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
   ┌──────────┐     ┌──────────┐     ┌──────────┐
   │ Worker 1 │     │ Worker 2 │     │ Worker 3 │
   │ (MainWin)│     │ (BaZi)   │     │ (Dragon) │
   │  Claude  │     │  Claude  │     │  Ollama  │
   └──────────┘     └──────────┘     └──────────┘
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health/summary` | GET | System health overview |
| `/health/workers` | GET | List all workers |
| `/tasks` | POST | Submit a new task |
| `/tasks/{id}` | GET | Get task status |
| `/escalations` | GET | View pending escalations |

See [API Reference](docs/ControlPlane/API_REFERENCE.md) for full documentation.

## Project Structure

```
256ai.Engine/
├── src/
│   ├── Engine.Core/           # Message schemas, interfaces
│   ├── Engine.Infrastructure/ # Database, RabbitMQ
│   ├── Engine.ControlPlane/   # API server
│   └── Engine.Worker/         # Worker client
├── docs/
│   ├── ControlPlane/          # Control Plane docs
│   ├── Worker/                # Worker docs
│   ├── shared/                # Common docs
│   └── machines/              # Per-machine configs
├── CLAUDE.md                  # AI agent entry point
├── PROJECT_PLAN.md            # Development roadmap
└── README.md                  # You are here
```

## For Claude Agents

If you're a Claude agent working on this project, start with [CLAUDE.md](CLAUDE.md).

## Documentation

- [System Overview](docs/shared/00_SYSTEM_OVERVIEW.md)
- [API Reference](docs/ControlPlane/API_REFERENCE.md)
- [Task Schema](docs/ControlPlane/06_TASK_SCHEMA.md)
- [Worker Connection Guide](docs/Worker/04_WORKER_CONNECTION.md)
- [Escalation Protocol](docs/shared/07_ESCALATION_PROTOCOL.md)
- [Project Plan](PROJECT_PLAN.md)

## Current Status

**Phase 2: Documentation** - Building out comprehensive docs for workers to connect.

See [PROJECT_PLAN.md](PROJECT_PLAN.md) for the full roadmap.

## License

Proprietary - 256ai

---

*Built for humans and AI to work together.*
