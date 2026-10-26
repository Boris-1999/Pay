Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
$entry = $zip.GetEntry("resources.arsc")
$s = $entry.Open()
$ms = New-Object System.IO.MemoryStream
$s.CopyTo($ms)
$s.Close()
$zip.Dispose()
$b = $ms.ToArray()

# In resources.arsc, find strings that start with "res/"
$text = [System.Text.Encoding]::UTF8.GetString($b)
$matches = [regex]::Matches($text, "res/[a-zA-Z0-9_\-\.]+\.(png|xml)")
$files = @()
foreach ($m in $matches) {
    $files += $m.Value
}
$files | Select-Object -Unique | Select-Object -First 30
