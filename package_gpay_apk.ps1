# package_gpay_apk.ps1 - Safe extractor, packager, and signer
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Security
Add-Type -AssemblyName System.Drawing

$projectDir = Resolve-Path "."
$templateApk = Join-Path $projectDir "template_clean.apk"
$outputApk = Join-Path $projectDir "GPay.apk"
$stagingDir = Join-Path $projectDir "staging_apk"

if (Test-Path $stagingDir) {
    Remove-Item $stagingDir -Recurse -Force
}
New-Item -ItemType Directory -Path $stagingDir | Out-Null

Write-Host "1. Safely extracting template APK entries..."
$zip = [System.IO.Compression.ZipFile]::OpenRead($templateApk)
foreach ($entry in $zip.Entries) {
    # Skip old signatures
    if ($entry.FullName -like "META-INF/*") { continue }
    
    $destPath = Join-Path $stagingDir $entry.FullName.Replace("/", "\")
    $parent = [System.IO.Path]::GetDirectoryName($destPath)
    if (-not (Test-Path $parent)) {
        [System.IO.Directory]::CreateDirectory($parent) | Out-Null
    }
    
    # If not a directory entry
    if (-not [string]::IsNullOrEmpty($entry.Name)) {
        try {
            $stream = $entry.Open()
            $fileStream = [System.IO.File]::Create($destPath)
            $stream.CopyTo($fileStream)
            $fileStream.Close()
            $stream.Close()
        } catch {
            # In case of Windows case-collision, skip or overwrite
        }
    }
}
$zip.Dispose()

Write-Host "2. Setting up META-INF..."
$metaInf = Join-Path $stagingDir "META-INF"
if (-not (Test-Path $metaInf)) {
    New-Item -ItemType Directory -Path $metaInf | Out-Null
}

Write-Host "3. Patching app title in resources.arsc..."
$arscPath = Join-Path $stagingDir "resources.arsc"
if (Test-Path $arscPath) {
    $arscBytes = [System.IO.File]::ReadAllBytes($arscPath)
    $oldStr = [System.Text.Encoding]::UTF8.GetBytes("My WebView")
    $newStr = [System.Text.Encoding]::UTF8.GetBytes("GPay      ")
    
    for ($i = 0; $i -le ($arscBytes.Length - $oldStr.Length); $i++) {
        $match = $true
        for ($j = 0; $j -lt $oldStr.Length; $j++) {
            if ($arscBytes[$i + $j] -ne $oldStr[$j]) {
                $match = $false
                break
            }
        }
        if ($match) {
            Write-Host "Patched 'My WebView' to 'GPay' at offset $i"
            for ($j = 0; $j -lt $newStr.Length; $j++) {
                $arscBytes[$i + $j] = $newStr[$j]
            }
        }
    }
    [System.IO.File]::WriteAllBytes($arscPath, $arscBytes)
}

Write-Host "4. Copying GPay web assets into APK..."
$webFiles = @(
    "index.html", "index.css", "style.css", "app.js", "manifest.json", "app-icon.png",
    "user-profile.jpg", "ragupathi.jpg", "bsnl-logo.png", "vi-logo.jpg", "airtel-logo.jpg",
    "jio-logo.svg", "gpay.mp3", "ubi-symbol.png", "upi-powered-by.png", "animation-data.js",
    "jsQR.min.js", "lottie.min.js", "qrcode.min.js", "sw.js"
)

$targetDirs = @(
    (Join-Path $stagingDir "assets\demo"),
    (Join-Path $stagingDir "assets\local"),
    (Join-Path $stagingDir "assets\web")
)

foreach ($td in $targetDirs) {
    if (-not (Test-Path $td)) {
        New-Item -ItemType Directory -Path $td | Out-Null
    }
    foreach ($wf in $webFiles) {
        $src = Join-Path $projectDir $wf
        if (Test-Path $src) {
            Copy-Item $src (Join-Path $td $wf) -Force
        }
    }
}

Write-Host "5. Updating settings.json & config.json..."
$settingsJsonPath = Join-Path $stagingDir "assets\settings.json"
$settingsContent = @'
{
  "sites": [
    {
      "url": "https://appassets.androidplatform.net/sites/demo/index.html",
      "title": "GPay"
    }
  ],
  "other": "https://appassets.androidplatform.net/sites/demo/index.html",
  "match": [
    ["host", "equals", "appassets.androidplatform.net"]
  ],
  "skip": [],
  "remote_debug": false,
  "console_log": false,
  "js_interface": true,
  "context_menu": false,
  "not_matching": false,
  "local_sites": true,
  "update_zip": "",
  "web_settings": {
    "JavaScriptEnabled": true
  },
  "source": "assets",
  "timestamp": "2026-10-25T22:00:00Z"
}
'@
[System.IO.File]::WriteAllText($settingsJsonPath, $settingsContent, [System.Text.Encoding]::UTF8)

$configJsonPath = Join-Path $stagingDir "assets\local\config.json"
$configContent = @'
{
  "sites": {
    "demo/index.html": "GPay"
  },
  "bundles": [],
  "prefix": "https://appassets.androidplatform.net/sites/"
}
'@
[System.IO.File]::WriteAllText($configJsonPath, $configContent, [System.Text.Encoding]::UTF8)

Write-Host "6. Updating launcher icons with Google Pay logo..."
$iconSourcePath = Join-Path $projectDir "app-icon.png"
if (Test-Path $iconSourcePath) {
    $srcImg = [System.Drawing.Image]::FromFile($iconSourcePath)
    
    $resFolder = Join-Path $stagingDir "res"
    $pngFiles = Get-ChildItem -Path $resFolder -Filter "*.png"
    foreach ($png in $pngFiles) {
        if ($png.Name -notlike "*.9.png") {
            try {
                $targetImg = [System.Drawing.Image]::FromFile($png.FullName)
                $w = $targetImg.Width
                $h = $targetImg.Height
                $targetImg.Dispose()
                
                if ($w -eq $h -and $w -ge 32 -and $w -le 512) {
                    $bmp = New-Object System.Drawing.Bitmap $w, $h
                    $g = [System.Drawing.Graphics]::FromImage($bmp)
                    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                    $g.DrawImage($srcImg, 0, 0, $w, $h)
                    $g.Dispose()
                    $bmp.Save($png.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
                    $bmp.Dispose()
                }
            } catch {}
        }
    }
    $srcImg.Dispose()
}

Write-Host "7. Calculating SHA-256 digests for all files..."
$manifestLines = New-Object System.Collections.Generic.List[string]
$manifestLines.Add("Manifest-Version: 1.0")
$manifestLines.Add("Created-By: 1.0 (Android)")
$manifestLines.Add("")

$sfLines = New-Object System.Collections.Generic.List[string]
$sfLines.Add("Signature-Version: 1.0")
$sfLines.Add("Created-By: 1.0 (Android)")

$sha256 = [System.Security.Cryptography.SHA256]::Create()
$allFiles = Get-ChildItem -Path $stagingDir -Recurse -File | Where-Object { $_.FullName -notlike "*\META-INF\*" }

$sortedFiles = $allFiles | Sort-Object { $_.FullName.Substring($stagingDir.Length + 1).Replace("\", "/") }

foreach ($file in $sortedFiles) {
    $relPath = $file.FullName.Substring($stagingDir.Length + 1).Replace("\", "/")
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $hash = [Convert]::ToBase64String($sha256.ComputeHash($bytes))
    
    $manifestLines.Add("Name: $relPath")
    $manifestLines.Add("SHA-256-Digest: $hash")
    $manifestLines.Add("")
    
    $entryBlockBytes = [System.Text.Encoding]::UTF8.GetBytes("Name: $relPath`r`nSHA-256-Digest: $hash`r`n`r`n")
    $sfEntryHash = [Convert]::ToBase64String($sha256.ComputeHash($entryBlockBytes))
    $sfLines.Add("Name: $relPath")
    $sfLines.Add("SHA-256-Digest: $sfEntryHash")
    $sfLines.Add("")
}

$manifestText = ($manifestLines -join "`r`n") + "`r`n"
$manifestBytes = [System.Text.Encoding]::UTF8.GetBytes($manifestText)
$manifestHash = [Convert]::ToBase64String($sha256.ComputeHash($manifestBytes))

$sfLines.Insert(2, "SHA-256-Digest-Manifest: $manifestHash")
$sfText = ($sfLines -join "`r`n") + "`r`n"
$sfBytes = [System.Text.Encoding]::UTF8.GetBytes($sfText)

[System.IO.File]::WriteAllBytes((Join-Path $metaInf "MANIFEST.MF"), $manifestBytes)
[System.IO.File]::WriteAllBytes((Join-Path $metaInf "CERT.SF"), $sfBytes)

Write-Host "8. Signing with PKCS#7 (CERT.RSA)..."
$cert = New-SelfSignedCertificate -Subject "CN=GPay, O=Google, C=US" -CertStoreLocation "Cert:\CurrentUser\My" -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 -NotAfter (Get-Date).AddYears(25)
$content = New-Object System.Security.Cryptography.Pkcs.ContentInfo (,$sfBytes)
$signedCms = New-Object System.Security.Cryptography.Pkcs.SignedCms $content, $true
$signer = New-Object System.Security.Cryptography.Pkcs.CmsSigner $cert
$signedCms.ComputeSignature($signer)
$rsaBytes = $signedCms.Encode()
[System.IO.File]::WriteAllBytes((Join-Path $metaInf "CERT.RSA"), $rsaBytes)

Write-Host "9. Packaging into GPay.apk with forward slashes..."
if (Test-Path $outputApk) {
    Remove-Item $outputApk -Force
}

$zipArchive = [System.IO.Compression.ZipFile]::Open($outputApk, [System.IO.Compression.ZipArchiveMode]::Create)
$allStagedFiles = Get-ChildItem -Path $stagingDir -Recurse -File
foreach ($file in $allStagedFiles) {
    $relPath = $file.FullName.Substring($stagingDir.Length + 1).Replace("\", "/")
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zipArchive, $file.FullName, $relPath, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
}
$zipArchive.Dispose()

# Mirror to d:\clab\
Copy-Item $outputApk -Destination "d:\clab\GPay.apk" -Force

$finalSize = (Get-Item $outputApk).Length
Write-Host "SUCCESS! Generated GPay.apk ($finalSize bytes)"
Write-Host "Location: $outputApk"
Write-Host "Mirrored to: d:\clab\GPay.apk"
