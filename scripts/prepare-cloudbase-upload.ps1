$ErrorActionPreference = "Stop"

# Build a clean CloudBase upload directory without node_modules or local secrets.
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

& npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed; upload package was not created." }

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$UploadRoot = Join-Path $ProjectRoot ".cloudbase-upload-$Stamp"
New-Item -ItemType Directory -Path $UploadRoot | Out-Null

foreach ($Name in @(".next", "public")) {
  $Source = Join-Path $ProjectRoot $Name
  if (-not (Test-Path -LiteralPath $Source)) { throw "Missing deployment output: $Name" }
  Copy-Item -LiteralPath $Source -Destination (Join-Path $UploadRoot $Name) -Recurse
}

foreach ($Name in @("package.json", "package-lock.json", "next.config.mjs", "scf_bootstrap")) {
  $Source = Join-Path $ProjectRoot $Name
  if (-not (Test-Path -LiteralPath $Source)) { throw "Missing deployment file: $Name" }
  Copy-Item -LiteralPath $Source -Destination (Join-Path $UploadRoot $Name)
}

Write-Output "CloudBase upload directory: $UploadRoot"
Write-Output "Select this directory in the CloudBase console."
