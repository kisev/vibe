# Tasks

- [ ] 1. List the current navigation entries and where each lives (header vs footer) in `Nav.tsx` and `Footer.tsx`, and name the ones that exist in both.
- [ ] 2. Move every section link into the header, with a collapsed menu below the `sm` breakpoint that reaches all of them; keep the header's current look at desktop width.
- [ ] 3. Remove the duplicated section links from the footer, leaving language, licence, repository and contact.
- [ ] 4. Tests: a phone-width render exposes every section from the header and none from the footer; the desktop render keeps its previous entries.
- [ ] 5. `docs/how-to/maintain-the-repository.md` matches the new structure, and the synced `site-roadmap` requirement is checked against the code.
- [ ] 6. `pnpm --dir website exec vitest run` and `pnpm --dir website exec tsc --noEmit` are green.
