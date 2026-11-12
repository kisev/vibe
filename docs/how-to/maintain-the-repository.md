# Maintain the repository

Small repository chores that do not deserve their own page. Dependency updates live in [Update dependencies](update-dependencies.md); release work lives in [Publish a release](publish-a-release.md) and [Cut a dev build](cut-a-dev-build.md).

## Regenerate generated docs

The models table on the site is generated from the vendored catalog:

```console
task docs:models          # regenerate i18n/docs/en-US/models.md
task docs:models:check    # fail when the generated page is stale
```

The model catalog itself is refreshed and checked with `task sync:catalog` and `task sync:catalog:check`.

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

`task --list` is the index of every facade task. [Tooling](../reference/tooling.md) explains the split between `task` and `chore` and which one to use for what.
