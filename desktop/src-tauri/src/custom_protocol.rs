use eyre::Result;

/// The other applications' URL schemes Vibe can answer for. Each carries a web
/// URL that the meeting window can load; the desktop clients expect to handle
/// these themselves, so registering is opt-in.
pub const MEETING_SCHEMES: [&str; 4] = ["zoommtg", "msteams", "teams", "webex"];

/// Whether this platform can register scheme handlers at all. macOS needs
/// LaunchServices to hand a scheme over, which would take it away from the
/// application that owns it; the setting reports itself as unavailable there.
pub const MEETING_SCHEMES_SUPPORTED: bool = cfg!(any(windows, target_os = "linux"));

#[cfg(windows)]
mod imp {
    use super::*;
    use eyre::ContextCompat;
    use winreg::enums::*;
    use winreg::{RegKey, RegValue};

    /// Where another application's command is kept while Vibe answers for its scheme, so turning
    /// the setting off can hand the scheme back instead of deleting somebody else's registration.
    const BACKUP_ROOT: &str = "Software\\Vibe\\MeetingSchemes";
    /// The saved copy of the whole scheme key inside its backup entry.
    const BACKUP_KEY: &str = "Key";

    fn current_command() -> Result<String> {
        let program_path = std::env::current_exe()?;
        Ok(format!("\"{}\" \"%1\"", program_path.to_str().context("tostr")?))
    }

    /// The executable part of a handler command: the path between the leading quotes when the
    /// command starts with one (installers quote paths that contain spaces), otherwise the first
    /// whitespace-delimited token. Arguments and quotes are dropped.
    fn command_exe(command: &str) -> Option<&str> {
        let trimmed = command.trim();
        if let Some(rest) = trimmed.strip_prefix('"') {
            return rest.split('"').next().filter(|exe| !exe.is_empty());
        }
        trimmed.split_whitespace().next()
    }

    /// Whether `command` runs `exe`. Compared case-insensitively, because Windows paths are, and
    /// an update that only changed the path's case must still count as our own registration.
    fn command_is_ours(command: &str, exe: &str) -> bool {
        command_exe(command).is_some_and(|candidate| candidate.eq_ignore_ascii_case(exe))
    }

    /// The text of a string value, in either encoding a command can be registered as; `None` for
    /// any other type. `REG_EXPAND_SZ` matters: a handler written with `%ProgramFiles%` in it
    /// must be handed back unchanged instead of being treated as missing.
    fn value_text(value: &RegValue) -> Option<String> {
        if value.vtype != REG_SZ && value.vtype != REG_EXPAND_SZ {
            return None;
        }
        let units: Vec<u16> = value
            .bytes
            .chunks_exact(2)
            .map(|pair| u16::from_le_bytes([pair[0], pair[1]]))
            .collect();
        let end = units.iter().position(|unit| *unit == 0).unwrap_or(units.len());
        String::from_utf16(&units[..end]).ok()
    }

    /// The raw command another application registered for `scheme`, keeping its value type, if
    /// the key exists.
    fn previous_command(classes: &RegKey, scheme: &str) -> Option<RegValue> {
        let class = classes.open_subkey(scheme).ok()?;
        let command = class.open_subkey("shell\\open\\command").ok()?;
        command.get_raw_value("").ok()
    }

    /// Remember the scheme key's state before Vibe overwrites it. A refresh of our own
    /// registration (setup re-points the handler after every update) must keep the original
    /// backup rather than saving Vibe's own command as the previous owner.
    fn remember(classes: &RegKey, backup_root: &RegKey, scheme: &str, ours: &str) -> Result<()> {
        let Some(ours_exe) = command_exe(ours) else {
            return Err(eyre::eyre!("the current command names no executable: {ours:?}"));
        };
        let existing = previous_command(classes, scheme);
        // Ownership is the executable, not the whole command line: an update moves the binary,
        // and a stale Vibe command must still be recognised as ours so the real backup survives.
        let is_ours = existing
            .as_ref()
            .and_then(value_text)
            .is_some_and(|command| command_is_ours(&command, ours_exe));
        if is_ours {
            return Ok(());
        }
        let (saved, _) = backup_root.create_subkey(scheme)?;
        // The backup belongs to the first owner the scheme had; a later registration by some
        // other program must not replace it with that program's command.
        if saved.get_value::<u32, _>("Existed").is_ok() {
            return Ok(());
        }
        let existed = classes.open_subkey(scheme).is_ok();
        saved.set_value("Existed", &u32::from(existed))?;
        if existed {
            // Save the whole key, not just the command: the default value, `URL Protocol`,
            // `DefaultIcon` and `ddeexec` are what make the scheme work for its owner.
            let (tree, _) = saved.create_subkey(BACKUP_KEY)?;
            classes.copy_tree(scheme, &tree)?;
        }
        match existing.as_ref() {
            // Kept with its original value type for an older Vibe that only reads this key.
            Some(previous) => saved.set_raw_value("PreviousCommand", previous)?,
            None => {
                let _ = saved.delete_value("PreviousCommand");
            }
        }
        Ok(())
    }

    /// Delete `scheme`, treating a missing key as the state we want and reporting every other
    /// failure: otherwise the setting would say "off" while Vibe is still the handler.
    fn delete_scheme(classes: &RegKey, scheme: &str) -> Result<()> {
        match classes.delete_subkey_all(scheme) {
            Ok(()) => Ok(()),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
            Err(error) => Err(error.into()),
        }
    }

    /// Hand `scheme` back: restore the key the previous owner had, or remove the registration
    /// when Vibe created it. Without a backup the registration is removed only if it still
    /// points at Vibe, so a third party's handler is never deleted along with it.
    fn restore(classes: &RegKey, backup_root: Option<&RegKey>, scheme: &str, ours: &str) -> Result<()> {
        let saved = match backup_root.map(|root| root.open_subkey(scheme)) {
            Some(Ok(saved)) => Some(saved),
            Some(Err(error)) if error.kind() == std::io::ErrorKind::NotFound => None,
            Some(Err(error)) => return Err(error.into()),
            None => None,
        };
        let Some(saved) = saved else {
            // No backup to hand back (registered before the backup existed, or somebody cleared
            // it): remove what Vibe registered, and nothing else.
            let current = previous_command(classes, scheme).as_ref().and_then(value_text);
            if current.is_some_and(|command| command_is_ours(&command, ours)) {
                delete_scheme(classes, scheme)?;
            }
            return Ok(());
        };
        let existed = saved.get_value::<u32, _>("Existed").unwrap_or(0) != 0;
        if !existed {
            delete_scheme(classes, scheme)?;
        } else if let Ok(tree) = saved.open_subkey(BACKUP_KEY) {
            // Hand the whole key back: its values, subkeys and their types as they were.
            match classes.delete_subkey_all(scheme) {
                Ok(()) => {}
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
                Err(error) => return Err(error.into()),
            }
            let (class, _) = classes.create_subkey(scheme)?;
            tree.copy_tree("", &class)?;
        } else {
            // A backup from before the whole key was saved: it only holds the command.
            let (class, _) = classes.create_subkey(scheme)?;
            let (shell, _) = class.create_subkey("shell")?;
            let (open, _) = shell.create_subkey("open")?;
            let (command, _) = open.create_subkey("command")?;
            match saved.get_raw_value("PreviousCommand") {
                Ok(previous) => command.set_raw_value("", &previous)?,
                Err(_) => {
                    let _ = command.delete_value("");
                }
            }
        }
        if let Some(root) = backup_root {
            root.delete_subkey_all(scheme)?;
        }
        Ok(())
    }

    fn register_one(classes: &RegKey, backup_root: &RegKey, scheme: &str, command_value: &str) -> Result<()> {
        remember(classes, backup_root, scheme, command_value)?;
        let (class, _) = classes.create_subkey(scheme)?;
        class.set_value("", &format!("URL:{scheme}"))?;
        class.set_value("URL Protocol", &"")?;
        let (shell, _) = class.create_subkey("shell")?;
        let (open, _) = shell.create_subkey("open")?;
        let (command, _) = open.create_subkey("command")?;
        command.set_value("", &command_value)?;
        Ok(())
    }

    pub fn register_schemes(schemes: &[&str]) -> Result<()> {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let classes = hkcu.open_subkey_with_flags("Software\\Classes", KEY_ALL_ACCESS)?;
        let (backup_root, _) = hkcu.create_subkey(BACKUP_ROOT)?;
        let command_value = current_command()?;
        let mut first_error: Option<eyre::Error> = None;
        for scheme in schemes {
            // One scheme failing must not leave the rest unregistered: they are applied
            // independently and registration is idempotent, so a retry finishes the job.
            if let Err(error) = register_one(&classes, &backup_root, scheme, &command_value) {
                first_error.get_or_insert(error);
            }
        }
        match first_error {
            Some(error) => Err(error),
            None => Ok(()),
        }
    }

    pub fn unregister_schemes(schemes: &[&str]) -> Result<()> {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let classes = hkcu.open_subkey_with_flags("Software\\Classes", KEY_ALL_ACCESS)?;
        // Only "no backup root at all" means nothing was ever saved; any other open error must
        // fail the command, because falling through would delete other applications' handlers.
        let backup_root = match hkcu.open_subkey_with_flags(BACKUP_ROOT, KEY_ALL_ACCESS) {
            Ok(backup_root) => Some(backup_root),
            Err(error) if error.kind() == std::io::ErrorKind::NotFound => None,
            Err(error) => return Err(error.into()),
        };
        let ours = current_command()?;
        let mut first_error: Option<eyre::Error> = None;
        for scheme in schemes {
            if let Err(error) = restore(&classes, backup_root.as_ref(), scheme, &ours) {
                first_error.get_or_insert(error);
            }
        }
        match first_error {
            Some(error) => Err(error),
            None => Ok(()),
        }
    }
}

#[cfg(target_os = "linux")]
mod imp {
    use super::*;
    use eyre::{ContextCompat, WrapErr};
    use std::fs;
    use std::path::PathBuf;

    /// The desktop entry Vibe owns; also the value `xdg-mime default` writes into `mimeapps.list`.
    const HANDLER_FILE: &str = "vibe-meeting-handler.desktop";

    /// The directory desktop entries are looked up in, honouring `XDG_DATA_HOME`: with it set,
    /// `~/.local/share` is not on the lookup path at all, so a file written there is inert.
    fn applications_dir() -> Result<PathBuf> {
        if let Some(data_home) = std::env::var_os("XDG_DATA_HOME").filter(|value| !value.is_empty()) {
            return Ok(PathBuf::from(data_home).join("applications"));
        }
        let home = std::env::var("HOME").context("HOME is not set")?;
        Ok(PathBuf::from(home).join(".local/share/applications"))
    }

    fn desktop_file() -> Result<PathBuf> {
        Ok(applications_dir()?.join(HANDLER_FILE))
    }

    /// The association list `xdg-mime default` updates.
    fn mimeapps_file() -> Result<PathBuf> {
        if let Some(config_home) = std::env::var_os("XDG_CONFIG_HOME").filter(|value| !value.is_empty()) {
            return Ok(PathBuf::from(config_home).join("mimeapps.list"));
        }
        let home = std::env::var("HOME").context("HOME is not set")?;
        Ok(PathBuf::from(home).join(".config/mimeapps.list"))
    }

    /// Every list the handler may have been written into: the XDG config one, plus the legacy
    /// data-home list that xdg-utils 1.1.x still updates on some distributions.
    fn mimeapps_files() -> Result<Vec<PathBuf>> {
        let mut files = vec![mimeapps_file()?, applications_dir()?.join("mimeapps.list")];
        files.dedup();
        Ok(files)
    }

    /// Remove `handler` from every association list in a `mimeapps.list`, dropping a line when
    /// it was the only handler so the scheme falls back instead of pointing at a deleted file.
    /// Section headers and unrelated lines are kept verbatim.
    fn without_handler(contents: &str, handler: &str) -> String {
        let mut out = String::with_capacity(contents.len());
        for line in contents.lines() {
            let Some((key, value)) = line.split_once('=') else {
                out.push_str(line);
                out.push('\n');
                continue;
            };
            let entries: Vec<&str> = value.split(';').filter(|entry| !entry.is_empty()).collect();
            let kept: Vec<&str> = entries.iter().copied().filter(|entry| *entry != handler).collect();
            if kept.len() == entries.len() {
                out.push_str(line);
                out.push('\n');
            } else if !kept.is_empty() {
                out.push_str(key);
                out.push('=');
                out.push_str(&kept.join(";"));
                out.push_str(";\n");
            }
        }
        out
    }

    fn desktop_entry(schemes: &[&str]) -> Result<String> {
        let exe = std::env::current_exe()?;
        let mime: Vec<String> = schemes.iter().map(|scheme| format!("x-scheme-handler/{scheme}")).collect();
        Ok(format!(
            "[Desktop Entry]\nType=Application\nName=Vibe meeting link handler\nExec=\"{}\" %u\nTerminal=false\nNoDisplay=true\nMimeType={};\n",
            exe.to_str().context("tostr")?,
            mime.join(";")
        ))
    }

    pub fn register_schemes(schemes: &[&str]) -> Result<()> {
        let path = desktop_file()?;
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(&path, desktop_entry(schemes)?)?;
        // Best effort: without xdg-mime the file is inert, which the setting
        // reports as not applied rather than silently claiming success.
        let status = std::process::Command::new("xdg-mime")
            .args(["default", HANDLER_FILE])
            .args(schemes.iter().map(|scheme| format!("x-scheme-handler/{scheme}")))
            .status();
        match status {
            Ok(status) if status.success() => Ok(()),
            _ => eyre::bail!("xdg-mime could not set the handler; the desktop entry was written but is not active"),
        }
    }

    pub fn unregister_schemes(_schemes: &[&str]) -> Result<()> {
        let path = desktop_file()?;
        if path.exists() {
            fs::remove_file(path)?;
        }
        // `xdg-mime default` left the handler in a mimeapps.list (the XDG config one or the
        // legacy data-home one); drop it in both, otherwise the schemes keep pointing at a
        // desktop file that no longer exists.
        for mimeapps in mimeapps_files()? {
            if !mimeapps.exists() {
                continue;
            }
            let contents = fs::read_to_string(&mimeapps).wrap_err_with(|| format!("could not read {}", mimeapps.display()))?;
            let updated = without_handler(&contents, HANDLER_FILE);
            if updated != contents {
                fs::write(&mimeapps, updated).wrap_err_with(|| format!("could not update {}", mimeapps.display()))?;
            }
        }
        Ok(())
    }

    #[cfg(test)]
    mod tests {
        use super::without_handler;

        #[test]
        fn removing_the_handler_keeps_other_handlers_and_sections() {
            let contents = "[Default Applications]\n\
                            x-scheme-handler/zoommtg=vibe-meeting-handler.desktop;\n\
                            text/plain=org.gnome.TextEditor.desktop;\n\
                            [Added Associations]\n\
                            x-scheme-handler/msteams=vibe-meeting-handler.desktop;teams-for-linux.desktop;\n\
                            \n";
            let updated = without_handler(contents, "vibe-meeting-handler.desktop");
            assert_eq!(
                updated,
                "[Default Applications]\n\
                 text/plain=org.gnome.TextEditor.desktop;\n\
                 [Added Associations]\n\
                 x-scheme-handler/msteams=teams-for-linux.desktop;\n\
                 \n"
            );
        }

        #[test]
        fn a_file_without_the_handler_is_unchanged() {
            let contents = "[Default Applications]\ntext/plain=org.gnome.TextEditor.desktop;\n";
            assert_eq!(without_handler(contents, "vibe-meeting-handler.desktop"), contents);
        }
    }
}

#[cfg(not(any(windows, target_os = "linux")))]
mod imp {
    use super::*;

    pub fn register_schemes(_schemes: &[&str]) -> Result<()> {
        eyre::bail!("registering meeting schemes is not supported on this platform")
    }

    pub fn unregister_schemes(_schemes: &[&str]) -> Result<()> {
        Ok(())
    }
}

pub fn register_meeting_schemes() -> Result<()> {
    imp::register_schemes(&MEETING_SCHEMES)
}

pub fn unregister_meeting_schemes() -> Result<()> {
    imp::unregister_schemes(&MEETING_SCHEMES)
}

#[cfg(windows)]
pub fn register() -> Result<()> {
    use eyre::ContextCompat;
    use winreg::enums::*;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let classes = hkcu.open_subkey_with_flags("Software\\Classes", KEY_ALL_ACCESS)?;

    // Create the main key for the protocol handler
    let app_class = classes.create_subkey("vibe")?;
    app_class.0.set_value("URL Protocol", &"")?;

    // Create the necessary subkeys: shell, open, command
    let shell = app_class.0.create_subkey("shell")?;
    let open = shell.0.create_subkey("open")?;
    let command = open.0.create_subkey("command")?;

    // Set the default value for the command key
    let program_path = std::env::current_exe()?;
    let command_value = format!("\"{}\" \"%1\"", program_path.to_str().context("tostr")?);
    command.0.set_value("", &command_value)?;

    tracing::debug!("Protocol handler registered successfully.");
    Ok(())
}
