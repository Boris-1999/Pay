Add-Type -AssemblyName System.IO.Compression.FileSystem
$apk = [System.IO.Compression.ZipFile]::OpenRead("c:\Users\pajan\.gemini\antigravity-ide\scratch\demowallet-app\GPay.apk")
$entry = $apk.GetEntry("AndroidManifest.xml")
$stream = $entry.Open()
$ms = New-Object System.IO.MemoryStream
$stream.CopyTo($ms)
$bytes = $ms.ToArray()
$ms.Dispose()
$stream.Dispose()
$apk.Dispose()

# Find strings in binary xml
$strList = @()
for ($i = 0; $i -lt $bytes.Length - 4; $i++) {
    if ($bytes[$i] -ge 32 -and $bytes[$i] -le 126 -and $bytes[$i+1] -ge 32 -and $bytes[$i+1] -le 126) {
        $start = $i
        while ($i -lt $bytes.Length -and $bytes[$i] -ge 32 -and $bytes[$i] -le 126) {
            $i++
        }
        $len = $i - $start
        if ($len -ge 4) {
            $s = [System.Text.Encoding]::ASCII.GetString($bytes, $start, $len)
            $strList += $s
        }
    }
}
$strList | Select-Object -Unique
