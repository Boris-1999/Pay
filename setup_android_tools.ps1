$toolsDir = "c:\Users\pajan\.gemini\antigravity-ide\scratch\android-tools"
if (-not (Test-Path $toolsDir)) {
    New-Item -ItemType Directory -Path $toolsDir | Out-Null
}

$jreZip = Join-Path $toolsDir "jre17.zip"
$jreDir = Join-Path $toolsDir "jre17"
if (-not (Test-Path (Join-Path $jreDir "bin\java.exe"))) {
    Write-Host "Downloading Portable OpenJDK 17 JRE..."
    $jreUrl = "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.10+7/OpenJDK17U-jre_x64_windows_hotspot_17.0.10_7.zip"
    & curl.exe -L -o $jreZip $jreUrl
    Write-Host "Extracting JRE..."
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($jreZip, $toolsDir)
    Remove-Item $jreZip -Force
    $extractedJre = Get-ChildItem -Path $toolsDir -Directory -Filter "jdk*" | Select-Object -First 1
    if ($extractedJre) {
        Rename-Item $extractedJre.FullName "jre17"
    }
}

$btZip = Join-Path $toolsDir "build-tools.zip"
$btDir = Join-Path $toolsDir "build-tools"
if (-not (Test-Path (Join-Path $btDir "apksigner.bat"))) {
    Write-Host "Downloading Android SDK Build Tools 34..."
    $btUrl = "https://dl.google.com/android/repository/build-tools_r34-windows.zip"
    & curl.exe -L -o $btZip $btUrl
    Write-Host "Extracting Build Tools..."
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($btZip, $toolsDir)
    Remove-Item $btZip -Force
    $extractedBt = Get-ChildItem -Path $toolsDir -Directory -Filter "android*" | Select-Object -First 1
    if ($extractedBt) {
        Rename-Item $extractedBt.FullName "build-tools"
    }
}

Write-Host "Checking installed tools:"
$javaExe = Join-Path $toolsDir "jre17\bin\java.exe"
$apksignerBat = Join-Path $toolsDir "build-tools\apksigner.bat"
$zipalignExe = Join-Path $toolsDir "build-tools\zipalign.exe"

Write-Host "Java: $(Test-Path $javaExe) ($javaExe)"
Write-Host "Apksigner: $(Test-Path $apksignerBat) ($apksignerBat)"
Write-Host "Zipalign: $(Test-Path $zipalignExe) ($zipalignExe)"
