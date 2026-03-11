#!/usr/bin/env bash
set -euo pipefail

# ChoreQuest Database Backup Script
# Usage: ./backup.sh [backup_dir]
# Runs pg_dump, compresses output, retains last 7 daily backups.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_DIR="$PROJECT_ROOT/infra/docker"

BACKUP_DIR="${1:-$PROJECT_ROOT/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="chorequest_${TIMESTAMP}.sql"
RETENTION_DAYS=7

# Load env if present
if [ -f "$COMPOSE_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$COMPOSE_DIR/.env"
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-chorequest}"
POSTGRES_DB="${POSTGRES_DB:-chorequest}"
CONTAINER_NAME="chorequest-db"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "Starting backup of database '$POSTGRES_DB'..."

# Run pg_dump inside the postgres container
if docker exec "$CONTAINER_NAME" pg_dump \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --no-owner \
  --no-privileges \
  > "$BACKUP_DIR/$BACKUP_FILE"; then

  # Compress
  gzip "$BACKUP_DIR/$BACKUP_FILE"
  FINAL_FILE="$BACKUP_DIR/${BACKUP_FILE}.gz"
  SIZE=$(du -h "$FINAL_FILE" | cut -f1)

  log "Backup complete: $FINAL_FILE ($SIZE)"
else
  log "ERROR: pg_dump failed!"
  exit 1
fi

# Cleanup: remove backups older than retention period
log "Removing backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "chorequest_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true

REMAINING=$(find "$BACKUP_DIR" -name "chorequest_*.sql.gz" | wc -l)
log "Cleanup done. $REMAINING backup(s) on disk."

log "Backup script finished successfully."
