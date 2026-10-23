# Design

## Context

See `proposal.md` — Why. The constraints that shape this design come from the
existing release pipeline:

- `release.yml` builds five platforms with `tauri-action`, fed by two `chore`
  tasks: `chore linux-deps` and `chore setup <triple>`, the latter downloading
  `server-v<.server-version>` assets from `thewh1teagle/vibe`.
- `.server-version` is `v0.7.0`; upstream's newest server release is
  `server-v0.6.10`, so the download step cannot succeed for the current tree.
- `server/` is its own Cargo workspace, excluded from the root workspace, so the
  server binary lands in `server/target/<triple>/release/`.
- `desktop/src-tauri/tauri.conf.json` sets `createUpdaterArtifacts: true` and
  bundles `nsis`, `deb`, `rpm`, `dmg`, `app`. `tauri.windows.conf.json` adds
  `binaries/ffmpeg` to `externalBin` on Windows.
- The ggml static libraries come from the public release
  `libraries-ggml-<libs/ggml-version>-r<libs/revision>`; the headers are checked
  in under `server/libs/include`.
- ffmpeg static builds come from `osxexperts.net` (macOS) and `gyan.dev`
  (Windows), as recorded in `server/chorefile`.

## Goals / Non-Goals

**Goals:**

- One workflow file that reproduces the release build without `chore`, without
  secrets, and without touching upstream-owned files.
- A stable download location for the newest build of `main`.

**Non-Goals:**

- Signing, notarization, updater artifacts, or self-updates for dev builds.
- Running the test suites as a gate.
- Replacing or modifying `release.yml`, the chorefiles, or the app config.

## Decisions

**Separate `dev-build.yml` rather than extending `release.yml`.**
`release.yml` is upstream-owned: any edit conflicts on every sync and risks the
real release path. A sibling file duplicates ~60 lines and stays free to
diverge. Alternative considered: add a `push` trigger and a tag input to
`release.yml` — rejected for the conflict and blast-radius cost.

**Build the server from the tree.** `cargo build -p vibe-server --release
--target <triple>` in `server/`, then copy into
`desktop/src-tauri/binaries/vibe-server-<triple>[.exe]`. Alternatives: publish
`server-v0.7.0` upstream first (out of our control and would make dev builds lag
behind `main`), or reuse `chore server-build` (still requires `chore`).

**Replace the `chore` tasks with three shell steps.**

| chore | replacement |
|---|---|
| `linux-deps` | the same `apt-get install` list, inline |
| `fetch-libs` | `curl` `ggml-libs-<platform>.tar.gz` from the release tag computed from `server/libs/ggml-version` and `revision`, then replace `server/libs/lib` |
| `setup` | not needed; the server is built locally |
| `package-release` | ffmpeg URL per platform, extracted and renamed to `ffmpeg-<triple>` |

Computing the ggml release tag from the pinned files instead of hardcoding it
means a `libs/` bump is picked up automatically.

**Publish with `tauri-action`, one release per commit.** The tag is
`dev.<short-commit>` and the action's handling of an existing release is what
lets five parallel jobs fill one release — the same mechanism upstream uses.

The first implementation used a single rolling `dev` release. That broke as soon
as a run failed: the cleanup job only ran after a fully green matrix, so a
partially built run left its assets beside the previous commit's, and the
release showed a mix of versions. A snapshot per commit removes the shared state
entirely — a failed run simply leaves an incomplete release of its own commit,
and the earlier ones stay intact. Alternative: keep the rolling tag and make
cleanup run even on failure — rejected because it would delete the newest
platform bundles whenever a runner is declined capacity, leaving a release that
holds neither version.

**Disable updater artifacts with `--config
'{"bundle":{"createUpdaterArtifacts":false}}'`.** This is exactly what the
`upgrade` task does locally; it removes the signing-key requirement.

**Version the build `<base>-dev.<short-sha>`, derived from `tauri.conf.json`.**
A dev build must not claim to be the release it was branched from. Build
metadata (`3.2.2+dev.abc`) is rejected because NSIS turns the version into
`VIProductVersion`, which requires four numeric components; a prerelease keeps
that field at `3.2.2.0` while the displayed version stays readable. NSIS allows
the resulting downgrade (`allow_downgrades` defaults to true), so installing a
dev build over the released app works. The same string is passed as
`VIBE_SERVER_VERSION`, so the app and its sidecar agree.

**Turn the updater off with `"plugins":{"updater":{"endpoints":[]}}`.** A
prerelease sorts below its base version, so the upstream channel would offer
`3.2.2` as an "update" and replace the dev build with the release. The provider
logs check failures without surfacing them, so an empty endpoint list is quiet.
Alternative: keep the channel and accept being asked to downgrade — rejected.

**No cleanup job.** With one release per commit there is nothing to clean up;
the versioned tag is the boundary. Old releases accumulate, which is the point —
each one is a downloadable snapshot. Pruning can be added later if the list
becomes unwieldy.

**Keep jobs independent (`fail-fast: false`) and let runs queue
(`cancel-in-progress: false`).** A cancelled run could leave the release holding
a mix of old and new assets.

**Build on `ubuntu-24.04-arm` for Linux aarch64.** The prebuilt aarch64 ggml
libraries come from `server-libs.yml`, which builds them on 24.04; linking them
from 22.04 fails on `__isoc23_strto*` (glibc 2.38). The x86_64 libraries are
built on 22.04, so that job stays on `ubuntu-22.04`. The consequence is that the
aarch64 bundle links a newer glibc than the release bundle does — acceptable for
a dev build, and the only alternative would be splitting the server and app
builds across two runners.

**Extract ffmpeg with Python, not `tar`.** macOS runner `tar` reads zip, but the
Windows runner's GNU tar does not; `actions` supports `shell: python`, which
removes the difference.

**Disable LTO and raise codegen units for dev builds.** The root `Cargo.toml`
sets `lto = true` and `codegen-units = 1`, which is right for a release and is
the largest cost in a dev build. Setting `CARGO_PROFILE_RELEASE_LTO=false` and
`CARGO_PROFILE_RELEASE_CODEGEN_UNITS=16` in the job environment leaves the
tracked profile untouched and applies to both Cargo invocations. The server
workspace already uses Cargo's default release profile, so this is a no-op
there.

**Cache `server/target` as a second rust-cache workspace.** The action defaults
to the repository root, and the server builds in its own workspace, so its
dependencies were recompiled on every run. `desktop/src-tauri` is a member of
the root workspace, so its artifacts already live in the root `target/` and need
no separate entry — the directories rust-cache sees are exactly `vibe/vibe` and
`vibe/vibe/server`. Alternative: accept the 1–4 minute rebuild — rejected, but
the cache budget (10 GB per repository) is the reason this is measured rather
than assumed.

**Key the cache by target triple.** `rust-cache` derives its key from the host,
so the two macOS cells — same arm64 runner, different `--target` — share one
entry and overwrite each other. Passing `key: matrix.triple` gives each cell its
own cache at the cost of one more entry per platform.

**Keep `paths-ignore` out.** The agreed contract is a build on every push to
`main`; skipping doc-only pushes would quietly narrow it.

**Keep Linux x86_64 on `ubuntu-22.04`.** Moving it to 24.04 would remove the
stalls in the dependency step, but it would push the bundles' glibc floor to
2.39. Compatibility with older distributions was chosen over build time; the
stall is accepted and recorded below rather than worked around.

## Risks / Trade-offs

- **Releases accumulate one per push** → each is a snapshot worth keeping; prune
  by hand or add a retention step if the list grows unmanageable.
- **Runner capacity can leave an incomplete release** → a macOS job declined by
  GitHub cancels, so that commit's release may lack a platform; re-running the
  workflow for that commit fills it in.
- **`gyan.dev`'s `release-essentials.zip` follows the newest ffmpeg** → builds
  are not byte-reproducible; pin a versioned package URL if it ever breaks.
- **Unsigned installers** → SmartScreen and Gatekeeper warn; users bypass them
  manually. Not a defect of this pipeline.
- **The aarch64 Linux bundle needs glibc 2.39** → it will not run on older
  distributions; rebuild on 22.04 with locally built libraries if that matters.
- **`website.yml` also fires on pushes to `main` that touch `i18n/`** → must be
  disabled in the fork's Actions settings rather than edited.
- **`test-release.yml` takes the newest release** → it will pick up the `dev`
  prerelease; acceptable for a manual workflow, but worth remembering.
- **Five jobs per push** → the critical path was 14 minutes before the LTO
  change; the target is under ten. `paths` filters were rejected because the
  user asked for a build on every push.
- **The server cache may evict platform entries** → the repository has a 10 GB
  cache budget and five platforms; drop the `server -> target` workspace if the
  cache complaints appear.
- **Dev binaries are larger without LTO** → acceptable for builds nobody ships.
- **The `ubuntu-22.04` dependency step occasionally takes 20–30 minutes** → seen
  in two of four runs while `ubuntu-24.04-arm` installs the same list in a
  minute; nothing in the workflow causes it, and the agreed fix (moving to
  24.04) was rejected for glibc compatibility.

## Migration Plan

1. Add the workflow file and merge it into `main`.
2. Enable Actions for the fork and disable `Deploy Website`.
3. Push (or run manually) once; verify the `dev` release appears with all five
   platform bundles.
4. Rollback: disable the workflow or delete the `dev` release; nothing else is
   affected.
