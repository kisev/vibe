# site-locale Specification

## Purpose

Changing the site language takes effect immediately across the whole page, without a reload, and every piece of locale-dependent content is rendered in the newly selected locale.

## Requirements

### Requirement: A locale switch re-renders the whole page

Selecting a different locale SHALL re-render the routed page and all locale-dependent UI in the new locale without reloading the document, in addition to updating `<html lang>` and `dir`.

#### Scenario: Switching language on a content page

- **WHEN** a visitor picks another language in the selector
- **THEN** the page body text, including content outside the header, is rendered in the chosen locale before any reload

#### Scenario: The previous locale does not remain

- **WHEN** the page content has been re-rendered for the new locale
- **THEN** no visible string from the previous locale remains on the page

### Requirement: Locale-dependent page data reloads for the new locale

A page that loads or memoizes translated content SHALL obtain that content for the active locale after a switch, rather than keeping the content it loaded for the previous locale.

#### Scenario: The changelog after a switch

- **WHEN** a visitor switches language while viewing the changelog
- **THEN** the page chrome and the release entries are presented for the new locale, and any translated release notes for it are loaded

#### Scenario: A page with lazily loaded translations

- **WHEN** a visitor switches to a locale the page has translations for
- **THEN** the page fetches those translations for the new locale instead of showing the old locale's copy
