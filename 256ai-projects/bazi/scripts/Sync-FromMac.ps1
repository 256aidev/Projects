<#
.SYNOPSIS
    Pull changed files FROM Mac TO Win11.

.DESCRIPTION
    Compares files between Mac and Win11, shows what will change,
    and prompts for confirmation before copying.
    Use this when Mac has newer changes you want on Win11.

.EXAMPLE
    .\Sync-FromMac.ps1

.EXAMPLE
    .\Sync-FromMac.ps1 -Force  # Skip confirmation prompt
#>

param(
    [string]$DestPath = "I:\2026CodeProjects\BaZi\iOS\BaziMobileApp",
    [string]$MacUser = "mark lombardi",
    [string]$MacIP = "10.0.0.143",
    [string]$MacSourcePath = "~/Documents/BaziMobileApp",
    [switch]$Force,
    [switch]$DryRun
)

# Folders and files to exclude
$ExcludeFolders = @(
    "node_modules",
    ".expo",
    "android",
    "__pycache__",
    ".git",
    "build",
    "dist",
    "ios"
)

# Start
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SYNC FROM MAC TO WIN11" -ForegroundColor Cyan
Write-Host "  $(Get-Date)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Source:      ${MacUser}@${MacIP}:${MacSourcePath}" -ForegroundColor Yellow
Write-Host "Destination: $DestPath" -ForegroundColor Yellow
Write-Host ""

if ($DryRun) {
    Write-Host "[DRY RUN MODE - No files will be copied]" -ForegroundColor Magenta
    Write-Host ""
}

# Test SSH connection
Write-Host "Testing SSH connection to Mac..." -ForegroundColor Cyan
$sshTest = ssh -o ConnectTimeout=5 -o BatchMode=yes "${MacUser}@${MacIP}" "echo OK" 2>&1
if ($sshTest -ne "OK") {
    Write-Host "ERROR: Cannot connect to Mac via SSH" -ForegroundColor Red
    Write-Host "Make sure Remote Login is enabled on Mac." -ForegroundColor Red
    exit 1
}
Write-Host "  SSH connection OK" -ForegroundColor Green
Write-Host ""

# Get list of files on Mac (excluding specified folders)
Write-Host "Scanning Mac files..." -ForegroundColor Cyan

# Build find exclusions
$excludeArgs = ($ExcludeFolders | ForEach-Object { "-not -path '*/$_/*'" }) -join " "
$findCmd = "find `"$MacSourcePath/src`" -type f $excludeArgs 2>/dev/null"

$macFileList = ssh "${MacUser}@${MacIP}" $findCmd
$macFiles = $macFileList -split "`n" | Where-Object { $_ }

Write-Host "  Found $($macFiles.Count) files on Mac" -ForegroundColor Green
Write-Host ""

# Compare with local and build list of files to sync
Write-Host "Comparing with Win11 (this may take a moment)..." -ForegroundColor Cyan

$FilesToSync = @()
$FilesNew = @()
$FilesUpdated = @()

foreach ($macFile in $macFiles) {
    if (-not $macFile) { continue }

    # Get relative path
    $relativePath = $macFile -replace "^.*BaziMobileApp/", ""
    $localPath = Join-Path $DestPath $relativePath.Replace("/", "\")

    # Get Mac file timestamp
    $macStat = ssh "${MacUser}@${MacIP}" "stat -f '%m' `"$macFile`" 2>/dev/null"
    if (-not $macStat) { continue }
    $macEpoch = [int]$macStat

    if (-not (Test-Path $localPath)) {
        $FilesToSync += @{
            MacPath = $macFile
            LocalPath = $localPath
            RelativePath = $relativePath
            Status = "NEW"
        }
        $FilesNew += $relativePath
    } else {
        $localFile = Get-Item $localPath
        $localEpoch = [int][double]::Parse((Get-Date $localFile.LastWriteTime -UFormat %s))

        if ($macEpoch -gt $localEpoch) {
            $FilesToSync += @{
                MacPath = $macFile
                LocalPath = $localPath
                RelativePath = $relativePath
                Status = "UPDATED"
            }
            $FilesUpdated += $relativePath
        }
    }
}

# Display results
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SYNC SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if ($FilesToSync.Count -eq 0) {
    Write-Host "No files need syncing - Win11 is up to date!" -ForegroundColor Green
    exit 0
}

Write-Host "Files to sync FROM Mac: $($FilesToSync.Count)" -ForegroundColor Yellow
Write-Host ""

if ($FilesNew.Count -gt 0) {
    Write-Host "NEW FILES (on Mac, not on Win11) ($($FilesNew.Count)):" -ForegroundColor Green
    foreach ($f in $FilesNew) {
        Write-Host "  + $f" -ForegroundColor Green
    }
    Write-Host ""
}

if ($FilesUpdated.Count -gt 0) {
    Write-Host "UPDATED FILES (Mac is newer) ($($FilesUpdated.Count)):" -ForegroundColor Yellow
    foreach ($f in $FilesUpdated) {
        Write-Host "  << $f" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Confirmation
if (-not $Force -and -not $DryRun) {
    Write-Host "============================================" -ForegroundColor Cyan
    $confirm = Read-Host "Pull these files from Mac? (Y/N)"
    if ($confirm -ne "Y" -and $confirm -ne "y") {
        Write-Host "Sync cancelled." -ForegroundColor Red
        exit 0
    }
    Write-Host ""
}

if ($DryRun) {
    Write-Host "[DRY RUN] Would sync $($FilesToSync.Count) files from Mac" -ForegroundColor Magenta
    exit 0
}

# Perform sync
Write-Host "Syncing files from Mac..." -ForegroundColor Cyan
$successCount = 0
$failCount = 0

foreach ($item in $FilesToSync) {
    $relativePath = $item.RelativePath
    $macPath = $item.MacPath
    $localPath = $item.LocalPath

    # Create local directory if needed
    $localDir = Split-Path $localPath -Parent
    if (-not (Test-Path $localDir)) {
        New-Item -Path $localDir -ItemType Directory -Force | Out-Null
    }

    # Copy file from Mac
    scp "${MacUser}@${MacIP}:`"$macPath`"" "$localPath" 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK: $relativePath" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "  FAIL: $relativePath" -ForegroundColor Red
        $failCount++
    }
}

# Summary
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  SYNC FROM MAC COMPLETE!" -ForegroundColor Green
Write-Host "  $(Get-Date)" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Pulled:  $successCount files from Mac" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "Failed:  $failCount files" -ForegroundColor Red
}
Write-Host ""
