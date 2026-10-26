Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
$entry = $zip.GetEntry("AndroidManifest.xml")
$s = $entry.Open()
$ms = New-Object System.IO.MemoryStream
$s.CopyTo($ms)
$s.Close()
$zip.Dispose()
$b = $ms.ToArray()

# Search for the tag "application"
$pos = 0
while ($pos -lt ($b.Length - 4)) {
    $chunkType = [BitConverter]::ToInt16($b, $pos)
    $chunkSize = [BitConverter]::ToInt32($b, $pos + 4)
    if ($chunkType -eq 0x0102) { # START_TAG
        $tagIdx = [BitConverter]::ToInt32($b, $pos + 20)
        $attrCount = [BitConverter]::ToInt16($b, $pos + 28)
        # attrs start at $pos + 36
        for ($a = 0; $a -lt $attrCount; $a++) {
            $aOffset = $pos + 36 + $a * 20
            $aNameIdx = [BitConverter]::ToInt32($b, $aOffset + 4)
            $aType = [BitConverter]::ToInt32($b, $aOffset + 12) -shr 24
            $aData = [BitConverter]::ToInt32($b, $aOffset + 16)
            Write-Output "TagIdx $tagIdx AttrNameIdx $aNameIdx Type $aType Data 0x$($aData.ToString('X8'))"
        }
    }
    if ($chunkSize -le 0) { break }
    $pos += $chunkSize
}
