# Provision a YubiKey for signing

This page binds an SSL.com code-signing certificate to a YubiKey FIPS and signs a test binary locally. The private key is generated inside the token and never leaves it. CI uses the same token through the signing server described in [Sign Windows binaries](sign-windows-binaries.md).

## Requirements

- A Windows machine with physical USB access (RDP does not work with YubiKey PIV)
- A YubiKey FIPS 5.4.x (5.4.3 confirmed)
- An SSL.com code-signing certificate (Personal or Individual)
- Administrator access on Windows

## Install the tools

Install **YubiKey Manager** from Yubico; it provides `ykman`. Install `jsign` and the Windows SDK (for `signtool`). Add them to the session `PATH`:

```powershell
$env:PATH += ";C:\Program Files\Yubico\YubiKey Manager"
$env:PATH += ";C:\Program Files\Yubico\Yubico PIV Tool\bin"
$signToolDir = (Get-ChildItem "C:\Program Files (x86)\Windows Kits\10\bin\*\x64\signtool.exe" | Sort-Object FullName -Descending | Select-Object -First 1).DirectoryName
$env:PATH += ";$signToolDir"
```

Verify:

```powershell
ykman list
ls "C:\Program Files\Yubico\Yubico PIV Tool\bin\libykcs11.dll"
signtool /?
```

## Reset the PIV application

This is destructive: it deletes every PIV key and certificate on the token. Do it only at the start.

```text
ykman piv reset
```

The defaults after a reset are PIN `123456`, PUK `12345678`, and the standard management key. Change the PIN if the token will be shared:

```text
ykman piv access change-pin
```

The PIN must be six to eight digits.

## Generate the key on the token

Use slot `9c` (Digital Signature), ECC P-256, with touch policy `never` so CI can sign unattended. Token presence is still required.

```text
ykman piv keys generate \
 --algorithm ECCP256 \
 --pin-policy once \
 --touch-policy never \
 9c pubkey.pem
```

Press Enter for the management key prompt to use the default.

## Create the CSR

```text
ykman piv certificates request 9c pubkey.pem codesign.csr -s "CN=Your Name"
```

Enter the PIN when prompted.

## Attest the key

Generate the attestation for slot `9c` and export the intermediate from slot `f9`:

```text
ykman piv keys attest 9c attestation.crt
ykman piv certificates export f9 attestation-intermediate.crt
```

## Re-issue the certificate on SSL.com

1. Log in to SSL.com and open **Orders → Code Signing → Manage → Attestation**.
1. Paste `attestation.crt` and `attestation-intermediate.crt` and submit.
1. Wait for **Successful attestation**.
1. SSL.com re-issues the certificate bound to the token; no additional payment is required.
1. Download the **YubiKey (DER)** format and confirm the certificate is ECC, not RSA.

## Import the certificate

```text
ykman piv certificates import 9c codesign.der
ykman piv certificates list
```

The certificate must appear in slot `9c` and match the key. Remove any old signature before re-signing a binary:

```powershell
signtool remove /s main.exe
```

## Sign locally

```powershell
jsign `
  --storetype YUBIKEY `
  --storepass <PIV_PIN> `
  --alias "X.509 Certificate for Digital Signature" `
  --tsaurl http://timestamp.digicert.com `
  main.exe
```

`--storepass` is the PIV PIN (default `123456`). Successful output ends with `Adding Authenticode signature to main.exe`. Verify:

```powershell
signtool verify /pa /v main.exe
```

## Notes

- `touch-policy never` allows automation, but the token must be present.
- RDP cannot reach a YubiKey PIV; use physical access.
- There are no per-signing limits with local hardware signing.
- Renewal reuses the same token once the new certificate is imported.
- For CI, keep the token on a machine running `scripts/sign.py serve`; the runner uploads binaries and never holds the certificate. See [Sign Windows binaries](sign-windows-binaries.md).
