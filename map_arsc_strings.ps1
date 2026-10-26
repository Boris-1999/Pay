Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path "template_clean.apk"))
$entry = $zip.GetEntry("resources.arsc")
$s = $entry.Open()
$ms = New-Object System.IO.MemoryStream
$s.CopyTo($ms)
$s.Close()
$zip.Dispose()
$b = $ms.ToArray()

# Read String Pool
$strCount = [BitConverter]::ToInt32($b, 16)
$stringsStart = 8 + [BitConverter]::ToInt32($b, 28)
$isUtf8 = ([BitConverter]::ToInt32($b, 24) -band 0x100) -ne 0

$offsets = @()
for ($i = 0; $i -lt $strCount; $i++) {
    $offsets += [BitConverter]::ToInt32($b, 36 + $i * 4)
}

$resMap = @{}
for ($i = 0; $i -lt $strCount; $i++) {
    $pos = $stringsStart + $offsets[$i]
    if ($isUtf8) {
        $len = $b[$pos + 1]
        $str = [System.Text.Encoding]::UTF8.GetString($b, $pos + 2, $len)
    } else {
        $len = [BitConverter]::ToInt16($b, $pos) * 2
        $str = [System.Text.Encoding]::Unicode.GetString($b, $pos + 2, $len)
    }
    if ($str -like "res/*") {
        Write-Output "$i = $str"
    }
}
