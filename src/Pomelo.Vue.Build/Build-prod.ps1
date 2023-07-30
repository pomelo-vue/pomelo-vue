Write-Host 'Downloading vue.js(v3)...'
$vueDownloadUrl = 'https://unpkg.com/vue@3/dist/vue.global.prod.js'
$result = Invoke-WebRequest $vueDownloadUrl
$vueJsContent = $result.Content

Write-Host 'Reading pomelo.js...'
$currentFolder = [System.IO.Path]::GetDirectoryName($MyInvocation.MyCommand.Path)
$pomeloPath = Join-Path $currentFolder 'pomelo.js'
Write-Host $pomeloPath
$pomeloContent = Get-Content $pomeloPath -Raw

Write-Host 'Pathcing vue.js...'
$publicPropertiesMap = '$watch:e=>An.bind(e)'
$publicPropertiesMap = $publicPropertiesMap + ',$containers: i => i.$containers,'
$publicPropertiesMap = $publicPropertiesMap + '$container: i => i.$container,'
$publicPropertiesMap = $publicPropertiesMap + '$created: i => i.$created,'
$publicPropertiesMap = $publicPropertiesMap + '$unmounted: i => i.$unmounted,'
$publicPropertiesMap = $publicPropertiesMap + '$mounted: i => i.$mounted,'
$publicPropertiesMap = $publicPropertiesMap + '$layout: i => i.$layout,'
$publicPropertiesMap = $publicPropertiesMap + '$view: i => i.$view'
$vueJsContent = $vueJsContent.Replace('$parent:e=>xo(e.parent),', '$parent:e=>e.$parent||xo(e.parent),')
$vueJsContent = $vueJsContent.Replace('$root:e=>xo(e.root),', '$root:e=>e.$root||xo(e.root),')
$vueJsContent = $vueJsContent.Replace('$watch:e=>An.bind(e)', $publicPropertiesMap)
$vueJsContent = "// Vue`r`n" + $vueJsContent + "`r`n// Pomelo" + "`r`n" + $pomeloContent

If (-Not($vueJsContent.Contains("$layout"))) {
    Throw 'Merge Vue.js failed!'
    Exit 1
}

Write-Host 'Generating pomelo.vue...'
$outputDir = Join-Path $currentFolder 'bin/js'
If (-Not (Test-Path $outputDir)) {
    New-Item -Path $outputDir -ItemType Directory
}
$original = Join-Path $outputDir 'pomelo.vue.js'
$min = Join-Path $outputDir 'pomelo.vue.min.js'
Set-Content -Path $original -Value $vueJsContent
uglifyjs $original -m -o $min
Write-Host 'Generated ' $original
Write-Host 'Generated ' $min
Copy-Item -Path (Join-Path $currentFolder 'package.json') -Destination (Join-Path $outputDir 'package.json') -Force

Write-Host 'Finished generate pomelo.vue.js & pomelo.vue.min.js'