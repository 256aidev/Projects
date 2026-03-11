# ChoreQuest — Backup & Restore Guide

## Backup Strategy

ChoreQuest uses PostgreSQL `pg_dump` for full logical backups. Backups are taken as SQL dumps, compressed with gzip, and stored locally on the host.

### What is backed up
- All database tables (households, users, chores, assignments, points, rotations)
- Schema definitions
- Enum types and constraints

### What is NOT backed up
- Uploaded files/media (none currently)
- Application configuration (stored in `.env`, managed separately)
- Docker volumes other than the database

## Running a Backup

```bash
# Default: saves to ./backups/
./infra/scripts/backup.sh

# Custom backup directory
./infra/scripts/backup.sh /mnt/nas/chorequest-backups
```

Output file: `chorequest_YYYYMMDD_HHMMSS.sql.gz`

## Retention Policy

| Policy | Value |
|--------|-------|
| Format | Compressed SQL dump (`.sql.gz`) |
| Frequency | Daily recommended (see cron below) |
| Retention | 7 days automatic cleanup |
| Pre-deploy | Automatic (via `deploy.sh`) |

The backup script automatically deletes `.sql.gz` files older than 7 days from the backup directory.

### Recommended cron schedule

```bash
# Daily at 2:00 AM
0 2 * * * /opt/chorequest/infra/scripts/backup.sh >> /var/log/chorequest-backup.log 2>&1
```

### Off-site backup (recommended)

Copy backups to a separate machine or NAS for disaster recovery:

```bash
# Example: rsync to NAS after backup
0 3 * * * rsync -az /opt/chorequest/backups/ nas:/backups/chorequest/
```

## Restore Steps

### 1. Identify the backup to restore

```bash
ls -lh backups/
# -rw-r--r-- 1 root root  12K Mar  7 02:00 chorequest_20260307_020000.sql.gz
# -rw-r--r-- 1 root root  11K Mar  6 02:00 chorequest_20260306_020000.sql.gz
```

### 2. Stop the API (recommended)

```bash
cd infra/docker
docker compose stop api
```

### 3. Run the restore

```bash
./infra/scripts/restore.sh backups/chorequest_20260307_020000.sql.gz
```

The script will:
1. Ask for confirmation (you must type `yes`)
2. Decompress the backup
3. Drop and recreate the database
4. Import the SQL dump
5. Display row counts for verification

### 4. Restart the API

```bash
cd infra/docker
docker compose start api
```

### 5. Verify

```bash
curl http://localhost/health/detailed
```

## Verification Checklist

After every restore, verify:

- [ ] `curl http://localhost/health/detailed` returns `"status": "ok"`
- [ ] Database status shows `"database": "healthy"`
- [ ] Row counts match expected values (compare with pre-backup counts)
- [ ] Key tables have data:
  ```bash
  docker exec chorequest-db psql -U chorequest -d chorequest -c "
    SELECT 'households' AS t, COUNT(*) FROM households
    UNION ALL SELECT 'users', COUNT(*) FROM users
    UNION ALL SELECT 'chores', COUNT(*) FROM chores
    UNION ALL SELECT 'chore_assignments', COUNT(*) FROM chore_assignments;
  "
  ```
- [ ] Application functionality works (create a test chore, verify it appears)

## Disaster Recovery

If the host machine is lost:

1. Provision a new machine with Docker installed
2. Clone the repository
3. Copy `.env` configuration
4. Start services: `docker compose up -d`
5. Run migrations: `./infra/scripts/migrate.sh`
6. Restore from the most recent off-site backup
7. Verify with the checklist above
