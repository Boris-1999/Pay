Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
$entry = $zip.GetEntry("resources.arsc")
$s = $entry.Open()
$ms = New-Object System.IO.MemoryStream
$s.CopyTo($ms)
$s.Close()
$zip.Dispose()
$b = $ms.ToArray()

# Search for the type name string pool
$text = [System.Text.Encoding]::UTF8.GetString($b)
$matches = [regex]::Matches($text, "mipmap[a-zA-Z0-9_\-\.]*|ic_launcher[a-zA-Z0-9_\-\.]*")
foreach ($m in $matches) {
    Write-Output $m.Value
}
