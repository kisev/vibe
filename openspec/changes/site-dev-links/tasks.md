# Tasks

- [ ] 1. Reduce `website.yml` to one build: drop the `dev-src` checkout, the dev build, the `pwa`-adjacent assembly step and `website:assemble`; keep the deploy on `main` with the guard.
- [ ] 2. Delete the dev-only surface from the site: the hash-routing branch in `website/src/lib/site.ts`, the `docs/:slug` route and hash handling in `App.tsx`/`Docs.tsx`, the changelog alias in `Changelog.tsx`, the `/vibe/docs#slug` rewriting in `DocViewer.tsx`, the `BASE_URL` manifest in `PrivacyPolicy.tsx`, `DevBanner.tsx` and `scripts/website_assemble.sh` with its task.
- [ ] 3. Add a Development section (header entry included) whose links point at `dev` on GitHub: `i18n/changelog/unreleased.md`, `openspec/changes/`, `updater/dev.json`, and the branch's commits.
- [ ] 4. Replace `website/tests/deployArtifact.test.ts` with a test that the built artifact holds no `dev/` directory and that the Development links resolve to the `dev` branch.
- [ ] 5. `docs/how-to/maintain-the-repository.md` describes the single build and the linked dev channel.
- [ ] 6. `pnpm --dir website exec vitest run`, `pnpm --dir website exec tsc --noEmit` and `openspec validate site-dev-links --strict` are green.
