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

- [x] 4.1 Run `tsc`, `vitest`, and the i18n audit; verify zero failures
- [ ] 4.2 Verify manually: download a catalog model end to end (progress, verification, appearance in the model list), and confirm a failed-integrity download is reported and not selectable

## 5. Interface consolidation (user feedback after the first cut)

- [x] 5.1 Replace the "Select model" and "Model library" groups with one Models section: installed models as cards (catalog metadata matched by file name, active model marked, one-click select), the catalog with name search, streaming/translation chips, language and provider filters, and the URL download folded in; drop parameter counts from cards (M vs MB confusion)
- [x] 5.2 Remove the legacy .bin entries from the vibe layer, the settings catalog, and the generated docs (the engine refuses them; the catalog is a chooser of what works, not an archive), and update the docs generator + parity test accordingly
- [x] 5.3 Translate the new keys into every locale, regenerate paraglide, stamp, and re-run the i18n audit; keep tsc/vitest green

## 6. Second round of feedback: fullscreen settings, installed-in-catalog, limitations on cards

- [x] 6.1 Maximize the app window while the settings sheet is open (restore on close) and make the sheet fill the window with a readable content column instead of the fixed 640px/3xl box
- [x] 6.2 Drop the "Installed models" group: installed entries appear in the catalog list, highlighted with a primary ring and an installed badge, sorted first, with select/rename/reveal instead of download for the installed quantization; files outside the catalog still appear above the cards
- [x] 6.3 Show each entry's limitations (single language without detection, no streaming, no translation) on its card and remove the separate limitations group
- [x] 6.4 Update the badge key ("Installed"), drop the unused group-title key, keep the audit green, tsc/vitest green
