# Tasks

## 1. Catalog data

- [x] 1.1 Add `@handy-computer/models` as a pnpm dependency and a sync script that copies its `catalog.json` into the desktop tree with a drift check, mirroring handy's pattern; verify `pnpm sync:catalog` copies the file and the check fails when the copy is edited
- [x] 1.2 Author the vibe layer `catalog-vibe.json` in the same schema for the non-handy providers (vibe-app mirrors, `ggerganov/whisper.cpp`, `ggml-org` VAD, `ivrit-ai`) and a merge module (concatenate, dedupe by repository+revision+filename, provider display names); verify with a unit test that two same-named entries from different providers both survive and that identity keys are unique

## 2. Catalog UI

- [x] 2.1 Build the catalog section in Settings → Models: cards with provider, size in MB, languages, streaming/translation badges, and accuracy/speed bars normalized against catalog best; verify with a component test that a benchmarked entry renders all fields and an unbenchmarked one renders without fake bars
- [x] 2.2 Add the quantization selector (default Q8_0) with per-file size and wire one-click downloads through the existing `download_model` with integrity; verify with a component test that switching quantization updates size/benchmarks and that a download start passes the right URL, size, and SHA-256
- [x] 2.3 Mark entries whose family the installed engine lacks with the stated requirement and disabled download; verify with a component test using a mocked engine identity
- [x] 2.4 Add the i18n keys for the catalog UI (provider, badges, accuracy/speed, quantization, engine requirement, integrity failure) in en-US and all locales via the `/translate` flow, regenerate paraglide, stamp; verify the i18n audit is clean

## 3. Documentation

- [x] 3.1 Add a generation script that renders the models documentation table (model, provider, size, languages, streaming, links) from the merged catalog into `i18n/docs/en-US/models.md`, and translate the regenerated page via the `/translate` flow; verify the documented entries equal the merged catalog's

## 4. Integration

- [ ] 4.1 Run `tsc`, `vitest`, and the i18n audit; verify zero failures
- [ ] 4.2 Verify manually: download a catalog model end to end (progress, verification, appearance in the model list), and confirm a failed-integrity download is reported and not selectable
