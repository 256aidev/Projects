#!/bin/bash
# =============================================================================
# 256ai Engine - Mac Worker (Full Worker: Heartbeat + Task Polling + Execution)
# Worker ID: worker-mac-001
# Domains: frontend, ui, mobile
# Executes tasks via: claude -p (Claude Code CLI)
# =============================================================================

set -euo pipefail

# --- Configuration ---
WORKER_ID="worker-mac-001"
CONTROL_PLANE="http://10.0.1.147:5100"
DOMAINS="frontend,ui,mobile,general"
HEARTBEAT_INTERVAL=20
POLL_INTERVAL=5
CLAUDE_PATH="/opt/homebrew/bin/claude"
CLAUDE_TIMEOUT=120
VERSION="1.0.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Logging ---
log_info()  { echo -e "${GREEN}[INFO]${NC}  $(date '+%H:%M:%S') $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $(date '+%H:%M:%S') $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date '+%H:%M:%S') $1"; }
log_task()  { echo -e "${BLUE}[TASK]${NC}  $(date '+%H:%M:%S') $1"; }

# --- Preflight Checks ---
preflight() {
    echo "========================================"
    echo "  256ai Engine - Mac Worker"
    echo "  Worker ID: $WORKER_ID"
    echo "  Domains:   $DOMAINS"
    echo "  Engine:    $CONTROL_PLANE"
    echo "========================================"
    echo ""

    # Check curl
    if ! command -v curl &> /dev/null; then
        log_error "curl not found. Please install curl."
        exit 1
    fi
    log_info "curl: OK"

    # Check jq (optional but preferred)
    if command -v jq &> /dev/null; then
        JQ_AVAILABLE=true
        log_info "jq: OK"
    else
        JQ_AVAILABLE=false
        log_warn "jq not found - using python for JSON parsing. Install jq for better performance: brew install jq"
    fi

    # Check claude CLI
    if [ -f "$CLAUDE_PATH" ]; then
        log_info "Claude CLI: $CLAUDE_PATH"
        CLAUDE_AVAILABLE=true
    elif command -v claude &> /dev/null; then
        CLAUDE_PATH="$(command -v claude)"
        log_info "Claude CLI: $CLAUDE_PATH (from PATH)"
        CLAUDE_AVAILABLE=true
    else
        log_warn "Claude CLI not found at $CLAUDE_PATH - will use echo mode"
        CLAUDE_AVAILABLE=false
    fi

    # Check connectivity to control plane
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$CONTROL_PLANE/health/summary" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        log_info "Control Plane: reachable ($CONTROL_PLANE)"
    else
        log_error "Cannot reach Control Plane at $CONTROL_PLANE (HTTP $HTTP_CODE)"
        log_error "Make sure the Control Plane is running and the IP is correct."
        exit 1
    fi

    echo ""
    log_info "Preflight complete. Starting worker..."
    echo ""
}

# --- JSON helpers ---
json_get() {
    local json="$1"
    local field="$2"
    if [ "$JQ_AVAILABLE" = true ]; then
        echo "$json" | jq -r ".$field // empty" 2>/dev/null
    else
        echo "$json" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    keys = '$field'.split('.')
    val = data
    for k in keys:
        if isinstance(val, dict):
            val = val.get(k)
        else:
            val = None
            break
    if val is not None:
        print(val)
except:
    pass
" 2>/dev/null
    fi
}

# --- Heartbeat (runs in background) ---
heartbeat_loop() {
    while true; do
        PAYLOAD=$(cat <<EOF
{"workerId":"$WORKER_ID","status":"OK","version":"$VERSION"}
EOF
)
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            -X POST "$CONTROL_PLANE/health/heartbeat" \
            -H "Content-Type: application/json" \
            -d "$PAYLOAD" \
            --connect-timeout 5 2>/dev/null || echo "000")

        if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "204" ]; then
            log_warn "Heartbeat failed (HTTP $HTTP_CODE)"
        fi

        sleep "$HEARTBEAT_INTERVAL"
    done
}

# --- Execute task with Claude CLI ---
execute_with_claude() {
    local objective="$1"
    local task_id="$2"

    local system_prompt="You are a worker agent (ID: $WORKER_ID) in a distributed AI system called 256ai Engine. Your specialization is frontend, UI, and mobile development. Execute the given task concisely and return results."
    local full_prompt="$system_prompt

---

$objective"

    if [ "$CLAUDE_AVAILABLE" = true ]; then
        log_task "Executing with Claude CLI..."

        # Run claude -p with timeout, pipe prompt via stdin
        local result
        result=$(echo "$full_prompt" | timeout "$CLAUDE_TIMEOUT" "$CLAUDE_PATH" -p --output-format text 2>/dev/null) || {
            local exit_code=$?
            if [ $exit_code -eq 124 ]; then
                echo "[Worker $WORKER_ID] Task timed out after ${CLAUDE_TIMEOUT}s"
                return 1
            else
                echo "[Worker $WORKER_ID] Claude CLI failed (exit code $exit_code)"
                return 1
            fi
        }

        echo "$result"
    else
        # Echo mode fallback
        echo "[Worker $WORKER_ID] Received objective: $objective"
    fi
}

# --- Poll and execute tasks ---
poll_loop() {
    local consecutive_errors=0

    while true; do
        # Poll for task
        POLL_URL="$CONTROL_PLANE/tasks/poll?workerId=$WORKER_ID&domains=$DOMAINS"
        RESPONSE=$(curl -s --connect-timeout 5 "$POLL_URL" 2>/dev/null) || {
            consecutive_errors=$((consecutive_errors + 1))
            if [ $((consecutive_errors % 12)) -eq 0 ]; then
                log_warn "Cannot reach Control Plane (${consecutive_errors} consecutive failures)"
            fi
            sleep "$POLL_INTERVAL"
            continue
        }
        consecutive_errors=0

        # Check if there's a task
        HAS_TASK=$(json_get "$RESPONSE" "hasTask")
        if [ "$HAS_TASK" != "true" ]; then
            sleep "$POLL_INTERVAL"
            continue
        fi

        # Extract task details
        TASK_ID=$(json_get "$RESPONSE" "taskId")
        OBJECTIVE=$(json_get "$RESPONSE" "objective")
        DOMAIN=$(json_get "$RESPONSE" "domain")

        log_task "Claimed task $TASK_ID (domain: $DOMAIN)"
        log_task "Objective: $OBJECTIVE"

        # Execute (macOS date doesn't support %3N, use python for millisecond timestamps)
        START_TIME=$(python3 -c "import time; print(int(time.time()*1000))")
        TASK_RESULT=""
        TASK_SUCCESS=true
        TASK_ERROR=""

        TASK_RESULT=$(execute_with_claude "$OBJECTIVE" "$TASK_ID") || {
            TASK_SUCCESS=false
            TASK_ERROR="$TASK_RESULT"
            TASK_RESULT=""
        }

        END_TIME=$(python3 -c "import time; print(int(time.time()*1000))")
        ELAPSED=$((END_TIME - START_TIME))

        # Escape result for JSON
        ESCAPED_RESULT=$(echo "$TASK_RESULT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))" 2>/dev/null || echo "\"$TASK_RESULT\"")
        ESCAPED_ERROR=$(echo "$TASK_ERROR" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))" 2>/dev/null || echo "null")

        if [ "$TASK_SUCCESS" = true ]; then
            RESULT_PAYLOAD=$(cat <<EOFRESULT
{"workerId":"$WORKER_ID","success":true,"outputs":{"response":$ESCAPED_RESULT},"executionTimeMs":$ELAPSED}
EOFRESULT
)
        else
            RESULT_PAYLOAD=$(cat <<EOFRESULT
{"workerId":"$WORKER_ID","success":false,"outputs":{"response":""},"errorMessage":$ESCAPED_ERROR,"executionTimeMs":$ELAPSED}
EOFRESULT
)
        fi

        # Submit result
        RESULT_URL="$CONTROL_PLANE/tasks/$TASK_ID/result"
        RESULT_HTTP=$(curl -s -o /dev/null -w "%{http_code}" \
            -X POST "$RESULT_URL" \
            -H "Content-Type: application/json" \
            -d "$RESULT_PAYLOAD" \
            --connect-timeout 10 2>/dev/null || echo "000")

        if [ "$RESULT_HTTP" = "200" ]; then
            log_task "Task $TASK_ID COMPLETED in ${ELAPSED}ms"
        else
            log_error "Failed to submit result for $TASK_ID (HTTP $RESULT_HTTP)"
        fi

        echo ""
        sleep 1  # Brief pause before next poll
    done
}

# --- Cleanup on exit ---
cleanup() {
    echo ""
    log_info "Shutting down worker $WORKER_ID..."
    # Kill heartbeat background process
    if [ -n "${HEARTBEAT_PID:-}" ]; then
        kill "$HEARTBEAT_PID" 2>/dev/null || true
    fi
    log_info "Worker stopped."
    exit 0
}
trap cleanup SIGINT SIGTERM

# --- Main ---
preflight

# Start heartbeat in background
heartbeat_loop &
HEARTBEAT_PID=$!
log_info "Heartbeat started (PID $HEARTBEAT_PID, interval ${HEARTBEAT_INTERVAL}s)"

# Start polling (foreground)
log_info "Task polling started (interval ${POLL_INTERVAL}s, domains: $DOMAINS)"
echo ""
poll_loop
