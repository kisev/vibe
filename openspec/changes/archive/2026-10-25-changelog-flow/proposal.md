# Proposal

## Why

GitHub releases in the fork carry no human notes (dev releases say "Dev build of main at sha"), and the accumulated work since 3.2.2 (transcribe.cpp adoption, device management, the model catalog UI) is invisible to anyone installing a build. The project already has a working changelog pipeline — per-version files in `i18n/changelog/`, a website page, 14 locales — so the gap is not infrastructure, it is flow: nothing collects changes between releases and nothing feeds release notes from that collection.

## What Changes

- An `i18n/changelog/unreleased.md` entry, in the exact existing format, accumulates changes as they land; the website changelog renders it above all released versions until the next release renames it.
- Release notes for GitHub releases come from the same entry — one source of truth, no separate writing step.
- A one-time task gives the surviving dev release meaningful notes describing everything since 3.2.2.
- Sections stay `## New / Improved / Fixed`; versions stay semver; translations follow the existing `/translate` flow at release time.

## Capabilities

### New Capabilities

- `changelog`: how changes are collected between releases and become both the website changelog and GitHub release notes.

### Modified Capabilities

_None._
