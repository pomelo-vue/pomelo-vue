﻿Write-Host 'Downloading vue.js(v3)...'
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
$publicPropertiesMap = $publicPropertiesMap + '      $layout: i => i.$layout' + "`r`n"
$vueJsContent = $vueJsContent.Replace('$parent: i => getPublicInstance(i.parent),', '$parent: i => i.$parent || getPublicInstance(i.parent),')
$vueJsContent = $vueJsContent.Replace('$root: i => getPublicInstance(i.root),', '$root: i => i.$root || getPublicInstance(i.root),')
$vueJsContent = $vueJsContent.Replace('$watch: i => (instanceWatch.bind(i) )', $publicPropertiesMap)
$vueJsContent = "// Vue`r`n" + $vueJsContent + "`r`n// Pomelo" + "`r`n" + $pomeloContent

Write-Host 'Generating scripts...'
$outputDir = Join-Path $currentFolder 'bin'
$original = Join-Path $outputDir 'pue.js'
$min = Join-Path $outputDir 'pue.min.js'
Set-Content -Path $original -Value $vueJsContent
uglifyjs $original -m -o $min
Write-Host 'Generated ' $original
Write-Host 'Generated ' $min

Write-Host 'Copying scripts to sample project...'
Copy-Item -Path $original -Destination (Join-Path $currentFolder '../Pomelo.Vue/wwwroot/assets/js/pue.js')
Copy-Item -Path $min  -Destination (Join-Path $currentFolder '../Pomelo.Vue/wwwroot/assets/js/pue.min.js')

Write-Host 'Finished'