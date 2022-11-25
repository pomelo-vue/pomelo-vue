$currentFolder = Get-Location
$middlewarePath = Join-Path $currentFolder '..'
$middlewarePath = Join-Path $middlewarePath 'Pomelo.Vue.Middleware'
Set-Location $middlewarePath
. .\publish.ps1
Set-Location $currentFolder