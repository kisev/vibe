# Tasks

- [x] 1.1 Add Playwright, a browser-mode config and a boot smoke test; keep the suite out of vitest
- [x] 1.2 `task ci:e2e` and a thin `e2e.yml` on desktop pull requests
- [x] 1.3 Cover settings sections and the meeting settings flow
  - `settings-navigation.spec.ts` opens every sidebar section and asserts no error boundary, plus the meeting settings surface, the API switch and update controls
  - `meeting-browser.spec.ts` checks URL normalization, the failed-load retry/close prompt and the stop/keep-recording prompt
- [x] 1.4 Cover the flows that broke repeatedly: API switch intent, update channels and Beta's empty line, comparison diffs, language switch
  - `settings-api-server.spec.ts` asserts the persisted state on load and the `start_api_server` / `stop_api_server` calls through the mock's IPC log
  - `settings-updater.spec.ts` pins literal `Release` / `Beta` / `Dev`, "No candidate on this line" for an absent or empty manifest, and the `/changelog/dev` link
  - `model-comparison.spec.ts` runs the comparison lab against stubbed transcriptions: `+2 −1` for a complete diff, the "too long" note (never `+0 −0`) over budget
  - `language.spec.ts` switches to Russian in place and proves no reload
- [x] 1.5 Give the mock a test surface (`window.__vibeMockTauri`: IPC log, command overrides, event emission), the meeting-browser and `update_check` commands it was missing, and a second mock model so comparisons can run
- [x] 1.6 Beta with no candidate: the provider treats a manifest without a version as nothing on the line, and the controls render "No candidate on this line" instead of an empty version
- [ ] 1.7 Verify the job is green on a pull request
