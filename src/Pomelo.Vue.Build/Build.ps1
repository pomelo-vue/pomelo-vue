$currentFolder = Get-Location
$outputDir = Join-Path $currentFolder 'bin/js'
If (Test-Path $outputDir) {
    Remove-Item -Path $outputDir -Force -Recurse
}

. .\Build-dev.ps1
. .\Build-prod.ps1
. .\Build-misc.ps1