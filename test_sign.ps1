Add-Type -AssemblyName System.Security
$cert = New-SelfSignedCertificate -Subject "CN=GPay, O=Google, C=US" -CertStoreLocation "Cert:\CurrentUser\My" -KeyAlgorithm RSA -KeyLength 2048 -HashAlgorithm SHA256 -NotAfter (Get-Date).AddYears(25)
Write-Output "Certificate created: $($cert.Thumbprint)"

$data = [System.Text.Encoding]::UTF8.GetBytes("Test signature data")
$content = New-Object System.Security.Cryptography.Pkcs.ContentInfo (,$data)
$signedCms = New-Object System.Security.Cryptography.Pkcs.SignedCms $content, $true # detached signature
$signer = New-Object System.Security.Cryptography.Pkcs.CmsSigner $cert
$signedCms.ComputeSignature($signer)
$sigBytes = $signedCms.Encode()
Write-Output "Signature length: $($sigBytes.Length) bytes"
