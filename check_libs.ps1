Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
$libs = @()
foreach ($entry in $zip.Entries) {
    if ($entry.FullName -like "lib/*") {
        $libs += $entry.FullName
    }
}
$zip.Dispose()
Write-Output "=== Native Libraries in APK ==="
$libs
