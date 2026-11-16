# Proposal

## Why

The app version in **Settings → General** is a single long token (`1.0.0-local.20261113.e3d2b9d7`). The row does not wrap, so the build identifier the user needs for a bug report is cut off, and with local builds the version only got longer.

## What Changes

- The version value wraps or is shown in full on its own line, selectable, so it can be copied; no horizontal clipping in any locale or window width.
- The same treatment for the commit/build identifiers where they appear beside it.

## Capabilities

- `settings-ui` (new): how the settings surfaces present values.

## Impact

- `desktop/src/pages/settings/sections/general.tsx` (or the version row's component), a test for long values, and the locale catalogs if a label changes.
