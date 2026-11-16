# Proposal

## Why

The comparison lab reports how long each model took on the same input, and people read those numbers as capability. They are not comparable when one model was already loaded and the next paid a load: the server keeps a resident model warm and reloads the others, but it never says which happened, so the desktop cannot tell and neither can the reader. The change's own design recorded this as a risk and promised a timing note that does not exist.

## What Changes

- The server's model-load response says whether the model was already resident or was loaded for this run.
- The comparison records that fact per column and shows it beside the time, so a fast run that skipped a load is not read as a faster model.
- The design risk is removed because the note it promised now exists.

## Capabilities

- `model-comparison` (existing): what a column reports about its run.
- `server-interface` (new): the shape of the local server's responses the desktop relies on.

## Impact

- `server/crates/vibe-server` (the load response), the desktop runner (`desktop/src/lib/model-comparison.ts`), the results view and its tests, and the comparison spec delta.
- The server line moves to the next version for the release that carries the field; the desktop keeps working against an older server by treating a missing field as "unknown".

## Non-Goals

- Making the comparison wait for a cold load of every model. The honest note is enough; a controlled experiment is a different feature.
- Any change to how models are cached or evicted.
