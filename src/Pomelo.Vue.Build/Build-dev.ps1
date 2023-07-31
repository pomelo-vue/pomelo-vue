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
$publicPropertiesMap = $publicPropertiesMap + '      $data: i => i.$data,' + "`r`n"
$publicPropertiesMap = $publicPropertiesMap + '      $created: i => i.$created,' + "`r`n"
$publicPropertiesMap = $publicPropertiesMap + '      $unmounted: i => i.$unmounted,' + "`r`n"
$publicPropertiesMap = $publicPropertiesMap + '      $mounted: i => i.$mounted,' + "`r`n"
$publicPropertiesMap = $publicPropertiesMap + '      $layout: i => i.$layout,' + "`r`n"
$publicPropertiesMap = $publicPropertiesMap + '      $view: i => i.$view' + "`r`n"
$vueJsContent = $vueJsContent.Replace('$parent: i => getPublicInstance(i.parent),', '$parent: i => i.$parent || getPublicInstance(i.parent),')
$vueJsContent = $vueJsContent.Replace('$root: i => getPublicInstance(i.root),', '$root: i => i.$root || getPublicInstance(i.root),')
$vueJsContent = $vueJsContent.Replace('$watch: i => (instanceWatch.bind(i) )', $publicPropertiesMap)
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
$original = Join-Path $outputDir 'pomelo.vue.dev.js'
$min = Join-Path $outputDir 'pomelo.vue.dev.min.js'
Set-Content -Path $original -Value $vueJsContent
uglifyjs $original -m -o $min
Write-Host 'Generated ' $original
Write-Host 'Generated ' $min
Copy-Item -Path (Join-Path $currentFolder 'package.json') -Destination (Join-Path $outputDir 'package.json') -Force

Write-Host 'Finished generate pomelo.vue.dev.js & pomelo.vue.dev.min.js'