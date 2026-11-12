# Sign Windows binaries

Windows signing in this repository runs through a small signing server on the machine that holds the YubiKey. The release runner uploads each binary over a Cloudflare tunnel, `jsign` signs it locally with the YubiKey, and the signed bytes come back. The private key never leaves the token and the CI runner never needs the certificate.

The certificate itself is provisioned once per [Provision a YubiKey for signing](sign-with-a-yubikey.md).

## How the pieces connect

| Piece | Role |
| --- | --- |
| `scripts/sign.py serve` | Runs on the YubiKey machine: an HTTP endpoint plus a Cloudflare tunnel, calling `jsign` for each upload |
| `scripts/sign.py sign <file>` | Runs on the CI runner as Tauri's `signCommand`: uploads the file, writes the signed bytes back in place |
| `desktop/src-tauri/tauri.windows.signing.conf.json` | Wires `uv.exe run ../../scripts/sign.py sign %1` as the Windows `signCommand` |
| `.github/workflows/release.yml` | Passes `SIGN_ENABLED`, `SIGN_TUNNEL_URL`, and `SIGN_TUNNEL_SECRET`; selects the signing config when the `sign-windows` input is on |

The client is a dry run unless `SIGN_ENABLED=true`. It currently matches every filename (`SIGN_PATTERNS = ["*"]`); the narrow whitelist is a TODO in the script, so a signing run touches every file Tauri offers.

## On the YubiKey machine

Install `jsign` and `cloudflared`, put them on `PATH`, and make sure the YubiKey is physically connected. The server needs these environment variables:

```text
TUNNEL_URL=https://sign.example.com
CF_TUNNEL_TOKEN=...
PIV_PIN=...
TUNNEL_SECRET=...        # optional; generated when absent
```

Start the server:

```console
uv run --env-file .env.local scripts/sign.py serve
```

It prints the tunnel URL and the client exports it expects. Keep the process running while the release builds. `SIGN_TUNNEL_SECRET` on the client must equal `TUNNEL_SECRET` on the server; a mismatch is rejected with `401`.

## GitHub secrets

| Secret | Value |
| --- | --- |
| `SIGN_TUNNEL_URL` | The tunnel URL printed by `serve` |
| `SIGN_TUNNEL_SECRET` | The same secret the server uses |

These are separate from the YubiKey-side `.env`; the runner only needs the tunnel address and the shared secret.

## Sign a release

1. Start the signing server on the YubiKey machine.
1. Dispatch the Release workflow with **Sign Windows binaries via remote YubiKey** enabled.
1. Confirm the Windows job logs show `[sign] SIGNING` for the binaries instead of `[sign] DRY RUN`.

Without the input, `SIGN_ENABLED` is `false` and the release is unsigned. With the input, the workflow adds `--config src-tauri/tauri.windows.signing.conf.json`.

## Manual signing

With the server running and the client environment set:

```console
SIGN_ENABLED=true uv run scripts/sign.py sign path\to\file.exe
```

## Verify

```powershell
signtool verify /pa /v path\to\file.exe
```

Or with the full path to the SDK tool:

```powershell
& "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\signtool.exe" verify /pa /v path\to\file.exe
```

Expected result: the signer is your certificate subject, the chain is trusted, a timestamp is present, and there are no warnings or errors.

## Troubleshooting

- **`Missing tools: jsign, cloudflared`** — install both and put them on `PATH` for the `serve` process.
- **`Missing env vars`** — `TUNNEL_URL`, `CF_TUNNEL_TOKEN`, and `PIV_PIN` are required on the server side; `SIGN_TUNNEL_URL` and `SIGN_TUNNEL_SECRET` on the client side.
- **`401 unauthorized`** — the client secret and the server `TUNNEL_SECRET` differ.
- **`jsign failed`** — the token is absent, the PIV PIN is wrong, or the certificate is not in slot `9c`. See [Provision a YubiKey for signing](sign-with-a-yubikey.md).
- **Timeouts** — the tunnel is not reachable from the runner, or the signing machine is asleep. The client waits 120 seconds per file.
