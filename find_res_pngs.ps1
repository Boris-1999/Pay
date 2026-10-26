Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
$pngs = @()
foreach ($entry in $zip.Entries) {
    if ($entry.FullName -like "res/*.png") {
        $pngs += "$($entry.FullName) ($($entry.Length) bytes)"
    }
}
$zip.Dispose()
$pngs
