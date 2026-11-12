# Proposal

## Why

The project's task scheme is `taskfile.yml` plus `lefthook`. `chore` is upstream's runner: five `chorefile`-style files (420 lines), a third-party GitHub Action in four workflows, and a parallel vocabulary (`chore setup`, `chore website-build`, `chore package-release`) that a contributor has to learn on top of `task`. Two runners mean two places where the same command can drift, and the drift already happened: `lint` in `chorefile` lints what CI lints while the `task` targets named `lint` do something else, and a host that has no `chore` installed cannot run the steps the release workflow runs.

The rest of the repository already speaks `task`: the CI workflows call `mise exec -- task …` for lint, tests, ggml libraries, Vulkan deps and the website deploy. `chore` remains only where nobody rewrote it yet.

## What Changes

- Every command `chore` provides becomes a `task` target: `setup` (sidecars), `server:build`, `linux-deps`, `dev`, `dev-web`, `app:build`, `upgrade`, `website:dev`, `website:build`, `phone:wasm`, `phone:pwa`, `phone:dev`, `phone:tunnel`, `phone:probe`, `phone:caps`, `server:package-release`, `server:fetch-headers`, and the ggml library tasks (`libs:id`, `libs:tag`, `libs:platform`, `libs:fetch`, `libs:build`, `libs:upload`, `libs:stage`, `libs:cpu-variant`). Logic that is more than a couple of lines lives in `scripts/` — `scripts/setup_sidecars.sh`, `scripts/package_server_release.sh`, `scripts/phone_wasm.sh`, `scripts/ggml_libs.sh`, `scripts/website_build.sh` — so the YAML stays a facade.
- `chorefile`, `server/chorefile`, `handoff/handoff.chore`, `website/website.chore` and `server/libs/libs.chore` are deleted, and so are the `getchore/setup-chore` steps in `release.yml`, `lint_rust.yml`, `server-release.yml` and `website.yml`. The site workflow's `chorefile` path filter becomes `taskfile.yml`.
- `linux-deps` learns the local package manager (apt on the CI runners, zypper on an openSUSE host) instead of failing on anything that is not Debian.
- Docs, skills, the server and handoff READMEs stop telling anyone to run `chore`.

## Capabilities

- `dev-tooling` (existing): one task facade.
- `dev-build` (existing): how a dev build gets its sidecars.

## Impact

- Deleted: 5 chore files.
- Changed: `taskfile.yml`, `scripts/` (5 new, 1 extended), 4 workflows, `AGENTS.md`, `docs/tutorials/build-and-run.md`, `docs/how-to/{check-your-change,build-the-server,sign-and-notarize-macos}.md`, `docs/reference/{tooling,repository-layout,architecture}.md`, `server/docs/BUILDING.md`, `handoff/README.md`, `.claude/skills/{translate,release}/SKILL.md`.
- No application behaviour changes; the commands themselves are ported, not redesigned.
- Hosts that installed `chore` only for this repository no longer need it.
