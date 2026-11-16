# Proposal

## Why

The site is the fork's, but its published addresses were still upstream's: the repository link in the footer and the call to action, the canonical URL and `og:url`, the social image, `sitemap.xml`, `robots.txt`, `llm.txt`, the installer script's release URLs and the repository entry in `structured-data.jsonld`. The last two disagreed with each other after the domain moved — structured data claimed `kisev.github.io` while `index.html` still claimed `thewh1teagle.github.io`, so a crawler got two different answers about where this site lives.

Nothing about that is deliberate credit: the credit that belongs to upstream is the donation link and the upstream-sync documentation, not the fork's own identity.

## What Changes

- Every address the site publishes names the fork: `github.com/kisev/vibe`, `kisev.github.io/vibe`, and the fork's release downloads in the installer.
- A test scans the site's sources and served assets for the upstream host names and fails on any that is not a deliberate credit, so the next copy-paste cannot quietly reintroduce one.

## Capabilities

- `website` (existing): the site's addresses and identity.

## Impact

- `website/index.html`, `website/src/components/{Footer,Cta}.tsx`, `website/src/lib/linux_install_options.json`, `website/public/{llm.txt,sitemap.xml,robots.txt,installer.sh,structured-data.jsonld}`, and a new `website/tests/forkAttribution.test.ts`.
- `website/public/docs/**` and the generated `roadmap.json` keep their upstream mentions: the docs explain the upstream relationship, and the roadmap quotes change proposals that discuss it.

## Non-Goals

- Removing upstream attribution from the app's donation link or from the upstream-sync documentation.
- Changing the application's bundle identifier (`github.com.thewh1teagle.vibe`), which is the installed app's identity on disk.
