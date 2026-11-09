$src = 'H:\Rasel\all_local_Projecrt\blognexa-ai'
$dest = 'H:\Rasel\xampp\htdocs\cleanblog\wp-content\plugins\blognexa-ai'
$zipPath = 'H:\Rasel\all_local_Projecrt\blognexa-ai.zip'

# 1. Sync to local XAMPP
if (Test-Path $dest) {
    Copy-Item -Path "$src\app" -Destination $dest -Recurse -Force
    Copy-Item -Path "$src\docs" -Destination $dest -Recurse -Force
    Copy-Item -Path "$src\tests" -Destination $dest -Recurse -Force
    Write-Output 'Synced updated plugin files to local XAMPP cleanblog.'
}

# 2. Re-create production zip
$tempDir = Join-Path $env:TEMP ('bnx_zip_' + [System.Guid]::NewGuid().ToString())
$stageDir = Join-Path $tempDir 'blognexa-ai'
New-Item -ItemType Directory -Path $stageDir -Force | Out-Null

$itemsToCopy = @('app', 'build', 'config', 'docs', 'languages', 'resources', 'scripts', 'templates', 'tests', 'backend', 'blognexa-ai.php', 'composer.json', 'package.json', 'readme.txt', 'uninstall.php')
foreach ($item in $itemsToCopy) {
    $itemPath = Join-Path $src $item
    if (Test-Path $itemPath) {
        Copy-Item -Path $itemPath -Destination (Join-Path $stageDir $item) -Recurse -Force
    }
}

if (Test-Path $zipPath) { Remove-Item -Path $zipPath -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $zipPath)
Remove-Item -Path $tempDir -Recurse -Force

Write-Output ('Plugin zip created at: ' + $zipPath + ' (' + (Get-Item $zipPath).Length + ' bytes)')
