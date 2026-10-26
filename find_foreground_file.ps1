Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
$entry = $zip.GetEntry("resources.arsc")
$s = $entry.Open()
$ms = New-Object System.IO.MemoryStream
$s.CopyTo($ms)
$s.Close()
$zip.Dispose()
$b = $ms.ToArray()

# In resources.arsc, find the entry for 0x7f08005d (type 8, id 0x5d = 93)
# Let's search for "ic_launcher_foreground" in resources.arsc and see what filename is right next to it!
$text = [System.Text.Encoding]::UTF8.GetString($b)
$idx = $text.IndexOf("ic_launcher_foreground")
Write-Output "Index of ic_launcher_foreground: $idx"
if ($idx -gt 0) {
    # print 300 characters around it
    $start = [Math]::Max(0, $idx - 100)
    $len = [Math]::Min($text.Length - $start, 300)
    Write-Output $text.Substring($start, $len)
}
