# Maintain the repository

Small repository chores that do not deserve their own page. Dependency updates live in [Update dependencies](update-dependencies.md); release work lives in [Publish a release](publish-a-release.md) and [Cut a dev build](cut-a-dev-build.md).

## Regenerate generated docs

The models table on the site is generated from the vendored catalog:

```console
task docs:models          # regenerate i18n/docs/en-US/reference/models.md
task docs:models:check    # fail when the generated page is stale
```

The model catalog itself is refreshed and checked with `task sync:catalog` and `task sync:catalog:check`.

## Read the development site

The Pages deploy at <https://kisev.github.io> publishes two builds from one artifact:

| Address | Built from | Routing |
| --- | --- | --- |
| `/vibe/` | `main` | Paths, for example `/vibe/roadmap` |
| `/vibe/dev/` | `dev` | Hashes, for example `/vibe/dev/#/roadmap` |

A deploy starts from `main`: a push that touches the site, or a manual dispatch on `main`. It rebuilds both — the workflow checks out `main` for the production build, then `dev` for the preview it places under `dev/`, and deploys the combined artifact once. A `dev` push deploys nothing, because GitHub skips the deploy job of a run on a ref the `github-pages` environment does not admit and still reports the run as successful; the preview therefore follows `dev` at the next deploy from `main`. GitHub Pages has a single root `404.html`, so the dev build uses hash routing; the root fallback stays the production one and `/vibe/` behaves as before.

Build the two halves locally with `task website:build` (into `website/dist`) and `task website:build:dev` (into `website/dist-dev`), then combine them with `task website:assemble`.

## Clear GitHub Actions caches

```console
gh cache delete -a
```

## Compress website images

The site's screenshots and feature images live under `website/public/`. Compress them with `tinypng-go` and commit only the smaller files:

```console
pnpx tinypng-go website/public/*.png design/*.png
```

## Convert the privacy policy to PDF

```console
go install github.com/mandolyte/mdtopdf/cmd/md2pdf@latest
md2pdf -i website/public/privacy_policy.md -o website/public/privacy_policy.pdf
```

## Normalize a WAV fixture

The server fixtures are 16 kHz mono PCM. Convert a new recording to the same shape:

```console
ffmpeg -i file.wav -ar 16000 -ac 1 -c:a pcm_s16le normal.wav
```

## Speed up dev builds with cranelift

Useful on Windows, where debug builds are slow:

```console
rustup toolchain install nightly
rustup component add rustc-codegen-cranelift-preview --toolchain nightly
# Unix
CARGO_PROFILE_DEV_CODEGEN_BACKEND="cranelift" cargo +nightly build -Zcodegen-backend
# PowerShell
$env:CARGO_PROFILE_DEV_CODEGEN_BACKEND="cranelift" ; cargo +nightly build -Zcodegen-backend
```

## Check out someone else's pull request

Pull requests are limited to a few collaborators, but a review sometimes needs a local checkout:

```console
gh pr checkout <url>
git push <fork-url>
```

## Run the task facade

`task --list` is the index of every facade task. [Tooling](../reference/tooling.md) lists the task groups and what each one covers.
