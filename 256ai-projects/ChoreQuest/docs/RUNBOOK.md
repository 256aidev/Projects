# ChoreQuest — Operations Runbook

## Quick Reference

| Action | Command |
|--------|---------|
| Start all services | `cd infra/docker && docker compose up -d` |
| Stop all services | `cd infra/docker && docker compose down` |
| View logs | `cd infra/docker && docker compose logs -f` |
| Deploy update | `./infra/scripts/deploy.sh` |
| Backup database | `./infra/scripts/backup.sh` |
| Restore database | `./infra/scripts/restore.sh <file>` |
| Run migrations | `./infra/scripts/migrate.sh` |
| Health check | `curl http://localhost/health/detailed` |

## Startup Procedure

```bash
cd /opt/chorequest/infra/docker

# Start all services (postgres starts first, then API, then nginx)
docker compose up -d

# Verify everything is healthy
docker compose ps
curl http://localhost/health/detailed
```

Services start in dependency order:
1. **postgres** — Database starts and passes health check
2. **api** — Waits for postgres, then starts NestJS
3. **nginx** — Waits for api health check, then starts reverse proxy

## Shutdown Procedure

```bash
cd /opt/chorequest/infra/docker

# Graceful shutdown (recommended)
docker compose down

# If containers hang, force stop after 30s
docker compose down --timeout 30
```

**Note:** `docker compose down` does NOT delete the database volume. Data is preserved.

To completely wipe data (destructive):
```bash
docker compose down -v   # Removes volumes — ALL DATA LOST
```

## Backup Schedule Recommendation

| Frequency | What | Retention |
|-----------|------|-----------|
| Daily (2 AM) | Full pg_dump | 7 days |
| Pre-deploy | Full pg_dump | 7 days |

Set up a daily cron job:

```bash
# crontab -e
0 2 * * * /opt/chorequest/infra/scripts/backup.sh >> /var/log/chorequest-backup.log 2>&1
```

On Windows, use Task Scheduler to run `bash /opt/chorequest/infra/scripts/backup.sh`.

## Restore Procedure

See [BACKUP_RESTORE.md](./BACKUP_RESTORE.md) for full details.

Quick restore:
```bash
# List available backups
ls -la backups/

# Restore (will prompt for confirmation)
./infra/scripts/restore.sh backups/chorequest_20260307_020000.sql.gz
```

## How to Check Logs

### All services
```bash
cd infra/docker
docker compose logs -f              # Follow all logs
docker compose logs -f api          # API only
docker compose logs -f postgres     # Database only
docker compose logs -f nginx        # Nginx only
```

### Specific time range
```bash
docker compose logs --since "2h" api       # Last 2 hours
docker compose logs --since "2026-03-07" api  # Since a date
```

### Log locations inside containers
| Service | Log path |
|---------|----------|
| API | stdout (captured by Docker) |
| PostgreSQL | `/var/lib/postgresql/data/log/` |
| nginx | `/var/log/nginx/access.log`, `/var/log/nginx/error.log` |

## How to Update / Upgrade

### Standard deploy
```bash
./infra/scripts/deploy.sh
```

This will:
1. Pull latest code (`git pull --ff-only`)
2. Create a pre-deploy backup
3. Rebuild the API container
4. Restart all services
5. Wait for health check
6. Run database migrations

### Skip backup (faster, for non-critical updates)
```bash
./infra/scripts/deploy.sh --skip-backup
```

### Manual step-by-step
```bash
cd /opt/chorequest
git pull --ff-only
./infra/scripts/backup.sh
cd infra/docker
docker compose build --no-cache api
docker compose up -d
cd ../..
./infra/scripts/migrate.sh
curl http://localhost/health/detailed
```

## Troubleshooting

### API won't start

**Check logs:**
```bash
docker compose logs api
```

**Common causes:**
- Database not ready → Check postgres health: `docker compose ps`
- Missing environment variables → Check `infra/docker/.env`
- Migration needed → Run `./infra/scripts/migrate.sh`

### Database connection refused

```bash
# Check if postgres is running
docker compose ps postgres

# Check postgres logs
docker compose logs postgres

# Test connectivity from API container
docker exec chorequest-api wget -qO- http://localhost:3000/health/detailed
```

### Nginx 502 Bad Gateway

The API container is not healthy or not running.

```bash
# Check API status
docker compose ps api

# Restart API
docker compose restart api

# Wait and test
sleep 10
curl http://localhost/health
```

### Out of disk space

```bash
# Check disk usage
df -h

# Clean up old Docker images
docker system prune -f

# Check backup directory size
du -sh backups/
```

### Container stuck / unresponsive

```bash
# Force recreate
docker compose up -d --force-recreate

# Nuclear option: stop everything, clean up, restart
docker compose down
docker compose up -d --build
```

### Checking database directly

```bash
# Open psql shell
docker exec -it chorequest-db psql -U chorequest -d chorequest

# Run a query
docker exec chorequest-db psql -U chorequest -d chorequest -c "SELECT COUNT(*) FROM users;"
```

### Reset to clean state

```bash
cd infra/docker
docker compose down -v   # WARNING: deletes all data
docker compose up -d --build
cd ../..
./infra/scripts/migrate.sh
```
