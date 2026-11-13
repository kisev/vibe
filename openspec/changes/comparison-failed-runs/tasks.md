# Tasks

- [x] 1. The results window renders one column per selected model: a failed run carries `m.error(): <reason>` in place of its transcript, and the baseline picker lists only successful runs.
- [x] 2. The section shows `{count} finished` · `{count} failed` before the results button, and the button appears even when every run failed.
- [x] 3. The three new strings exist in `en-US` and in all 21 other desktop catalogs with `{count}` intact.
- [x] 4. Tests: three runs with the third failing yields three columns and the error; all-failed yields the "nothing to compare" line and no baseline; the section summary test covers both.
- [x] 5. `pnpm --dir desktop test` (290+ tests), `tsc --noEmit` and `task verify` green.
