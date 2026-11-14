#!/usr/bin/env bash
# Export the Apple signing secrets into the job environment.
set -euo pipefail

# A missing secret arrives here as an empty string, and tauri-action would then
# fail deep inside signing with an opaque message. Fail where the cause is clear.
for name in APPLE_CERTIFICATE APPLE_CERTIFICATE_PASSWORD APPLE_SIGNING_IDENTITY \
    APPLE_ID APPLE_PASSWORD APPLE_TEAM_ID; do
    value="${!name:-}"
    [ -n "$value" ] || {
        echo "::error::$name is empty; configure the secret or disable the sign-macos input" >&2
        exit 1
    }
    printf '%s=%s\n' "$name" "$value"
done >>"$GITHUB_ENV"
