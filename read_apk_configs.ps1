Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
foreach ($name in @("assets/settings.json", "assets/local/config.json")) {
    $entry = $zip.GetEntry($name)
    if ($entry) {
        Write-Output "=== $name ==="
        $reader = New-Object System.IO.StreamReader($entry.Open())
        Write-Output $reader.ReadToEnd()
        $reader.Close()
    }
}
$zip.Dispose()
