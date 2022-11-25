$currentFolder = [System.IO.Path]::GetDirectoryName($MyInvocation.MyCommand.Path)

Write-Host 'Generating pomelo.cachequery...'
$cq = 'pomelo.cachequery.js'
$cqPath = Join-Path $currentFolder $cq
$cqPublish = Join-Path $outputDir $cq
Copy-Item -Path $cqPath -Destination $cqPublish
$min = Join-Path $outputDir 'pomelo.cachequery.min.js'
uglifyjs $cqPublish -m -o $min
Copy-Item -Path $min -Destination (Join-Path $currentFolder '../Pomelo.Vue.Middleware/pomelo.cachequery.js') -Force
Copy-Item -Path $min -Destination (Join-Path $currentFolder '../Pomelo.Vue.Middleware/pomelo.cachequery.min.js') -Force
Write-Host 'Finished generate pomelo.cachequery.js & pomelo.cachequery.min.js'

Write-Host 'Generating pomelo.commonjs...'
$commonJs = 'pomelo.commonjs.js'
$cjsPath = Join-Path $currentFolder $commonJs
$cjsPublish = Join-Path $outputDir $commonJs
Copy-Item -Path $cjsPath -Destination $cjsPublish
$min = Join-Path $outputDir 'pomelo.commonjs.min.js'
uglifyjs $cjsPublish -m -o $min
Write-Host 'Finished generate pomelo.commonjs.js & pomelo.commonjs.min.js'