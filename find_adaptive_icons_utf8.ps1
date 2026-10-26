Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
foreach ($e in $zip.Entries) {
    if ($e.FullName -like "res/*.xml") {
        $s = $e.Open()
        $ms = New-Object System.IO.MemoryStream
        $s.CopyTo($ms)
        $s.Close()
        $b = $ms.ToArray()
        $txt = [System.Text.Encoding]::UTF8.GetString($b)
        if ($txt -like "*adaptive-icon*" -or $txt -like "*foreground*" -or $txt -like "*background*") {
            Write-Output "$($e.FullName) is adaptive icon"
        }
    }
}
$zip.Dispose()
