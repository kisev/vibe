---
version: unreleased
date: 
title: "One engine, one model catalog, and long recordings that plan themselves"
---

## New

- 🤖 **Model catalog** — Settings → Models shows a bundled, benchmarked catalog of every model the engine can load (the handy layer plus vibe builds). Filter by streaming, translation, language, or provider; pick a quantization with its size shown; download with one click, every file verified against its published size and SHA-256. Installed models stand out in the list with select, rename, and delete right on the card, and every card links to its Hugging Face page
- 🧠 **One engine for every family** — the GGML runtime is now transcribe.cpp 0.4.1, loading Parakeet, GigaAM, Nemotron, Voxtral, Qwen and Canary alike. Whisper-only controls appear only for Whisper; streaming and translation follow what the loaded model actually supports
- 🎙️ **Recording devices survive replugs** — selections match devices by name, so unplugging and replugging keeps your mic; hidden devices stay hidden and are revealed from settings
- ⏱️ **Long recordings plan themselves** — speech ranges are planned up front, out-of-memory splits are retried where they failed, and finished chunks are reused from a cache, so a long file never restarts from zero. Speaker labels carry across chunk boundaries, and boundary lines show their speakers
- 📄 **Generated model docs** — the Models documentation page is generated from the catalog, so providers, sizes, and download links always match what the app offers

## Improved

- 🪟 **Settings open full-window** — the sheet fills the window, with room for the catalog and its filters
- ⬇️ **Downloads you can read** — the progress toast names the file it is downloading and stays coherent when several downloads run at once; a finished download flips its card to installed immediately
- 🗑️ **Delete models from settings** — remove a downloaded model or a single quantization without opening the folder
- 🌍 **Everything translated** — the catalog interface, the models docs, and the new strings are translated into all 21 app languages
- 🔁 **Fork updates** — in-app updates and release notes point at this fork's releases, and dev builds are cut on demand from dev tags instead of every commit

## Fixed

- 👁️ **The hide-devices eye button** stopped responding after opening the device picker
- 📉 **Progress jumped between parallel downloads** — each download now reports its own percentage
- 🗂️ **The installed list waited for a window focus** before showing a finished download
