# BaZi Astrology App - Claude Context

## Quick Links

| Document | Description |
|----------|-------------|
| [SSH_ACCESS.md](SSH_ACCESS.md) | Server SSH access, deployment commands |
| [ADMIN_CREDENTIALS.md](ADMIN_CREDENTIALS.md) | Admin console login credentials |

## Project Structure

```
AstrologyApp/
├── app.py                 # FastAPI main application
├── engines/               # BaZi calculation engines
│   └── relationship_engine.py  # Compatibility scoring
├── routers/               # API endpoints
│   ├── admin_router.py    # Admin dashboard API
│   └── ...
├── models/                # SQLAlchemy database models
├── services/              # Business logic
├── scripts/               # Maintenance scripts
│   ├── reset_relationship_analyses.py
│   └── test_relationship_scoring.py
└── templates/             # Email templates
```

## Server Access

- **Internal SSH**: `ssh nazmin@10.0.1.76`
- **App path**: `/home/nazmin/AstrologyApp/`
- **Production URL**: https://256ai.xyz

See [SSH_ACCESS.md](SSH_ACCESS.md) for full deployment instructions.

## Key Engines

### Relationship Scoring Engine
Location: `engines/relationship_engine.py`

Calculates BaZi compatibility with:
- Branch interactions (Clash, Combine, Harm, Punishment, Trine)
- Stem relationships (generating, controlling)
- Ten-God adjustments
- Palace weighting (primary 60%, stem 25%, secondary 15%)
- Diminishing returns for stacking
- Confidence-based score caps

### Score Labels
| Score | Label |
|-------|-------|
| 85+ | Exceptional |
| 75+ | Strong |
| 65+ | Good |
| 55+ | Mixed |
| 45+ | Challenging |
| <45 | Poor |

## Admin API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /admin/data/reset-relationship-analyses` | Clear cached analyses |
| `GET /admin/launch-health` | System health dashboard |
| `GET /admin/scheduler/status` | Job scheduler status |

## Deployment Workflow

1. Edit files locally in `I:\2026CodeProjects\BaZi\iOS\AstrologyApp\`
2. SCP files to server: `scp file.py nazmin@10.0.1.76:/home/nazmin/AstrologyApp/path/`
3. Restart service: `ssh nazmin@10.0.1.76 "pkill -f 'uvicorn app:app' && cd /home/nazmin/AstrologyApp && source venv/bin/activate && nohup uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4 &"`
