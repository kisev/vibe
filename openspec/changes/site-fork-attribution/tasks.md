# Tasks

- [x] 1. Point the footer and call-to-action repository links at `github.com/kisev/vibe`.
- [x] 2. Point `index.html`'s canonical URL, `og:url`, social images and author link at the fork's domain and account.
- [x] 3. Update `sitemap.xml`, `robots.txt`, `llm.txt`, `structured-data.jsonld` and `linux_install_options.json` to the fork's addresses, so they agree with the canonical URL.
- [x] 4. Point `installer.sh`'s RPM and DEB downloads at the fork's releases and update the URL in its header comment.
- [x] 5. Add `website/tests/forkAttribution.test.ts`: scans `website/src`, `website/public` and the entry page for the upstream host names, skipping the docs mirror and the generated roadmap, and fails with the offending files.
- [x] 6. Drop the upstream account from the site's untranslatable-brand allowlist, where it was only there to let upstream copy pass.
- [x] 7. `pnpm --dir website exec vitest run` green (the attribution test included) and `tsc --noEmit` clean.
