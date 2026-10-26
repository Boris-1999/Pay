Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
foreach ($name in @("assets/local/index.html", "assets/web/index.html", "assets/demo/index.html")) {
    $entry = $zip.GetEntry($name)
    if ($entry) {
        Write-Output "=== $name ==="
        $reader = New-Object System.IO.StreamReader($entry.Open())
        Write-Output ($reader.ReadToEnd() | Select-Object -First 20)
        $reader.Close()
    }
}
$zip.Dispose()
