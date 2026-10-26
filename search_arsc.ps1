Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
$entry = $zip.GetEntry("resources.arsc")
$stream = $entry.Open()
$mem = New-Object System.IO.MemoryStream
$stream.CopyTo($mem)
$stream.Close()
$zip.Dispose()

$bytes = $mem.ToArray()
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
$matches = [regex]::Matches($text, "WebView|My WebView|Demo")
foreach ($m in $matches) {
    Write-Output $m.Value
}
