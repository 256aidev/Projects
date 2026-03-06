param(
    [int[]]$ConcurrencyLevels = @(5, 10, 20, 40, 100),
    [string]$ApiBase = "https://256ai.xyz",
    [int]$RequestsPerUser = 5,
    [switch]$SkipCleanup,
    [switch]$CleanupOnly,
    [int]$TimeoutSec = 60,
    [string]$OllamaHost = "localhost",
    [string]$ApiHost = "10.0.1.76",
    [string]$ApiSshUser = "nazmin",
    [int]$MetricsPollSec = 3,
    [switch]$SkipMetrics,
    [switch]$PreGenerate
)

# ============================================================
# BaZi API Throughput Test
# Runs progressive concurrency tests against the BaZi API.
# Creates test users via /auth/register, authenticates them,
# hits all major endpoints, then cleans up.
# ============================================================

$ErrorActionPreference = "Continue"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# --- App signature for API authentication ---

$AppSecret = "f4cea590d9ecc1637862dea3643f8f1bfe5cd458c6b8e8ee2865646b8beafc30"

function Get-AppSignatureHeaders {
    $timestamp = [Math]::Floor(([DateTimeOffset]::UtcNow).ToUnixTimeSeconds())
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $bytes = [System.Text.Encoding]::UTF8.GetBytes("$timestamp$AppSecret")
    $hash = $sha256.ComputeHash($bytes)
    $signature = -join ($hash | ForEach-Object { $_.ToString("x2") })
    return @{
        "X-Timestamp"     = "$timestamp"
        "X-App-Signature" = $signature
    }
}

# --- System metrics collection ---

$script:MetricsRunning = $false
$script:MetricsJob = $null
$script:MetricsSamples = @()

function Get-OllamaCpu {
    # 256ai is local (or remote Windows machine running Ollama)
    if ($OllamaHost -eq "localhost" -or $OllamaHost -eq "127.0.0.1") {
        try {
            $counter = Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction Stop
            return [Math]::Round($counter.CounterSamples[0].CookedValue, 1)
        } catch { return -1 }
    } else {
        try {
            $result = ssh -o ConnectTimeout=3 -o BatchMode=yes "mark@$OllamaHost" "powershell -Command `"(Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples[0].CookedValue`"" 2>$null
            return [Math]::Round([double]$result, 1)
        } catch { return -1 }
    }
}

function Get-OllamaMemory {
    if ($OllamaHost -eq "localhost" -or $OllamaHost -eq "127.0.0.1") {
        try {
            $os = Get-CimInstance Win32_OperatingSystem
            $usedMB = [Math]::Round(($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / 1024, 0)
            $totalMB = [Math]::Round($os.TotalVisibleMemorySize / 1024, 0)
            return @{ UsedMB = $usedMB; TotalMB = $totalMB; Pct = [Math]::Round(($usedMB / $totalMB) * 100, 1) }
        } catch { return @{ UsedMB = 0; TotalMB = 0; Pct = -1 } }
    } else {
        return @{ UsedMB = 0; TotalMB = 0; Pct = -1 }
    }
}

function Get-ApiServerCpu {
    try {
        $result = ssh -o ConnectTimeout=3 -o BatchMode=yes "$ApiSshUser@$ApiHost" "top -bn1 | grep 'Cpu(s)' | awk '{print `$2 + `$4}'" 2>$null
        return [Math]::Round([double]$result, 1)
    } catch { return -1 }
}

function Get-ApiServerMemory {
    try {
        $result = ssh -o ConnectTimeout=3 -o BatchMode=yes "$ApiSshUser@$ApiHost" "free -m | grep Mem | awk '{print `$3, `$2}'" 2>$null
        $parts = $result -split '\s+'
        if ($parts.Count -ge 2) {
            $usedMB = [int]$parts[0]
            $totalMB = [int]$parts[1]
            return @{ UsedMB = $usedMB; TotalMB = $totalMB; Pct = [Math]::Round(($usedMB / $totalMB) * 100, 1) }
        }
        return @{ UsedMB = 0; TotalMB = 0; Pct = -1 }
    } catch { return @{ UsedMB = 0; TotalMB = 0; Pct = -1 } }
}

function Get-SystemSnapshot {
    return @{
        Timestamp   = Get-Date
        OllamaCpu   = Get-OllamaCpu
        OllamaMem   = Get-OllamaMemory
        ApiCpu      = Get-ApiServerCpu
        ApiMem      = Get-ApiServerMemory
    }
}

function Start-MetricsCollection {
    param([string]$Label)
    if ($SkipMetrics) { return }
    $script:MetricsSamples = [System.Collections.ArrayList]::new()
}

function Add-MetricsSample {
    if ($SkipMetrics) { return }
    $snapshot = Get-SystemSnapshot
    $script:MetricsSamples.Add(@{
        Timestamp    = (Get-Date).ToString("HH:mm:ss")
        OllamaCpu    = $snapshot.OllamaCpu
        OllamaMemPct = $snapshot.OllamaMem.Pct
        OllamaMemMB  = $snapshot.OllamaMem.UsedMB
        ApiCpu       = $snapshot.ApiCpu
        ApiMemPct    = $snapshot.ApiMem.Pct
        ApiMemMB     = $snapshot.ApiMem.UsedMB
    }) | Out-Null
}

function Stop-MetricsCollection {
    if ($SkipMetrics) { return @() }
    # Take one final sample
    Add-MetricsSample
    $samples = @($script:MetricsSamples)
    return $samples
}

function Show-SystemMetrics {
    param([array]$Samples, [string]$Label)
    if ($SkipMetrics -or $Samples.Count -eq 0) { return }

    $ollamaCpuVals = @($Samples | Where-Object { $_.OllamaCpu -ge 0 } | ForEach-Object { $_.OllamaCpu })
    $apiCpuVals    = @($Samples | Where-Object { $_.ApiCpu -ge 0 } | ForEach-Object { $_.ApiCpu })
    $ollamaMemVals = @($Samples | Where-Object { $_.OllamaMemPct -ge 0 } | ForEach-Object { $_.OllamaMemPct })
    $apiMemVals    = @($Samples | Where-Object { $_.ApiMemPct -ge 0 } | ForEach-Object { $_.ApiMemPct })

    Write-Host ""
    Write-Host "    System Metrics ($($Samples.Count) samples @ ${MetricsPollSec}s interval):" -ForegroundColor Magenta

    if ($ollamaCpuVals.Count -gt 0) {
        $avgCpu = [Math]::Round(($ollamaCpuVals | Measure-Object -Average).Average, 1)
        $maxCpu = [Math]::Round(($ollamaCpuVals | Measure-Object -Maximum).Maximum, 1)
        $minCpu = [Math]::Round(($ollamaCpuVals | Measure-Object -Minimum).Minimum, 1)
        Write-Host "      256ai CPU:   avg=$avgCpu%  min=$minCpu%  max=$maxCpu%" -ForegroundColor DarkMagenta
    }

    if ($ollamaMemVals.Count -gt 0) {
        $avgMem = [Math]::Round(($ollamaMemVals | Measure-Object -Average).Average, 1)
        $maxMem = [Math]::Round(($ollamaMemVals | Measure-Object -Maximum).Maximum, 1)
        $lastMemMB = $Samples[-1].OllamaMemMB
        Write-Host "      256ai Mem:   avg=$avgMem%  max=$maxMem%  (${lastMemMB}MB used)" -ForegroundColor DarkMagenta
    }

    if ($apiCpuVals.Count -gt 0) {
        $avgCpu = [Math]::Round(($apiCpuVals | Measure-Object -Average).Average, 1)
        $maxCpu = [Math]::Round(($apiCpuVals | Measure-Object -Maximum).Maximum, 1)
        $minCpu = [Math]::Round(($apiCpuVals | Measure-Object -Minimum).Minimum, 1)
        Write-Host "      API CPU:     avg=$avgCpu%  min=$minCpu%  max=$maxCpu%" -ForegroundColor DarkMagenta
    }

    if ($apiMemVals.Count -gt 0) {
        $avgMem = [Math]::Round(($apiMemVals | Measure-Object -Average).Average, 1)
        $maxMem = [Math]::Round(($apiMemVals | Measure-Object -Maximum).Maximum, 1)
        $lastMemMB = $Samples[-1].ApiMemMB
        Write-Host "      API Mem:     avg=$avgMem%  max=$maxMem%  (${lastMemMB}MB used)" -ForegroundColor DarkMagenta
    }
}

# --- Test user configuration ---

$TestPassword = "TestPass256!"
$EmailDomain  = "test.256ai.xyz"
$EmailPrefix  = "throughput-test"

$Cities = @(
    @{ name = "New York";   lat = 40.7128;  lon = -74.0060 },
    @{ name = "Los Angeles"; lat = 34.0522; lon = -118.2437 },
    @{ name = "Chicago";    lat = 41.8781;  lon = -87.6298 },
    @{ name = "Shanghai";   lat = 31.2304;  lon = 121.4737 },
    @{ name = "Beijing";    lat = 39.9042;  lon = 116.4074 },
    @{ name = "Hong Kong";  lat = 22.3193;  lon = 114.1694 },
    @{ name = "Tokyo";      lat = 35.6762;  lon = 139.6503 },
    @{ name = "Mumbai";     lat = 19.0760;  lon = 72.8777 },
    @{ name = "London";     lat = 51.5074;  lon = -0.1278 },
    @{ name = "Paris";      lat = 48.8566;  lon = 2.3522 },
    @{ name = "Sydney";     lat = -33.8688; lon = 151.2093 },
    @{ name = "Singapore";  lat = 1.3521;   lon = 103.8198 },
    @{ name = "Dubai";      lat = 25.2048;  lon = 55.2708 },
    @{ name = "Toronto";    lat = 43.6532;  lon = -79.3832 },
    @{ name = "Seoul";      lat = 37.5665;  lon = 126.9780 }
)

$FirstNames = @("Emma","Liam","Olivia","Noah","Ava","James","Sophia","Mason",
                "Isabella","Oliver","Mia","Lucas","Charlotte","Elijah","Amelia",
                "Wei","Mei","Chen","Yan","Ming","Raj","Priya","Arun","Devi","Sanjay")

$LastNames = @("Smith","Johnson","Williams","Brown","Jones","Garcia","Miller",
               "Wang","Li","Zhang","Liu","Yang","Patel","Singh","Kumar")

$Tones = @("balanced","gentle","direct","motivational")

function Get-RandomBirthDate {
    $year  = Get-Random -Minimum 1960 -Maximum 2006
    $month = Get-Random -Minimum 1 -Maximum 13
    $day   = Get-Random -Minimum 1 -Maximum 29
    return "{0:D4}-{1:D2}-{2:D2}" -f $year, $month, $day
}

function Get-RandomBirthTime {
    $hour   = Get-Random -Minimum 0 -Maximum 24
    $minute = Get-Random -InputObject @(0, 15, 30, 45)
    return "{0:D2}:{1:D2}:00" -f $hour, $minute
}

function Get-TestUserData {
    param([int]$Index)
    $city = $Cities[$Index % $Cities.Count]
    return @{
        email          = "$EmailPrefix-$Index@$EmailDomain"
        password       = $TestPassword
        name           = "$($FirstNames | Get-Random) $($LastNames | Get-Random)"
        birth_date     = Get-RandomBirthDate
        birth_time     = Get-RandomBirthTime
        birth_longitude = $city.lon
        birth_latitude  = $city.lat
        birth_location  = $city.name
        preferred_tone  = $Tones | Get-Random
        language        = "en"
    }
}

# --- HTTP helpers ---

function Invoke-Api {
    param(
        [string]$Method = "GET",
        [string]$Path,
        [hashtable]$Body = $null,
        [string]$Token = $null
    )

    $uri = "$ApiBase$Path"
    $headers = Get-AppSignatureHeaders
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }

    $params = @{
        Uri             = $uri
        Method          = $Method
        ContentType     = "application/json"
        Headers         = $headers
        UseBasicParsing = $true
        TimeoutSec      = $TimeoutSec
    }

    if ($Body) {
        $params["Body"] = ($Body | ConvertTo-Json -Depth 5)
    }

    $start = Get-Date
    try {
        $response = Invoke-WebRequest @params
        $elapsed = ((Get-Date) - $start).TotalMilliseconds
        return @{
            StatusCode = $response.StatusCode
            Content    = $response.Content
            LatencyMs  = $elapsed
            Success    = $true
            Error      = $null
        }
    } catch {
        $elapsed = ((Get-Date) - $start).TotalMilliseconds
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        return @{
            StatusCode = $statusCode
            Content    = $null
            LatencyMs  = $elapsed
            Success    = $false
            Error      = $_.Exception.Message
        }
    }
}

function Get-Percentile {
    param([double[]]$Values, [double]$Pct)
    if ($Values.Count -eq 0) { return 0 }
    $sorted = $Values | Sort-Object
    $idx = [Math]::Min([Math]::Floor($sorted.Count * $Pct), $sorted.Count - 1)
    return $sorted[$idx]
}

# ============================================================
# PHASE 1: CLEANUP OLD TEST USERS
# ============================================================

function Remove-TestUsers {
    param([array]$Users)

    if ($Users.Count -eq 0) {
        Write-Host "  No test users to clean up." -ForegroundColor DarkGray
        return
    }

    Write-Host "  Deleting $($Users.Count) test users via SQL..." -NoNewline

    # Use direct SQL deletion via SSH (API delete-account doesn't handle all FK tables)
    try {
        $sqlCmd = @"
DELETE FROM chart_readings WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'throughput-test-%@test.256ai.xyz');
DELETE FROM daily_readings WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'throughput-test-%@test.256ai.xyz');
DELETE FROM weekly_readings WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'throughput-test-%@test.256ai.xyz');
DELETE FROM monthly_readings WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'throughput-test-%@test.256ai.xyz');
DELETE FROM yearly_readings WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'throughput-test-%@test.256ai.xyz');
DELETE FROM relationship_daily_readings WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'throughput-test-%@test.256ai.xyz');
DELETE FROM relationship_analyses WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'throughput-test-%@test.256ai.xyz');
DELETE FROM added_persons WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'throughput-test-%@test.256ai.xyz');
DELETE FROM users WHERE email LIKE 'throughput-test-%@test.256ai.xyz';
"@
        $result = ssh -o ConnectTimeout=10 -o BatchMode=yes "$ApiSshUser@$ApiHost" "PGPASSWORD=BaziPass2026 psql -h localhost -U baziuser -d bazidb -c `"$sqlCmd`"" 2>&1
        $usersDeleted = ($result | Select-String "DELETE (\d+)" | Select-Object -Last 1)
        if ($usersDeleted) {
            $count = $usersDeleted.Matches[0].Groups[1].Value
            Write-Host " done ($count users deleted)" -ForegroundColor Green
        } else {
            Write-Host " done" -ForegroundColor Green
        }
    } catch {
        Write-Host " SQL cleanup failed, trying API fallback..." -ForegroundColor Yellow
        $deleted = 0
        $failed  = 0
        foreach ($u in $Users) {
            $email = $u.Email
            if (-not $email) { $email = "$EmailPrefix-$($u.Index)@$EmailDomain" }
            $loginResult = Invoke-Api -Method "POST" -Path "/auth/login" -Body @{
                email    = $email
                password = $TestPassword
            }
            if ($loginResult.Success -and $loginResult.Content) {
                $freshToken = ($loginResult.Content | ConvertFrom-Json).access_token
                $result = Invoke-Api -Method "DELETE" -Path "/auth/delete-account" -Token $freshToken
                if ($result.Success) { $deleted++ } else { $failed++ }
            } else { $failed++ }
        }
        Write-Host " API fallback: $deleted deleted, $failed failed" -ForegroundColor Yellow
    }
}

# ============================================================
# PHASE 2: SEED TEST USERS
# ============================================================

function New-TestUsers {
    param([int]$Count)

    Write-Host ""
    Write-Host "--- Seed Phase ---" -ForegroundColor Cyan
    Write-Host "  Creating $Count test users..."
    $seedStart = Get-Date
    $users = @()

    for ($i = 1; $i -le $Count; $i++) {
        $userData = Get-TestUserData -Index $i
        $result = Invoke-Api -Method "POST" -Path "/auth/register" -Body $userData

        if ($result.Success -and $result.Content) {
            $parsed = $result.Content | ConvertFrom-Json
            $users += @{
                Index   = $i
                Email   = $userData.email
                Token   = $parsed.access_token
                UserId  = $parsed.user_id
            }
            if ($i % 10 -eq 0 -or $i -eq $Count) {
                Write-Host "    [$i/$Count] registered" -ForegroundColor DarkGray
            }
        } else {
            Write-Host "    [$i/$Count] FAILED: $($userData.email) - $($result.Error)" -ForegroundColor Red

            # If email already exists, try to login and delete first
            if ($result.StatusCode -eq 400) {
                $loginResult = Invoke-Api -Method "POST" -Path "/auth/login" -Body @{
                    email    = $userData.email
                    password = $TestPassword
                }
                if ($loginResult.Success -and $loginResult.Content) {
                    $loginParsed = $loginResult.Content | ConvertFrom-Json
                    Invoke-Api -Method "DELETE" -Path "/auth/delete-account" -Token $loginParsed.access_token | Out-Null
                    Write-Host "      Cleaned up existing user, retrying..." -ForegroundColor Yellow

                    # Retry registration
                    $retryResult = Invoke-Api -Method "POST" -Path "/auth/register" -Body $userData
                    if ($retryResult.Success -and $retryResult.Content) {
                        $retryParsed = $retryResult.Content | ConvertFrom-Json
                        $users += @{
                            Index   = $i
                            Email   = $userData.email
                            Token   = $retryParsed.access_token
                            UserId  = $retryParsed.user_id
                        }
                    }
                }
            }
        }
    }

    $seedTime = ((Get-Date) - $seedStart).TotalSeconds
    Write-Host "  Created $($users.Count)/$Count users in $([Math]::Round($seedTime, 1))s" -ForegroundColor Green

    return $users
}

# ============================================================
# PHASE 3: WARM-UP
# ============================================================

function Test-WarmUp {
    param([array]$Users)

    Write-Host ""
    Write-Host "--- Warm-Up Phase ---" -ForegroundColor Cyan
    $ok = 0
    $fail = 0

    foreach ($u in $Users) {
        $result = Invoke-Api -Method "GET" -Path "/auth/me" -Token $u.Token
        if ($result.Success) { $ok++ } else { $fail++ }
    }

    Write-Host "  Auth check: $ok OK, $fail failed" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Yellow" })

    if ($fail -gt 0) {
        Write-Host "  WARNING: Some users failed auth. Results may be affected." -ForegroundColor Yellow
    }
}

# ============================================================
# PHASE 4: THROUGHPUT RUNS
# ============================================================

function Get-EndpointList {
    param([int]$UserId, [string]$Token)

    return @(
        @{ Method = "GET";  Path = "/auth/me";                     NeedsAuth = $true;  Name = "auth/me" },
        @{ Method = "GET";  Path = "/daily/$UserId";               NeedsAuth = $true;  Name = "daily" },
        @{ Method = "GET";  Path = "/weekly/$UserId";              NeedsAuth = $true;  Name = "weekly" },
        @{ Method = "GET";  Path = "/monthly/$UserId";             NeedsAuth = $true;  Name = "monthly" },
        @{ Method = "GET";  Path = "/yearly/$UserId";              NeedsAuth = $true;  Name = "yearly" },
        @{ Method = "GET";  Path = "/chart-reading/$UserId";       NeedsAuth = $true;  Name = "chart" },
        @{ Method = "POST"; Path = "/daily/$UserId/regenerate";    NeedsAuth = $true;  Name = "regen" },
        @{ Method = "GET";  Path = "/pillars";                     NeedsAuth = $false; Name = "pillars" },
        @{ Method = "GET";  Path = "/health";                      NeedsAuth = $false; Name = "health" }
    )
}

function Invoke-ThroughputRound {
    param(
        [array]$Users,
        [int]$Concurrency,
        [int]$RequestsPerUser
    )

    Write-Host ""
    Write-Host "--- Concurrency: $Concurrency ---" -ForegroundColor Cyan

    # Select users for this round (cycle if fewer users than concurrency)
    $activeUsers = @()
    for ($i = 0; $i -lt $Concurrency; $i++) {
        $activeUsers += $Users[$i % $Users.Count]
    }

    # Build request queue
    $requestQueue = @()
    foreach ($u in $activeUsers) {
        $endpoints = Get-EndpointList -UserId $u.UserId -Token $u.Token
        for ($r = 0; $r -lt $RequestsPerUser; $r++) {
            $ep = $endpoints[$r % $endpoints.Count]
            $requestQueue += @{
                UserId   = $u.UserId
                Token    = $u.Token
                Method   = $ep.Method
                Path     = $ep.Path
                Name     = $ep.Name
                NeedsAuth = $ep.NeedsAuth
            }
        }
    }

    $totalRequests = $requestQueue.Count
    Write-Host "  Users: $Concurrency | Requests: $totalRequests | Endpoints: 9"

    # Start system metrics collection
    Start-MetricsCollection -Label "Concurrency-$Concurrency"

    # Execute with runspace pool for true concurrency
    $runspacePool = [RunspaceFactory]::CreateRunspacePool(1, [Math]::Min($Concurrency, 50))
    $runspacePool.Open()

    $scriptBlock = {
        param($ApiBase, $Method, $Path, $Token, $NeedsAuth, $TimeoutSec, $AppSecret)

        # Generate app signature in runspace
        $timestamp = [Math]::Floor(([DateTimeOffset]::UtcNow).ToUnixTimeSeconds())
        $sha256 = [System.Security.Cryptography.SHA256]::Create()
        $bytes = [System.Text.Encoding]::UTF8.GetBytes("$timestamp$AppSecret")
        $hash = $sha256.ComputeHash($bytes)
        $signature = -join ($hash | ForEach-Object { $_.ToString("x2") })

        $uri = "$ApiBase$Path"
        $headers = @{
            "X-Timestamp"     = "$timestamp"
            "X-App-Signature" = $signature
        }
        if ($NeedsAuth -and $Token) { $headers["Authorization"] = "Bearer $Token" }

        $start = Get-Date
        try {
            $params = @{
                Uri             = $uri
                Method          = $Method
                ContentType     = "application/json"
                Headers         = $headers
                UseBasicParsing = $true
                TimeoutSec      = $TimeoutSec
            }
            $response = Invoke-WebRequest @params
            $elapsed = ((Get-Date) - $start).TotalMilliseconds
            return @{
                StatusCode = $response.StatusCode
                LatencyMs  = $elapsed
                Success    = $true
                Error      = $null
            }
        } catch {
            $elapsed = ((Get-Date) - $start).TotalMilliseconds
            $sc = 0
            if ($_.Exception.Response) { $sc = [int]$_.Exception.Response.StatusCode }
            return @{
                StatusCode = $sc
                LatencyMs  = $elapsed
                Success    = $false
                Error      = $_.Exception.Message
            }
        }
    }

    # Launch all requests
    $jobs = @()
    $roundStart = Get-Date

    foreach ($req in $requestQueue) {
        $ps = [PowerShell]::Create().AddScript($scriptBlock).AddArgument($ApiBase).AddArgument($req.Method).AddArgument($req.Path).AddArgument($req.Token).AddArgument($req.NeedsAuth).AddArgument($TimeoutSec).AddArgument($AppSecret)
        $ps.RunspacePool = $runspacePool
        $jobs += @{
            PowerShell = $ps
            Handle     = $ps.BeginInvoke()
            Name       = $req.Name
        }
    }

    # Collect results
    $results = @()
    $completed = 0
    foreach ($job in $jobs) {
        try {
            $output = $job.PowerShell.EndInvoke($job.Handle)
            if ($output -and $output.Count -gt 0) {
                $r = $output[0]
                $results += @{
                    Name       = $job.Name
                    StatusCode = $r.StatusCode
                    LatencyMs  = $r.LatencyMs
                    Success    = $r.Success
                    Error      = $r.Error
                }
            }
        } catch {
            $results += @{
                Name       = $job.Name
                StatusCode = 0
                LatencyMs  = 0
                Success    = $false
                Error      = $_.Exception.Message
            }
        }
        $job.PowerShell.Dispose()
        $completed++

        if ($completed % 25 -eq 0 -or $completed -eq $totalRequests) {
            $elapsed = ((Get-Date) - $roundStart).TotalSeconds
            $rps = if ($elapsed -gt 0) { [Math]::Round($completed / $elapsed, 1) } else { 0 }
            Write-Host "    Progress: $completed/$totalRequests ($rps req/s)" -ForegroundColor DarkGray
            Add-MetricsSample
        }
    }

    $roundTime = ((Get-Date) - $roundStart).TotalSeconds
    $runspacePool.Close()
    $runspacePool.Dispose()

    # Calculate metrics
    $successful = @($results | Where-Object { $_.Success })
    $failed     = @($results | Where-Object { -not $_.Success })
    $latencies  = @($successful | ForEach-Object { $_.LatencyMs })

    $metrics = @{
        Concurrency    = $Concurrency
        TotalRequests  = $totalRequests
        Successful     = $successful.Count
        Failed         = $failed.Count
        SuccessRate    = if ($totalRequests -gt 0) { [Math]::Round(($successful.Count / $totalRequests) * 100, 1) } else { 0 }
        WallTimeSec    = [Math]::Round($roundTime, 1)
        RPS            = if ($roundTime -gt 0) { [Math]::Round($successful.Count / $roundTime, 1) } else { 0 }
    }

    if ($latencies.Count -gt 0) {
        $metrics["AvgMs"]  = [Math]::Round(($latencies | Measure-Object -Average).Average, 0)
        $metrics["MinMs"]  = [Math]::Round(($latencies | Measure-Object -Minimum).Minimum, 0)
        $metrics["MaxMs"]  = [Math]::Round(($latencies | Measure-Object -Maximum).Maximum, 0)
        $metrics["P50Ms"]  = [Math]::Round((Get-Percentile -Values $latencies -Pct 0.50), 0)
        $metrics["P95Ms"]  = [Math]::Round((Get-Percentile -Values $latencies -Pct 0.95), 0)
        $metrics["P99Ms"]  = [Math]::Round((Get-Percentile -Values $latencies -Pct 0.99), 0)
    }

    # Per-endpoint breakdown
    $endpointMetrics = @{}
    foreach ($r in $results) {
        if (-not $endpointMetrics.ContainsKey($r.Name)) {
            $endpointMetrics[$r.Name] = @{ OK = 0; Fail = 0; Latencies = @() }
        }
        if ($r.Success) {
            $endpointMetrics[$r.Name].OK++
            $endpointMetrics[$r.Name].Latencies += $r.LatencyMs
        } else {
            $endpointMetrics[$r.Name].Fail++
        }
    }

    # Error breakdown
    $errorCodes = @{}
    foreach ($r in $failed) {
        $code = if ($r.StatusCode -gt 0) { "$($r.StatusCode)" } else { "timeout/error" }
        if (-not $errorCodes.ContainsKey($code)) { $errorCodes[$code] = 0 }
        $errorCodes[$code]++
    }

    # Print round results
    Write-Host ""
    Write-Host "  Results:" -ForegroundColor White
    Write-Host "    Requests:  $($metrics.Successful)/$($metrics.TotalRequests) ($($metrics.SuccessRate)% success)"
    Write-Host "    Wall time: $($metrics.WallTimeSec)s"
    Write-Host "    RPS:       $($metrics.RPS)" -ForegroundColor Cyan

    if ($metrics.ContainsKey("AvgMs")) {
        Write-Host "    Latency:   avg=$($metrics.AvgMs)ms  P50=$($metrics.P50Ms)ms  P95=$($metrics.P95Ms)ms  P99=$($metrics.P99Ms)ms  max=$($metrics.MaxMs)ms"
    }

    if ($errorCodes.Count -gt 0) {
        $errorStr = ($errorCodes.GetEnumerator() | ForEach-Object { "$($_.Key):$($_.Value)" }) -join ", "
        Write-Host "    Errors:    $errorStr" -ForegroundColor Yellow
    }

    # Per-endpoint table
    Write-Host ""
    Write-Host ("    {0,-12} {1,5} {2,5} {3,8} {4,8} {5,8}" -f "Endpoint", "OK", "Fail", "Avg(ms)", "P95(ms)", "Max(ms)") -ForegroundColor DarkCyan
    Write-Host ("    {0,-12} {1,5} {2,5} {3,8} {4,8} {5,8}" -f "--------", "----", "----", "-------", "-------", "-------")
    foreach ($ep in $endpointMetrics.GetEnumerator() | Sort-Object Key) {
        $lats = $ep.Value.Latencies
        $avg = if ($lats.Count -gt 0) { [Math]::Round(($lats | Measure-Object -Average).Average, 0) } else { 0 }
        $p95 = if ($lats.Count -gt 0) { [Math]::Round((Get-Percentile -Values $lats -Pct 0.95), 0) } else { 0 }
        $max = if ($lats.Count -gt 0) { [Math]::Round(($lats | Measure-Object -Maximum).Maximum, 0) } else { 0 }
        Write-Host ("    {0,-12} {1,5} {2,5} {3,8} {4,8} {5,8}" -f $ep.Key, $ep.Value.OK, $ep.Value.Fail, $avg, $p95, $max)
    }

    # Collect and display system metrics
    $sysSamples = Stop-MetricsCollection
    Show-SystemMetrics -Samples $sysSamples -Label "Concurrency-$Concurrency"

    # Store system metrics in round metrics
    if ($sysSamples -and $sysSamples.Count -gt 0) {
        $ollamaCpuVals = @($sysSamples | Where-Object { $_.OllamaCpu -ge 0 } | ForEach-Object { $_.OllamaCpu })
        $apiCpuVals    = @($sysSamples | Where-Object { $_.ApiCpu -ge 0 } | ForEach-Object { $_.ApiCpu })
        if ($ollamaCpuVals.Count -gt 0) {
            $metrics["OllamaCpuAvg"] = [Math]::Round(($ollamaCpuVals | Measure-Object -Average).Average, 1)
            $metrics["OllamaCpuMax"] = [Math]::Round(($ollamaCpuVals | Measure-Object -Maximum).Maximum, 1)
        }
        if ($apiCpuVals.Count -gt 0) {
            $metrics["ApiCpuAvg"] = [Math]::Round(($apiCpuVals | Measure-Object -Average).Average, 1)
            $metrics["ApiCpuMax"] = [Math]::Round(($apiCpuVals | Measure-Object -Maximum).Maximum, 1)
        }
    }

    return $metrics
}

# ============================================================
# MAIN
# ============================================================

$maxUsers = ($ConcurrencyLevels | Measure-Object -Maximum).Maximum

Write-Host ""
Write-Host "=== BaZi API Throughput Test ===" -ForegroundColor Cyan
Write-Host "API:              $ApiBase"
Write-Host "Concurrency:      $($ConcurrencyLevels -join ', ')"
Write-Host "Max test users:   $maxUsers"
Write-Host "Requests/user:    $RequestsPerUser"
Write-Host "Timeout:          ${TimeoutSec}s"
Write-Host "Metrics:          $(if ($SkipMetrics) { 'Disabled' } else { 'Enabled (poll every ' + $MetricsPollSec + 's)' })"
Write-Host "Pre-generate:     $(if ($PreGenerate) { 'Yes (trigger scheduler jobs first)' } else { 'No (test on-demand generation)' })"
Write-Host "Timestamp:        $(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')"
Write-Host ""

# Health check
Write-Host "--- Pre-flight ---" -ForegroundColor Cyan
$healthResult = Invoke-Api -Method "GET" -Path "/health"
if ($healthResult.Success) {
    Write-Host "  API health: OK ($($healthResult.LatencyMs.ToString('F0'))ms)" -ForegroundColor Green
} else {
    Write-Host "  API health: FAILED - $($healthResult.Error)" -ForegroundColor Red
    Write-Host "  Cannot reach $ApiBase. Aborting." -ForegroundColor Red
    exit 1
}

# Ollama check
try {
    $ollamaUrl = if ($OllamaHost -eq "localhost") { "http://localhost:11434" } else { "http://${OllamaHost}:11434" }
    $ollamaResp = Invoke-WebRequest -Uri "$ollamaUrl/api/ps" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    $ollamaData = $ollamaResp.Content | ConvertFrom-Json
    $loadedModels = if ($ollamaData.models.Count -gt 0) { ($ollamaData.models | ForEach-Object { $_.name }) -join ", " } else { "(none loaded)" }
    Write-Host "  Ollama:     OK ($loadedModels)" -ForegroundColor Green

    $ollamaTagsResp = Invoke-WebRequest -Uri "$ollamaUrl/api/tags" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    $ollamaTags = ($ollamaTagsResp.Content | ConvertFrom-Json).models
    $modelNames = ($ollamaTags | ForEach-Object { "$($_.name) ($($_.details.parameter_size))" }) -join ", "
    Write-Host "  Models:     $modelNames" -ForegroundColor DarkGray
} catch {
    Write-Host "  Ollama:     WARNING - Could not reach $ollamaUrl" -ForegroundColor Yellow
}

# Baseline system snapshot
if (-not $SkipMetrics) {
    Write-Host ""
    Write-Host "--- Baseline System Metrics ---" -ForegroundColor Magenta
    $baseline = Get-SystemSnapshot
    if ($baseline.OllamaCpu -ge 0) {
        Write-Host "  256ai:   CPU=$($baseline.OllamaCpu)%  Mem=$($baseline.OllamaMem.Pct)% ($($baseline.OllamaMem.UsedMB)MB/$($baseline.OllamaMem.TotalMB)MB)"
    }
    if ($baseline.ApiCpu -ge 0) {
        Write-Host "  API:     CPU=$($baseline.ApiCpu)%  Mem=$($baseline.ApiMem.Pct)% ($($baseline.ApiMem.UsedMB)MB/$($baseline.ApiMem.TotalMB)MB)"
    }
}

# Cleanup-only mode
if ($CleanupOnly) {
    Write-Host ""
    Write-Host "--- Cleanup Only Mode ---" -ForegroundColor Yellow
    Write-Host "  Logging into existing test users to delete them..."

    $cleanupUsers = @()
    for ($i = 1; $i -le 200; $i++) {
        $email = "$EmailPrefix-$i@$EmailDomain"
        $loginResult = Invoke-Api -Method "POST" -Path "/auth/login" -Body @{
            email    = $email
            password = $TestPassword
        }
        if ($loginResult.Success -and $loginResult.Content) {
            $parsed = $loginResult.Content | ConvertFrom-Json
            $cleanupUsers += @{ Token = $parsed.access_token; Email = $email }
        }
    }

    if ($cleanupUsers.Count -gt 0) {
        Write-Host "  Found $($cleanupUsers.Count) test users." -ForegroundColor Yellow
        Remove-TestUsers -Users $cleanupUsers
    } else {
        Write-Host "  No test users found." -ForegroundColor Green
    }
    exit 0
}

# Seed users
$users = New-TestUsers -Count $maxUsers
if ($users.Count -eq 0) {
    Write-Host "  No users created. Aborting." -ForegroundColor Red
    exit 1
}

# Warm-up
Test-WarmUp -Users $users

# Pre-generate readings (trigger background jobs)
if ($PreGenerate) {
    Write-Host ""
    Write-Host "--- Pre-Generate Phase ---" -ForegroundColor Cyan
    Write-Host "  Triggering background jobs to generate readings for all test users..."
    Write-Host "  This simulates the scheduled jobs that run daily/weekly/monthly."
    Write-Host ""

    $genEndpoints = @(
        @{ Name = "daily";   Path = "/admin/scheduler/trigger-daily" },
        @{ Name = "weekly";  Path = "/admin/scheduler/trigger-weekly" },
        @{ Name = "monthly"; Path = "/admin/scheduler/trigger-monthly" },
        @{ Name = "yearly";  Path = "/admin/scheduler/trigger-yearly" }
    )

    foreach ($ep in $genEndpoints) {
        Write-Host "  Triggering $($ep.Name) generation..." -NoNewline
        $genStart = Get-Date
        $result = Invoke-Api -Method "POST" -Path $ep.Path -Token $users[0].Token
        $genTime = [Math]::Round(((Get-Date) - $genStart).TotalSeconds, 1)
        if ($result.Success) {
            Write-Host " done (${genTime}s)" -ForegroundColor Green
        } else {
            Write-Host " FAILED ($($result.StatusCode): $($result.Error))" -ForegroundColor Yellow
        }
    }

    Write-Host ""
    Write-Host "  Pre-generation complete. Readings should now be cached." -ForegroundColor Green
    Write-Host "  Throughput test will now measure cached read performance." -ForegroundColor DarkGray
}

# Run throughput levels
$allMetrics = @()
foreach ($level in $ConcurrencyLevels) {
    $metrics = Invoke-ThroughputRound -Users $users -Concurrency $level -RequestsPerUser $RequestsPerUser
    $allMetrics += $metrics
}

# ============================================================
# PHASE 5: SUMMARY
# ============================================================

Write-Host ""
Write-Host ""
Write-Host "=== THROUGHPUT SUMMARY ===" -ForegroundColor Cyan
Write-Host ""

if (-not $SkipMetrics) {
    Write-Host ("{0,12} | {1,7} | {2,9} | {3,9} | {4,9} | {5,9} | {6,9} | {7,11} | {8,9}" -f "Concurrency", "RPS", "Success%", "Avg(ms)", "P50(ms)", "P95(ms)", "P99(ms)", "256ai CPU%", "API CPU%") -ForegroundColor White
    Write-Host ("{0,12} | {1,7} | {2,9} | {3,9} | {4,9} | {5,9} | {6,9} | {7,11} | {8,9}" -f "-----------", "------", "--------", "-------", "-------", "-------", "-------", "-----------", "---------")
} else {
    Write-Host ("{0,12} | {1,7} | {2,9} | {3,9} | {4,9} | {5,9} | {6,9}" -f "Concurrency", "RPS", "Success%", "Avg(ms)", "P50(ms)", "P95(ms)", "P99(ms)") -ForegroundColor White
    Write-Host ("{0,12} | {1,7} | {2,9} | {3,9} | {4,9} | {5,9} | {6,9}" -f "-----------", "------", "--------", "-------", "-------", "-------", "-------")
}

foreach ($m in $allMetrics) {
    $avg = if ($m.ContainsKey("AvgMs")) { $m.AvgMs } else { "-" }
    $p50 = if ($m.ContainsKey("P50Ms")) { $m.P50Ms } else { "-" }
    $p95 = if ($m.ContainsKey("P95Ms")) { $m.P95Ms } else { "-" }
    $p99 = if ($m.ContainsKey("P99Ms")) { $m.P99Ms } else { "-" }

    if (-not $SkipMetrics) {
        $ollamaCpu = if ($m.ContainsKey("OllamaCpuAvg")) { "$($m.OllamaCpuAvg)/$($m.OllamaCpuMax)" } else { "-" }
        $apiCpu    = if ($m.ContainsKey("ApiCpuAvg")) { "$($m.ApiCpuAvg)/$($m.ApiCpuMax)" } else { "-" }
        Write-Host ("{0,12} | {1,7} | {2,8}% | {3,9} | {4,9} | {5,9} | {6,9} | {7,11} | {8,9}" -f $m.Concurrency, $m.RPS, $m.SuccessRate, $avg, $p50, $p95, $p99, $ollamaCpu, $apiCpu)
    } else {
        Write-Host ("{0,12} | {1,7} | {2,8}% | {3,9} | {4,9} | {5,9} | {6,9}" -f $m.Concurrency, $m.RPS, $m.SuccessRate, $avg, $p50, $p95, $p99)
    }
}

Write-Host ""

# ============================================================
# PHASE 6: CLEANUP
# ============================================================

if (-not $SkipCleanup) {
    Write-Host "--- Cleanup Phase ---" -ForegroundColor Cyan
    Remove-TestUsers -Users $users
} else {
    Write-Host "--- Cleanup SKIPPED (--SkipCleanup) ---" -ForegroundColor Yellow
    Write-Host "  $($users.Count) test users remain in the system."
    Write-Host "  Run with -CleanupOnly to remove them later."
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
