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

# 2. Re-create production WordPress plugin zip with strict Unix permissions (0755/0644)
$pythonScript = @"
import os, zipfile

src = r'$src'
zip_path = r'$zipPath'
items_to_copy = ['app', 'build', 'config', 'languages', 'templates', 'blognexa-ai.php', 'readme.txt', 'uninstall.php']

with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    for item in items_to_copy:
        full_item = os.path.join(src, item)
        if not os.path.exists(full_item):
            continue
        if os.path.isfile(full_item):
            arcname = 'blognexa-ai/' + item
            zinfo = zipfile.ZipInfo(arcname)
            zinfo.create_system = 3
            zinfo.external_attr = 0o100644 << 16
            with open(full_item, 'rb') as f:
                zf.writestr(zinfo, f.read())
        else:
            for root, dirs, files in os.walk(full_item):
                rel_root = os.path.relpath(root, src).replace('\\', '/')
                dir_arcname = 'blognexa-ai/' + rel_root + '/'
                zinfo = zipfile.ZipInfo(dir_arcname)
                zinfo.create_system = 3
                zinfo.external_attr = (0o040755 << 16) | 0x10
                zf.writestr(zinfo, '')
                for file in files:
                    if file.endswith('.map'):
                        continue
                    file_full = os.path.join(root, file)
                    file_arcname = 'blognexa-ai/' + rel_root + '/' + file
                    zinfo = zipfile.ZipInfo(file_arcname)
                    zinfo.create_system = 3
                    zinfo.external_attr = 0o100644 << 16
                    with open(file_full, 'rb') as f:
                        zf.writestr(zinfo, f.read())
"@

python -c "$pythonScript"
Write-Output ('Plugin zip created at: ' + $zipPath + ' (' + (Get-Item $zipPath).Length + ' bytes)')

