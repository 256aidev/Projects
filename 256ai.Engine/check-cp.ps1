$procs = Get-Process | Where-Object { $_.ProcessName -eq 'Engine.ControlPlane' }
if ($procs) {
    $procs | ForEach-Object { Write-Host "Running: PID=$($_.Id) Path=$($_.Path)" }
} else {
    Write-Host "NOT RUNNING"
}
