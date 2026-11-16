# Spec Delta

## Purpose

The public website presents all of its content in the visitor's chosen language, offers that choice plainly, keeps it across visits and shared links, and never renders a half-translated page.

## ADDED Requirements

### Requirement: All visible strings are translatable

Every user-visible string on the site SHALL come from the website message catalogs; hardcoded English outside them SHALL NOT remain in pages or shared components.

#### Scenario: A page in another locale

- **WHEN** the site renders in a non-English locale
- **THEN** headings, buttons, dialogs, navigation, and footer text all come from that locale's catalog

#### Scenario: A new string

- **WHEN** a new UI string is added
- **THEN** it lands in the English catalog and flows through the translation pipeline like the rest

### Requirement: The language selector is discoverable everywhere

The site SHALL offer a language selector in the header on every page, including the mobile layout, listing exactly the website locales and marking the active one.

#### Scenario: Desktop header

- **WHEN** a visitor opens the selector
- **THEN** every website locale is listed by its native language name with the current one marked

#### Scenario: Mobile layout

- **WHEN** the site is viewed at a small breakpoint
- **THEN** the selector is reachable from the mobile menu with the same list

### Requirement: The choice persists and is shareable in the URL

The selected locale SHALL persist across visits and SHALL be represented in the URL as a query parameter; opening a URL with that parameter SHALL adopt it, and navigation within the site SHALL preserve the choice.

#### Scenario: A shared link

- **WHEN** a visitor shares a URL carrying a locale
- **THEN** the recipient opens the site in that locale

#### Scenario: A later visit

- **WHEN** a visitor returns without a locale in the URL
- **THEN** the last chosen locale is used

### Requirement: Document language and direction follow the locale

The document SHALL set its `lang` and `dir` attributes from the active locale on every page, and right-to-left locales SHALL render the whole site, not only docs and changelog.

#### Scenario: An RTL locale

- **WHEN** an RTL locale is active on any page
- **THEN** the page direction and document language attributes reflect it

### Requirement: Translation gaps fall back cleanly

A content page without a translation SHALL fall back to English as a whole; chrome strings SHALL fall back per key. A page SHALL NOT mix languages within one content entry.

#### Scenario: A missing page translation

- **WHEN** a locale has no translation for a content page
- **THEN** the English page renders whole, with the rest of the chrome in the chosen locale
