$currentFolder = Get-Location
$outputDir = Join-Path $currentFolder 'bin/js'
If (Test-Path $outputDir) {
    Remove-Item -Path $outputDir -Force -Recurse
}

. .\Build-dev.ps1
. .\Build-prod.ps1
. .\Build-misc.ps1
. .\Build-nupkg.ps1
. .\Build-middleware.ps1

Write-Host 'Copying licenses...'
$licensePath = Join-Path $currentFolder '../../LICENSE'
$licenseDestPath = Join-Path $outputDir './LICENSE'
Copy-Item $licensePath -Destination $licenseDestPath
$licensePath = Join-Path $currentFolder '../../LICENSE-VUEJS'
$licenseDestPath = Join-Path $outputDir './LICENSE-VUEJS'
Copy-Item $licensePath -Destination $licenseDestPath

Set-Location $currentFolder