<#
.SYNOPSIS
    Deploy BaZi backend and admin dashboard to production server.

.DESCRIPTION
    Copies the AstrologyApp (FastAPI backend) and admin-dashboard to the
    production server and restarts the service.

.EXAMPLE
    .\Deploy-ToServer.ps1

.EXAMPLE
    .\Deploy-ToServer.ps1 -SkipRestart  # Copy files without restarting service

.EXAMPLE
    .\Deploy-ToServer.ps1 -BackendOnly  # Only deploy backend, skip admin dashboard
#>

param(
    [string]$BackendPath = "I:\2026CodeProjects\BaZi\iOS\AstrologyApp",
    [string]$AdminPath = "I:\2026CodeProjects\BaZi\iOS\admin-dashboard",
    [string]$ServerUser = "nazmin",
    [string]$ServerIP = "10.0.1.76",
    [string]$BackendDestPath = "~/AstrologyApp",
    [string]$AdminDestPath = "~/admin-dashboard",
    [switch]$SkipRestart,
    [switch]$BackendOnly
)

# For backwards compatibility
$SourcePath = $BackendPath
$ServerDestPath = $BackendDestPath

# Folders to exclude from copy
$ExcludeFolders = @(
    "venv",
    "__pycache__",
    ".git",
    "*.db"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DEPLOY TO PRODUCTION SERVER" -ForegroundColor Cyan
Write-Host "  $(Get-Date)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Source:      $SourcePath" -ForegroundColor Yellow
Write-Host "Destination: ${ServerUser}@${ServerIP}:${ServerDestPath}" -ForegroundColor Yellow
Write-Host ""

# Check source exists
if (-not (Test-Path $SourcePath)) {
    Write-Host "ERROR: Source path not found: $SourcePath" -ForegroundColor Red
    exit 1
}

# Test SSH connection
Write-Host "Testing SSH connection to server..." -ForegroundColor Cyan
$sshTest = ssh -o ConnectTimeout=5 -o BatchMode=yes "${ServerUser}@${ServerIP}" "echo OK" 2>&1
if ($sshTest -ne "OK") {
    Write-Host "ERROR: Cannot connect to server via SSH" -ForegroundColor Red
    Write-Host "Try: ssh ${ServerUser}@${ServerIP}" -ForegroundColor Yellow
    exit 1
}
Write-Host "  SSH connection OK" -ForegroundColor Green
Write-Host ""

# Show what will be deployed
Write-Host "Files to deploy:" -ForegroundColor Cyan
$files = Get-ChildItem -Path $SourcePath -Recurse -File | Where-Object {
    $relativePath = $_.FullName.Substring($SourcePath.Length + 1)
    $excluded = $false
    foreach ($folder in $ExcludeFolders) {
        if ($relativePath -like "$folder*" -or $relativePath -like "*\$folder\*" -or $relativePath -like $folder) {
            $excluded = $true
            break
        }
    }
    -not $excluded
}
Write-Host "  $($files.Count) files (excluding venv, __pycache__, .db)" -ForegroundColor Green
Write-Host ""

# Confirm
$confirm = Read-Host "Deploy to production? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Deployment cancelled." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Deploying..." -ForegroundColor Cyan

# Create temp directory for clean copy (excluding venv, etc.)
$tempDir = Join-Path $env:TEMP "bazi_deploy_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null

# Copy files to temp (excluding unwanted)
$robocopyArgs = @(
    "`"$SourcePath`"",
    "`"$tempDir`"",
    "/E",
    "/NP",
    "/NFL",
    "/NDL",
    "/XD venv __pycache__ .git",
    "/XF *.db"
)
$robocopyCmd = "robocopy $($robocopyArgs -join ' ')"
Invoke-Expression $robocopyCmd | Out-Null

Write-Host "  Files staged for deployment" -ForegroundColor Green

# SCP to server
Write-Host "  Copying to server..." -ForegroundColor Cyan
scp -r "$tempDir/*" "${ServerUser}@${ServerIP}:${ServerDestPath}/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: SCP failed" -ForegroundColor Red
    Remove-Item -Path $tempDir -Recurse -Force
    exit 1
}

Write-Host "  Files copied successfully" -ForegroundColor Green

# Clean up temp
Remove-Item -Path $tempDir -Recurse -Force

# Deploy admin dashboard
if (-not $BackendOnly -and (Test-Path $AdminPath)) {
    Write-Host ""
    Write-Host "Deploying admin dashboard..." -ForegroundColor Cyan

    # Create temp for admin dashboard
    $adminTempDir = Join-Path $env:TEMP "bazi_admin_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -Path $adminTempDir -ItemType Directory -Force | Out-Null

    # Copy admin files (excluding node_modules, dist built separately)
    $adminRobocopyArgs = @(
        "`"$AdminPath`"",
        "`"$adminTempDir`"",
        "/E",
        "/NP",
        "/NFL",
        "/NDL",
        "/XD node_modules .git"
    )
    $adminRobocopyCmd = "robocopy $($adminRobocopyArgs -join ' ')"
    Invoke-Expression $adminRobocopyCmd | Out-Null

    Write-Host "  Admin dashboard staged" -ForegroundColor Green

    # Create admin directory on server
    ssh "${ServerUser}@${ServerIP}" "mkdir -p ${AdminDestPath}"

    # SCP admin to server
    Write-Host "  Copying admin dashboard to server..." -ForegroundColor Cyan
    scp -r "$adminTempDir/*" "${ServerUser}@${ServerIP}:${AdminDestPath}/"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Admin dashboard copied successfully" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: Admin dashboard copy may have failed" -ForegroundColor Yellow
    }

    # Clean up
    Remove-Item -Path $adminTempDir -Recurse -Force
}

# Restart service
if (-not $SkipRestart) {
    Write-Host ""
    Write-Host "Restarting bazi-app service..." -ForegroundColor Cyan
    ssh "${ServerUser}@${ServerIP}" "sudo systemctl restart bazi-app"

    Start-Sleep -Seconds 2

    # Check status
    Write-Host "Checking service status..." -ForegroundColor Cyan
    $status = ssh "${ServerUser}@${ServerIP}" "sudo systemctl is-active bazi-app"

    if ($status -eq "active") {
        Write-Host "  Service is running!" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: Service may not be running. Status: $status" -ForegroundColor Yellow
        Write-Host "  Check logs: ssh ${ServerUser}@${ServerIP} 'sudo journalctl -u bazi-app -n 50'" -ForegroundColor Yellow
    }
}

# Test API
Write-Host ""
Write-Host "Testing API..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://${ServerIP}:8000/" -TimeoutSec 5
    Write-Host "  API Response: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "  WARNING: Could not reach API directly. Try via Cloudflare:" -ForegroundColor Yellow
    Write-Host "  curl https://256ai.xyz/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "  $(Get-Date)" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Test the API:" -ForegroundColor Cyan
Write-Host "  curl https://256ai.xyz/" -ForegroundColor White
Write-Host "  curl http://${ServerIP}:8000/" -ForegroundColor White
Write-Host ""

if (-not $BackendOnly -and (Test-Path $AdminPath)) {
    Write-Host "Admin Dashboard deployed to: ${AdminDestPath}" -ForegroundColor Yellow
    Write-Host "To run admin dashboard on server:" -ForegroundColor Cyan
    Write-Host "  ssh ${ServerUser}@${ServerIP}" -ForegroundColor White
    Write-Host "  cd ${AdminDestPath} && npm install && npm run build" -ForegroundColor White
    Write-Host "  # Then serve with nginx or 'npx serve dist'" -ForegroundColor White
    Write-Host ""
}
