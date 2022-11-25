$version = 'r' + [System.DateTime]::UtcNow.ToString("yyyyMMddHHmmss")
dotnet pack --version-suffix $version -c Release