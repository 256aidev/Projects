<#
.SYNOPSIS
    Smart sync BaZi project to Mac - only copies changed files.

.DESCRIPTION
    Compares files between Win11 and Mac, shows what will change,
    and prompts for confirmation before copying.
    Excludes node_modules, venv, __pycache__, .expo, android folders.

.EXAMPLE
    .\Sync-ToMac.ps1

.EXAMPLE
    .\Sync-ToMac.ps1 -Force  # Skip confirmation prompt
#>

param(
    [string]$SourcePath = "I:\2026CodeProjects\BaZi\temp delete\BaziMobileApp",
    [string]$MacUser = "mark lombardi",
    [string]$MacIP = "10.0.0.143",
    [string]$MacDestPath = "~/projects/bazi/BaziMobileApp",
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
    "ios"  # iOS native folder is large and rebuilt by pod install
)

$ExcludeExtensions = @(
    ".log",
    ".tmp",
    ".lock"
)

# Start
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SMART SYNC TO MAC" -ForegroundColor Cyan
Write-Host "  $(Get-Date)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Source:      $SourcePath" -ForegroundColor Yellow
Write-Host "Destination: ${MacUser}@${MacIP}:${MacDestPath}" -ForegroundColor Yellow
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
    Write-Host "Make sure Remote Login is enabled on Mac and you've connected before." -ForegroundColor Red
    Write-Host "Try: ssh `"${MacUser}@${MacIP}`"" -ForegroundColor Yellow
    exit 1
}
Write-Host "  SSH connection OK" -ForegroundColor Green
Write-Host ""

# Get list of local files (excluding specified folders)
Write-Host "Scanning local files..." -ForegroundColor Cyan

$LocalFiles = Get-ChildItem -Path $SourcePath -Recurse -File | Where-Object {
    $relativePath = $_.FullName.Substring($SourcePath.Length + 1)
    $excluded = $false

    # Check if in excluded folder
    foreach ($folder in $ExcludeFolders) {
        if ($relativePath -like "$folder\*" -or $relativePath -like "*\$folder\*") {
            $excluded = $true
            break
        }
    }

    # Check extension
    if (-not $excluded) {
        foreach ($ext in $ExcludeExtensions) {
            if ($_.Extension -eq $ext) {
                $excluded = $true
                break
            }
        }
    }

    -not $excluded
}

Write-Host "  Found $($LocalFiles.Count) files to check" -ForegroundColor Green
Write-Host ""

# Compare with Mac and build list of files to sync
Write-Host "Comparing with Mac (this may take a moment)..." -ForegroundColor Cyan

$FilesToSync = @()
$FilesNew = @()
$FilesUpdated = @()

foreach ($file in $LocalFiles) {
    $relativePath = $file.FullName.Substring($SourcePath.Length + 1).Replace("\", "/")
    $macFilePath = "${MacDestPath}/${relativePath}"

    # Check if file exists on Mac and get its timestamp
    $macStat = ssh "${MacUser}@${MacIP}" "stat -f '%m' `"$macFilePath`" 2>/dev/null || echo 'NOTFOUND'"

    if ($macStat -eq "NOTFOUND") {
        $FilesToSync += @{
            LocalPath = $file.FullName
            RelativePath = $relativePath
            Status = "NEW"
        }
        $FilesNew += $relativePath
    } else {
        # Compare timestamps (Mac returns Unix epoch, convert local to epoch)
        $localEpoch = [int][double]::Parse((Get-Date $file.LastWriteTime -UFormat %s))
        $macEpoch = [int]$macStat

        if ($localEpoch -gt $macEpoch) {
            $FilesToSync += @{
                LocalPath = $file.FullName
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
    Write-Host "No files need syncing - Mac is up to date!" -ForegroundColor Green
    exit 0
}

Write-Host "Files to sync: $($FilesToSync.Count)" -ForegroundColor Yellow
Write-Host ""

if ($FilesNew.Count -gt 0) {
    Write-Host "NEW FILES ($($FilesNew.Count)):" -ForegroundColor Green
    foreach ($f in $FilesNew) {
        Write-Host "  + $f" -ForegroundColor Green
    }
    Write-Host ""
}

if ($FilesUpdated.Count -gt 0) {
    Write-Host "UPDATED FILES ($($FilesUpdated.Count)):" -ForegroundColor Yellow
    foreach ($f in $FilesUpdated) {
        Write-Host "  ~ $f" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Confirmation
if (-not $Force -and -not $DryRun) {
    Write-Host "============================================" -ForegroundColor Cyan
    $confirm = Read-Host "Proceed with sync? (Y/N)"
    if ($confirm -ne "Y" -and $confirm -ne "y") {
        Write-Host "Sync cancelled." -ForegroundColor Red
        exit 0
    }
    Write-Host ""
}

if ($DryRun) {
    Write-Host "[DRY RUN] Would sync $($FilesToSync.Count) files" -ForegroundColor Magenta
    exit 0
}

# Perform sync
Write-Host "Syncing files..." -ForegroundColor Cyan
$successCount = 0
$failCount = 0

foreach ($item in $FilesToSync) {
    $relativePath = $item.RelativePath
    $localPath = $item.LocalPath
    $macFilePath = "${MacDestPath}/${relativePath}"
    $macDir = Split-Path $macFilePath -Parent

    # Create directory on Mac if needed
    ssh "${MacUser}@${MacIP}" "mkdir -p `"$macDir`"" 2>$null

    # Copy file
    $scpResult = scp "$localPath" "${MacUser}@${MacIP}:`"$macFilePath`"" 2>&1

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
Write-Host "  SYNC COMPLETE!" -ForegroundColor Green
Write-Host "  $(Get-Date)" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Synced:  $successCount files" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "Failed:  $failCount files" -ForegroundColor Red
}
Write-Host ""
Write-Host "Next steps on Mac:" -ForegroundColor Cyan
Write-Host "  cd ~/Documents/BaziMobileApp" -ForegroundColor White
Write-Host "  npx expo start --clear" -ForegroundColor White
Write-Host ""
