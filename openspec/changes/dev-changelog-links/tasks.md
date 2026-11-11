# Tasks

## 1. Website alias

- [ ] 1.1 Render the dev alias route from the `unreleased` entry, labeled as the dev line; verify the page shows the current dev notes and never the unknown-version state
- [ ] 1.2 Rewrite versioned dev URLs (param `dev` or containing `-dev.`) to the alias with `history.replaceState`; verify an old dev link shows the alias content and the address bar canonicalizes
- [ ] 1.3 Fall back to the newest released entry with a notice when the dev entry has no bullets; verify with an emptied unreleased entry

## 2. Links

- [ ] 2.1 Map dev versions in `changelogURL` to the alias; verify unit tests for stable, dev, `unreleased`, and `dev` inputs
- [ ] 2.2 Add the alias link to the dev release body in `dev-build.yml`; verify a built body links to `/changelog/dev`
- [ ] 2.3 Keep stable version links resolving to their own entries; verify a stable URL renders its entry

## 3. Validation

- [ ] 3.1 Live: open a link naming an old dev version and the alias itself, and verify both render the current dev entry
- [ ] 3.2 Verify the dev build's "What's new" opens the alias, not a versioned dev path
- [ ] 3.3 Live acceptance: open an old dev-version link from a previous release note and confirm it lands on the current dev entry; report anything that reads confusingly
