# Design

## Context

Downloads already work end to end (`download_model` with progress toasts, size/SHA-256 integrity on `ModelDownload`, deep links); what's missing is the data and the presentation. Handy's npm package `@handy-computer/models` ships `catalog.json` with 76 models: id, provider repo + revision, license, family, parameters, languages, capabilities, per-quant files (filename, size, SHA-256), curated flags, and fleurs WER accuracy plus RTF speed benchmarks. Handy vendors it into its app with a sync script — the same pattern fits here. The models documentation page is hand-written today and drifts from reality.

## Goals / Non-Goals

**Goals:**

- Data-only catalog updates via a sync script.
- Cards that answer "what am I downloading, from whom, how big, how good, how fast".
- Zero new backend surface — reuse `download_model` and its integrity checks.

**Non-Goals:**

- Editing or forking the handy catalog contents (upstream stays the source; the vibe layer only adds).
- Diarization/VAD models in the catalog (they stay behind their existing gates; can move later).
- Streaming server behavior (owned by `adopt-transcribe-cpp`).

## Decisions

- **Vendor, don't fetch.** Add `@handy-computer/models` as a pnpm dependency and copy its `catalog.json` into the desktop tree with a sync script (`pnpm sync:catalog` mirroring handy's), plus a CI check that fails when the copy drifts. No runtime network dependency, and releases stay reproducible.
- **A vibe layer in the same schema.** `catalog-vibe.json` holds non-handy entries (`vibe-app`, `ggerganov/whisper.cpp`, `ggml-org` VAD, `ivrit-ai`) in identical shape; a small merge concatenates both, deduplicating by the identity triple (repository, revision, filename). Provider display names come from a small owner map (vibe-app → "Vibe", handy-computer → "Handy", …).
- **Benchmarks become relative scores.** Normalize each entry's accuracy (fleurs WER, lower better) and speed (RTF) against the catalog best to render handy-style accuracy/speed bars, as handy's ModelCard does; missing benchmarks render no bar rather than a fake one.
- **Quantization defaults to Q8_0** (the quant handy benchmarks), selector lists the entry's available files with per-file size; downloads reuse the existing `ModelDownload` (size + SHA-256) so verification is already enforced by the backend.
- **Engine availability per family.** Each entry carries its family; availability compares against the server's engine identity, so entries ahead of the bundled engine render with the requirement stated and download disabled.

## Risks / Trade-offs

- [Upstream catalog schema changes] → The sync check pins the package version; a breaking upstream schema is a deliberate upgrade, and the vibe layer is versioned with the same schema field.
- [Benchmark data lags the engine] → Benchmarks are informational; nothing functional keys off them.
- [Catalog grows large in the bundle] → JSON only (~190 KB today); negligible.

## Migration Plan

Ship after `adopt-transcribe-cpp` so every catalog family loads. The docs page regenerates from the catalog in the same change; translations follow the `/translate` flow. Rollback is removing the catalog section — the URL download field stays regardless.

## Open Questions
