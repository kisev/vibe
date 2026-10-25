# Tasks

## 1. Unreleased entry in the pipeline

- [ ] 1.1 Create `i18n/changelog/unreleased.md` in the existing format (frontmatter + New/Improved/Fixed), seeded with everything since 3.2.2: transcribe.cpp engine adoption, audio device management, the unified model catalog UI, fullscreen settings, download UX
- [ ] 1.2 Teach `website/src/lib/changelog.ts` to render the unreleased entry first, labeled as the dev line (sorting + label, no schema change)

## 2. Release-time flow

- [ ] 2.1 Update the release skill: at release time rename `unreleased.md` → `<version>.md` with the date, take the GitHub release body from the same content, create the empty unreleased entry
- [ ] 2.2 Wire the dev-release flow so a dev release body carries the unreleased bullets instead of "Dev build of main at sha" (dev-build.yml release body or the dev:tag task)

## 3. One-time backfill

- [ ] 3.1 Rewrite the surviving dev release's GitHub notes (user-confirmed edit) from the same accumulated content as 1.1
- [ ] 3.2 After the next stable release cuts the entry: translate it into every locale, stamp, audit green
