# Spec Delta

## Purpose

How the translated documentation behaves: which words are product labels that never change, what a link inside a translated page may point at, and where interface wording comes from.

## ADDED Requirements

### Requirement: Product labels are never translated

Update-channel names (`Release`, `Beta`, `Dev`) SHALL appear as the application's own labels in every locale of the documentation, exactly as the desktop client shows them. A translated phrase SHALL NOT replace them.

#### Scenario: A translated page names a channel

- **WHEN** a locale's update-channels page names the channels
- **THEN** it shows `Release`, `Beta` and `Dev`, and the surrounding prose is translated

### Requirement: A translated page links only to translated pages or to the repository

A link inside a translated page SHALL resolve: it SHALL point at a page present in the translated set, or at an absolute repository address for a document that exists only in English. A link SHALL NOT name a file that does not exist.

#### Scenario: A reader follows a link

- **WHEN** a reader follows a cross-reference from a translated page
- **THEN** the target exists — a translated page or the repository file

#### Scenario: A maintainer-only document

- **WHEN** a translated page refers to a how-to that is not translated
- **THEN** the link is an absolute repository address, not a relative path into the translated tree

### Requirement: Interface wording follows the catalog

Where a translated page quotes an interface label, it SHALL use the value from `i18n/desktop/<locale>.json` rather than a shorter variant of its own.

#### Scenario: A device placeholder

- **WHEN** a page names the "None" device
- **THEN** it uses the catalog's wording for `noRecord` in that locale
