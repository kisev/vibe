# Tasks

- [ ] 1. Decide and document what the archive holds and what it redacts, in the change's design: log file, settings with secrets replaced by their presence, versions, platform, catalog digest; explicitly no media, no transcripts, no paths outside the app's own folders.
- [ ] 2. Add a command that assembles the archive into the app's config folder and returns its path; redact keys by name against an allowlist of config keys, so a new secret cannot leak by default.
- [ ] 3. Offer the action in the diagnostics surface next to the pre-filled issue link, with the content list shown before it runs and the finished file revealed afterwards.
- [ ] 4. Test the redaction: a settings file carrying an API key, a pairing token and a normal preference yields the preference and only the presence of the secrets.
- [ ] 5. Docs: how to report a problem, what the archive contains, and that nothing is sent automatically.
- [ ] 6. Acceptance: one bundle opened by hand contains what it promised and nothing else.
