# Tasks

Policy first; the pages are brought in line when this change is taken. Nothing here is done yet.

- [ ] 1. Rewrite the update-channels pages in the locales that translated the channel names (`cs-CZ`, `ja-JP`, `ko-KR`, `no-NO`, `pl-PL`, `zh-HK`, and any other found by a scan) so `Release`, `Beta` and `Dev` stand as labels.
- [ ] 2. Add `reference/meeting-browser.md` to the translated set: copy the English page into `i18n/docs/en-US/`, translate it for every docs locale, and stamp.
- [ ] 3. In the English `reference/update-channels.md`, correct the `../explanation/update-channels.md` link to `update-channels-design.md`; in `explanation/meeting-browser.md` keep the reference link now that the target exists.
- [ ] 4. In translated pages, replace relative links to maintainer-only documents (`publish-a-release`, `cut-a-dev-build`) with absolute repository addresses.
- [ ] 5. Align the `record-audio` pages' device placeholder with the catalog's `noRecord` wording in every locale.
- [ ] 6. `i18n:sync-docs`, then `stamp`, then `check_i18n.py` — the audit passes and no translated page links to a missing file.
