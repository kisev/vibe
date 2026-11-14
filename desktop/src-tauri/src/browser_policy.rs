//! The embedded browser's allowlist and blocked-host registry.
//!
//! One policy decides what may load, independent of the engine: a host is allowed over https,
//! on the exact name or any subdomain. A top-level navigation and every resource request are
//! checked by the same functions; the per-platform code only translates an engine's event into
//! a decision and records what it refused.

use crate::config::STORE_FILENAME;
use once_cell::sync::Lazy;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Url};
use tauri_plugin_store::StoreExt;

/// The persisted allowlist. Replaces the old meeting-host key.
pub const ALLOWED_HOSTS_KEY: &str = "browser.allowedHosts";
/// The key the previous release wrote; migrated into [`ALLOWED_HOSTS_KEY`] on startup.
pub const LEGACY_HOSTS_KEY: &str = "meeting.browserHosts";
/// The strictness setting. There is deliberately no "off": navigation is always gated.
pub const POLICY_KEY: &str = "browser.policy";
/// Emitted with the full blocked list whenever it changes.
pub const BLOCKED_HOSTS_EVENT: &str = "browser-blocked-hosts";

/// How far the allowlist reaches. `strict` checks every origin; `trusted-site` lets an allowed
/// page load its resources from anywhere but never relaxes the navigation gate.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum Policy {
    #[default]
    Strict,
    TrustedSite,
}

impl Policy {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Strict => "strict",
            Self::TrustedSite => "trusted-site",
        }
    }

    /// Reject anything that is not one of the two known modes; there is no third value.
    pub fn parse(raw: &str) -> Result<Self, String> {
        match raw.trim() {
            "strict" => Ok(Self::Strict),
            "trusted-site" => Ok(Self::TrustedSite),
            other => Err(format!(
                "Unknown browser policy {other:?}; expected \"strict\" or \"trusted-site\""
            )),
        }
    }

    /// Navigation is gated identically in both modes.
    pub fn blocks_navigation(self, url: &str, allowed: &[String]) -> bool {
        should_block(url, allowed)
    }

    /// Only `strict` filters resources; `trusted-site` leaves them to the engine.
    pub fn blocks_resource(self, url: &str, allowed: &[String]) -> bool {
        match self {
            Self::Strict => should_block(url, allowed),
            Self::TrustedSite => false,
        }
    }

    /// Whether a page window needs the per-origin resource filter at all.
    pub fn filters_resources(self) -> bool {
        matches!(self, Self::Strict)
    }
}

/// Last saved allowlist, so the resource-request hot path never touches the store.
static ALLOWED: Lazy<Mutex<Vec<String>>> = Lazy::new(|| Mutex::new(Vec::new()));
/// Unique blocked hosts, newest first. Per app run, cleared only by allowing a host.
static BLOCKED: Lazy<Mutex<Vec<String>>> = Lazy::new(|| Mutex::new(Vec::new()));

/// Accepts a bare host name or a pasted URL and returns a lowercase host name.
pub fn normalize_host(raw: &str) -> Option<String> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return None;
    }
    let candidate = if trimmed.contains("://") {
        trimmed.to_string()
    } else {
        format!("https://{trimmed}")
    };
    let parsed = Url::parse(&candidate).ok()?;
    let host = parsed.host_str()?.trim_end_matches('.').to_ascii_lowercase();
    (!host.is_empty()).then_some(host)
}

/// Normalize and dedupe a list of hosts, dropping anything that is not a host name.
pub fn normalize_hosts(hosts: impl IntoIterator<Item = String>) -> Vec<String> {
    let mut normalized: Vec<String> = Vec::new();
    for raw in hosts {
        let Some(host) = normalize_host(&raw) else {
            continue;
        };
        if !normalized.contains(&host) {
            normalized.push(host);
        }
    }
    normalized
}

fn parse_host_list(value: Option<serde_json::Value>) -> Vec<String> {
    value
        .and_then(|value| value.as_array().cloned())
        .map(|items| normalize_hosts(items.iter().filter_map(|item| item.as_str().map(str::to_string))))
        .unwrap_or_default()
}

/// The host of a URL, lowercase and without the trailing dot.
pub fn host_of(url: &str) -> String {
    Url::parse(url)
        .ok()
        .and_then(|parsed| parsed.host_str().map(|host| host.trim_end_matches('.').to_ascii_lowercase()))
        .unwrap_or_default()
}

/// A host matches itself and its subdomains; an entry never matches a parent domain.
pub fn is_allowed_host(host: &str, allowed: &[String]) -> bool {
    let host = host.trim_end_matches('.').to_ascii_lowercase();
    allowed
        .iter()
        .any(|entry| host == *entry || host.ends_with(&format!(".{entry}")))
}

/// Only https URLs load; the rule is a host rule, so a port does not change the decision.
pub fn is_allowed_url(url: &str, allowed: &[String]) -> bool {
    let Ok(parsed) = Url::parse(url) else {
        return false;
    };
    if parsed.scheme() != "https" {
        return false;
    }
    let Some(host) = parsed.host_str() else {
        return false;
    };
    is_allowed_host(host, allowed)
}

/// Whether an engine event should be refused. Engine-internal schemes (`about:`, `data:`,
/// `blob:`) stay untouched; plain http and ws are refused outright, and https/wss must point at
/// an allowed host (so a page's secure socket to an allowed origin keeps working).
pub fn should_block(url: &str, allowed: &[String]) -> bool {
    let Ok(parsed) = Url::parse(url) else {
        return false;
    };
    match parsed.scheme() {
        "http" | "ws" => true,
        "https" | "wss" => parsed.host_str().map(|host| !is_allowed_host(host, allowed)).unwrap_or(true),
        _ => false,
    }
}

fn set_cache(hosts: Vec<String>) -> Vec<String> {
    if let Ok(mut cache) = ALLOWED.lock() {
        *cache = hosts.clone();
    }
    hosts
}

/// The current allowlist from memory. Call [`load_allowed`] first to refresh from the store.
pub fn allowed() -> Vec<String> {
    ALLOWED.lock().map(|cache| cache.clone()).unwrap_or_default()
}

/// Read the allowlist from the store and refresh the in-memory copy.
pub fn load_allowed(app: &AppHandle) -> Vec<String> {
    let hosts = app
        .store(STORE_FILENAME)
        .ok()
        .map(|store| parse_host_list(store.get(ALLOWED_HOSTS_KEY)))
        .unwrap_or_default();
    set_cache(hosts)
}

/// Decode the stored policy: missing means `strict`, and an unknown or non-string value is an
/// error rather than a silent third mode.
pub fn parse_stored_policy(value: Option<serde_json::Value>) -> Result<Policy, String> {
    match value {
        None => Ok(Policy::default()),
        Some(serde_json::Value::String(raw)) => Policy::parse(&raw),
        Some(other) => Err(format!("Stored browser policy must be a string, found {other}")),
    }
}

/// Read the policy from the store. A corrupt value falls back to `strict` (the safe mode) and
/// leaves the stored value alone so the user can still see and fix it.
pub fn load_policy(app: &AppHandle) -> Policy {
    let stored = app.store(STORE_FILENAME).ok().and_then(|store| store.get(POLICY_KEY));
    match parse_stored_policy(stored) {
        Ok(policy) => policy,
        Err(error) => {
            tracing::warn!("{error}; using the strict browser policy");
            Policy::default()
        }
    }
}

/// Persist one of the two known policies; anything else is refused before it touches the store.
pub fn save_policy(app: &AppHandle, raw: &str) -> Result<Policy, String> {
    let policy = Policy::parse(raw)?;
    let store = app.store(STORE_FILENAME).map_err(|error| error.to_string())?;
    store.set(POLICY_KEY, serde_json::json!(policy.as_str()));
    store.save().map_err(|error| error.to_string())?;
    Ok(policy)
}

fn save_allowed(app: &AppHandle, hosts: Vec<String>) -> Result<Vec<String>, String> {
    let hosts = normalize_hosts(hosts);
    let store = app.store(STORE_FILENAME).map_err(|error| error.to_string())?;
    store.set(ALLOWED_HOSTS_KEY, serde_json::json!(hosts));
    store.save().map_err(|error| error.to_string())?;
    Ok(set_cache(hosts))
}

/// Merge the previous release's meeting lists into the allowlist, keeping anything the user
/// already added to the new key and removing the legacy key so the migration runs once.
pub fn merge_allowlist(existing: &[String], legacy: &[String]) -> Vec<String> {
    let mut merged = normalize_hosts(existing.iter().cloned());
    for host in normalize_hosts(legacy.iter().cloned()) {
        if !merged.contains(&host) {
            merged.push(host);
        }
    }
    merged
}

/// One-shot startup migration from `meeting.browserHosts` to `browser.allowedHosts`.
/// Only what the user stored is carried over: there are no seeded defaults.
pub fn migrate(app: &AppHandle) -> Result<(), String> {
    let store = app.store(STORE_FILENAME).map_err(|error| error.to_string())?;
    let existing = parse_host_list(store.get(ALLOWED_HOSTS_KEY));
    let Some(legacy) = store.get(LEGACY_HOSTS_KEY) else {
        set_cache(existing);
        return Ok(());
    };
    let legacy = parse_host_list(Some(legacy));
    let merged = merge_allowlist(&existing, &legacy);
    // Use the merged list even if persisting it fails; the legacy key is retried next launch.
    let merged = set_cache(merged);
    store.set(ALLOWED_HOSTS_KEY, serde_json::json!(merged));
    store.delete(LEGACY_HOSTS_KEY);
    store.save().map_err(|error| error.to_string())?;
    Ok(())
}

/// The unique blocked hosts, newest first.
pub fn blocked_hosts() -> Vec<String> {
    BLOCKED.lock().map(|hosts| hosts.clone()).unwrap_or_default()
}

/// Insert a host at the front unless it is already recorded. Returns whether the list changed.
fn push_blocked(hosts: &mut Vec<String>, host: &str) -> bool {
    let Some(host) = normalize_host(host) else {
        return false;
    };
    if hosts.iter().any(|item| item == &host) {
        return false;
    }
    hosts.insert(0, host);
    true
}

fn emit_blocked(app: &AppHandle) -> Vec<String> {
    let hosts = blocked_hosts();
    if let Err(error) = app.emit(BLOCKED_HOSTS_EVENT, hosts.clone()) {
        tracing::warn!("could not emit the blocked hosts: {error}");
    }
    hosts
}

/// Record a refused host once and publish the registry.
pub fn record_blocked_host(app: &AppHandle, raw: &str) -> Vec<String> {
    let changed = {
        let Ok(mut hosts) = BLOCKED.lock() else {
            return Vec::new();
        };
        push_blocked(&mut hosts, raw)
    };
    if changed {
        emit_blocked(app)
    } else {
        blocked_hosts()
    }
}

fn remove_blocked_host(app: &AppHandle, host: &str) -> bool {
    let removed = {
        let Ok(mut hosts) = BLOCKED.lock() else {
            return false;
        };
        let Some(position) = hosts.iter().position(|item| item == host) else {
            return false;
        };
        hosts.remove(position);
        true
    };
    if removed {
        emit_blocked(app);
    }
    removed
}

/// Add a host to the allowlist and drop it from the blocked registry.
pub fn allow_host(app: &AppHandle, raw: &str) -> Result<Vec<String>, String> {
    let host = normalize_host(raw).ok_or_else(|| format!("Enter a bare host name, not {raw:?}"))?;
    let mut hosts = load_allowed(app);
    if !hosts.contains(&host) {
        hosts.push(host.clone());
    }
    let saved = save_allowed(app, hosts)?;
    remove_blocked_host(app, &host);
    Ok(saved)
}

/// Remove a host from the allowlist; open pages keep what they already loaded until the next
/// navigation, which is then refused and recorded.
pub fn remove_allowed_host(app: &AppHandle, raw: &str) -> Result<Vec<String>, String> {
    let host = normalize_host(raw).ok_or_else(|| format!("Invalid host {raw:?}"))?;
    let hosts = load_allowed(app);
    save_allowed(app, hosts.into_iter().filter(|item| item != &host).collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn hosts(items: &[&str]) -> Vec<String> {
        items.iter().map(|item| (*item).to_string()).collect()
    }

    #[test]
    fn matching_is_https_exact_host_or_subdomain() {
        let allowed = hosts(&["example.com"]);
        assert!(is_allowed_url("https://example.com/room/1", &allowed));
        assert!(is_allowed_url("https://meet.example.com/room/1", &allowed));
        assert!(is_allowed_url("https://EXAMPLE.COM:8443/room", &allowed));
        assert!(!is_allowed_url("http://example.com/room/1", &allowed));
        assert!(!is_allowed_url("https://notexample.com/x", &allowed));
        assert!(!is_allowed_url("https://example.com.evil.test/x", &allowed));
        assert!(!is_allowed_url("https://example.org/x", &allowed));
    }

    #[test]
    fn navigation_and_resources_block_http_and_foreign_hosts_only() {
        let allowed = hosts(&["example.com"]);
        assert!(!should_block("https://cdn.example.com/app.js", &allowed));
        assert!(should_block("https://cdn.other.test/app.js", &allowed));
        // Plain http is refused even from an allowed host, but engine internals pass through.
        assert!(should_block("http://example.com/app.js", &allowed));
        // A secure socket keeps working only on an allowed origin.
        assert!(!should_block("wss://meet.example.com/socket", &allowed));
        assert!(should_block("wss://other.test/socket", &allowed));
        assert!(should_block("ws://meet.example.com/socket", &allowed));
        assert!(!should_block("about:blank", &allowed));
        assert!(!should_block("data:text/plain,hi", &allowed));
        assert!(!should_block("blob:https://example.com/abc", &allowed));
        assert!(!should_block("not a url", &allowed));
    }

    #[test]
    fn host_normalization_accepts_urls_and_dedupes() {
        let normalized = normalize_hosts(vec![
            " Meet.Example.COM. ".to_string(),
            "https://meet.example.com/path".to_string(),
            "meet.example.com".to_string(),
            "   ".to_string(),
        ]);
        assert_eq!(normalized, hosts(&["meet.example.com"]));
    }

    #[test]
    fn migration_keeps_new_and_legacy_hosts_once() {
        let merged = merge_allowlist(
            &hosts(&["new.example.com"]),
            &hosts(&["telemost.yandex.ru", "New.Example.com."]),
        );
        assert_eq!(merged, hosts(&["new.example.com", "telemost.yandex.ru"]));
        assert!(merge_allowlist(&[], &[]).is_empty());
    }

    #[test]
    fn blocked_hosts_are_unique_and_newest_first() {
        let mut blocked = Vec::new();
        assert!(push_blocked(&mut blocked, "first.example.com"));
        assert!(push_blocked(&mut blocked, "second.example.com"));
        assert!(!push_blocked(&mut blocked, "first.example.com"));
        assert_eq!(blocked, hosts(&["second.example.com", "first.example.com"]));
        // The same host arriving through a URL is the same entry.
        assert!(!push_blocked(&mut blocked, "https://second.example.com/path"));
        assert!(!push_blocked(&mut blocked, "   "));
        assert_eq!(blocked.len(), 2);
    }

    #[test]
    fn policy_modes_gate_resources_but_never_navigation() {
        let allowed = hosts(&["example.com"]);
        let third_party = "https://cdn.other.test/app.js";

        // Strict refuses a resource from an origin outside the list.
        assert!(Policy::Strict.blocks_resource(third_party, &allowed));
        // Trusted-site leaves resources to the engine, whatever their origin.
        assert!(!Policy::TrustedSite.blocks_resource(third_party, &allowed));

        // Navigation is refused identically in both modes.
        for policy in [Policy::Strict, Policy::TrustedSite] {
            assert!(policy.blocks_navigation("https://other.test/room", &allowed));
            assert!(policy.blocks_navigation("http://example.com/room", &allowed));
            assert!(!policy.blocks_navigation("https://meet.example.com/room", &allowed));
        }

        assert!(Policy::Strict.filters_resources());
        assert!(!Policy::TrustedSite.filters_resources());
    }

    #[test]
    fn stored_policy_defaults_to_strict_and_refuses_unknown_values() {
        assert_eq!(parse_stored_policy(None), Ok(Policy::Strict));
        assert_eq!(parse_stored_policy(Some(serde_json::json!("strict"))), Ok(Policy::Strict));
        assert_eq!(
            parse_stored_policy(Some(serde_json::json!("trusted-site"))),
            Ok(Policy::TrustedSite)
        );
        // No "off", no unknown string, no non-string value.
        assert!(parse_stored_policy(Some(serde_json::json!("off"))).is_err());
        assert!(parse_stored_policy(Some(serde_json::json!(""))).is_err());
        assert!(parse_stored_policy(Some(serde_json::json!(true))).is_err());
        assert!(Policy::parse("nonsense").is_err());
    }
}
