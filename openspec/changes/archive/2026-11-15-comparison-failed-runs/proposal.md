# Proposal

## Why

With three models selected, the results window showed two: the third run failed and the window filters to `status === 'done'`, so a failure disappears instead of being explained. The section's row list knows about the error, but the full-window surface — where the user compares — silently drops the model, which reads as "only the first two models can be compared".

## What Changes

- The results window renders every selected model: a failed run becomes a column with its error, and the baseline picker only offers successful runs.
- The section states how many models finished and how many failed before the results button appears.
- A test drives three models where the third fails and asserts all three are visible.

## Capabilities

- `model-comparison` (existing).

## Impact

- `desktop/src/pages/settings/sections/models-comparison{,-results}.tsx`, tests, the comparison change's spec delta.
