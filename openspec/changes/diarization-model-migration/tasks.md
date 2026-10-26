# Tasks

## 1. Migration

- [x] 1.1 Allow `delete_model_file` to remove the three legacy diarization artifacts by exact file name, keeping the extension guard for everything else (`desktop/src-tauri/src/cmd/download.rs`)
- [x] 1.2 Add `legacyDiarizationFilenames` next to the current diarization model constants (`desktop/src/lib/config.ts`)
- [x] 1.3 Implement `runDiarizationMigration` in `desktop/src/lib/diarization-migration.ts`: no-op when disabled or already installed, one download offer, disable-with-notice on decline or failure, best-effort legacy cleanup on success
- [x] 1.4 Wire it as a one-shot effect in the preference provider so every entry point is covered
- [x] 1.5 Cover the four outcomes with vitest tests

## 2. Validation

- [ ] 2.1 Cut a dev build; on a profile with the pre-port toggle on and no GGUF on disk, the dialog appears, the model downloads, and a GigaAM transcription carries speaker labels again
