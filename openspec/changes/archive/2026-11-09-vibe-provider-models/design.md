# Design

## Context

`desktop/src/lib/catalog.ts` merges two layers: the vendored handy catalog (73 ASR models, byte-identical upstream copy, refreshed by `task sync:catalog` with a staleness check in CI) and the fork's `catalog-vibe.json` layer (3 ASR + 1 VAD entry, deduplicated against handy by file identity). The provider label shown in the UI derives from the repository owner in `providerName()` (`vibe-app` → "Vibe", `handy-computer` → "Handy"). The whisper GGUF builds the vibe download page has always pointed at (via `ggerganov/whisper.cpp`, whose `.bin` files the engine refuses) all live in `handy-computer/*-gguf` repositories — hence "Handy", which is not what a user looking for "vibe's models" searches for.

## Goals / Non-Goals

- **Goal:** filtering by Vibe shows everything the two named HuggingFace locations publish that the engine can load: the 3 vibe-app entries plus the 12 whisper GGUF entries already in the catalog.
- **Goal:** the attribution survives a handy-catalog refresh unchanged.
- **Goal:** no duplicate rows — the same file stays one entry; only its provider group changes.
- **Non-Goal:** loading `.bin` containers (native-stack ASR routing, deferred §4 of sync-upstream-main; the immediate follow-up change after this one).
- **Non-Goal:** mirroring files into the `vibe-app` org or re-hosting anything.
- **Non-Goal:** models outside the two named projects (the old download page's language-optimised picks among them).

## Decisions

- **A fork-side id list, not a field in the vendored catalog.** The override is a constant in `catalog.ts` (`VIBE_PICK_IDS` or similar): the handy entry ids `whisper-tiny`, `whisper-tiny.en`, `whisper-base`, `whisper-base.en`, `whisper-small`, `whisper-small.en`, `whisper-medium`, `whisper-medium.en`, `whisper-large`, `whisper-large-v2`, `whisper-large-v3`, `whisper-large-v3-turbo`. Editing `handy-catalog.json` itself would be overwritten by the next `sync:catalog` and trip the staleness gate; `catalog-vibe.json` cannot express "re-label someone else's entry".
- **`providerName` consults the list before the owner map.** An id in the list renders "Vibe"; everything else keeps today's owner-derived name. The provider filter and grouping in `models-catalog.tsx` derive from the same function, so no UI change is needed beyond tests.
- **Vibe-layer entries stay owner-derived.** The three `vibe-*` entries already land under "Vibe" through `vibe-app`; they do not join the list.
- **The existing `curated` field is untouched.** It means handy's own curation (29 models) — different semantics, wrong tool.

## Risks / Trade-offs

- [User expects the file from the old links and gets a GGUF build] → the card links to the actual repository (spec scenario: hosting origin stays visible), and the download is the same model in the container the engine loads; the `.bin` limitation is documented, not hidden.
- [A picked id disappears upstream] → the list entry becomes inert (no catalog row matches it); the spec accepts silent disappearance rather than a build failure, since a missing model cannot be downloaded either way.
- [Two providers' whisper entries could confuse dedup later] → the override changes display only; file-identity dedup and installed-file matching are untouched.

## Migration Plan

None: a display-only relabel. No stored preferences, file paths, or download URLs change.

## Open Questions

None blocking. Whether the Vibe group should also carry a badge distinguishing "hosted by vibe-app" from "picked by vibe" is a cosmetic follow-up the UI can grow later.
