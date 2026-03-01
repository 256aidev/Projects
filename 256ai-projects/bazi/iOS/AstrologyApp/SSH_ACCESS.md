# SSH Access Documentation

## Server Access

**Internal Network Only** - SSH is not exposed externally via 256ai.xyz

### Connection Details

| Property | Value |
|----------|-------|
| Host | `10.0.1.76` |
| User | `nazmin` |
| Auth | SSH key (auto-connect configured) |
| Port | 22 (default) |

### Connect Command
```bash
ssh nazmin@10.0.1.76
```

### App Location
```
/home/nazmin/AstrologyApp/
```

### Directory Structure
```
/home/nazmin/AstrologyApp/
├── app.py              # FastAPI main app
├── venv/               # Python virtual environment
├── engines/            # BaZi calculation engines
│   └── relationship_engine.py
├── routers/            # API route handlers
│   └── admin_router.py
├── models/             # SQLAlchemy models
├── services/           # Business logic services
├── scripts/            # Maintenance scripts
│   ├── reset_relationship_analyses.py
│   └── test_relationship_scoring.py
└── requirements.txt
```

### Service Management

The API runs via uvicorn:
```bash
# Check status
ps aux | grep 'uvicorn app:app'

# Restart service
pkill -f 'uvicorn app:app'
cd /home/nazmin/AstrologyApp
source venv/bin/activate
nohup uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4 > /dev/null 2>&1 &
```

### Deploy Files
```bash
# From Windows machine
scp "I:/2026CodeProjects/BaZi/iOS/AstrologyApp/engines/relationship_engine.py" nazmin@10.0.1.76:/home/nazmin/AstrologyApp/engines/

scp "I:/2026CodeProjects/BaZi/iOS/AstrologyApp/routers/admin_router.py" nazmin@10.0.1.76:/home/nazmin/AstrologyApp/routers/
```

### Common Maintenance Tasks

**Reset relationship analyses:**
```bash
ssh nazmin@10.0.1.76 "cd /home/nazmin/AstrologyApp && source venv/bin/activate && python scripts/reset_relationship_analyses.py"
```

**Run scoring tests:**
```bash
ssh nazmin@10.0.1.76 "cd /home/nazmin/AstrologyApp && source venv/bin/activate && python scripts/test_relationship_scoring.py"
```

**Check logs:**
```bash
ssh nazmin@10.0.1.76 "journalctl -u astrology-api -n 50 --no-pager"
```

---

## Database

PostgreSQL on the same server:
- Database: `astrology_app` (or similar)
- Access via SQLAlchemy in the app

## External URL

- **Production**: https://256ai.xyz
- **Admin Dashboard**: https://256ai.xyz/admin (or separate port)
