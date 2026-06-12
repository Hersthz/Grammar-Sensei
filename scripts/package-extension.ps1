$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root "dist"
$manifestPath = Join-Path $root "manifest.json"

node (Join-Path $PSScriptRoot "validate-publish.js")

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$zipName = "grammar-sensei-$($manifest.version).zip"
$zipPath = Join-Path $dist $zipName

if (!(Test-Path $dist)) {
  New-Item -ItemType Directory -Path $dist | Out-Null
}

if (Test-Path $zipPath) {
  Remove-Item -LiteralPath $zipPath
}

$items = @(
  "manifest.json",
  "background.js",
  "content.js",
  "popup.html",
  "popup.js",
  "styles.css",
  "sidepanel.html",
  "sidepanel.js",
  "sidepanel.css",
  "options.html",
  "options.js",
  "options.css",
  "onboarding.html",
  "onboarding.js",
  "onboarding.css",
  "icons",
  "data",
  "core"
)

$paths = $items | ForEach-Object { Join-Path $root $_ }
Compress-Archive -Path $paths -DestinationPath $zipPath -CompressionLevel Optimal

Write-Host "Created $zipPath"
