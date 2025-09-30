# scripts/api.ps1
# Simple helpers for TurboVets API (Windows PowerShell)

$Global:ApiBase = "http://localhost:3000/api"
$Global:JWT = $env:JWT  # pick up from env if already set

function Set-Jwt {
  param(
    [Parameter(Mandatory=$true)][string]$Email,
    [Parameter(Mandatory=$true)][string]$Password
  )
  $body = @{ email = $Email; password = $Password } | ConvertTo-Json -Compress
  try {
    $resp = Invoke-RestMethod -Method Post -Uri "$ApiBase/auth/login" -ContentType 'application/json' -Body $body
    $Global:JWT = $resp.accessToken
    $env:JWT = $Global:JWT
    Write-Host "✅ JWT set in session (and \$env:JWT)."
  } catch {
    Write-Error "Login failed: $($_.Exception.Message)"
  }
}

function Require-Jwt {
  if (-not $Global:JWT) { throw "No JWT set. Run: Set-Jwt -Email <email> -Password <password>" }
}

function ApiGet {
  param([Parameter(Mandatory=$true)][string]$Path)
  Require-Jwt
  Invoke-RestMethod -Method Get -Uri "$ApiBase/$Path" -Headers @{ Authorization = "Bearer $JWT" }
}

function ApiPost {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter()][hashtable]$Body
  )
  Require-Jwt
  $json = if ($Body) { $Body | ConvertTo-Json -Compress } else { $null }
  Invoke-RestMethod -Method Post -Uri "$ApiBase/$Path" -Headers @{ Authorization = "Bearer $JWT" } -ContentType 'application/json' -Body $json
}

function ApiPut {
  param(
    [Parameter(Mandatory=$true)][string]$Path,
    [Parameter()][hashtable]$Body
  )
  Require-Jwt
  $json = if ($Body) { $Body | ConvertTo-Json -Compress } else { $null }
  $uri = "$ApiBase/$Path"
  Write-Host "PUT $uri"  # debug
  if ($json) { Write-Host "BODY $json" }  # debug
  Invoke-RestMethod -Method Put -Uri $uri -Headers @{ Authorization = "Bearer $JWT" } `
    -ContentType 'application/json' -Body $json
}

function ApiDelete {
  param([Parameter(Mandatory=$true)][string]$Path)
  Require-Jwt
  Invoke-RestMethod -Method Delete -Uri "$ApiBase/$Path" -Headers @{ Authorization = "Bearer $JWT" }
}

function Register-User {
  param([Parameter(Mandatory=$true)][string]$Email,
        [Parameter(Mandatory=$true)][string]$Password)
  $body = @{ email = $Email; password = $Password } | ConvertTo-Json -Compress
  Invoke-RestMethod -Method Post -Uri "$ApiBase/auth/register" `
    -ContentType 'application/json' -Body $body
}

function Add-Member {
  param([Parameter(Mandatory=$true)][string]$Email,
        [Parameter(Mandatory=$true)][int]$OrgId,
        [Parameter(Mandatory=$true)][ValidateSet('OWNER','ADMIN','VIEWER')][string]$Role)
  Require-Jwt
  $body = @{ email = $Email; orgId = $OrgId; role = $Role } | ConvertTo-Json -Compress
  Invoke-RestMethod -Method Post -Uri "$ApiBase/dev/memberships?orgId=$OrgId" `
    -Headers @{ Authorization = "Bearer $JWT" } `
    -ContentType 'application/json' -Body $body
}

function List-Members {
  param([int]$OrgId=1)
  ApiGet "dev/memberships?orgId=$OrgId"
}

# Convenience commands for the challenge
function Seed-Org { ApiPost "dev-seed" }
function Create-Task { param([int]$OrgId,[string]$Title,[string]$Description="") ApiPost "tasks" @{ orgId=$OrgId; title=$Title; description=$Description } }
function List-Tasks { param([int]$OrgId) ApiGet "tasks?orgId=$OrgId" }

function Update-Task {
  param(
    [Parameter(Mandatory=$true)][int]$Id,
    [Parameter(Mandatory=$true)][string]$Status,
    [Parameter()][int]$OrgId = 1
  )
  $path = ("tasks/{0}?orgId={1}" -f $Id, $OrgId)
  ApiPut $path @{ status = $Status }
}

function Delete-Task {
  param(
    [Parameter(Mandatory=$true)][int]$Id,
    [Parameter()][int]$OrgId = 1
  )
  $path = ("tasks/{0}?orgId={1}" -f $Id, $OrgId)
  ApiDelete $path
}

function Audit-Log { param([int]$OrgId=1) ApiGet "audit-log?orgId=$OrgId" }
function Debug-Users { param([int]$OrgId=1) ApiGet "debug/users?orgId=$OrgId" }
function Debug-Orgs  { param([int]$OrgId=1) ApiGet "debug/orgs?orgId=$OrgId" }
function Debug-Mems  { param([int]$OrgId=1) ApiGet "debug/mems?orgId=$OrgId" }
function Debug-Tasks { param([int]$OrgId=1) ApiGet "debug/tasks?orgId=$OrgId" }

Write-Host "Loaded API helpers. Use: Set-Jwt -Email <e> -Password <p>  |  List-Tasks -OrgId 1"
