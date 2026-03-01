# AI PC 2 Worker - Connects to 256ai.Engine Control Plane
# Copy this to AI PC 2 and run: powershell -ExecutionPolicy Bypass -File worker-aipc2.ps1

$WorkerId = "worker-aipc2-001"
$ControlPlaneUrl = "http://10.0.1.147:5100"  # MainWin IP
$HeartbeatIntervalSeconds = 20
$Domains = @("general", "compute", "ml")

Write-Host "=========================================="
Write-Host "  AI PC 2 Worker Starting"
Write-Host "  Worker ID: $WorkerId"
Write-Host "  Control Plane: $ControlPlaneUrl"
Write-Host "  Heartbeat: every $HeartbeatIntervalSeconds seconds"
Write-Host "=========================================="

function Send-Heartbeat {
    $body = @{
        workerId = $WorkerId
        status = "OK"
        version = "1.0.0"
        capacity = @{
            maxConcurrent = 5
            currentInflight = 0
            domains = $Domains
        }
    } | ConvertTo-Json -Depth 3

    try {
        $response = Invoke-RestMethod -Uri "$ControlPlaneUrl/health/heartbeat" -Method POST -Body $body -ContentType "application/json"
        Write-Host "$(Get-Date -Format 'HH:mm:ss') Heartbeat sent - OK"
    }
    catch {
        Write-Host "$(Get-Date -Format 'HH:mm:ss') Heartbeat FAILED: $_" -ForegroundColor Red
    }
}

Write-Host "Starting heartbeat loop... (Ctrl+C to stop)"

while ($true) {
    Send-Heartbeat
    Start-Sleep -Seconds $HeartbeatIntervalSeconds
}
