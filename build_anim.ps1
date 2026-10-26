$raw = Get-Content -Raw -Path "success-animation.json"
$out = "window.SUCCESS_LOTTIE_DATA = " + $raw + ";"
[System.IO.File]::WriteAllText((Join-Path (Get-Location) "animation-data.js"), $out, [System.Text.Encoding]::UTF8)
Write-Output "SUCCESS: animation-data.js written."
