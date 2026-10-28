# Proposal

## Why

The models page rates every catalog entry with published accuracy/speed bars, but those benchmarks come from other people's audio and other people's hardware — on a 5070 Ti versus a laptop CPU the ordering can invert, and the numbers say nothing about how a model handles the user's language and accent. Users picking a model want to judge on their own material. Replace the borrowed verdict with a lab: run the same short input through several models and read the actual transcripts side by side.

## What Changes

- Catalog cards stop showing the accuracy/speed bars; the rest of the card (provider, size, languages, streaming/translation badges) stays.
- The models page gains a comparison section: pick the input — record a short clip in place or choose an audio file — and check two or more installed models.
- Transcription runs sequentially over the selected models, one model loaded at a time, with per-run progress and the wall-clock processing time of each run reported at the end.
- Each run writes its transcript as a markdown file named for the model into a per-comparison folder; the section lists the files with links to open them, so the user compares the texts themselves.
- A model that fails its run does not stop the others; the failure is shown with its reason.

## Capabilities

### New Capabilities

- `model-comparison`: the record-or-pick, sequential-run, per-model-timing-and-markdown lab on the models page.

### Modified Capabilities

- `model-catalog`: the card stops carrying the published benchmark indicators — honest metadata is provider, size, languages, and availability flags, not third-party scores.

## Assumptions

- Only models already installed can be selected; the lab does not download catalog entries (the catalog's own download flow stays the way in).
- All runs of one comparison use the same plain options (the user's language preference, no diarization, no stable timestamps) so the comparison measures the models, not option differences.
- Timing is wall-clock from the desktop, covering load-if-needed plus transcription of the same input; the server API already exposes both steps (`/v1/models/load`, `/v1/audio/transcriptions`).
