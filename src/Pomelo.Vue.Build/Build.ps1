Write-Host 'Downloading vue.js(v3)...'
$vueDownloadUrl = 'https://unpkg.com/vue@next'
$result = Invoke-WebRequest $vueDownloadUrl
$vueJsContent = $result.Content

Write-Host 'Reading pomelo.js...'
$currentFolder = [System.IO.Path]::GetDirectoryName($MyInvocation.MyCommand.Path)
$pomeloPath = Join-Path $currentFolder 'pomelo.js'
Write-Host $pomeloPath
$pomeloContent = Get-Content $pomeloPath -Raw

Write-Host 'Pathcing vue.js...'
$publicPropertiesMap = '$watch: i => (instanceWatch.bind(i) ),' + "`r`n"
$publicPropertiesMap = $publicPropertiesMap + '      $containers: i => i.$containers,' + "`r`n"
$publicPropertiesMap = $publicPropertiesMap + '      $container: i => i.$container,' + "`r`n"
$publicPropertiesMap = $publicPropertiesMap + '      $layout: i => i.$layout,' + "`r`n"
$publicPropertiesMap = $publicPropertiesMap + '      $view: i => i.$view' + "`r`n"
$vueJsContent = $vueJsContent.Replace('$parent: i => getPublicInstance(i.parent),', '$parent: i => i.$parent || getPublicInstance(i.parent),')
$vueJsContent = $vueJsContent.Replace('$root: i => getPublicInstance(i.root),', '$root: i => i.$root || getPublicInstance(i.root),')
$vueJsContent = $vueJsContent.Replace('$watch: i => (instanceWatch.bind(i) )', $publicPropertiesMap)
$vueJsContent = "// Vue`r`n" + $vueJsContent + "`r`n// Pomelo" + "`r`n" + $pomeloContent

Write-Host 'Generating pue...'
$outputDir = Join-Path $currentFolder 'bin/js'
If (-Not (Test-Path $outputDir)) {
    New-Item -Path $outputDir -ItemType Directory
}
$original = Join-Path $outputDir 'pue.js'
$min = Join-Path $outputDir 'pue.min.js'
Set-Content -Path $original -Value $vueJsContent
uglifyjs $original -m -o $min
Write-Host 'Generated ' $original
Write-Host 'Generated ' $min
Copy-Item -Path (Join-Path $currentFolder 'package.json') -Destination (Join-Path $outputDir 'package.json') -Force

Write-Host 'Copying scripts to sample project...'
Copy-Item -Path $original -Destination (Join-Path $currentFolder '../Pomelo.Vue/wwwroot/assets/js/pue.js') -Force
Copy-Item -Path $min  -Destination (Join-Path $currentFolder '../Pomelo.Vue/wwwroot/assets/js/pue.min.js') -Force

Write-Host 'Finished generate pue.js & pue.min.js'

Write-Host 'Generating pomelo.cachequery...'
$cq = 'pomelo.cachequery.js'
$cqPath = Join-Path $currentFolder $cq
$cqPublish = Join-Path $outputDir $cq
Copy-Item -Path $cqPath -Destination $cqPublish
$min = Join-Path $outputDir 'pomelo.cachequery.min.js'
uglifyjs $cqPublish -m -o $min
Copy-Item -Path $min -Destination (Join-Path $currentFolder '../Pomelo.Vue/wwwroot/assets/js/pomelo.cachequery.js') -Force
Copy-Item -Path $min -Destination (Join-Path $currentFolder '../Pomelo.Vue/wwwroot/assets/js/pomelo.cachequery.min.js') -Force
Write-Host 'Finished generate pomelo.cachequery.js & pomelo.cachequery.min.js'

Write-Host 'Generating pomelo.commonjs...'
$commonJs = 'pomelo.commonjs.js'
$cjsPath = Join-Path $currentFolder $commonJs
$cjsPublish = Join-Path $outputDir $commonJs
Copy-Item -Path $cjsPath -Destination $cjsPublish
$min = Join-Path $outputDir 'pomelo.commonjs.min.js'
uglifyjs $cjsPublish -m -o $min
Copy-Item -Path $min -Destination (Join-Path $currentFolder '../Pomelo.Vue/wwwroot/assets/js/pomelo.commonjs.js') -Force
Copy-Item -Path $min -Destination (Join-Path $currentFolder '../Pomelo.Vue/wwwroot/assets/js/pomelo.commonjs.min.js') -Force
Write-Host 'Finished generate pomelo.commonjs.js & pomelo.commonjs.min.js'