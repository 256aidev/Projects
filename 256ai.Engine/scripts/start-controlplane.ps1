# 256ai Engine Control Plane Startup Script
# Runs at boot via Scheduled Task

$LogFile = "I:\2026CodeProjects\256ai.Engine\logs\controlplane.log"
$ProjectPath = "I:\2026CodeProjects\256ai.Engine"

# Ensure logs directory exists
if (-not (Test-Path "$ProjectPath\logs")) {
    New-Item -ItemType Directory -Path "$ProjectPath\logs" -Force
}

# Log startup
Add-Content -Path $LogFile -Value "$(Get-Date) - Starting Control Plane..."

# Change to project directory and run
Set-Location $ProjectPath
dotnet run --project src/Engine.ControlPlane --urls "http://0.0.0.0:5100" 2>&1 | Tee-Object -FilePath $LogFile -Append
