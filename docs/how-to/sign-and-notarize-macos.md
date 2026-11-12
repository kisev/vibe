# Sign and notarize macOS builds

Signing and notarizing for distribution outside the App Store needs an Apple Developer ID Application certificate. The repository's macOS bundle already has the hardened runtime and entitlements configured; this page covers the certificate, the signing environment, and the release workflow input.

Prerequisite: an approved Apple Developer Program enrollment.

## Create the certificate

1. In **Keychain Access → Certificate Assistant → Request a Certificate from a Certificate Authority**, enter your email and common name, select **Saved to disk**, and save the `.certSigningRequest`.
1. Open [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/certificates/list), click **Create a Certificate**, choose **Developer ID Application**, and select the **G2 Sub-CA**.
1. Upload the CSR, download the resulting `.cer`, and double-click it to install it into the **login** keychain.
1. Confirm it appears under **My Certificates** with an expandable private key.

Only the Apple Developer Account Holder can create Developer ID Application certificates.

## Install the intermediate certificate

The G2 chain needs Apple's intermediate certificate, which macOS does not always ship. Without it `security find-identity -p codesigning` reports `1 matching identity, 0 valid identities`; that looks like a permissions problem but is a broken chain.

Download **Developer ID - G2** (and **Apple Root CA - G2** if it is missing) from [Apple Certificate Authority](https://www.apple.com/certificateauthority/), install both into the **login** keychain, and leave trust at **Use System Defaults**.

Verify:

```console
security find-identity -v -p codesigning
```

The expected output is `1 valid identity found`.

## Sign locally

Tauri reads the identity from the environment:

```console
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"
```

Then build:

```console
chore build
```

Tauri signs every binary with `codesign` and applies the hardened runtime. Verify:

```console
codesign --verify --deep --strict /path/to/vibe.app
spctl --assess --type exec /path/to/vibe.app
```

## Notarize

Notarization is required for Developer ID distribution. Tauri submits, waits, and staples automatically when the credentials are present.

Create an app-specific password at [appleid.apple.com](https://appleid.apple.com) under **Sign-In and Security → App-Specific Passwords**, then:

```console
export APPLE_ID="your@email.com"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="TEAMID"
```

The team ID is the 10-character code in parentheses in the `security find-identity` output.

The first notarization for a new app or certificate can take hours. You can interrupt the Tauri build after the upload finishes and check progress directly:

```console
xcrun notarytool history --apple-id "$APPLE_ID" --password "$APPLE_PASSWORD" --team-id "$APPLE_TEAM_ID"
xcrun notarytool log <submission-id> --apple-id "$APPLE_ID" --password "$APPLE_PASSWORD" --team-id "$APPLE_TEAM_ID"
```

The log is available only after Apple finishes processing. If notarization stays stuck for 12+ hours, contact Apple Developer Support. After **Accepted**, staple the ticket if Tauri did not:

```console
xcrun stapler staple /path/to/vibe.app
```

Stapling covers every binary in the bundle.

## CI

The release workflow takes a **Sign and notarize macOS binaries** input, off by default. With it on, `.github/workflows/release.yml` exports the secrets through `task ci:macos-signing-env` before the Tauri build.

| Secret | Value |
| --- | --- |
| `APPLE_CERTIFICATE` | Base64 of the exported `.p12` |
| `APPLE_CERTIFICATE_PASSWORD` | The `.p12` export password |
| `APPLE_SIGNING_IDENTITY` | `Developer ID Application: Your Name (TEAMID)` |
| `APPLE_ID` | Apple ID email |
| `APPLE_PASSWORD` | App-specific password |
| `APPLE_TEAM_ID` | 10-character team ID |

Export the certificate from Keychain Access as `.p12`, then base64-encode it:

```console
openssl base64 -A -in certificate.p12 -out certificate-base64.txt
gh secret set APPLE_CERTIFICATE -b "<contents of certificate-base64.txt>"
gh secret set APPLE_CERTIFICATE_PASSWORD -b "your-p12-password"
gh secret set APPLE_SIGNING_IDENTITY -b "Developer ID Application: Your Name (TEAMID)"
gh secret set APPLE_ID -b "your@email.com"
gh secret set APPLE_PASSWORD -b "your-app-specific-password"
gh secret set APPLE_TEAM_ID -b "TEAMID"
rm certificate.p12 certificate-base64.txt
```

`gh secret set` targets the repository in the current directory. Check it with `gh repo view --json nameWithOwner -q .nameWithOwner`.

## Troubleshooting

- **`1 matching identity, 0 valid identities`** — the G2 intermediate is missing. Install it and leave trust at the system default.
- **`internal error in Code Signing subsystem`** — usually the same broken chain; fix trust first.
- **Notarization `401`** — you used the Apple ID password instead of an app-specific password.
- **Certificate missing from My Certificates** — the certificate is not associated with a private key. Recreate the CSR and certificate on the same Mac that generated the key.
- **Keychain ACLs** — reset them with `security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "PASSWORD" ~/Library/Keychains/login.keychain-db`, then restart `securityd`.
