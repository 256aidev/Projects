# generate-docs.ps1
# Auto-generates documentation from code
# Run: pwsh -File scripts/generate-docs.ps1

param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot),
    [string]$ApiUrl = "http://localhost:5100"
)

$ErrorActionPreference = "Continue"
Write-Host "=== 256ai.Engine Documentation Generator ===" -ForegroundColor Cyan
Write-Host "Project Root: $ProjectRoot"

# -----------------------------
# 1. Generate API_ENDPOINTS.md from Swagger
# -----------------------------
Write-Host "`n[1/3] Generating API_ENDPOINTS.md..." -ForegroundColor Yellow

$apiEndpointsPath = Join-Path $ProjectRoot "docs\ControlPlane\API_ENDPOINTS.md"

try {
    $swaggerUrl = "$ApiUrl/swagger/v1/swagger.json"
    $swagger = Invoke-RestMethod -Uri $swaggerUrl -TimeoutSec 5

    $content = @"
# API Endpoints

> **AUTO-GENERATED** from Swagger. Do not edit manually.
> Regenerate with: ``pwsh -File scripts/generate-docs.ps1``

## Base URL

``$ApiUrl``

## Endpoints

"@

    foreach ($path in $swagger.paths.PSObject.Properties) {
        $endpoint = $path.Name
        foreach ($method in $path.Value.PSObject.Properties) {
            $httpMethod = $method.Name.ToUpper()
            $details = $method.Value
            $summary = if ($details.summary) { $details.summary } elseif ($details.operationId) { $details.operationId } else { "No description" }

            $content += @"

### $httpMethod $endpoint

**Summary:** $summary

"@

            if ($details.parameters) {
                $content += "**Parameters:**`n"
                foreach ($param in $details.parameters) {
                    $desc = if ($param.description) { $param.description } else { "No description" }
                    $content += "- ``$($param.name)`` ($($param.in)): $desc`n"
                }
            }
        }
    }

    $content += "`n---`n*Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')*`n"

    Set-Content -Path $apiEndpointsPath -Value $content -Encoding UTF8
    Write-Host "  Created: $apiEndpointsPath" -ForegroundColor Green
}
catch {
    Write-Host "  Warning: Could not fetch Swagger. Is the API running?" -ForegroundColor Yellow
    Write-Host "  Error: $_" -ForegroundColor Gray

    # Create placeholder
    $placeholder = @"
# API Endpoints

> **AUTO-GENERATED** - Run the Control Plane first, then regenerate.
>
> Start API: ``dotnet run --project src/Engine.ControlPlane --urls "http://localhost:5100"``
> Regenerate: ``pwsh -File scripts/generate-docs.ps1``

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health/summary | Overall system health |
| GET | /health/workers | List workers |
| GET | /health/apps | List app health |
| POST | /tasks | Submit task |
| GET | /tasks/{id} | Get task status |
| GET | /escalations | List escalations |
| PUT | /escalations/{id} | Disposition escalation |

---
*Placeholder - regenerate when API is running*
"@
    Set-Content -Path $apiEndpointsPath -Value $placeholder -Encoding UTF8
    Write-Host "  Created placeholder: $apiEndpointsPath" -ForegroundColor Yellow
}

# -----------------------------
# 2. Generate MESSAGE_SCHEMAS.md from C# classes
# -----------------------------
Write-Host "`n[2/3] Generating MESSAGE_SCHEMAS.md..." -ForegroundColor Yellow

$messageSchemasPath = Join-Path $ProjectRoot "docs\shared\MESSAGE_SCHEMAS.md"
$messagesDir = Join-Path $ProjectRoot "src\Engine.Core\Messages"

$content = @"
# Message Schemas

> **AUTO-GENERATED** from C# classes in ``Engine.Core/Messages/``
> Regenerate with: ``pwsh -File scripts/generate-docs.ps1``

## Message Types

| Code | Class | Purpose |
|------|-------|---------|
| TAS | TaskMessage | Task dispatch from Control Plane to Worker |
| TRS | TaskResultMessage | Task result from Worker to Control Plane |
| AHE | AgentHeartbeat | Worker liveness signal |
| AHS | AppHealthStatus | Application health check |
| ASC | SyntheticCheckResult | End-to-end system verification |
| ESC | EscalationMessage | Surface risks to Strategy Layer |

## Classes

"@

if (Test-Path $messagesDir) {
    $messageFiles = Get-ChildItem -Path $messagesDir -Filter "*.cs" | Where-Object { $_.Name -ne "IMessage.cs" }

    foreach ($file in $messageFiles) {
        $className = $file.BaseName
        $fileContent = Get-Content $file.FullName -Raw

        $content += @"

### $className

``````csharp
// File: src/Engine.Core/Messages/$($file.Name)
"@

        # Extract the record/class definition (simplified)
        if ($fileContent -match "public record $className[^{]*\{([^}]+)\}") {
            $properties = $Matches[1].Trim()
            $content += "`n$properties"
        }

        $content += @"

``````

"@
    }
}

$content += "`n---`n*Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')*`n"

Set-Content -Path $messageSchemasPath -Value $content -Encoding UTF8
Write-Host "  Created: $messageSchemasPath" -ForegroundColor Green

# -----------------------------
# 3. Generate DATABASE_SCHEMA.md from entities
# -----------------------------
Write-Host "`n[3/3] Generating DATABASE_SCHEMA.md..." -ForegroundColor Yellow

$dbSchemaPath = Join-Path $ProjectRoot "docs\ControlPlane\DATABASE_SCHEMA.md"
$entitiesDir = Join-Path $ProjectRoot "src\Engine.Infrastructure\Entities"

$content = @"
# Database Schema

> **AUTO-GENERATED** from EF Core entities in ``Engine.Infrastructure/Entities/``
> Regenerate with: ``pwsh -File scripts/generate-docs.ps1``

## Tables

| Table | Entity Class | Purpose |
|-------|--------------|---------|
| messages | MessageEntity | Core message log |
| worker_heartbeat | WorkerHeartbeatEntity | Worker health state |
| app_health | AppHealthEntity | App health state |
| synthetic_check | SyntheticCheckEntity | Synthetic check results |
| tasks | TaskEntity | Task tracking |
| escalations | EscalationEntity | Escalation tracking |

## Entity Details

"@

if (Test-Path $entitiesDir) {
    $entityFiles = Get-ChildItem -Path $entitiesDir -Filter "*.cs"

    foreach ($file in $entityFiles) {
        $className = $file.BaseName

        $content += @"

### $className

``````csharp
// File: src/Engine.Infrastructure/Entities/$($file.Name)
``````

"@
    }
}

$content += "`n---`n*Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')*`n"

Set-Content -Path $dbSchemaPath -Value $content -Encoding UTF8
Write-Host "  Created: $dbSchemaPath" -ForegroundColor Green

# -----------------------------
# Summary
# -----------------------------
Write-Host "`n=== Documentation Generated ===" -ForegroundColor Cyan
Write-Host "Files created/updated:"
Write-Host "  - docs/ControlPlane/API_ENDPOINTS.md"
Write-Host "  - docs/shared/MESSAGE_SCHEMAS.md"
Write-Host "  - docs/ControlPlane/DATABASE_SCHEMA.md"
Write-Host ""
