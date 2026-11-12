---
version: unreleased
date: 
title: "What's next"
---

## New

- 🧪 **Model comparison, side by side** — Settings → Models runs one clip or file through every installed model you pick and opens full-window results: a column per model with its time and word count, independent scrolling, a baseline picker, and word-level highlighting that strikes out missed words and marks extras
- 🗣️ **Speaker separation in the comparison** — one switch adds voice labels to every model's transcript, so the same run shows which model heard the words and who said them
- 🔄 **Three update channels** — follow Release, Beta or Dev, see the current version and when the last check ran, and start a check yourself with one button instead of waiting for the next launch
- 🌐 **Meetings open inside Vibe** — meeting links open in an embedded browser with back, forward and reload, a record-ready bar, and an editable meeting-host list; a detected call prompts you to record it with your microphone and system audio
- 🌍 **The website speaks your language** — a language selector in the header switches the page in place, keeps `?lang=` in the URL so shared links carry the choice, and applies right-to-left layout. `/changelog/dev` is now the permanent address for the dev notes

## Improved

- 🧭 **Dev updates have their own line** — dev builds ship as `-dev.N` prereleases on the Dev channel, release candidates are cut for Beta, and the dev changelog keeps one stable URL as builds come and go
- 🏷️ **Comparisons name models properly** — results and dialogs use the catalog's canonical model name and quantization spelling instead of title-casing a file name
- 🤫 **Meeting detection stays out of the way** — Vibe's own meeting window suppresses the external detection prompt, and recording state is shared, so a call already open in Vibe never offers to record twice

## Fixed

- 🎙️ **Every model can run the comparison** — GigaAM and Parakeet no longer refuse a run for a missing VAD model; the lab supplies its bundled detector so results differ only by the model
- 📍 **The comparison sits first** — the lab moved above the long model catalog on Settings → Models so it is the first thing you see
