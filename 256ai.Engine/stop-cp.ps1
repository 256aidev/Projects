$procs = Get-Process | Where-Object { $_.ProcessName -eq 'Engine.ControlPlane' }
if ($procs) {
    $procs | ForEach-Object {
        Write-Host "Stopping PID $($_.Id)..."
        Stop-Process -Id $_.Id -Force
    }
    Write-Host "ControlPlane stopped."
} else {
    Write-Host "No ControlPlane process found."
}
