# Design

## Context

The user's projects converged on one stack; `kisev/skills` is the full reference (JS-centric, ~27 KB taskfile), `kisev/gitlaw` a leaner Python variant. vibe needs the union because it is TS + Rust + Python + GitHub Actions + generated i18n artifacts. This change ports the stack; it does not invent one.

## Decisions

- **mise as the version layer.** All binaries pinned in `mise.toml` (aqua/npm/pipx backends, exact versions copied from `kisev/skills` where present). Everything resolves through `mise exec --`, so neither hooks nor CI depend on global installs. Node/Python/rustup keep their existing roles; mise only adds the lint binaries.
- **Taskfile delegates, never duplicates.** A task wraps `pnpm --dir desktop ...`, `uv run ...`, or `cargo ...` as-is. When a script changes, the task does not. No wrapper logic beyond directory and env.
- **lefthook over husky/pre-commit.** Same as skills/gitlaw: `pre-commit` parallel staged-scoped jobs (doublestar globs), `pre-push: task test`, `commit-msg: commitlint`. Pre-commit must stay under a few seconds — it will run on the agent's commits too.
- **markdownlint-cli2 for rules, mdformat for format** (gitlaw's split), prettier stays for what it already owns here (json/md via existing `.prettierrc.json`). One linter per file type; prettier does not format what oxfmt owns (json) — assignment is exclusive to avoid fights.
- **oxlint as an additional fast pass, not an eslint replacement.** `desktop/` keeps its existing eslint setup for React rules; oxlint adds a seconds-fast first pass. If it proves redundant, dropping eslint is a later decision, not this change.
- **rustfmt stays on stable.** The interesting options (`imports_granularity`, `group_imports`) are nightly-only; a nightly-just-for-fmt toolchain adds flakiness for marginal gain. `rustfmt.toml` gains only stable keys beyond the current three lines.
- **Clippy: curated set, not blanket pedantic.** `[workspace.lints.clippy]` with `unwrap_used`, `expect_used`, `undocumented_unsafe_blocks`, targeted cast lints. Blanket pedantic generates noise that teams then suppress wholesale.
- **cargo-deny scope.** Licenses allowlist (MIT, Apache-2.0, ISC, BSD-3, Unicode-3.0, CC0/MIT-0 as needed by the transitive graph), advisories, duplicates warn-first then ban after the first run shows the baseline. cargo-audit is not added — deny covers advisories.
- **Generated trees are exempt, explicitly.** `src/paraglide/`, `catalog-*.json`, generated docs, `gen/` schemas are listed in every tool's ignore, not blanket-skipped by path prefix hacks.
- **chore is removed from AGENTS.md.** It was already banned in practice; `task` takes its place.

## Risks / Trade-offs

- [Hook friction on the agent's SSH-signed commits] → pre-commit jobs are format-only staged checks; a failing gate is a real finding, not noise. If seconds add up, drop to formatting the touched files only.
- \[First `cargo-deny` run fails on the existing graph\] → run it, record the baseline, allowlist exceptions explicitly in `deny.toml` rather than disabling categories.
- [markdownlint vs prettier disagreeing on md] → prettier owns formatting, markdownlint owns structure; disable the overlapping markdownlint rules.

## Migration Plan

Single PR: `mise.toml`, `Taskfile.yml`, `lefthook.yml`, per-tool configs, workspace lints, `deny.toml`, AGENTS.md, one CI job calling `task lint format:check test`. Hooks are opt-in per checkout (`task hooks`), so nothing breaks for contributors who never install them.

## Open Questions

- Should `cargo-semver-checks` gate server releases now or when the `server-v0.9.0` release actually happens? (Cheap to add to the release workflow only.)
