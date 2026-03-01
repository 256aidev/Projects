<#
.SYNOPSIS
    Backs up BaZi project to NAS with timestamped versioning.

.DESCRIPTION
    Creates a timestamped backup of the BaZi project source files to the NAS.
    Excludes node_modules, venv, __pycache__, .expo, android folders.
    Keeps last 10 backups and auto-cleans older ones.

.EXAMPLE
    .\Backup-ToNAS.ps1
#>

param(
    [string]$SourcePath = "I:\2026CodeProjects\BaZi",
    [string]$NASBasePath = "\\10.0.1.198\home\Projects\Bazi\backups",
    [int]$KeepBackups = 10
)

# Create backups folder if it doesn't exist
if (-not (Test-Path $NASBasePath -ErrorAction SilentlyContinue)) {
    $ParentPath = Split-Path $NASBasePath -Parent
    if (Test-Path $ParentPath) {
        New-Item -Path $NASBasePath -ItemType Directory -Force | Out-Null
        Write-Host "Created backups folder: $NASBasePath" -ForegroundColor Green
    }
}

# Configuration
$Timestamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$BackupPath = Join-Path $NASBasePath $Timestamp

# Folders to exclude
$ExcludeFolders = @(
    "node_modules",
    ".expo",
    "android",
    "venv",
    "__pycache__",
    ".git",
    "build",
    "dist"
)

# Start
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  BAZI PROJECT BACKUP TO NAS" -ForegroundColor Cyan
Write-Host "  Started: $(Get-Date)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Source:      $SourcePath" -ForegroundColor Yellow
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
    Write-Host "Created backup folder: $BackupPath" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to create backup folder: $_" -ForegroundColor Red
    exit 1
}

# Build exclusion pattern for robocopy
$ExcludeArgs = ($ExcludeFolders | ForEach-Object { "/XD `"$_`"" }) -join " "

# Define what to backup
$BackupItems = @(
    @{ Source = "BaziMobileApp\src"; Dest = "BaziMobileApp\src" },
    @{ Source = "BaziMobileApp\assets"; Dest = "BaziMobileApp\assets" },
    @{ Source = "BaziMobileApp\app.json"; Dest = "BaziMobileApp" },
    @{ Source = "BaziMobileApp\package.json"; Dest = "BaziMobileApp" },
    @{ Source = "BaziMobileApp\tsconfig.json"; Dest = "BaziMobileApp" },
    @{ Source = "BaziMobileApp\babel.config.js"; Dest = "BaziMobileApp" },
    @{ Source = "iOS\AstrologyApp"; Dest = "iOS\AstrologyApp" }
)

# Copy BaziMobileApp source (now at iOS\BaziMobileApp)
Write-Host ""
Write-Host "Copying iOS/BaziMobileApp..." -ForegroundColor Cyan

$MobileAppSource = Join-Path $SourcePath "iOS\BaziMobileApp"
$MobileAppDest = Join-Path $BackupPath "iOS\BaziMobileApp"

# Use robocopy for folder copy with exclusions
$robocopyArgs = @(
    "`"$MobileAppSource`"",
    "`"$MobileAppDest`"",
    "/E",           # Copy subdirectories including empty
    "/NP",          # No progress
    "/NFL",         # No file list
    "/NDL",         # No directory list
    "/XD node_modules .expo android __pycache__ .git build dist"
)

$robocopyCmd = "robocopy $($robocopyArgs -join ' ')"
Invoke-Expression $robocopyCmd | Out-Null

Write-Host "  iOS/BaziMobileApp copied." -ForegroundColor Green

# Copy iOS/AstrologyApp
Write-Host "Copying iOS/AstrologyApp..." -ForegroundColor Cyan

$AstrologySource = Join-Path $SourcePath "iOS\AstrologyApp"
$AstrologyDest = Join-Path $BackupPath "iOS\AstrologyApp"

$robocopyArgs2 = @(
    "`"$AstrologySource`"",
    "`"$AstrologyDest`"",
    "/E",
    "/NP",
    "/NFL",
    "/NDL",
    "/XD venv __pycache__ .git"
)

$robocopyCmd2 = "robocopy $($robocopyArgs2 -join ' ')"
Invoke-Expression $robocopyCmd2 | Out-Null

Write-Host "  iOS/AstrologyApp copied." -ForegroundColor Green

# Copy admin-dashboard
Write-Host "Copying iOS/admin-dashboard..." -ForegroundColor Cyan

$AdminSource = Join-Path $SourcePath "iOS\admin-dashboard"
$AdminDest = Join-Path $BackupPath "iOS\admin-dashboard"

if (Test-Path $AdminSource) {
    $robocopyArgs3 = @(
        "`"$AdminSource`"",
        "`"$AdminDest`"",
        "/E",
        "/NP",
        "/NFL",
        "/NDL",
        "/XD node_modules dist .git"
    )

    $robocopyCmd3 = "robocopy $($robocopyArgs3 -join ' ')"
    Invoke-Expression $robocopyCmd3 | Out-Null
    Write-Host "  iOS/admin-dashboard copied." -ForegroundColor Green
}

# Copy root documentation files
Write-Host "Copying documentation files..." -ForegroundColor Cyan

$DocFiles = @(
    "CLAUDE_CONTEXT.md",
    "CHANGELOG.md",
    "PROJECT_STATUS.md",
    "CREDENTIALS.md",
    "IOS_TESTING.md",
    "copy-to-mac.bat"
)

foreach ($file in $DocFiles) {
    $srcFile = Join-Path $SourcePath $file
    if (Test-Path $srcFile) {
        Copy-Item $srcFile -Destination $BackupPath -Force
    }
}

Write-Host "  Documentation files copied." -ForegroundColor Green

# Calculate backup size
$BackupSize = (Get-ChildItem -Path $BackupPath -Recurse | Measure-Object -Property Length -Sum).Sum
$BackupSizeMB = [math]::Round($BackupSize / 1MB, 2)

# Cleanup old backups (keep last N)
Write-Host ""
Write-Host "Cleaning up old backups (keeping last $KeepBackups)..." -ForegroundColor Cyan

$AllBackups = Get-ChildItem -Path $NASBasePath -Directory | Sort-Object Name -Descending
if ($AllBackups.Count -gt $KeepBackups) {
    $ToDelete = $AllBackups | Select-Object -Skip $KeepBackups
    foreach ($old in $ToDelete) {
        Write-Host "  Removing old backup: $($old.Name)" -ForegroundColor DarkGray
        Remove-Item -Path $old.FullName -Recurse -Force
    }
}

# Summary
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  BACKUP COMPLETE!" -ForegroundColor Green
Write-Host "  Finished: $(Get-Date)" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup Location: $BackupPath" -ForegroundColor Yellow
Write-Host "Backup Size:     $BackupSizeMB MB" -ForegroundColor Yellow
Write-Host ""

# List current backups
Write-Host "Current backups on NAS:" -ForegroundColor Cyan
Get-ChildItem -Path $NASBasePath -Directory | Sort-Object Name -Descending | ForEach-Object {
    Write-Host "  $($_.Name)" -ForegroundColor White
}
Write-Host ""
