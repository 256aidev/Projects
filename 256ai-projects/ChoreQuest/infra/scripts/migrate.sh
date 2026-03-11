#!/usr/bin/env bash
set -euo pipefail

# ChoreQuest Database Migration Script
# Usage: ./migrate.sh
# Runs prisma migrate deploy inside the API container.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_DIR="$PROJECT_ROOT/infra/docker"

# Load env if present
if [ -f "$COMPOSE_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$COMPOSE_DIR/.env"
  set +a
fi

CONTAINER_NAME="chorequest-api"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log "Running Prisma migrations..."

if docker exec "$CONTAINER_NAME" npx prisma migrate deploy; then
  log "Migrations applied successfully."
else
  log "ERROR: Migration failed!"
  log "Check migration status with: docker exec $CONTAINER_NAME npx prisma migrate status"
  exit 1
fi

log "Current migration status:"
docker exec "$CONTAINER_NAME" npx prisma migrate status 2>&1 || true

log "Migration script finished."
