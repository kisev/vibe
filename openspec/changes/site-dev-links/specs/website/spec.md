# Spec Delta

## REMOVED Requirements

### Requirement: The site publishes a dev twin from dev

**Reason**: GitHub skips the deploy job of a run on a `dev` ref — zero steps, no error, the run reads successful — even though the `github-pages` environment admits `dev`. The twin therefore only refreshed when `main` moved, and a preview that trails a release is not a preview. The maintainer asked for dev content to be visible without rebuilding the site.

**Migration**: The `/vibe/dev/` path, the second build and its hash router are removed; the dev channel is linked from the site instead (see the added requirement below). `main` remains the only deploy source.

## ADDED Requirements

### Requirement: The dev channel is linked, not rebuilt

The site SHALL expose the repository's dev channel as links to files in the `dev` branch on GitHub — the unreleased changelog, the OpenSpec changes that back the roadmap, the dev updater manifest and the branch's recent commits — and SHALL NOT build, assemble or serve a second bundle for it. The links SHALL show the branch's current content without a site deploy.

#### Scenario: A visitor reads the unreleased notes

- **WHEN** a visitor follows the dev changelog entry
- **THEN** GitHub opens `dev`'s `i18n/changelog/unreleased.md` as it stands at that moment

#### Scenario: A dev change lands

- **WHEN** a change is pushed to `dev`
- **THEN** the linked page shows it without any site build or deploy

#### Scenario: A deploy runs

- **WHEN** the deploy workflow runs
- **THEN** it checks out and publishes `main` only, and no `/vibe/dev/` path exists in the artifact
