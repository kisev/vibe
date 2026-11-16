# Tasks

## 1. Release body assembly

- [x] 1.1 Add `scripts/release_notes.py`: read `i18n/changelog/<version>.md`, drop its frontmatter, prepend `Read this changelog in your language: https://kisev.github.io/vibe/changelog/<version>`, fail on a missing entry, and print to stdout or write `RELEASE_NOTES` — 2026-11-12: `python3 -m py_compile` passes; `VERSION=1.0.0` prints the link line then the unchanged entry; `VERSION=9.9.9` exits 1 naming `i18n/changelog/9.9.9.md` and writes nothing; `RELEASE_NOTES=/tmp/notes-check.md` writes the 38-line body
- [x] 1.2 Add `task release:notes` so the release skill calls a task instead of ad-hoc shell — 2026-11-12: `VERSION=1.0.0 task --silent release:notes` prints the assembled body; `yamllint taskfile.yml` passes
- [x] 1.3 Point the `release.yml` prerelease `releaseBody` at the same link line for `__VERSION__` — 2026-11-12: the input reads `Read this changelog in your language: https://kisev.github.io/vibe/changelog/__VERSION__`; `actionlint` and `yamllint` exit 0
- [x] 1.4 Replace the `awk` promotion pipeline in the `release` skill with the task, and document the link line — 2026-11-12: step 5 now runs `VERSION=<version> RELEASE_NOTES=/tmp/notes.md task release:notes` and explains the link line; no `awk` remains in the skill

## 2. Validation

- [x] 2.1 `python3 -m py_compile` the new script and dry-run the assembly for a real entry — 2026-11-12: both pass; the dry run emits the `1.0.0` link line and the full English entry
- [x] 2.2 `actionlint` and `yamllint` on the changed workflow — 2026-11-12: both exit 0 on `.github/workflows/release.yml`; `yamllint` also passes on `taskfile.yml`
- [x] 2.3 Confirm the dev body construction is untouched and still links to `/changelog/dev` — 2026-11-12: `scripts/dev_build.py` lines 32 and 116 are unchanged; a dry run of the body shows the `/changelog/dev` alias and no versioned dev path
