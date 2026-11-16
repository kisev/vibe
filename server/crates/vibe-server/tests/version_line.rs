//! The server's own version line, as the release process relies on it:
//! `.server-version` holds a `server-v*` release tag minus the prefix, the
//! release workflow publishes that shape and stamps the tag into the binary,
//! and the pin never runs ahead of the crate version that precedes it.
//! Nothing else in the build would notice if one of these drifted.

// Test harness: a panic with context beats a silent skip.
#![allow(clippy::expect_used)]

use std::fs;
use std::path::{Path, PathBuf};

fn repo_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../..")
        .canonicalize()
        .expect("resolve the repository root")
}

fn read(relative: &str) -> String {
    fs::read_to_string(repo_root().join(relative)).unwrap_or_else(|error| panic!("read {relative}: {error}"))
}

/// `vX.Y.Z` (or bare `X.Y.Z`) to comparable numbers.
fn version(value: &str) -> (u64, u64, u64) {
    let parts: Vec<u64> = value
        .trim()
        .trim_start_matches('v')
        .split('.')
        .map(|part| part.parse().unwrap_or_else(|_| panic!("not a version: {value:?}")))
        .collect();
    match parts.as_slice() {
        [major, minor, patch] => (*major, *minor, *patch),
        _ => panic!("not a three-part version: {value:?}"),
    }
}

/// The pin is the release tag with `server-` dropped, which is what
/// `scripts/setup_sidecars.sh` downloads and what the app ships as a sidecar.
#[test]
fn the_pin_is_a_release_tag_on_the_server_line() {
    let pin = read(".server-version");
    let pin = pin.trim();
    assert!(
        pin.starts_with('v'),
        ".server-version must hold a tag-shaped version: {pin:?}"
    );

    let (major, _, _) = version(pin);
    assert!(
        major >= 1,
        "the server's own line starts at 1.0.0, never upstream's 0.x: {pin:?}"
    );

    let setup = read("scripts/setup_sidecars.sh");
    assert!(
        setup.contains(r#"tag="server-$server""#),
        "scripts/setup_sidecars.sh must turn the pin into a server-v* release tag"
    );
}

#[test]
fn the_release_workflow_publishes_the_server_line() {
    let workflow = read(".github/workflows/server-release.yml");
    assert!(
        workflow.contains(r#"- "server-v*""#),
        "server-release.yml must trigger on server-v* tags"
    );
    assert!(
        workflow.contains(r#"VIBE_SERVER_VERSION="${VERSION#server-}""#),
        "the binary must be built with the tag's version, not the crate version"
    );
}

/// The crate version is raised before the tag; the pin follows only once the
/// release exists. A pin ahead of the crate means the marker points at a
/// release the tree never built.
#[test]
fn the_pin_never_runs_ahead_of_the_crate() {
    let pinned = version(&read(".server-version"));
    let crate_version = version(env!("CARGO_PKG_VERSION"));
    assert!(
        pinned <= crate_version,
        "the pin {pinned:?} runs ahead of the crate {crate_version:?}; bump the crate before pinning"
    );
}
