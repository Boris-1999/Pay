Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
$entry = $zip.GetEntry("AndroidManifest.xml")
$s = $entry.Open()
$ms = New-Object System.IO.MemoryStream
$s.CopyTo($ms)
$s.Close()
$zip.Dispose()
$b = $ms.ToArray()

$resIds = @()
for ($i = 0; $i -lt ($b.Length - 4); $i += 4) {
    $val = [BitConverter]::ToUInt32($b, $i)
    if (($val -band 0xFF000000) -eq 0x7F000000) {
        $resIds += "0x$($val.ToString('X8'))"
    }
}
$resIds | Select-Object -Unique
