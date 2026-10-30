# Proposal

## Why

The vibe project publishes its models in two places users know by heart — the `vibe-app` HuggingFace org and the classic `ggerganov/whisper.cpp` repository the old docs page linked to — and users expect that set when they filter the app's catalog by the Vibe provider. Today that filter returns only the three models `vibe-app` hosts as GGUF; the whisper line (Tiny through Large v3 Turbo) hides under the Handy provider, because the `.bin` files upstream links to are containers the fork's engine refuses and the GGUF builds of those same models live in handy-computer repositories. The provider label tells the user where a file is hosted, not what the vibe project ships — and that is not the question the user is asking the filter.

## What Changes

- The whisper ASR line — all twelve GGUF builds the catalog already carries (Tiny, Tiny English, Base, Base English, Small, Small English, Medium, Medium English, Large v1, Large v2, Large v3, Large v3 Turbo) — displays under the **Vibe** provider, next to the three existing vibe-app entries. These are the GGUF builds of exactly the models `ggerganov/whisper.cpp` (and `vibe-app/whisper-large-v3-turbo-gguf`) publish as `.bin`.
- Provider grouping stops deriving purely from repository owner for these entries: a fork-owned list of official vibe picks overrides the label, so a handy-hosted file the vibe project ships still answers "Vibe". The override lives in fork code, not in the vendored handy catalog copy, so a `sync:catalog` refresh cannot drop it.
- Downloads, sizes, sha256 and capability metadata are unchanged — the entries are the same catalog rows users can already install; only their provider attribution changes.
- No new files are mirrored and no repository is added to the vibe layer; the merge dedup between handy and vibe layers is untouched.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `model-catalog` — provider attribution gains an official-picks override; the Vibe provider group becomes the vibe project's published model line rather than a repository-owner artifact.

## Impact

- **Specifications**: `model-catalog/spec.md` gains one requirement about provider attribution of official picks.
- **Code**: `desktop/src/lib/catalog.ts` (an id list plus a `providerName` branch), the catalog UI tests, possibly the docs generator if it renders providers.
- **Risks / scope boundaries**:
  - Scope is exactly the two HuggingFace locations the user named: the `vibe-app` org and `ggerganov/whisper.cpp`. Everything they publish that the engine can load is covered by this change; everything else they publish is `.bin`.
  - The `.bin` container stays unsupported here — loading the `.bin` files themselves (all of `ggerganov/whisper.cpp`, and `vibe-app/whisper-large-v3-turbo-gguf`, which despite its name ships a `.bin`) requires routing ASR onto the native whisper-rs stack, the deferred §4 item of `sync-upstream-main` and the immediate follow-up change. This change delivers the same models as working GGUF builds instead; the literal `.bin` artifact is not what gets downloaded.
  - The two diarization repositories in the vibe-app org are not ASR catalog entries and stay governed by the diarization model machinery (sync-upstream-main stage 2, already wired).
