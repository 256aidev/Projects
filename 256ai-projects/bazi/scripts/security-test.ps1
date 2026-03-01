# Security Audit Tests
Write-Host "=== SECURITY AUDIT TESTS ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Request without signature (should fail)
Write-Host "Test 1: Request WITHOUT signature headers" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://256ai.xyz/weekly/2" -Method Get -ErrorAction Stop
    Write-Host "  FAIL: Request succeeded without signature!" -ForegroundColor Red
    Write-Host "  Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "  PASS: Request blocked with status $statusCode" -ForegroundColor Green
}

Write-Host ""

# Test 2: Request with invalid signature (should fail)
Write-Host "Test 2: Request with INVALID signature" -ForegroundColor Yellow
$headers = @{
    "X-Timestamp" = "1234567890"
    "X-App-Signature" = "invalid_signature_here"
}
try {
    $response = Invoke-RestMethod -Uri "https://256ai.xyz/weekly/2" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "  FAIL: Request succeeded with invalid signature!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "  PASS: Request blocked with status $statusCode" -ForegroundColor Green
}

Write-Host ""

# Test 3: Request with valid signature (should succeed)
Write-Host "Test 3: Request with VALID signature" -ForegroundColor Yellow
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$secret = "f4cea590d9ecc1637862dea3643f8f1bfe5cd458c6b8e8ee2865646b8beafc30"
$dataToHash = "$timestamp" + "$secret"
Write-Host "  Debug - Timestamp: $timestamp" -ForegroundColor Gray
$sha256 = New-Object System.Security.Cryptography.SHA256Managed
$bytes = [System.Text.Encoding]::UTF8.GetBytes($dataToHash)
$hashBytes = $sha256.ComputeHash($bytes)
$signature = -join ($hashBytes | ForEach-Object { $_.ToString("x2") })
Write-Host "  Debug - Signature: $($signature.Substring(0,16))..." -ForegroundColor Gray

$headers = @{
    "X-Timestamp" = $timestamp.ToString()
    "X-App-Signature" = $signature
}
try {
    $response = Invoke-RestMethod -Uri "https://256ai.xyz/weekly/2" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "  PASS: Request succeeded with valid signature" -ForegroundColor Green
    Write-Host "  User: $($response.user_name)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $body = $streamReader.ReadToEnd()
    Write-Host "  FAIL: Request blocked (status $statusCode)" -ForegroundColor Red
    Write-Host "  Body: $body" -ForegroundColor Red
}

Write-Host ""

# Test 4: Health endpoint (should be public)
Write-Host "Test 4: Health endpoint (should be public)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://256ai.xyz/" -Method Get -ErrorAction Stop
    Write-Host "  PASS: Health endpoint accessible" -ForegroundColor Green
    Write-Host "  Response: $($response.message)" -ForegroundColor Gray
} catch {
    Write-Host "  FAIL: Health endpoint not accessible" -ForegroundColor Red
}

Write-Host ""

# Test 5: Rate limiting (if applicable)
Write-Host "Test 5: Rate Limiting Test (10 rapid requests)" -ForegroundColor Yellow
$timestamp = [int][double]::Parse((Get-Date -UFormat %s))
$data = "$timestamp$secret"
$hash = $sha256.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($data))
$signature = [BitConverter]::ToString($hash).Replace("-", "").ToLower()
$headers = @{
    "X-Timestamp" = $timestamp.ToString()
    "X-App-Signature" = $signature
}

$rateLimited = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "https://256ai.xyz/weekly/2" -Method Get -Headers $headers -ErrorAction Stop
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 429) {
            Write-Host "  PASS: Rate limited after $i requests (429)" -ForegroundColor Green
            $rateLimited = $true
            break
        }
    }
}
if (-not $rateLimited) {
    Write-Host "  INFO: No rate limiting triggered in 10 requests (may have higher limit)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== AUDIT COMPLETE ===" -ForegroundColor Cyan
