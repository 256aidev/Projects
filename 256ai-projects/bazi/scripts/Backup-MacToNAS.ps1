<#
.SYNOPSIS
    Backup Mac's BaziMobileApp directly to NAS.

.DESCRIPTION
    Pulls files from Mac and creates a timestamped backup on the NAS.
    Useful for backing up Mac work before syncing to Win11.

.EXAMPLE
    .\Backup-MacToNAS.ps1
#>

param(
    [string]$MacUser = "mark lombardi",
    [string]$MacIP = "10.0.0.143",
    [string]$MacSourcePath = "~/Documents/BaziMobileApp",
    [string]$NASBasePath = "\\10.0.1.198\home\Projects\Bazi\backups",
    [int]$KeepBackups = 10
)

# Folders to exclude
$ExcludeFolders = @(
    "node_modules",
    ".expo",
    "android",
    "__pycache__",
    ".git",
    "build",
    "dist"
)

$Timestamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$BackupPath = Join-Path $NASBasePath "mac_$Timestamp"

# Start
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  BACKUP MAC TO NAS" -ForegroundColor Cyan
Write-Host "  Started: $(Get-Date)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Source:      ${MacUser}@${MacIP}:${MacSourcePath}" -ForegroundColor Yellow
Write-Host "Destination: $BackupPath" -ForegroundColor Yellow
Write-Host ""

# Test SSH connection
Write-Host "Testing SSH connection to Mac..." -ForegroundColor Cyan
$sshTest = ssh -o ConnectTimeout=5 -o BatchMode=yes "${MacUser}@${MacIP}" "echo OK" 2>&1
if ($sshTest -ne "OK") {
    Write-Host "ERROR: Cannot connect to Mac via SSH" -ForegroundColor Red
    exit 1
}
Write-Host "  SSH connection OK" -ForegroundColor Green

# Test NAS connectivity
Write-Host "Testing NAS connection..." -ForegroundColor Cyan
if (-not (Test-Path $NASBasePath -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Cannot access NAS at $NASBasePath" -ForegroundColor Red
    exit 1
}
Write-Host "  NAS connection OK" -ForegroundColor Green
Write-Host ""

# Create backup directory
New-Item -Path $BackupPath -ItemType Directory -Force | Out-Null
$MobileAppBackup = Join-Path $BackupPath "BaziMobileApp"
New-Item -Path $MobileAppBackup -ItemType Directory -Force | Out-Null

Write-Host "Created backup folder: $BackupPath" -ForegroundColor Green
Write-Host ""

# Get list of files on Mac
Write-Host "Scanning Mac files..." -ForegroundColor Cyan

$excludeArgs = ($ExcludeFolders | ForEach-Object { "-not -path '*/$_/*'" }) -join " "
$findCmd = "find `"$MacSourcePath`" -type f $excludeArgs 2>/dev/null | grep -v '/ios/'"

$macFileList = ssh "${MacUser}@${MacIP}" $findCmd
$macFiles = $macFileList -split "`n" | Where-Object { $_ }

Write-Host "  Found $($macFiles.Count) files to backup" -ForegroundColor Green
Write-Host ""

# Copy files
Write-Host "Copying files from Mac to NAS..." -ForegroundColor Cyan
$successCount = 0
$failCount = 0

foreach ($macFile in $macFiles) {
    if (-not $macFile) { continue }

    # Get relative path
    $relativePath = $macFile -replace "^.*BaziMobileApp/", ""
    $destPath = Join-Path $MobileAppBackup $relativePath.Replace("/", "\")

    # Create directory if needed
    $destDir = Split-Path $destPath -Parent
    if (-not (Test-Path $destDir)) {
        New-Item -Path $destDir -ItemType Directory -Force | Out-Null
    }

    # Copy file
    scp "${MacUser}@${MacIP}:`"$macFile`"" "$destPath" 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        $successCount++
    } else {
        Write-Host "  FAIL: $relativePath" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "  Copied $successCount files" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "  Failed: $failCount files" -ForegroundColor Red
}

# Calculate backup size
$BackupSize = (Get-ChildItem -Path $BackupPath -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
$BackupSizeMB = [math]::Round($BackupSize / 1MB, 2)

# Cleanup old Mac backups (keep last N)
Write-Host ""
Write-Host "Cleaning up old Mac backups..." -ForegroundColor Cyan

$MacBackups = Get-ChildItem -Path $NASBasePath -Directory | Where-Object { $_.Name -like "mac_*" } | Sort-Object Name -Descending
if ($MacBackups.Count -gt $KeepBackups) {
    $ToDelete = $MacBackups | Select-Object -Skip $KeepBackups
    foreach ($old in $ToDelete) {
        Write-Host "  Removing old backup: $($old.Name)" -ForegroundColor DarkGray
        Remove-Item -Path $old.FullName -Recurse -Force
    }
}

# Summary
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  MAC BACKUP COMPLETE!" -ForegroundColor Green
Write-Host "  Finished: $(Get-Date)" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup Location: $BackupPath" -ForegroundColor Yellow
Write-Host "Backup Size:     $BackupSizeMB MB" -ForegroundColor Yellow
Write-Host "Files Copied:    $successCount" -ForegroundColor Yellow
Write-Host ""

# List current backups
Write-Host "Current backups on NAS:" -ForegroundColor Cyan
Get-ChildItem -Path $NASBasePath -Directory | Sort-Object Name -Descending | ForEach-Object {
    Write-Host "  $($_.Name)" -ForegroundColor White
}
Write-Host ""
