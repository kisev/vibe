# Add a translation

Catalogs live under `i18n/`:

```text
i18n/desktop/{locale}.json     desktop UI strings
i18n/website/{locale}.json     website strings
i18n/changelog/{version}.md    release notes, one page per version
i18n/docs/{locale}/{category}/{slug}.md   user-facing docs pages served on /docs
```

Use a [BCP 47 locale code](https://gist.github.com/thewh1teagle/c8877e5c4c5e2780754ddd065ae2592e), such as `pt-BR`.

## Add a locale

1. Copy `i18n/desktop/en-US.json` and `i18n/website/en-US.json` to files named after the new locale.

1. Translate the values and keep the keys unchanged.

1. Add the locale to `i18n/locales.json` and the relevant Inlang settings file (`desktop/project.inlang`, `website/project.inlang`).

1. Compile the message catalogs:

   ```console
   task i18n:generate
   ```

1. Check coverage:

   ```console
   task i18n:audit
   ```

You can translate the desktop app, the website, or both. Missing translations fall back to English.

## Translate content pages

Changelog entries and docs pages carry a `source` hash of the English file they were made from. After translating a page, restamp the hashes so the audit can tell a stale translation from a current one:

```console
task i18n:stamp
```

The content audit (`scripts/check_i18n.py`) fails when a translated page is not one of the pages the site shows. A missing translation, or one whose source hash no longer matches, is a warning: the page falls back to English whole, with no paragraph-level mixing.

For a bulk pass across locales, the `translate` project skill runs the catalogs and content through parallel agents and then runs the audit.
