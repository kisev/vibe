# Tasks

## 1. Migration

- [x] 1.1 Allow `delete_model_file` to remove the three legacy diarization artifacts by exact file name, keeping the extension guard for everything else (`desktop/src-tauri/src/cmd/download.rs`)
- [x] 1.2 Add `legacyDiarizationFilenames` next to the current diarization model constants (`desktop/src/lib/config.ts`)
- [x] 1.3 Implement `runDiarizationMigration` in `desktop/src/lib/diarization-migration.ts`: no-op when disabled or already installed, one download offer, disable-with-notice on decline or failure, best-effort legacy cleanup on success
- [x] 1.4 Wire it as a one-shot effect in the preference provider so every entry point is covered
- [x] 1.5 Cover the four outcomes with vitest tests

## 2. Validation

- [x] 2.1 Cut a dev build; on a profile with the pre-port toggle on and no GGUF on disk, the dialog appears, the model downloads, and a GigaAM transcription carries speaker labels again (dev.45 failed live: the shipped v2 GGUF was rejected by the engine with `gguf load error (status 4)` — reproduced locally on a sha-verified copy, while the engine crate's own smoke fixture is v2.1; the download now points at `handy-computer/diar_streaming_sortformer_4spk-v2.1-gguf` Q8_0, verified loading and running clean locally, and the broken v2 joined the legacy cleanup list. dev.47 passed live: the dialog appeared on first launch, the model downloaded, and transcriptions carry speaker labels again — user-confirmed 2026-10-28)
