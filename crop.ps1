Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('C:\Users\pajan\.gemini\antigravity-ide\brain\3e16ef14-25dc-40b9-9c96-e7c6d4a61de8\.user_uploaded\media_1792841254299.png')
$crop = New-Object System.Drawing.Bitmap($img.Width, 300)
$g = [System.Drawing.Graphics]::FromImage($crop)
$g.DrawImage($img, [System.Drawing.Rectangle]::new(0, 0, $img.Width, 300), [System.Drawing.Rectangle]::new(0, $img.Height - 300, $img.Width, 300), [System.Drawing.GraphicsUnit]::Pixel)
$crop.Save('c:\Users\pajan\.gemini\antigravity-ide\scratch\demowallet-app\bottom_crop.png')
$g.Dispose()
$crop.Dispose()
$img.Dispose()
Write-Output "Cropped bottom successfully"
