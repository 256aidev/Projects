# Simple HTTP Server for 256ai Dashboard
# Run on Dragon (10.0.1.147) to host the dashboard
# Usage: powershell -ExecutionPolicy Bypass -File serve.ps1

$Port = 8080
$Root = $PSScriptRoot

Write-Host "=========================================="
Write-Host "  256ai Swarm Dashboard"
Write-Host "  Listening on http://0.0.0.0:$Port"
Write-Host "  Serving from: $Root"
Write-Host "=========================================="
Write-Host ""
Write-Host "Access from any device:"
Write-Host "  http://10.0.1.147:$Port"
Write-Host ""
Write-Host "Press Ctrl+C to stop"
Write-Host ""

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://+:$Port/")
$listener.Start()

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath
        if ($path -eq "/") { $path = "/index.html" }

        $filePath = Join-Path $Root $path.TrimStart("/")

        if (Test-Path $filePath) {
            $content = [System.IO.File]::ReadAllBytes($filePath)

            # Set content type
            $ext = [System.IO.Path]::GetExtension($filePath)
            $contentType = switch ($ext) {
                ".html" { "text/html" }
                ".css"  { "text/css" }
                ".js"   { "application/javascript" }
                ".json" { "application/json" }
                default { "application/octet-stream" }
            }

            $response.ContentType = $contentType
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)

            Write-Host "$(Get-Date -Format 'HH:mm:ss') 200 $path"
        }
        else {
            $response.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
            $response.OutputStream.Write($msg, 0, $msg.Length)

            Write-Host "$(Get-Date -Format 'HH:mm:ss') 404 $path"
        }

        $response.Close()
    }
}
finally {
    $listener.Stop()
}
