#!/usr/bin/env bash
# Export the Apple signing secrets into the job environment.
set -euo pipefail

{
    echo "APPLE_CERTIFICATE=${APPLE_CERTIFICATE-}"
    echo "APPLE_CERTIFICATE_PASSWORD=${APPLE_CERTIFICATE_PASSWORD-}"
    echo "APPLE_SIGNING_IDENTITY=${APPLE_SIGNING_IDENTITY-}"
    echo "APPLE_ID=${APPLE_ID-}"
    echo "APPLE_PASSWORD=${APPLE_PASSWORD-}"
    echo "APPLE_TEAM_ID=${APPLE_TEAM_ID-}"
} >>"$GITHUB_ENV"
