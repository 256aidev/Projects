param(
    [int]$TaskCount = 10,
    [string]$Domain = "general",
    [switch]$Burst,
    [int]$TimeoutSec = 300,
    [string]$ControlPlane = "http://10.0.1.147:5100",
    [switch]$DryRun,
    [string]$ProjectId = ""
)

# Generate projectId if not provided
if (-not $ProjectId) {
    $ProjectId = "benchmark-" + (Get-Date -Format "yyyyMMdd-HHmmss")
}

$mode = if ($Burst) { "burst" } else { "sequential" }

Write-Host ""
Write-Host "=== 256ai Engine Benchmark ===" -ForegroundColor Cyan
Write-Host "Tasks:        $TaskCount"
Write-Host "Domain:       $Domain"
Write-Host "Mode:         $mode"
Write-Host "ProjectId:    $ProjectId"
Write-Host "Control Plane: $ControlPlane"
Write-Host ""

# Check workers online
try {
    $workers = Invoke-RestMethod -Uri "$ControlPlane/health/workers" -Method Get -ErrorAction Stop
    $online = @($workers | Where-Object { $_.isOnline -eq $true })
    $domainWorkers = @($online)  # All workers can potentially handle tasks
    Write-Host "Workers online: $($online.Count)" -ForegroundColor Green
    foreach ($w in $online) {
        $role = if ($w.role) { "($($w.role))" } else { "" }
        Write-Host "  $($w.workerId) $role $($w.ipAddress)" -ForegroundColor DarkGray
    }
    Write-Host ""
} catch {
    Write-Host "ERROR: Cannot reach Control Plane at $ControlPlane" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

if ($online.Count -eq 0) {
    Write-Host "WARNING: No workers online. Tasks will stay PENDING." -ForegroundColor Yellow
}

# Submit tasks
Write-Host "Submitting $TaskCount tasks... " -NoNewline
$submitStart = Get-Date
$taskIds = @()

for ($i = 1; $i -le $TaskCount; $i++) {
    $body = @{
        objective = "Benchmark task $i/$TaskCount - respond with 'OK' and nothing else"
        domain = $Domain
        expectedOutputs = "OK"
        projectId = $ProjectId
        executionMode = "auto"
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod -Uri "$ControlPlane/tasks" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
        $taskIds += $result.taskId
    } catch {
        Write-Host ""
        Write-Host "ERROR submitting task $i : $($_.Exception.Message)" -ForegroundColor Red
    }

    # If not burst mode, wait 1 second between submissions
    if (-not $Burst -and $i -lt $TaskCount) {
        Start-Sleep -Milliseconds 500
    }
}

$submitEnd = Get-Date
$submitTime = ($submitEnd - $submitStart).TotalSeconds
Write-Host "done ($([math]::Round($submitTime, 1))s)" -ForegroundColor Green
Write-Host "Task IDs: $($taskIds.Count) submitted" -ForegroundColor DarkGray
Write-Host ""

if ($DryRun) {
    Write-Host "DRY RUN: Not waiting for completion." -ForegroundColor Yellow
    Write-Host "ProjectId: $ProjectId"
    Write-Host "Check results later: GET $ControlPlane/benchmark/$ProjectId"
    exit 0
}

# Wait for completion
Write-Host "Waiting for completion..." -NoNewline
$waitStart = Get-Date
$deadline = $waitStart.AddSeconds($TimeoutSec)
$lastPrint = 0

while ((Get-Date) -lt $deadline) {
    # Fetch all tasks for this project
    $tasks = Invoke-RestMethod -Uri "$ControlPlane/tasks?projectId=$ProjectId&limit=$($TaskCount + 10)" -Method Get -ErrorAction SilentlyContinue

    $completed = @($tasks | Where-Object { $_.status -eq "COMPLETED" }).Count
    $failed = @($tasks | Where-Object { $_.status -eq "FAIL" -or $_.status -eq "CANCELLED" }).Count
    $done = $completed + $failed

    if ($done -ne $lastPrint) {
        Write-Host "`rWaiting for completion... $done/$TaskCount done" -NoNewline
        $lastPrint = $done
    }

    if ($done -ge $taskIds.Count) {
        break
    }

    Start-Sleep -Seconds 2
}

$waitEnd = Get-Date
Write-Host ""
Write-Host ""

# Fetch final results with full detail
$finalTasks = @()
foreach ($tid in $taskIds) {
    try {
        $t = Invoke-RestMethod -Uri "$ControlPlane/tasks/$tid" -Method Get -ErrorAction SilentlyContinue
        $finalTasks += $t
    } catch {}
}

# Calculate metrics
$completedTasks = @($finalTasks | Where-Object { $_.status -eq "COMPLETED" })
$failedTasks = @($finalTasks | Where-Object { $_.status -eq "FAIL" -or $_.status -eq "CANCELLED" })
$pendingTasks = @($finalTasks | Where-Object { $_.status -ne "COMPLETED" -and $_.status -ne "FAIL" -and $_.status -ne "CANCELLED" })

$wallTime = ($waitEnd - $submitStart).TotalSeconds

# Calculate latencies (CreatedAt -> CompletedAt) for completed tasks
$latencies = @()
foreach ($t in $completedTasks) {
    if ($t.completedAt -and $t.createdAt) {
        $created = [DateTimeOffset]::Parse($t.createdAt)
        $completed = [DateTimeOffset]::Parse($t.completedAt)
        $latencyMs = ($completed - $created).TotalMilliseconds
        $latencies += $latencyMs
    }
}

# Sort latencies for percentiles
$latencies = $latencies | Sort-Object

# Per-worker distribution
$workerDist = @{}
foreach ($t in $completedTasks + $failedTasks) {
    $wid = if ($t.assignedWorkerId) { $t.assignedWorkerId } else { "(unassigned)" }
    if (-not $workerDist.ContainsKey($wid)) { $workerDist[$wid] = 0 }
    $workerDist[$wid]++
}

# Execution times from results
$execTimes = @()
foreach ($t in $completedTasks) {
    if ($t.result -and $t.result.executionTimeMs) {
        $execTimes += $t.result.executionTimeMs
    }
}

# Print results
Write-Host "=== RESULTS ===" -ForegroundColor Cyan
Write-Host "ProjectId:    $ProjectId" -ForegroundColor DarkGray
Write-Host ""

$completedPct = if ($taskIds.Count -gt 0) { [math]::Round(($completedTasks.Count / $taskIds.Count) * 100) } else { 0 }
$failedPct = if ($taskIds.Count -gt 0) { [math]::Round(($failedTasks.Count / $taskIds.Count) * 100) } else { 0 }

Write-Host "Completed:    $($completedTasks.Count)/$($taskIds.Count) ($completedPct%)" -ForegroundColor Green
if ($failedTasks.Count -gt 0) {
    Write-Host "Failed:       $($failedTasks.Count)/$($taskIds.Count) ($failedPct%)" -ForegroundColor Red
}
if ($pendingTasks.Count -gt 0) {
    Write-Host "Still pending: $($pendingTasks.Count) (timed out)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Wall time:    $([math]::Round($wallTime, 1))s"
Write-Host "Submit time:  $([math]::Round($submitTime, 1))s"

if ($completedTasks.Count -gt 0) {
    $tps = [math]::Round($completedTasks.Count / $wallTime, 2)
    $tpm = [math]::Round($completedTasks.Count / $wallTime * 60, 1)
    Write-Host "Throughput:   $tps tasks/sec | $tpm tasks/min" -ForegroundColor Cyan
}

if ($latencies.Count -gt 0) {
    Write-Host ""
    Write-Host "--- Latency (submit to complete) ---" -ForegroundColor DarkCyan
    $avgLat = [math]::Round(($latencies | Measure-Object -Average).Average / 1000, 1)
    $minLat = [math]::Round($latencies[0] / 1000, 1)
    $maxLat = [math]::Round($latencies[-1] / 1000, 1)

    # Percentiles
    $p50idx = [math]::Floor($latencies.Count * 0.50)
    $p95idx = [math]::Min([math]::Floor($latencies.Count * 0.95), $latencies.Count - 1)
    $p99idx = [math]::Min([math]::Floor($latencies.Count * 0.99), $latencies.Count - 1)
    $p50 = [math]::Round($latencies[$p50idx] / 1000, 1)
    $p95 = [math]::Round($latencies[$p95idx] / 1000, 1)
    $p99 = [math]::Round($latencies[$p99idx] / 1000, 1)

    Write-Host "  Min:        ${minLat}s"
    Write-Host "  Avg:        ${avgLat}s"
    Write-Host "  P50:        ${p50}s"
    Write-Host "  P95:        ${p95}s"
    Write-Host "  P99:        ${p99}s"
    Write-Host "  Max:        ${maxLat}s"
}

if ($execTimes.Count -gt 0) {
    Write-Host ""
    Write-Host "--- Worker execution time ---" -ForegroundColor DarkCyan
    $avgExec = [math]::Round(($execTimes | Measure-Object -Average).Average / 1000, 1)
    $minExec = [math]::Round(($execTimes | Measure-Object -Minimum).Minimum / 1000, 1)
    $maxExec = [math]::Round(($execTimes | Measure-Object -Maximum).Maximum / 1000, 1)
    Write-Host "  Min:        ${minExec}s"
    Write-Host "  Avg:        ${avgExec}s"
    Write-Host "  Max:        ${maxExec}s"
}

if ($workerDist.Count -gt 0) {
    Write-Host ""
    Write-Host "--- Per-worker distribution ---" -ForegroundColor DarkCyan

    # Look up worker roles
    $workerInfo = @{}
    try {
        $wlist = Invoke-RestMethod -Uri "$ControlPlane/health/workers" -Method Get -ErrorAction SilentlyContinue
        foreach ($w in $wlist) { $workerInfo[$w.workerId] = $w }
    } catch {}

    foreach ($entry in $workerDist.GetEnumerator() | Sort-Object -Property Value -Descending) {
        $wid = $entry.Key
        $count = $entry.Value
        $role = if ($workerInfo[$wid] -and $workerInfo[$wid].role) { "($($workerInfo[$wid].role))" } else { "" }
        $bar = "#" * $count
        Write-Host ("  {0,-30} {1,-15} {2,3} tasks  {3}" -f $wid, $role, $count, $bar)
    }
}

Write-Host ""
Write-Host "=== Benchmark complete ===" -ForegroundColor Cyan
Write-Host ""
