# Tasks

- [x] 1. Add `build:e2e` to `desktop/package.json`: `pnpm i18n:generate && tsc && vite build --mode e2e`.
- [x] 2. `desktop/src/main.tsx` installs the mock when `import.meta.env.DEV` or `import.meta.env.MODE === 'e2e'`; a plain build carries no mock.
- [x] 3. `desktop/playwright.config.ts` runs `pnpm build:e2e` and serves `dist` with `vite preview --strictPort`, replacing the dev server in `webServer.command`.
- [x] 4. `scripts/ci/e2e.sh` drops its own `pnpm i18n:generate` — the build generates the catalogs.
- [x] 5. Drop `retries: 1` and the `workers: 4` cap: with a built bundle there are no per-module dev-server fetches left to drop.
- [x] 6. Three consecutive runs on this workstation passed 21/21 with `retries: 0` and the default worker count; no spec needed a retry.
- [x] 7. `task verify` green on the final revision (lint, format:check, rustfmt, deny/machete, unit suites, `rust:clippy`, the 21-spec E2E suite).
