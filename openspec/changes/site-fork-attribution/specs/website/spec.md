# Spec Delta

## Purpose

The public site's addresses and identity, so a visitor or a crawler always lands on the fork's own repository, downloads and documentation instead of upstream's.

## ADDED Requirements

### Requirement: The site publishes the fork's addresses

Every address the site publishes — its canonical URL and social metadata, its sitemap and robots file, its machine-readable summary, its repository and download links, its installer's release URLs and its structured data — SHALL name the fork. The addresses SHALL agree with each other. Upstream SHALL appear only where the fork credits it: the donation link and the documentation that explains the upstream relationship.

#### Scenario: A visitor follows the repository link

- **WHEN** a visitor opens the repository link in the footer or the call to action
- **THEN** it opens the fork's repository

#### Scenario: A crawler reads the site's identity

- **WHEN** a crawler reads the canonical URL, `og:url` and the structured data
- **THEN** all three name the same fork address

#### Scenario: Someone installs from the installer

- **WHEN** the published installer fetches a package
- **THEN** it downloads the fork's release, not upstream's

#### Scenario: A future edit reintroduces upstream

- **WHEN** a site source or served asset mentions an upstream host outside the deliberate credits
- **THEN** the attribution test fails and names the file
