# Vibe documentation

Repository documentation is organized by [Diátaxis](https://diataxis.fr/): every page has one purpose and lives in the folder named for it. The same split will apply to the user-facing pages on the website.

- **Tutorials** teach a first success. Start here.
- **How-to guides** instruct a specific task. They assume you can already build and run the app.
- **Reference** states facts: paths, defaults, manifests, task names.
- **Explanation** explains why the system works this way, including trade-offs and limits.

## Tutorials

| Page | What it teaches |
| --- | --- |
| [Build and run Vibe locally](tutorials/build-and-run.md) | Install the toolchains, fetch the sidecars, and transcribe a file from a local build |

## How-to guides

| Page | Task |
| --- | --- |
| [Check your change](how-to/check-your-change.md) | Run the same tests, linters, formatters, and type checks that CI runs |
| [Build the server](how-to/build-the-server.md) | Run the app against an in-tree `vibe-server` build |
| [Update dependencies](how-to/update-dependencies.md) | Check, update, or Renovate Cargo, pnpm, and Python dependencies |
| [Add a translation](how-to/add-a-translation.md) | Add a locale and keep desktop, website, changelog, and docs catalogs complete |
| [Troubleshoot a crash](how-to/troubleshoot-a-crash.md) | Collect logs and diagnostics for a bug report |
| [Use the meeting browser](how-to/use-the-meeting-browser.md) | Open a call in Vibe, record it, and manage meeting hosts |
| [Sync upstream](how-to/sync-upstream.md) | Fetch upstream branches and tags without colliding with the fork's history |
| [Cut a dev build](how-to/cut-a-dev-build.md) | Tag `dev.<n>` on the `dev` branch and publish the dev release |
| [Publish a release](how-to/publish-a-release.md) | Cut a release candidate, promote a stable release, and point a channel at it |
| [Sign Windows binaries](how-to/sign-windows-binaries.md) | Sign a release through the remote YubiKey signing server |
| [Provision a YubiKey for signing](how-to/sign-with-a-yubikey.md) | Bind an SSL.com code-signing certificate to a YubiKey |
| [Sign and notarize macOS builds](how-to/sign-and-notarize-macos.md) | Create a Developer ID certificate, sign, notarize, and staple |
| [Maintain the repository](how-to/maintain-the-repository.md) | Housekeeping: caches, images, PDFs, fixtures, generated docs, faster builds |

## Reference

| Page | Facts |
| --- | --- |
| [Architecture](reference/architecture.md) | Components, the engine, the server sidecar, and the build flow |
| [Repository layout](reference/repository-layout.md) | Top-level directories and what each one holds |
| [Tooling](reference/tooling.md) | The `task` and `chore` facades, mise pins, and git hooks |
| [Update channels](reference/update-channels.md) | Channel URLs, tag and version rules, manifests, and settings |
| [Meeting browser](reference/meeting-browser.md) | URL schemes, default hosts, platform webviews, and settings |

## Explanation

| Page | Decision |
| --- | --- |
| [Update channels](explanation/update-channels.md) | Why channels are website manifests, why `-rc.<n>` sorts as it does, and why updates only move forward |
| [Upstream isolation](explanation/upstream-isolation.md) | Why upstream tags collide with the fork's tags and why they live in their own namespace |
| [Meeting browser](explanation/meeting-browser.md) | Why a URL scheme instead of the default browser, and what the embedded webview can and cannot do |

## Maintaining these docs

Put a new page in the category that matches its purpose, add it to the table above, and update every reference to a moved path in the same change. Facts belong in reference pages; a how-to links to them instead of restating them.
