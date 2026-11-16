# Design

## Context

Diarization runs NVIDIA Nemotron-3-Diarization (`nemotron-3-diarization-Q8_0.gguf`) and is auxiliary: `listInstalledModels` filters it out of the catalog (`isAuxiliaryModelFile`), so settings never showed which model the app uses, whether it is downloaded, or that the app downloads one. The only surface was the question the preference migration asks when the switch is turned on. The startup migration also swept the superseded sortformer/ONNX artifacts only after a replacement download, so a machine that already had the current GGUF kept the leftovers forever. See `proposal.md` and `specs/model-catalog/spec.md`.

## Goals / Non-Goals

**Goals:**

- The Models page names the speaker-separation model, its size, and whether it is installed.
- A missing model offers the same verified download the rest of the app uses; an installed one can be revealed in the folder.
- Startup removes the superseded diarization artifacts whenever the current model is in place, whatever the speaker-separation preference says.

**Non-Goals:**

- Making the auxiliary model a catalog entry, selectable or comparable.
- Any server or transcription behavior change.
- A general model manager or a per-file delete UI.

## Decisions

- **A dedicated group, not a catalog entry.** The catalog stays a chooser of models the engine can load, and the diarization model is not one. `SpeakerSeparationModelGroup` renders its own `SettingsGroup` above the comparison lab in `models.tsx`, leaving the catalog as the last thing on the page — it is the long list, and nothing should sit below it.

- **One hook owns the check; two sections consume it.** `useDiarizationModel` resolves the path from `get_models_folder` + `diarizeModelFilename` and validates it with `isModelFileUsable` (magic-byte check for the GGUF). It revalidates on window focus and on a window-local `vibe:diarize-model-changed` event fired after a download, so the comparison lab's speaker switch appears without a reload. A refused check is reported as not installed with `checked: true`, so the row falls back to the download offer instead of spinning forever.

- **The row states name, size and state.** The name comes from `getModelDisplayName`, and the size from `diarizeModelIntegrity.size` in whole MB, the same labelling the catalog uses for its files. Installed shows "Installed" plus reveal-in-folder; missing shows the download button wired to the URL, size and SHA-256 that the download path verifies; downloading shows a spinner. The download resolves its own destination, so the action does not depend on the check having returned a path. A successful download announces the change rather than assuming success, so the state comes from disk.

- **The sweep is separate from the preference migration, and runs at startup unconditionally.** `sweepLegacyDiarizationFiles` checks that the current model is usable and then removes every name in `legacyDiarizationFilenames` best-effort. `PreferenceProvider` calls it once per session before the gated migration, because not every install has a persisted toggle to revalidate and the leftovers are dead weight with the switch on or off. `runDiarizationMigration` keeps its own sweep in the already-installed branch, for callers that reach the migration without the provider's startup sweep. Both call the same cleanup routine.

- **Only the current model being usable unlocks deletion.** Without it the legacy files are the only thing the engine could load, so the sweep is a no-op and the migration offers the download instead. Removal stays name-matched: `delete_model_file` in Rust refuses anything that is not a model path except the exact legacy names, so the sweep cannot widen into arbitrary deletion.

## Risks / Trade-offs

- [A download that verifies but cannot be published] — the row stays on Download and the toast carries the error; nothing pretends the model is installed.
- [An unreadable models folder] — treated as missing, so the user gets an action instead of a permanent spinner. The download resolves its own destination, so that action still runs and reports its own failure; the console carries the check's cause.
- [Deleting leftovers is irreversible] — they are superseded artifacts the engine no longer loads, and only exact names from the legacy list can be removed.
