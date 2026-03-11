#!/usr/bin/env bash
set -euo pipefail

# ChoreQuest Deployment Script
# Usage: ./deploy.sh [--skip-backup]
# Pulls latest code, runs migrations, builds and restarts containers.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_DIR="$PROJECT_ROOT/infra/docker"

SKIP_BACKUP=false
for arg in "$@"; do
  case $arg in
    --skip-backup) SKIP_BACKUP=true ;;
  esac
done

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log "========================================="
log "ChoreQuest Deployment Starting"
log "========================================="

# Step 1: Pull latest code
log "Step 1/5: Pulling latest code..."
cd "$PROJECT_ROOT"
git pull --ff-only
log "Code updated."

# Step 2: Pre-deploy backup
if [ "$SKIP_BACKUP" = false ]; then
  log "Step 2/5: Creating pre-deploy backup..."
  if "$SCRIPT_DIR/backup.sh"; then
    log "Backup complete."
  else
    log "WARNING: Backup failed. Continuing with deploy..."
  fi
else
  log "Step 2/5: Skipping backup (--skip-backup flag)."
fi

# Step 3: Build containers
log "Step 3/5: Building containers..."
cd "$COMPOSE_DIR"
docker compose build --no-cache api
log "Build complete."

# Step 4: Restart services
log "Step 4/5: Restarting services..."
docker compose up -d
log "Services restarted."

# Step 5: Wait for health check and run migrations
log "Step 5/5: Waiting for API to be healthy..."
MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
  if docker exec chorequest-api wget -qO- http://localhost:3000/health > /dev/null 2>&1; then
    log "API is healthy."
    break
  fi
  sleep 2
  WAITED=$((WAITED + 2))
done

if [ $WAITED -ge $MAX_WAIT ]; then
  log "ERROR: API failed to become healthy within ${MAX_WAIT}s!"
  log "Check logs: docker compose -f $COMPOSE_DIR/docker-compose.yml logs api"
  exit 1
fi

# Run migrations after API is up (DB is guaranteed healthy)
log "Running migrations..."
"$SCRIPT_DIR/migrate.sh"

log "========================================="
log "Deployment complete!"
log "========================================="
log ""
log "Verify: curl http://localhost/health/detailed"
