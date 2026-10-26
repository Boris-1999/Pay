Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
$e = $zip.GetEntry("res/0K.xml")
$s = $e.Open()
$ms = New-Object System.IO.MemoryStream
$s.CopyTo($ms)
$s.Close()
$zip.Dispose()
$b = $ms.ToArray()
$txt = [System.Text.Encoding]::UTF8.GetString($b)
$matches = [regex]::Matches($txt, "[a-zA-Z0-9_\-\./:@]{3,}")
foreach ($m in $matches) {
    Write-Output $m.Value
}
