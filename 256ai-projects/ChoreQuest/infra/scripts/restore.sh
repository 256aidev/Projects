#!/usr/bin/env bash
set -euo pipefail

# ChoreQuest Database Restore Script
# Usage: ./restore.sh <backup_file.sql.gz>
# Decompresses and restores a backup, then verifies row counts.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_DIR="$PROJECT_ROOT/infra/docker"

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo "Example: $0 ./backups/chorequest_20260307_120000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

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

log "WARNING: This will DROP and recreate the '$POSTGRES_DB' database!"
read -r -p "Are you sure? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  log "Restore cancelled."
  exit 0
fi

log "Decompressing backup: $BACKUP_FILE"
TEMP_SQL=$(mktemp /tmp/chorequest_restore_XXXXXX.sql)
gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"

log "Dropping and recreating database '$POSTGRES_DB'..."
docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();" \
  > /dev/null 2>&1 || true

docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d postgres -c \
  "DROP DATABASE IF EXISTS $POSTGRES_DB;"
docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d postgres -c \
  "CREATE DATABASE $POSTGRES_DB OWNER $POSTGRES_USER;"

log "Restoring from backup..."
docker exec -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$TEMP_SQL"

# Cleanup temp file
rm -f "$TEMP_SQL"

log "Restore complete. Verifying row counts..."

# Verify row counts for key tables
TABLES=("households" "users" "chores" "chore_assignments" "points_ledger" "rotation_groups" "rotation_members")

echo ""
echo "Table Row Counts:"
echo "================================"
for TABLE in "${TABLES[@]}"; do
  COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c \
    "SELECT COUNT(*) FROM $TABLE;" 2>/dev/null | tr -d ' ' || echo "N/A")
  printf "  %-25s %s\n" "$TABLE" "$COUNT"
done
echo "================================"
echo ""

log "Restore and verification complete."
