# Proposal

## Why

The browser-mode E2E suite runs against the Vite **dev** server, which serves every module as a separate request and compiles them on demand. On this workstation that intermittently fails at the first page of a worker: Chromium drops module fetches with `ERR_NETWORK_CHANGED`, the app never mounts, and eight specs fail on `getByText('Vibe')` before the retry rescues them. One run needed a retry for seven of twenty-one specs. Retries turn that red run green without fixing anything, and a suite that needs them cannot be trusted to catch a real regression.

A production build has the same module graph in one bundle: a handful of requests instead of hundreds, no transform-on-demand, and the code the user actually runs. Serving `dist` through `vite preview` removes the failure mode and makes the suite closer to the shipped app.

## What Changes

- `desktop/src/main.tsx` installs the Tauri mock when `import.meta.env.DEV` **or** `import.meta.env.MODE === 'e2e'`, so a build made with `--mode e2e` can carry the mock when a test asks for it and a plain build never does.
- `desktop/package.json` gains `build:e2e` (`pnpm i18n:generate && tsc && vite build --mode e2e`).
- `desktop/playwright.config.ts` runs `pnpm build:e2e` and serves `dist` via `vite preview` instead of running the dev server.
- The retry and the worker cap added as a workaround come out once the suite is stable against preview; three consecutive runs passed with `retries: 0` and the default worker count.
- `scripts/ci/e2e.sh` stops pre-generating the catalogs (the build does it) and keeps the browser-install fallback.
- `.github/workflows/e2e.yml` keeps its thin `task ci:e2e` call; only the job's time budget may need raising for the added build.

## Capabilities

- `desktop-e2e` (existing): how the browser-mode suite starts and what it serves.

## Impact

- `desktop/src/main.tsx`, `desktop/playwright.config.ts`, `scripts/ci/e2e.sh`, possibly `e2e.yml` timeout.
- No application behaviour change: the mock is still absent unless `VITE_MOCK_TAURI=true` is set at build time.
- Suite runtime grows by one frontend build (~40 s) and loses the dev-server warmup.
