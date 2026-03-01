<#
.SYNOPSIS
    Compare files between Win11 and Mac without copying.

.DESCRIPTION
    Shows which files differ between local Win11 and Mac.
    Indicates which version is newer.
    Does NOT copy any files - read-only comparison.

.EXAMPLE
    .\Compare-WithMac.ps1

.EXAMPLE
    .\Compare-WithMac.ps1 -Path "BaziMobileApp\src\api"  # Compare specific folder
#>

param(
    [string]$BasePath = "I:\2026CodeProjects\BaZi\iOS\BaziMobileApp",
    [string]$Path = "",  # Optional subfolder to compare
    [string]$MacUser = "mark lombardi",
    [string]$MacIP = "10.0.0.143",
    [string]$MacBasePath = "~/Documents/BaziMobileApp"
)

# Folders to exclude
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

# Determine source path
if ($Path) {
    $SourcePath = Join-Path $BasePath $Path
    $MacComparePath = "$MacBasePath/$($Path.Replace('\', '/'))"
} else {
    $SourcePath = $BasePath
    $MacComparePath = $MacBasePath
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  FILE COMPARISON: Win11 vs Mac" -ForegroundColor Cyan
Write-Host "  $(Get-Date)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Win11: $SourcePath" -ForegroundColor Yellow
Write-Host "Mac:   ${MacUser}@${MacIP}:${MacComparePath}" -ForegroundColor Yellow
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

# Get local files
Write-Host "Scanning local files..." -ForegroundColor Cyan

$LocalFiles = Get-ChildItem -Path $SourcePath -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    $relativePath = $_.FullName.Substring($BasePath.Length + 1)
    $excluded = $false

    foreach ($folder in $ExcludeFolders) {
        if ($relativePath -like "$folder\*" -or $relativePath -like "*\$folder\*") {
            $excluded = $true
            break
        }
    }

    -not $excluded
}

Write-Host "  Found $($LocalFiles.Count) local files" -ForegroundColor Green
Write-Host ""
Write-Host "Comparing files (this may take a moment)..." -ForegroundColor Cyan
Write-Host ""

# Categories
$FilesIdentical = @()
$FilesNewerLocal = @()
$FilesNewerMac = @()
$FilesOnlyLocal = @()
$FilesOnlyMac = @()

# Track local files for later Mac-only check
$LocalRelativePaths = @()

foreach ($file in $LocalFiles) {
    $relativePath = $file.FullName.Substring($BasePath.Length + 1).Replace("\", "/")
    $LocalRelativePaths += $relativePath

    $macFilePath = "${MacBasePath}/${relativePath}"

    # Get Mac file stat
    $macStat = ssh "${MacUser}@${MacIP}" "stat -f '%m' `"$macFilePath`" 2>/dev/null || echo 'NOTFOUND'"

    if ($macStat -eq "NOTFOUND") {
        $FilesOnlyLocal += $relativePath
    } else {
        $localEpoch = [int][double]::Parse((Get-Date $file.LastWriteTime -UFormat %s))
        $macEpoch = [int]$macStat

        $diff = $localEpoch - $macEpoch

        if ([Math]::Abs($diff) -lt 2) {
            # Within 2 seconds = identical
            $FilesIdentical += $relativePath
        } elseif ($diff -gt 0) {
            $FilesNewerLocal += @{
                Path = $relativePath
                LocalTime = $file.LastWriteTime
                Diff = $diff
            }
        } else {
            $FilesNewerMac += @{
                Path = $relativePath
                LocalTime = $file.LastWriteTime
                Diff = [Math]::Abs($diff)
            }
        }
    }
}

# Check for Mac-only files (files on Mac not on Win11)
# This is expensive so we'll just check src folder
Write-Host "Checking for Mac-only files in src/..." -ForegroundColor Cyan
$macFiles = ssh "${MacUser}@${MacIP}" "find `"${MacBasePath}/src`" -type f 2>/dev/null | head -500"
if ($macFiles) {
    $macFileList = $macFiles -split "`n"
    foreach ($macFile in $macFileList) {
        if ($macFile) {
            $macRelative = $macFile.Replace("${MacBasePath}/", "").Replace("$MacBasePath/", "")
            # Normalize path
            $macRelative = $macRelative -replace "^~/Documents/BaziMobileApp/", ""

            if ($macRelative -and $LocalRelativePaths -notcontains $macRelative) {
                $FilesOnlyMac += $macRelative
            }
        }
    }
}

# Display Results
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  COMPARISON RESULTS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Summary counts
Write-Host "SUMMARY:" -ForegroundColor White
Write-Host "  Identical:      $($FilesIdentical.Count)" -ForegroundColor Green
Write-Host "  Newer on Win11: $($FilesNewerLocal.Count)" -ForegroundColor Yellow
Write-Host "  Newer on Mac:   $($FilesNewerMac.Count)" -ForegroundColor Magenta
Write-Host "  Only on Win11:  $($FilesOnlyLocal.Count)" -ForegroundColor Cyan
Write-Host "  Only on Mac:    $($FilesOnlyMac.Count)" -ForegroundColor Red
Write-Host ""

# Details
if ($FilesNewerLocal.Count -gt 0) {
    Write-Host "NEWER ON WIN11 (should sync TO Mac):" -ForegroundColor Yellow
    foreach ($f in $FilesNewerLocal) {
        $mins = [Math]::Round($f.Diff / 60, 1)
        Write-Host "  >> $($f.Path) (Win11 is ${mins}m newer)" -ForegroundColor Yellow
    }
    Write-Host ""
}

if ($FilesNewerMac.Count -gt 0) {
    Write-Host "NEWER ON MAC (should sync FROM Mac or keep Mac version):" -ForegroundColor Magenta
    foreach ($f in $FilesNewerMac) {
        $mins = [Math]::Round($f.Diff / 60, 1)
        Write-Host "  << $($f.Path) (Mac is ${mins}m newer)" -ForegroundColor Magenta
    }
    Write-Host ""
}

if ($FilesOnlyLocal.Count -gt 0) {
    Write-Host "ONLY ON WIN11 (new files to sync to Mac):" -ForegroundColor Cyan
    foreach ($f in $FilesOnlyLocal) {
        Write-Host "  + $f" -ForegroundColor Cyan
    }
    Write-Host ""
}

if ($FilesOnlyMac.Count -gt 0) {
    Write-Host "ONLY ON MAC (files Mac has that Win11 doesn't):" -ForegroundColor Red
    foreach ($f in $FilesOnlyMac) {
        Write-Host "  ! $f" -ForegroundColor Red
    }
    Write-Host ""
}

# Recommendations
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  RECOMMENDATIONS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if ($FilesNewerLocal.Count -gt 0 -and $FilesNewerMac.Count -eq 0) {
    Write-Host "Safe to run: .\Sync-ToMac.ps1" -ForegroundColor Green
} elseif ($FilesNewerMac.Count -gt 0) {
    Write-Host "WARNING: Mac has newer files!" -ForegroundColor Red
    Write-Host "Review the files above. You may want to:" -ForegroundColor Yellow
    Write-Host "  1. Copy Mac changes to Win11 first" -ForegroundColor White
    Write-Host "  2. Or use Sync-SingleFile.ps1 for specific files" -ForegroundColor White
} else {
    Write-Host "Files are in sync!" -ForegroundColor Green
}

Write-Host ""
