# Proposal

## Why

The unified engine replaced the diarization stack: the ONNX sortformer and the segmentation/embedding pair became one GGUF (`diar_streaming_sortformer_4spk-v2.q8_0.gguf`), but the download gate only runs when the speaker-detection switch is toggled. A user whose preference persisted from before the switch sends every request with a path to a file that is not on disk; the server swallows the load error and quietly returns transcripts without speakers. Reported live on dev.42 after GPU transcription was restored: "пропало обнаружение говорящих".

## What Changes

- The desktop runs a startup migration when speaker detection is enabled: if the current diarization model is not on disk, it offers the download once, keeps the preference enabled on success, and removes the obsolete ONNX artifacts.
- Declining or a failed download disables the preference with a visible notice instead of leaving it silently broken.
- `delete_model_file` learns the three legacy diarization file names, so the migration can clean them up through the same guarded command (its extension guard still refuses everything else).

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `model-capabilities`: a format migration for an enhancement model revalidates the persisted preference against the file on disk instead of trusting it.
