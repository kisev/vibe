# Tasks

- [x] 1. Replace the stale "One dev release at a time" requirement in `openspec/specs/dev-build/spec.md` with bounded retention, keeping every scenario the original block carried.
- [x] 2. Confirm the numbers in the requirement match `scripts/dev_build.py cleanup` and the `KEEP_COUNT` / `KEEP_HOURS` inputs in `dev-build.yml`.
- [x] 3. Archive this change once `openspec validate --all --strict` is clean.
