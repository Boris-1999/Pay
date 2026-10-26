Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
$e = $zip.GetEntry("res/0K.xml")
$s = $e.Open()
$ms = New-Object System.IO.MemoryStream
$s.CopyTo($ms)
$s.Close()
$zip.Dispose()
$b = $ms.ToArray()
for ($i = 0; $i -lt ($b.Length - 4); $i += 4) {
    $val = [BitConverter]::ToUInt32($b, $i)
    if (($val -band 0xFF000000) -eq 0x7F000000) {
        Write-Output "0x$($val.ToString('X8'))"
    }
}
