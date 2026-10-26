Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
$entry = $zip.GetEntry("AndroidManifest.xml")
$stream = $entry.Open()
$mem = New-Object System.IO.MemoryStream
$stream.CopyTo($mem)
$stream.Close()
$zip.Dispose()

$bytes = $mem.ToArray()
# Android binary XML string pool starts at offset 8
$strCount = [BitConverter]::ToInt32($bytes, 16)
$stringsOffset = [BitConverter]::ToInt32($bytes, 28)
Write-Output "String count: $strCount"
# Extract strings
$text = [System.Text.Encoding]::Unicode.GetString($bytes)
$matches = [regex]::Matches($text, "[a-zA-Z0-9_\-\./:@]{3,}")
foreach ($m in $matches) {
    if ($m.Value -like "*icon*" -or $m.Value -like "*launcher*" -or $m.Value -like "*res/*" -or $m.Value -like "*label*") {
        Write-Output $m.Value
    }
}
