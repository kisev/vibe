# Proposal

## Why

Switching the site language updates the header (`Nav` receives the locale as a prop and re-renders) but leaves the routed page in the previous language until a manual reload. Paraglide message functions read the locale from a module-level value at call time and React has no subscription to `setLocale(..., { reload: false })`, so nothing re-renders the page subtree. Pages that cache translated data in state — the changelog in particular — also keep the old locale's content after a switch, which reads as "the changelog isn't translated".

## What Changes

- A locale change through the selector (or an adopted `?lang=`) re-renders the routed page without a reload, not only the header.
- Pages that hold their own locale-dependent data (changelog release list, docs pages) re-initialize that data for the new locale instead of keeping the previous locale's copy.
- Document `lang` and `dir` continue to follow the locale (already implemented; kept as the contract this change must not break).
- A regression test switches the language and asserts that page body content, not just the header, changes to the target locale.

## Capabilities

### New Capabilities

- `site-locale`: a live locale switch re-renders all locale-dependent UI, including routed pages and their loaded content.

### Modified Capabilities

## Impact

- `website/src/components/Layout.tsx`: the routed outlet is keyed by the active locale so a switch remounts the page.
- `website/src/lib/i18n.test.ts`: a component test renders a real page and asserts its body text follows the selector.
- No routing, translation-catalog, or build change; no app or server change.
