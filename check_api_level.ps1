Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
$entry = $zip.GetEntry("AndroidManifest.xml")
$s = $entry.Open()
$ms = New-Object System.IO.MemoryStream
$s.CopyTo($ms)
$s.Close()
$zip.Dispose()
$b = $ms.ToArray()
# search for targetSdkVersion or numbers like 28..34
for ($i = 0; $i -lt ($b.Length - 4); $i += 4) {
    $v = [BitConverter]::ToInt32($b, $i)
    if ($v -ge 26 -and $v -le 35) {
        Write-Output "Found API level candidate: $v at offset $i"
    }
}
