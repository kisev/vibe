# Proposal

## Why

After the unified engine landed, a transcription request that sets `stable_timestamps` on a family without the capability fails outright with "gigaam does not support stable timestamps" before any audio is decoded. The desktop sends that flag from a persisted preference whenever the selected model's capabilities have not resolved yet, so a user with the toggle left on from whisper-era usage hits the error on every GigaAM recording — reported live on dev.41 during the Vulkan validation. The pre-port servers never failed on this flag, and the request gate already treats `word_timestamps` the same way: ignore what cannot run, reject only semantic options.

## What Changes

- `validate_request` downgrades an unsupported `stable_timestamps` request to a warning that drops the flag, matching the `word_timestamps` precedent; translation, prompts, and language stay strict rejections.
- Callers pass the options mutably so the dropped flag also stays out of the chunk-cache key.
- Tests: the rejection loop loses the stable-timestamps entry; a new assertion checks the flag is dropped, not rejected.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `asr-engines/transcribe-cpp`: the request gate's contract for unsupported enhancement flags — stable timestamps degrade gracefully instead of failing the request.
