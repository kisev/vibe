# Updater

Vibe updates from two channel files on the website, not from GitHub's latest release:

- `https://kisev.github.io/vibe/updater/stable.json`
- `https://kisev.github.io/vibe/updater/beta.json`

Each is the `latest.json` a release build produced. Everyone is on stable unless they turn on
Settings → General → Beta updates. The app side is `desktop/src-tauri/src/updater.rs`.

## Shipping a release

```console
# after release.yml finished (the GitHub release is a prerelease)
uv run scripts/channel.py 1.0.0 --channel beta     # beta users first
uv run scripts/channel.py 1.0.0 --channel stable   # once beta looks fine
gh release edit v1.0.0 --prerelease=false --latest # last: older apps read GitHub
```

Commit `website/public/updater/` to main after each step; the website deploy publishes it in a
few minutes. Promoting to stable also moves beta forward, so beta is never behind stable.

The updater only moves forward. A bad release is fixed by shipping a newer one — which is what
beta is for: catch it before stable gets it.

Apps built before the channel files (the upstream 3.x line) don't know about them: they still update from whichever GitHub
release is marked "latest". So `gh release edit --latest` is what ships a version to them — run it
last, once the version is already on stable.
