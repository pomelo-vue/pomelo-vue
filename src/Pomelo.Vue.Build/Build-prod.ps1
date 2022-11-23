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
$publicPropertiesMap = '$watch:e=>Fn.bind(e),' + "`r`n"
$publicPropertiesMap = $publicPropertiesMap + '$containers: i => i.$containers,'
$publicPropertiesMap = $publicPropertiesMap + '$container: i => i.$container,'
$publicPropertiesMap = $publicPropertiesMap + '$layout: i => i.$layout,'
$publicPropertiesMap = $publicPropertiesMap + '$view: i => i.$view'
$vueJsContent = $vueJsContent.Replace('$parent:e=>_o(e.parent),', '$parent:e=>e.$parent||_o(e.parent),')
$vueJsContent = $vueJsContent.Replace('$root:e=>_o(e.root),', '$root:e=>e.$root||_o(e.root),')
$vueJsContent = $vueJsContent.Replace('$watch:e=>Fn.bind(e)', $publicPropertiesMap)
$vueJsContent = "// Vue`r`n" + $vueJsContent + "`r`n// Pomelo" + "`r`n" + $pomeloContent

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

Write-Host 'Copying scripts to sample project...'
Copy-Item -Path $original -Destination (Join-Path $currentFolder '../Pomelo.Vue.Middleware/pomelo.vue.js') -Force
Copy-Item -Path $min  -Destination (Join-Path $currentFolder '../Pomelo.Vue.Middleware/pomelo.vue.min.js') -Force

Write-Host 'Finished generate pomelo.vue.js & pomelo.vue.min.js'