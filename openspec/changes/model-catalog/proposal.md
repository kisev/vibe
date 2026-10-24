# Proposal

## Why

Today the only downloadable-model surfaces are a paste-a-URL field and a hand-written docs page: no sizes, no languages, no benchmarks, no one-click downloads, and no way to see that the same model exists from several providers with different weights. Handy already publishes a complete, benchmarked model catalog (`@handy-computer/models`) for the same engine families this fork runs after `adopt-transcribe-cpp` — the data and the presentation pattern exist; vibe needs to adopt them and add its own layer.

## What Changes

- The app bundles a model catalog combining the vendored handy catalog and a vibe-authored layer for non-handy providers (`vibe-app`, `ggerganov/whisper.cpp`, `ggml-org`, `ivrit-ai`), kept mechanically in sync with the upstream package like handy itself does.
- A catalog entry is identified by provider repository + revision + file, so equally named models from different providers coexist as separate entries (e.g. a vibe mirror and a handy build of the same whisper variant).
- Settings → Models gains a catalog section: cards showing provider, size in MB, supported languages, streaming, translation, and accuracy/speed from the published benchmarks; a quantization selector where a model ships in several; one-click download with integrity verification (size + SHA-256).
- Models the installed engine cannot load are shown but marked with the reason (engine requirement), not hidden.
- The models documentation page is regenerated from the catalog so docs and app agree.

## Capabilities

### New Capabilities

- `model-catalog`: the bundled catalog of downloadable models, its identity scheme, the metadata users see, and downloads with integrity checks.

### Modified Capabilities

## Impact

- Desktop frontend: catalog data modules (vendored handy JSON + vibe layer + merge/filter), Settings → Models catalog section, download flow reuse (`download_model` with integrity), i18n keys; a sync script and a docs generation script.
- No server changes; downloads use the existing backend command.
- Depends on `adopt-transcribe-cpp` for engine availability of the new families.
