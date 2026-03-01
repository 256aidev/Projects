#!/bin/bash
#
# BaZi Health Monitor
# Centralized health check and recovery script for the BaZi app server.
#
# This script runs on the Linux server via cron every 5 minutes.
# It checks:
#   1. Ollama health - restarts if down
#   2. Scheduled jobs completion - triggers recovery if readings are missing
#
# Usage:
#   chmod +x bazi-health-monitor.sh
#   # Add to crontab: */5 * * * * /home/nazmin/AstrologyApp/scripts/bazi-health-monitor.sh
#

set -e

# Configuration
OLLAMA_HOST="${OLLAMA_HOST:-http://10.0.1.147:11434}"
OLLAMA_SSH_HOST="${OLLAMA_SSH_HOST:-nazmin@10.0.1.147}"  # SSH to AI server for restart
API_BASE="${API_BASE:-http://localhost:8000}"
LOG_FILE="${HOME}/logs/bazi/health-monitor.log"
APP_SECRET="${APP_SECRET:-f4cea590d9ecc1637862dea3643f8f1bfe5cd458c6b8e8ee2865646b8beafc30}"
MAX_LOG_LINES=2000

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Generate request signature for API calls
generate_signature() {
    local timestamp="$1"
    echo -n "${timestamp}${APP_SECRET}" | sha256sum | cut -d' ' -f1
}

# Report status to backend dashboard
report_to_backend() {
    local service="$1"
    local status="$2"
    local message="$3"

    local timestamp
    timestamp=$(date +%s)
    local signature
    signature=$(generate_signature "$timestamp")

    local payload
    payload=$(cat <<EOF
{
    "service": "$service",
    "status": "$status",
    "message": "$message",
    "host": "$(hostname)",
    "timestamp": "$(date -Iseconds)"
}
EOF
)

    curl -s -X POST "${API_BASE}/admin/system/health-report" \
        -H "Content-Type: application/json" \
        -H "X-Timestamp: $timestamp" \
        -H "X-App-Signature: $signature" \
        -d "$payload" \
        --connect-timeout 10 \
        --max-time 30 || log "WARN" "Failed to report to backend"
}

# Check if Ollama is healthy
check_ollama() {
    local response
    if response=$(curl -s -f --connect-timeout 10 --max-time 30 "${OLLAMA_HOST}/api/tags" 2>/dev/null); then
        if echo "$response" | grep -q "models"; then
            return 0
        fi
    fi
    return 1
}

# Restart Ollama service (on remote AI server via SSH)
restart_ollama() {
    log "WARN" "Attempting to restart Ollama on AI server via SSH..."

    # SSH to AI server and restart Ollama
    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$OLLAMA_SSH_HOST" "pkill -f 'ollama serve' 2>/dev/null; sleep 2; nohup ollama serve > /dev/null 2>&1 &" 2>/dev/null; then
        log "INFO" "Sent restart command to AI server"
    else
        log "ERROR" "Failed to SSH to AI server for Ollama restart"
        return 1
    fi

    # Wait for Ollama to come up
    sleep 15

    if check_ollama; then
        log "INFO" "Ollama successfully restarted and responding"
        report_to_backend "ollama" "recovered" "Ollama restarted successfully"
        return 0
    else
        log "ERROR" "Ollama still not responding after restart"
        return 1
    fi
}

# Get current date info
get_today() {
    date +%Y-%m-%d
}

get_week_start() {
    # Monday of current week
    date -d "last monday" +%Y-%m-%d 2>/dev/null || date -d "monday - 7 days" +%Y-%m-%d
}

get_month_start() {
    date +%Y-%m-01
}

get_current_year() {
    date +%Y
}

# Check if readings exist via API
check_readings_exist() {
    local reading_type="$1"
    local timestamp
    timestamp=$(date +%s)
    local signature
    signature=$(generate_signature "$timestamp")

    local response
    response=$(curl -s -f "${API_BASE}/admin/scheduler/check-readings?type=${reading_type}" \
        -H "X-Timestamp: $timestamp" \
        -H "X-App-Signature: $signature" \
        --connect-timeout 10 \
        --max-time 30 2>/dev/null) || return 1

    # Check if response indicates readings exist
    if echo "$response" | grep -q '"complete":true'; then
        return 0
    fi
    return 1
}

# Trigger job recovery via API
trigger_job_recovery() {
    local job_type="$1"
    local timestamp
    timestamp=$(date +%s)
    local signature
    signature=$(generate_signature "$timestamp")

    log "INFO" "Triggering $job_type job recovery..."

    local response
    response=$(curl -s -X POST "${API_BASE}/admin/scheduler/trigger-${job_type}" \
        -H "Content-Type: application/json" \
        -H "X-Timestamp: $timestamp" \
        -H "X-App-Signature: $signature" \
        --connect-timeout 10 \
        --max-time 300 2>/dev/null)

    if echo "$response" | grep -q '"success":true'; then
        log "INFO" "$job_type job recovery triggered successfully"
        report_to_backend "scheduler_${job_type}" "recovered" "Job triggered by health monitor"
        return 0
    else
        log "ERROR" "Failed to trigger $job_type job recovery"
        report_to_backend "scheduler_${job_type}" "critical" "Failed to trigger job recovery"
        return 1
    fi
}

# Check if we're within the expected job window
is_within_job_window() {
    local job_type="$1"
    local hour
    hour=$(date +%H)
    local day_of_week
    day_of_week=$(date +%u)  # 1=Monday, 7=Sunday
    local day_of_month
    day_of_month=$(date +%d)
    local month
    month=$(date +%m)

    case "$job_type" in
        "daily")
            # Daily job runs at 00:05, check between 00:10 and 06:00
            [[ $hour -ge 0 && $hour -lt 6 ]]
            ;;
        "weekly")
            # Weekly job runs Sunday 23:00, check Monday between 00:00 and 06:00
            [[ $day_of_week -eq 1 && $hour -lt 6 ]]
            ;;
        "monthly")
            # Monthly job runs 1st at 01:00, check 1st between 02:00 and 12:00
            [[ $day_of_month -eq "01" && $hour -ge 2 && $hour -lt 12 ]]
            ;;
        "yearly")
            # Yearly job runs Jan 1st at 02:00, check Jan 1st between 03:00 and 12:00
            [[ $month -eq "01" && $day_of_month -eq "01" && $hour -ge 3 && $hour -lt 12 ]]
            ;;
        *)
            return 1
            ;;
    esac
}

# Main execution
main() {
    log "INFO" "Starting BaZi health check..."

    # 1. Check Ollama health
    if check_ollama; then
        log "INFO" "Ollama is healthy"
        report_to_backend "ollama" "healthy" "Ollama responding normally"
    else
        log "ERROR" "Ollama is NOT responding!"
        report_to_backend "ollama" "down" "Ollama not responding, attempting restart"

        if ! restart_ollama; then
            # Try once more after a longer wait
            sleep 30
            if check_ollama; then
                log "INFO" "Ollama recovered after delayed restart"
                report_to_backend "ollama" "recovered" "Ollama recovered after delayed restart"
            else
                log "ERROR" "Ollama failed to restart - manual intervention required!"
                report_to_backend "ollama" "critical" "Ollama failed to restart - manual intervention required"
            fi
        fi
    fi

    # 2. Check scheduled job completions (only if Ollama is healthy and within time windows)
    if check_ollama; then
        # Check daily readings (between midnight and 6am)
        if is_within_job_window "daily"; then
            if ! check_readings_exist "daily"; then
                log "WARN" "Daily readings incomplete, triggering recovery..."
                trigger_job_recovery "daily"
            else
                log "INFO" "Daily readings complete"
            fi
        fi

        # Check weekly readings (Monday morning after Sunday job)
        if is_within_job_window "weekly"; then
            if ! check_readings_exist "weekly"; then
                log "WARN" "Weekly readings incomplete, triggering recovery..."
                trigger_job_recovery "weekly"
            else
                log "INFO" "Weekly readings complete"
            fi
        fi

        # Check monthly readings (1st of month after job runs)
        if is_within_job_window "monthly"; then
            if ! check_readings_exist "monthly"; then
                log "WARN" "Monthly readings incomplete, triggering recovery..."
                trigger_job_recovery "monthly"
            else
                log "INFO" "Monthly readings complete"
            fi
        fi

        # Check yearly readings (Jan 1st after job runs)
        if is_within_job_window "yearly"; then
            if ! check_readings_exist "yearly"; then
                log "WARN" "Yearly readings incomplete, triggering recovery..."
                trigger_job_recovery "yearly"
            else
                log "INFO" "Yearly readings complete"
            fi
        fi
    fi

    log "INFO" "Health check complete"

    # Trim log file if too large
    if [[ -f "$LOG_FILE" ]]; then
        tail -n "$MAX_LOG_LINES" "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
    fi
}

# Run main
main "$@"
