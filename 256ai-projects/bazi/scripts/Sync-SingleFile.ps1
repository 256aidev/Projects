<#
.SYNOPSIS
    Safely copy a single file to Mac with backup.

.DESCRIPTION
    Copies a specific file from Win11 to Mac.
    Creates a .bak backup of the Mac version first.

.PARAMETER File
    Relative path from BaZi folder (e.g., "BaziMobileApp\src\api\client.ts")

.PARAMETER NoBackup
    Skip creating backup of Mac version

.EXAMPLE
    .\Sync-SingleFile.ps1 -File "BaziMobileApp\src\api\client.ts"

.EXAMPLE
    .\Sync-SingleFile.ps1 -File "BaziMobileApp\app.json" -NoBackup
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$File,

    [string]$BasePath = "I:\2026CodeProjects\BaZi\iOS",
    [string]$MacUser = "mark lombardi",
    [string]$MacIP = "10.0.0.143",
    [string]$MacBasePath = "~/Documents",
    [switch]$NoBackup
)

# Normalize path
$File = $File.Replace("/", "\")
$LocalFullPath = Join-Path $BasePath $File
$MacRelativePath = $File.Replace("\", "/")

# Determine Mac destination based on file location
if ($File.StartsWith("BaziMobileApp")) {
    $MacDestPath = "$MacBasePath/$MacRelativePath"
} elseif ($File.StartsWith("iOS\AstrologyApp")) {
    # AstrologyApp goes to different location if needed
    $MacDestPath = "$MacBasePath/$MacRelativePath"
} else {
    $MacDestPath = "$MacBasePath/BaZi/$MacRelativePath"
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SINGLE FILE SYNC TO MAC" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check local file exists
if (-not (Test-Path $LocalFullPath)) {
    Write-Host "ERROR: Local file not found: $LocalFullPath" -ForegroundColor Red
    exit 1
}

$localFile = Get-Item $LocalFullPath
Write-Host "Local File:  $LocalFullPath" -ForegroundColor Yellow
Write-Host "Mac Target:  ${MacUser}@${MacIP}:${MacDestPath}" -ForegroundColor Yellow
Write-Host "Size:        $([math]::Round($localFile.Length / 1KB, 2)) KB" -ForegroundColor Yellow
Write-Host "Modified:    $($localFile.LastWriteTime)" -ForegroundColor Yellow
Write-Host ""

# Test SSH connection
Write-Host "Testing SSH connection..." -ForegroundColor Cyan
$sshTest = ssh -o ConnectTimeout=5 -o BatchMode=yes "${MacUser}@${MacIP}" "echo OK" 2>&1
if ($sshTest -ne "OK") {
    Write-Host "ERROR: Cannot connect to Mac via SSH" -ForegroundColor Red
    exit 1
}
Write-Host "  SSH connection OK" -ForegroundColor Green
Write-Host ""

# Check if file exists on Mac
$macExists = ssh "${MacUser}@${MacIP}" "test -f `"$MacDestPath`" && echo EXISTS || echo NOTFOUND"

if ($macExists -eq "EXISTS") {
    Write-Host "Mac file exists - will be overwritten" -ForegroundColor Yellow

    if (-not $NoBackup) {
        # Create backup
        $backupPath = "${MacDestPath}.bak"
        Write-Host "Creating backup: $backupPath" -ForegroundColor Cyan
        ssh "${MacUser}@${MacIP}" "cp `"$MacDestPath`" `"$backupPath`""
        Write-Host "  Backup created" -ForegroundColor Green
    }
} else {
    Write-Host "File does not exist on Mac - will be created" -ForegroundColor Green

    # Create directory if needed
    $macDir = Split-Path $MacDestPath -Parent
    ssh "${MacUser}@${MacIP}" "mkdir -p `"$macDir`""
}

Write-Host ""

# Confirm
$confirm = Read-Host "Proceed with copy? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Red
    exit 0
}

# Copy file
Write-Host ""
Write-Host "Copying file..." -ForegroundColor Cyan

scp "$LocalFullPath" "${MacUser}@${MacIP}:`"$MacDestPath`""

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  FILE COPIED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Copied: $File" -ForegroundColor Green
    Write-Host ""

    if (-not $NoBackup -and $macExists -eq "EXISTS") {
        Write-Host "Backup saved as: ${MacDestPath}.bak" -ForegroundColor Yellow
        Write-Host "To restore: ssh `"${MacUser}@${MacIP}`" `"cp '${MacDestPath}.bak' '${MacDestPath}'`"" -ForegroundColor DarkGray
        Write-Host ""
    }
} else {
    Write-Host ""
    Write-Host "ERROR: Copy failed!" -ForegroundColor Red
    exit 1
}
