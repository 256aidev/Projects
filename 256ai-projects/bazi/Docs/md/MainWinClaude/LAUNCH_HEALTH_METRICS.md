# Launch Health Metrics Dashboard

## Overview
The Launch Health dashboard provides at-a-glance visibility into system health with color-coded indicators (green/yellow/red) based on predefined thresholds.

## Accessing the Dashboard
1. Login to admin dashboard at `https://256ai.xyz/admin`
2. Navigate to **System Monitoring** page
3. Launch Health cards appear at the top

## Metrics

### P95 Latency
API response time at the 95th percentile over the last 24 hours.

| Status | Threshold | Meaning |
|--------|-----------|---------|
| Green | < 1500ms | Normal performance |
| Yellow | 1500-2500ms | Elevated latency, investigate |
| Red | > 2500ms | High latency, action required |

**Also shows:** p50 and p99 latency values

### Error Rate
Percentage of 5xx server errors out of total requests (24h).

| Status | Threshold | Meaning |
|--------|-----------|---------|
| Green | < 2% | Normal error rate |
| Yellow | 2-5% | Elevated errors, monitor |
| Red | > 5% | High error rate, investigate |

**Also shows:** Total error count and request count

### Rate Limits
Count of 429 (Too Many Requests) responses in the last hour.

| Status | Threshold | Meaning |
|--------|-----------|---------|
| Green | < 10 | Normal traffic |
| Yellow | 10-50 | Elevated rate limiting |
| Red | > 50 | High rate limiting, possible attack or misconfiguration |

### Scheduler
Status of scheduled reading generation jobs.

| Status | Threshold | Meaning |
|--------|-----------|---------|
| Green | 0 job failures | All jobs running normally |
| Yellow | 1 job failure | One job has issues |
| Red | 2+ job failures | Multiple jobs failing, investigate |

**Also shows:** Daily reading generation progress (generated/total)

## API Endpoint
```
GET /admin/launch-health
Authorization: Bearer <admin_token>
```

### Response Example
```json
{
  "latency": {
    "p50_ms": 45,
    "p95_ms": 120,
    "p99_ms": 250,
    "status": "green"
  },
  "errors": {
    "rate_percent": 0.5,
    "count_24h": 12,
    "total_requests_24h": 2400,
    "status": "green"
  },
  "rate_limits": {
    "count_1h": 0,
    "status": "green"
  },
  "scheduler": {
    "jobs": [
      {"job": "daily_readings", "status": "healthy", "last_run": "2026-01-25T00:05:00Z"},
      {"job": "weekly_readings", "status": "healthy", "last_run": "2026-01-19T23:00:00Z"}
    ],
    "readings": {
      "daily": {"generated": 150, "total": 150},
      "weekly": {"generated": 150, "total": 150}
    },
    "failures": 0,
    "status": "green"
  },
  "timestamp": "2026-01-25T12:30:00Z"
}
```

## Troubleshooting

### Red Latency Indicator
1. Check Ollama AI server health
2. Review recent request logs for slow endpoints
3. Check database connection pool
4. Monitor server CPU/memory

### Red Error Rate Indicator
1. Check recent error logs: `journalctl -u bazi-app -n 100`
2. Review request logs filtered by errors in dashboard
3. Check database connectivity
4. Verify Ollama is responding

### Red Rate Limits Indicator
1. Check for DDoS or bot traffic
2. Review IP addresses hitting rate limits
3. Consider adjusting rate limit thresholds if legitimate traffic

### Red Scheduler Indicator
1. Check scheduler logs: `journalctl -u bazi-app | grep scheduler`
2. Verify Ollama is healthy (required for weekly/monthly/yearly)
3. Manually trigger failed jobs via admin endpoints:
   - `POST /admin/scheduler/trigger-daily`
   - `POST /admin/scheduler/trigger-weekly`
   - `POST /admin/scheduler/trigger-monthly`
   - `POST /admin/scheduler/trigger-yearly`

## Data Sources
- **Latency/Errors/Rate Limits:** `request_logs` table
- **Scheduler status:** `system_health_logs` table
- **Reading counts:** `daily_readings`, `weekly_readings` tables

## Auto-Refresh
Dashboard auto-refreshes every 30 seconds when enabled (toggle in top-right).
