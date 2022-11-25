$currentPath = Get-Location
$buildPath = Join-Path $currentPath '..'
$buildPath = Join-Path $buildPath 'Pomelo.Vue.Build'
$packageJsonPath = Join-Path $buildPath 'package.json'
$content = Get-Content $packageJsonPath | ConvertFrom-Json
$version = $content.version
.\nuget pack Pomelo.Vue.JavaScript.nuspec -version $version
$nupkgName = 'Pomelo.Vue.JavaScript.' + $version + '.nupkg'
$destPath = Join-Path $currentPath 'bin'
$destPath = Join-Path $destPath $nupkgName
Move-Item -Path $nupkgName -Destination $destPath -Force