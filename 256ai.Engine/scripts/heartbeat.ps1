# Swarm Lead Heartbeat Script
# Sends heartbeat to Control Plane every 30 seconds

$workerId = "worker-mainwin-001"
$controlPlane = "http://10.0.1.147:5100"

while ($true) {
    try {
        $body = @{
            workerId = $workerId
            status = "OK"
            version = "1.0.0"
        } | ConvertTo-Json

        Invoke-RestMethod -Uri "$controlPlane/health/heartbeat" -Method POST -Body $body -ContentType "application/json" -ErrorAction SilentlyContinue | Out-Null
    }
    catch {
        # Silently continue on error
    }

    Start-Sleep -Seconds 30
}
