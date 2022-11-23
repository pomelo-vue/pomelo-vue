$currentPath = Get-Location
$buildPath = Join-Path $currentPath '..'
$buildPath = Join-Path $buildPath 'Pomelo.Vue.Build'
$packageJsonPath = Join-Path $buildPath 'package.json'
$content = Get-Content $packageJsonPath | ConvertFrom-Json
$version = 'r'+ $content.version
dotnet pack --version-suffix $version -c Release