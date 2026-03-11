$procs = Get-Process | Where-Object { $_.ProcessName -eq 'Engine.Worker' }
if ($procs) {
    $procs | ForEach-Object {
        Write-Host "Stopping worker PID $($_.Id) at $($_.Path)"
        Stop-Process -Id $_.Id -Force
    }
    Write-Host "All workers stopped."
} else {
    Write-Host "No worker processes found."
}
