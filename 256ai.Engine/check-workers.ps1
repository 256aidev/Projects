Get-Process Engine.Worker -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "PID: $($_.Id) Path: $($_.Path)"
}
