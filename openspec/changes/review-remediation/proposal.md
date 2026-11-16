# Proposal

## Why

An OCR review of the `dev` tree produced 334 findings across the whole repository — 2 critical, 28 high, 122 medium and 182 low, in 168 files. They are not stylistic noise: the first screen of them already names a script that cannot run at all (`scripts/ggml_libs.sh` reads a pin file that is not committed), a macOS build whose `externalBin` array silently loses the diarization helper, a delete command that erases any `.bin`/`.gguf` on the disk, a Privoxy-grade privacy leak in the meeting browser's log, and a speaker numbering bug that collapses speakers 0 and 1 into one in the default diarization engine.

The findings were produced against this tree, not an upstream copy, and most of them sit in code this fork now owns. Leaving them open means shipping a release whose defects are already written down.

## What Changes

- Every finding is verified against the current tree and either fixed or rejected with a recorded reason. A finding whose premise no longer holds (the code moved, the concern was already handled) is closed as rejected, never silently dropped.
- The fixes are grouped by area and land together: the Tauri core and the meeting detector, the desktop web layer, the server, CI and repository configuration, the scripts, the website and its locales, and the desktop tooling.
- Behavior that the review proved wrong is written down as a requirement, so it cannot regress: an explicit "None" device selection must survive restarts, an installed model cannot be deleted from the catalog while it is active, speaker ids are one-based everywhere, and the commit gate reports a partial verdict instead of hiding it.

## Capabilities

### Modified Capabilities

- `audio-device-management`: "None" becomes a choice that persists, and a hidden device stays reachable.
- `model-catalog`: the active model cannot be deleted from the catalog, and a failed download is not reported as success.
- `asr-engines`: speaker ids are one-based across engines, and an unsupported option is reported under its own error code.
- `dev-tooling`: the commit gate prints and honours a partial verdict, and the sidecar pins it reads are committed.
- `meeting-browser`: strict resource filtering runs on every platform, and the browser log does not carry a meeting secret.

## Assumptions

- The review is treated as a list of claims, not a list of instructions: each claim is checked against the code before it is acted on, and the ones that do not hold are recorded with the reason.
- Low-severity findings are fixed when the fix makes the code clearer or safer and does not fight the surrounding style; the ones that are pure preference are rejected in the same record.
- No finding is fixed by weakening a guard, relaxing a test or deleting an assertion.
- This change does not push, tag or release anything.

## Impact

- `desktop/src-tauri/**`, `crates/meeting-detect/**`, `desktop/src/**`, `desktop/e2e/**`, `desktop/scripts/**`, `server/**`, `scripts/**`, `.github/**`, the root configuration files, `website/**` and `i18n/roadmap/**`.
- Desktop tests, server tests and the website suite gain cases for the defects that were only caught by review.

## Non-Goals

- Reworking behavior that the review did not challenge.
- Closing findings by deleting the code they point at, except where the finding is that the code is dead.
- Re-planning the open changes that already own a piece of this tree; where a finding contradicts such a plan, the plan is corrected and the correction named in the task.
