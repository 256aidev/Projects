<#
.SYNOPSIS
    Full backup of BaZi project to NAS - pulls from Mac + Windows.

.DESCRIPTION
    Creates a timestamped backup including:
    - BaziMobileApp from Mac (via SSH)
    - AstrologyApp from Windows
    - admin-dashboard from Windows
    Keeps last 10 backups.

.EXAMPLE
    .\Backup-Full.ps1
#>

param(
    [string]$NASBasePath = "\\10.0.1.198\home\Projects\Bazi\backups",
    [string]$NASScriptsPath = "\\10.0.1.198\home\Projects\Bazi\Scripts",
    [string]$LocalSourcePath = "I:\2026CodeProjects\BaZi\iOS",
    [string]$LocalScriptsPath = "I:\2026CodeProjects\BaZi\scripts",
    [string]$MacHost = "10.0.0.143",
    [string]$MacUser = "marklombardi",
    [string]$MacAppPath = "~/BaziMobileApp",
    [int]$KeepBackups = 10
)

$ErrorActionPreference = "Stop"

# Configuration
$Timestamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$BackupPath = Join-Path $NASBasePath $Timestamp
$TempPath = Join-Path $env:TEMP "bazi-backup-$Timestamp"

# Start
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  BAZI FULL BACKUP TO NAS" -ForegroundColor Cyan
Write-Host "  Started: $(Get-Date)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Destination: $BackupPath" -ForegroundColor Yellow
Write-Host ""

# Check NAS connectivity
if (-not (Test-Path $NASBasePath -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Cannot access NAS at $NASBasePath" -ForegroundColor Red
    Write-Host "Make sure NAS is online and share is accessible." -ForegroundColor Red
    exit 1
}

# Create backup directory
try {
    New-Item -Path $BackupPath -ItemType Directory -Force | Out-Null
    New-Item -Path $TempPath -ItemType Directory -Force | Out-Null
    Write-Host "Created backup folder: $BackupPath" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to create backup folder: $_" -ForegroundColor Red
    exit 1
}

# ============================================
# 1. BACKUP FROM MAC (BaziMobileApp)
# ============================================
Write-Host ""
Write-Host "[1/4] Backing up BaziMobileApp from Mac..." -ForegroundColor Cyan
Write-Host "      Host: $MacHost" -ForegroundColor DarkGray
Write-Host "      Path: $MacAppPath" -ForegroundColor DarkGray

$MacBackupDest = Join-Path $BackupPath "BaziMobileApp"

try {
    Write-Host "      Copying files from Mac via SCP..." -ForegroundColor DarkGray

    # Copy to temp first, then to NAS (SCP can be slow to network paths)
    $TempMacDest = Join-Path $TempPath "BaziMobileApp"

    # First, run rsync on Mac to a clean temp folder (excludes large folders)
    $prepareCmd = "rm -rf /tmp/BaziBackup && rsync -a --exclude=node_modules --exclude=.expo --exclude=android --exclude='ios/Pods' --exclude=.git ~/BaziMobileApp /tmp/BaziBackup/"
    Write-Host "      Preparing files on Mac..." -ForegroundColor DarkGray
    ssh "${MacUser}@${MacHost}" $prepareCmd

    # Now scp the clean folder to temp (scp creates the folder inside $TempPath)
    Write-Host "      Downloading from Mac..." -ForegroundColor DarkGray
    scp -r "${MacUser}@${MacHost}:/tmp/BaziBackup/BaziMobileApp" "$TempPath"

    if (-not (Test-Path $TempMacDest)) {
        throw "Failed to copy from Mac - folder not found at $TempMacDest"
    }

    # Copy from temp to NAS
    Write-Host "      Copying to NAS..." -ForegroundColor DarkGray
    $robocopyMac = @(
        "`"$TempMacDest`"",
        "`"$MacBackupDest`"",
        "/E", "/NP", "/NFL", "/NDL"
    )
    Invoke-Expression "robocopy $($robocopyMac -join ' ')" | Out-Null

    $MacSize = (Get-ChildItem -Path $MacBackupDest -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $MacSizeMB = [math]::Round($MacSize / 1MB, 2)
    Write-Host "      BaziMobileApp: $MacSizeMB MB" -ForegroundColor Green

} catch {
    Write-Host "      WARNING: Failed to backup from Mac: $_" -ForegroundColor Yellow
    Write-Host "      Continuing with local backups..." -ForegroundColor Yellow
}

# ============================================
# 2. BACKUP AstrologyApp (from Windows)
# ============================================
Write-Host ""
Write-Host "[2/4] Backing up AstrologyApp from Windows..." -ForegroundColor Cyan

$AstrologySource = Join-Path $LocalSourcePath "AstrologyApp"
$AstrologyDest = Join-Path $BackupPath "AstrologyApp"

if (Test-Path $AstrologySource) {
    $robocopyArgs = @(
        "`"$AstrologySource`"",
        "`"$AstrologyDest`"",
        "/E", "/NP", "/NFL", "/NDL",
        "/XD venv __pycache__ .git .pytest_cache"
    )
    $robocopyCmd = "robocopy $($robocopyArgs -join ' ')"
    Invoke-Expression $robocopyCmd | Out-Null

    $AstroSize = (Get-ChildItem -Path $AstrologyDest -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $AstroSizeMB = [math]::Round($AstroSize / 1MB, 2)
    Write-Host "      AstrologyApp: $AstroSizeMB MB" -ForegroundColor Green
} else {
    Write-Host "      WARNING: AstrologyApp not found at $AstrologySource" -ForegroundColor Yellow
}

# ============================================
# 3. BACKUP admin-dashboard (from Windows)
# ============================================
Write-Host ""
Write-Host "[3/4] Backing up admin-dashboard from Windows..." -ForegroundColor Cyan

$AdminSource = Join-Path $LocalSourcePath "admin-dashboard"
$AdminDest = Join-Path $BackupPath "admin-dashboard"

if (Test-Path $AdminSource) {
    $robocopyArgs2 = @(
        "`"$AdminSource`"",
        "`"$AdminDest`"",
        "/E", "/NP", "/NFL", "/NDL",
        "/XD node_modules dist .git build"
    )
    $robocopyCmd2 = "robocopy $($robocopyArgs2 -join ' ')"
    Invoke-Expression $robocopyCmd2 | Out-Null

    $AdminSize = (Get-ChildItem -Path $AdminDest -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $AdminSizeMB = [math]::Round($AdminSize / 1MB, 2)
    Write-Host "      admin-dashboard: $AdminSizeMB MB" -ForegroundColor Green
} else {
    Write-Host "      WARNING: admin-dashboard not found at $AdminSource" -ForegroundColor Yellow
}

# ============================================
# 4. SYNC SCRIPTS TO NAS
# ============================================
Write-Host ""
Write-Host "[4/4] Syncing scripts to NAS..." -ForegroundColor Cyan

if (Test-Path $LocalScriptsPath) {
    $robocopyArgs4 = @(
        "`"$LocalScriptsPath`"",
        "`"$NASScriptsPath`"",
        "/MIR",         # Mirror - sync exactly
        "/NP", "/NFL", "/NDL",
        "/XF *.log"     # Exclude log files
    )
    $robocopyCmd4 = "robocopy $($robocopyArgs4 -join ' ')"
    Invoke-Expression $robocopyCmd4 | Out-Null

    $ScriptsSize = (Get-ChildItem -Path $NASScriptsPath -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $ScriptsSizeMB = [math]::Round($ScriptsSize / 1KB, 2)
    Write-Host "      Scripts synced: $ScriptsSizeMB KB" -ForegroundColor Green
} else {
    Write-Host "      WARNING: Scripts folder not found at $LocalScriptsPath" -ForegroundColor Yellow
}

# ============================================
# CLEANUP
# ============================================
Write-Host ""
Write-Host "Cleaning up temp files..." -ForegroundColor DarkGray
Remove-Item -Path $TempPath -Recurse -Force -ErrorAction SilentlyContinue

# ============================================
# CLEANUP OLD BACKUPS
# ============================================
Write-Host "Cleaning up old backups (keeping last $KeepBackups)..." -ForegroundColor DarkGray

$AllBackups = Get-ChildItem -Path $NASBasePath -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending
if ($AllBackups.Count -gt $KeepBackups) {
    $ToDelete = $AllBackups | Select-Object -Skip $KeepBackups
    foreach ($old in $ToDelete) {
        Write-Host "  Removing: $($old.Name)" -ForegroundColor DarkGray
        Remove-Item -Path $old.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# ============================================
# SUMMARY
# ============================================
$TotalSize = (Get-ChildItem -Path $BackupPath -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
$TotalSizeMB = [math]::Round($TotalSize / 1MB, 2)

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  BACKUP COMPLETE!" -ForegroundColor Green
Write-Host "  Finished: $(Get-Date)" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Location:   $BackupPath" -ForegroundColor Yellow
Write-Host "Total Size: $TotalSizeMB MB" -ForegroundColor Yellow
Write-Host ""

# List contents
Write-Host "Backup contents:" -ForegroundColor Cyan
Get-ChildItem -Path $BackupPath -Directory | ForEach-Object {
    $size = (Get-ChildItem -Path $_.FullName -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $sizeMB = [math]::Round($size / 1MB, 2)
    Write-Host "  $($_.Name) - $sizeMB MB" -ForegroundColor White
}
Write-Host ""

# List all backups on NAS
Write-Host "All backups on NAS:" -ForegroundColor Cyan
Get-ChildItem -Path $NASBasePath -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | ForEach-Object {
    Write-Host "  $($_.Name)" -ForegroundColor White
}
Write-Host ""
