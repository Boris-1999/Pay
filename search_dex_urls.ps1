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
$matches = [regex]::Matches($text, "https?://[a-zA-Z0-9_\-\./:]+|file:///[a-zA-Z0-9_\-\./:]+|assets/[a-zA-Z0-9_\-\./]+")
$urls = @()
foreach ($m in $matches) {
    if ($m.Value.Length -gt 5) {
        $urls += $m.Value
    }
}
$urls | Select-Object -Unique | Select-Object -First 30
