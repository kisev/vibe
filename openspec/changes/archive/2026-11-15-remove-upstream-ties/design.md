# Design

## Context

See `proposal.md` — Why. What shapes the approach is where the machinery sits: an Aptabase client in `desktop/src-tauri/src/analytics/` with call sites across commands, a frontend `analytics.ts` module and a settings toggle, the key and endpoint in the release workflow and `build.rs`, a Ko-fi dialog opened from the layout and a supporters wall fed by an exported JSON file, four catalog keys per locale, and an analytics export script.

Two constraints bound the solution: nothing may leave the device by default, and the remaining network paths (model download, update check, a page the user opens, an AI provider the user configured) must keep working unchanged. Upstream sync tooling and the retained application identifier are out of scope — other changes own them.

## Goals / Non-Goals

**Goals:**

- No analytics SDK, key, endpoint or call site survives in the app, its configuration, or CI.
- No donation dialog, supporter wall, funding link or supporters data ships with the site.
- The privacy policy states the resulting behaviour in one place, with the PDF regenerated from the same Markdown.
- Diagnostics remain useful without becoming an upload: the report is produced locally and only leaves when the user shares it.

**Non-Goals:**

- An opt-in telemetry mode or a consent flow; the proposal accepts losing aggregate statistics.
- A "share diagnostics" feature, which would be a separate, user-initiated change.
- Repointing update endpoints, in-app links or the application identifier at the fork — owned by the `fork-update-sources` change.
- Rewriting unrelated upstream attribution in docs (LICENSE, README provenance, upstream-sync how-tos).

## Decisions

**Delete the analytics client and every call site instead of gating it behind a flag.** A flag leaves the SDK, the endpoint and a code path in the binary, and any configuration mistake can flip it back on; deletion makes "cannot send" a property of the build. The cost is that re-adding telemetry needs a new change, which is the intended friction.

**Remove the key and endpoint from CI and `build.rs` rather than blanking them.** An empty secret still keeps the wiring point, and a stale repository secret could be re-injected. Removing `APTABASE_APP_KEY`/`APTABASE_BASE_URL` from the release workflow and the rerun line from `build.rs` means a release build has nothing to inject.

**Delete the Ko-fi components, the supporters data file and their catalog keys rather than hiding them with a feature flag.** A hidden component still ships the upstream embed URL and still depends on `kofi-supporters.json`; hidden UI is a surface that can be re-enabled. Removing the keys in every locale (not just English) keeps the catalogs structurally identical, which the translation audit expects.

**Keep one privacy statement as Markdown and regenerate the PDF from it.** The site serves the PDF from `public/`, so the Markdown stays the editable source and `md2pdf` is the single generation step documented in `docs/how-to/maintain-the-repository.md`; there is no second prose copy to drift.

**Keep diagnostics as local strings the user opens.** The diagnostics path composes a bug-report URL and returns it; it never posts. The URL points at the fork's issue tracker, which is consistent with the user choosing to share the report.

**Remove the export tooling with the data sources.** `scripts/export_analytics.py`, the analytics skill, `scripts/export_kofi_supports.py` and `website/public/kofi-supporters.json` describe or consume removed sources; leaving them would imply a pipeline that no longer exists.

## Risks / Trade-offs

- [No aggregate usage or crash statistics] → User reports and the desktop/website test suites replace them; the proposal states this assumption.
- [A future telemetry request re-opens the design] → It arrives as a new change with an explicit user-initiated flow, not a flag on this one.
- [Generated artefacts drift from their sources] → The PDF is regenerated in the same commit that rewrites the policy; the supporters JSON was deleted, not left stale.
- [The roadmap keeps naming Aptabase and Ko-fi in its rationale] → The roadmap card explains why the change exists and carries no link or data surface, so the sweep tolerates it (see task 3.1).
- [Icon assets survive a component's deletion] → The removal commit dropped the last imports; the unused `Heart` icon files are deleted with this change rather than left as dead assets.
