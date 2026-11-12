//! Other applications' meeting schemes, as web URLs.
//!
//! Zoom and Teams hand their own URL schemes to the system (`zoommtg:`, `msteams:`)
//! because they expect to launch their desktop client. Registering Vibe for those
//! schemes is opt-in; when it is on, the app receives the scheme URL and needs the
//! equivalent web address to load in the meeting window.

/// The web URL a meeting scheme stands for, or `None` for anything this module
/// does not understand (the caller then falls back to the system browser or
/// ignores the launch).
pub fn meeting_url(raw: &str) -> Option<String> {
    let (scheme, rest) = raw.split_once("://")?;
    match scheme.to_ascii_lowercase().as_str() {
        "zoommtg" | "zoomus" => zoom_url(rest),
        "msteams" | "teams" => teams_url(rest),
        "webex" | "wbx" => Some(format!("https://{rest}")),
        _ => None,
    }
}

/// `zoommtg://zoom.us/join?confno=123&pwd=abc` → `https://zoom.us/j/123?pwd=abc`.
///
/// Zoom puts the meeting number in `confno`; the web client's join path is `/j/`
/// followed by the number. Everything else in the query is carried over.
fn zoom_url(rest: &str) -> Option<String> {
    let (host, tail) = split_host(rest)?;
    let query = tail.split_once('?').map(|(_, query)| query).unwrap_or_default();
    let confno = form_value(query, "confno")?;
    let mut url = format!("https://{host}/j/{confno}");
    if let Some(pwd) = form_value(query, "pwd") {
        url.push_str("?pwd=");
        url.push_str(&pwd);
    }
    Some(url)
}

/// `msteams://teams.microsoft.com/l/meetup-join/…` → the same path over https.
///
/// Teams' other launch form (`msteams:?launchParams=…`) carries a serialized
/// parameter string rather than a URL, so it is declined.
fn teams_url(rest: &str) -> Option<String> {
    let (host, tail) = split_host(rest)?;
    if !tail.starts_with('/') {
        return None;
    }
    Some(format!("https://{host}{tail}"))
}

fn split_host(rest: &str) -> Option<(&str, &str)> {
    let end = rest.find(['/', '?', '#']).unwrap_or(rest.len());
    let host = &rest[..end];
    if host.is_empty() || !host.contains('.') {
        return None;
    }
    Some((host, &rest[end..]))
}

fn form_value<'a>(query: &'a str, key: &str) -> Option<&'a str> {
    query.split('&').find_map(|pair| {
        let (name, value) = pair.split_once('=')?;
        (name == key && !value.is_empty()).then_some(value)
    })
}

#[cfg(test)]
mod tests {
    use super::meeting_url;

    #[test]
    fn zoom_join_links_become_the_web_client() {
        assert_eq!(
            meeting_url("zoommtg://zoom.us/join?action=join&confno=987654321&pwd=s3cret"),
            Some("https://zoom.us/j/987654321?pwd=s3cret".to_string())
        );
        assert_eq!(
            meeting_url("zoommtg://zoom.us/join?confno=987654321"),
            Some("https://zoom.us/j/987654321".to_string())
        );
    }

    #[test]
    fn teams_links_keep_their_path() {
        assert_eq!(
            meeting_url("msteams://teams.microsoft.com/l/meetup-join/19%3ameeting/0?context=%7b%7d"),
            Some("https://teams.microsoft.com/l/meetup-join/19%3ameeting/0?context=%7b%7d".to_string())
        );
    }

    #[test]
    fn unknown_shapes_are_declined() {
        assert_eq!(meeting_url("msteams:?launchParams=abc"), None);
        assert_eq!(meeting_url("zoommtg://zoom.us/join?action=start"), None);
        assert_eq!(meeting_url("vibe://open/?url=https://example.com"), None);
        assert_eq!(meeting_url("https://example.com"), None);
    }
}
