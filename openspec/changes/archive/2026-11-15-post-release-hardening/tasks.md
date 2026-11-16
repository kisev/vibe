# Tasks

- [x] 1. `docs/how-to/publish-a-release.md` runs `task release:notes` before `gh release edit`; the release skill's promotion step does the same; a candidate's body keeps its inline English notes.

  `release.yml` now assembles the body with `task release:notes -- --github-output` after the version override and passes it to tauri-action as `releaseBody`, so the prerelease never starts link-only. `release_notes.py` falls back to the committed `tauri.conf.json` version when `VERSION` is unset.

- [x] 2. `scripts/release_notes.py` fails on malformed frontmatter and on a prerelease marker other than `-rc.<n>`; a Python test covers both, wired into `task test`.

  `scripts/release_notes_test.py` covers the stable and rc bodies, a missing entry (naming the expected path), missing and malformed frontmatter (naming the file), a version mismatch, a `-beta.1` refusal and the `$GITHUB_OUTPUT` path. `task scripts:test` runs it with the other Python script tests, and `task test` includes that target.

- [x] 3. CI calls `task rust:fmt-check` and `task rust:clippy` instead of raw `cargo fmt`/`clippy` in `lint.yml` and `lint_rust.yml`.

  `lint_rust.yml`'s clippy job fetches the prebuilt ggml libraries (`task libs:fetch`) and installs uv before `task rust:clippy`, because that target stages the diarization helper and resolves libclang through uv off Debian hosts.

- [x] 4. `task verify` runs the site build and the transcription spike, or `openspec/specs/dev-tooling/spec.md` narrows the "local-capable" claim with the reason.

  Decision: `task verify` now runs `task website:build` (it is deterministic and locally runnable). The transcribe spike stays CI-only: it downloads a model, runs a real inference against a fixed transcript, and installs the Vulkan SDK on a Linux/Windows matrix, so it is not a deterministic local gate. `openspec/specs/dev-tooling/spec.md` says so.

- [x] 5. `website.yml` triggers on `openspec/changes/**` and `scripts/roadmap.py`; the E2E workflow adds `i18n/desktop/**`, `scripts/ci/e2e.sh`, `taskfile.yml`.

- [x] 6. `scripts/ggml_libs.sh` packages the archive under `target/`, where `upload` reads it (regression from a109a4bd).

  Verified: `build_libs` writes `target/ggml-libs-$platform.tar.gz` from a `cd "$ROOT"`, and `upload_libs` reads `archive="$ROOT/target/ggml-libs-$platform.tar.gz"`. A simulated packaging run confirmed `lib/` and `include/` sit at the archive root and the file lands in `target/`.

- [x] 7. Residual `chore` references in `plans/` and in open changes (`fork-update-sources`, `dependency-hygiene`) are corrected.

- [x] 8. Dev retention scenarios name the tag number the build actually uses; the archived `dev-build-retention` task list has no unchecked item.

- [x] 9. `scripts/ci/fetch_ffmpeg.py` moves the downloaded ffmpeg with `shutil.move`: `os.replace` cannot cross drives, which is exactly the Windows runner layout (`RUNNER_TEMP` on C:, workspace on D:).

- [x] 10. The bootstrap tests no longer race the runner: a dynamic import plus the start chain can take seconds under a loaded suite, and the default five-second limit left a pending start that called the next test's mocks — one slow run failed two assertions and blocked a push. They now wait with a realistic budget, verified by two consecutive full desktop runs.

- [x] 11. `website.yml` triggers on `docs/**`: the build copies `docs/` into the site, so a docs-only edit used to reach the repository and never the published pages. The filter now lists the directory it copies.

- [x] 12. A delta that introduces a new capability now has to carry `## Purpose` (`AGENTS.md`, § OpenSpec first): archiving seeds the new main spec from it and otherwise leaves `TBD … Update Purpose after archive`, which three archives in one night did.

- [x] 13. `AGENTS.md` (§ Working in parallel) says one checkout belongs to one session and a second session takes its own worktree — a parallel session moved `dev` under this one and a merge was lost to it.

- [x] 14. `docs/how-to/maintain-the-repository.md` documents the signing agent: the `agent refused operation?` failure, how to unlock it, the probe, and why committing unsigned is not the way out.

- [x] 15. `task verify` green, `openspec validate --all --strict` passes (2026-11-15: verify exit 0, validate 50/50).
