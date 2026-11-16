# Proposal

## Why

The translated documentation drifted into three small inconsistencies while it was being refreshed:

- update-channel names are app labels in some locales and ordinary words in others (`正式版`, `リリース`, `Utgivelse`, `릴리스`, `Wydanie` beside `Release / Beta / Dev`), and a reader cannot tell whether "Release" is a channel or a release event;
- pages link to documents that are not in the translated set, so every locale inherits dead links, and one link names `update-channels` where the file is `update-channels-design`;
- the device placeholder "None" is `无记录` in the catalog but `无` on an older page of the same locale.

None of these is a translation mistake; they are policy the translators had to invent because nobody wrote it down.

## What Changes

- The policy is written down: update-channel names stay the application's labels and are never translated; interface wording follows the desktop catalog, not the other way round; a translated page links only to pages that exist in the translated set, or to an absolute repository address for maintainer-only documents.
- The existing pages are brought in line with it.

## Capabilities

- `docs` (existing): what the documentation site publishes and how its translations behave.

## Impact

- `i18n/docs/*/reference/update-channels.md` and `i18n/docs/*/how-to/record-audio.md` in 14 locales, `i18n/docs/en-US/reference/update-channels.md` and `explanation/meeting-browser.md` sources, and `reference/meeting-browser.md` joining the translated set.
- The English sources of two maintainer how-tos keep their links, but translated pages point at the repository instead.

## Non-Goals

- Translating maintainer-only documentation (`publish-a-release`, `cut-a-dev-build`).
- Renaming or restyling the channels themselves.
