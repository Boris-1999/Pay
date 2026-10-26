Add-Type -AssemblyName System.IO.Compression.FileSystem
$apk = [System.IO.Compression.ZipFile]::OpenRead("c:\Users\pajan\.gemini\antigravity-ide\scratch\demowallet-app\GPay.apk")
$entries = $apk.Entries | ForEach-Object { $_.FullName }
$apk.Dispose()

Write-Output "=== LIB ENTRIES ==="
$entries | Where-Object { $_ -like "lib/*" }

Write-Output "=== META-INF ==="
$entries | Where-Object { $_ -like "META-INF/*" }

Write-Output "=== TOTAL ENTRIES ==="
$entries.Count
