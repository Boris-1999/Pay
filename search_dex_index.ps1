Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
$entry = $zip.GetEntry("classes.dex")
$stream = $entry.Open()
$mem = New-Object System.IO.MemoryStream
$stream.CopyTo($mem)
$stream.Close()
$zip.Dispose()

$bytes = $mem.ToArray()
$text = [System.Text.Encoding]::ASCII.GetString($bytes)
$matches = [regex]::Matches($text, "[a-zA-Z0-9_\-\./]*index\.html")
foreach ($m in $matches) {
    Write-Output $m.Value
}
