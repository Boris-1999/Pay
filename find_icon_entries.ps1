Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
$entry = $zip.GetEntry("resources.arsc")
$s = $entry.Open()
$ms = New-Object System.IO.MemoryStream
$s.CopyTo($ms)
$s.Close()
$zip.Dispose()
$b = $ms.ToArray()

# In resources.arsc, find the offsets where "ic_launcher" appears
$text = [System.Text.Encoding]::UTF8.GetString($b)
# Search all entry names that end with .png or .xml in zip that might be launcher
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
foreach ($e in $zip.Entries) {
    if ($e.FullName -like "*icon*" -or $e.FullName -like "*launcher*" -or $e.FullName -like "*round*") {
        Write-Output $e.FullName
    }
}
$zip.Dispose()
