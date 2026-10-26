Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
$icons = @()
foreach ($entry in $zip.Entries) {
    if ($entry.FullName -like "*ic_launcher*" -or $entry.FullName -like "*icon*") {
        $icons += $entry.FullName
    }
}
$zip.Dispose()
$icons
