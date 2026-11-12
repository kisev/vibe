# Cut a dev build

A `dev.<n>` tag publishes a release. It is never a validation vehicle: do not tag to see whether the build compiles.

## Before tagging

- The commit is on `dev`, not `main` or a feature branch.

- The Lint run for that exact revision is green. Lint is dispatchable, so a dev revision is checked in place:

  ```console
  gh workflow run lint.yml --ref dev
  ```

  Nothing is built or published on a dev push, so this run is the only compile check the tag will get. A `main` push still triggers Lint for work that must live on the release line.

- You are prepared for five platform builds. Do not rerun a whole dev matrix to "check" something. The tag does not deploy the site itself; the build dispatches the site deploy from `main` so the dev manifest refreshes.

## Tag

```console
task dev:tag
```

The task fetches `main` and `dev` with tags, refuses to run off `dev`, computes the next number from the existing `dev.*` tags, creates a signed `dev.<n>` tag, and pushes it.

## What happens next

- `.github/workflows/dev-build.yml` builds the five release platforms, reusing the tag. The release name carries the application version with a `-dev.<n>.<sha>` suffix, and the body names the full commit.
- The sidecars are built from the tree rather than downloaded from a `server-v*` release, so the build carries the engine changes on `main`.
- The release is a GitHub prerelease with signed updater artifacts and `latest.json`.
- The Deploy Website workflow reads the newest complete dev release and writes `updater/dev.json`. A fresh build dispatches that deploy. If the newest release is partial or the API call fails, the site keeps the previous `dev.json`.

## Retention

Cleanup keeps the newest **5** dev releases, keeps anything created in the last **24 hours**, and only considers releases created before the running build started. A late-healed older run therefore cannot delete a release a newer build is filling.

Tags are never deleted; they are the history. To fix a bad dev build, ship the next one.

See [Update channels](../reference/update-channels.md) for what the dev line means to the updater, and [Publish a release](publish-a-release.md) for the stable line.
