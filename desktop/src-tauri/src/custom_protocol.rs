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
    use winreg::RegKey;

    /// Where another application's command is kept while Vibe answers for its scheme, so turning
    /// the setting off can hand the scheme back instead of deleting somebody else's registration.
    const BACKUP_ROOT: &str = "Software\\Vibe\\MeetingSchemes";

    fn current_command() -> Result<String> {
        let program_path = std::env::current_exe()?;
        Ok(format!("\"{}\" \"%1\"", program_path.to_str().context("tostr")?))
    }

    /// The command another application registered for `scheme`, if the key exists.
    fn previous_command(classes: &RegKey, scheme: &str) -> Option<String> {
        let class = classes.open_subkey(scheme).ok()?;
        let command = class.open_subkey("shell\\open\\command").ok()?;
        command.get_value::<String, _>("").ok()
    }

    /// Remember the scheme key's state before Vibe overwrites it. A refresh of our own
    /// registration (setup re-points the handler after every update) must keep the original
    /// backup rather than saving Vibe's own command as the previous owner.
    fn remember(classes: &RegKey, backup_root: &RegKey, scheme: &str, ours: &str) -> Result<()> {
        let existing = previous_command(classes, scheme);
        if existing.as_deref() == Some(ours) {
            return Ok(());
        }
        let existed = classes.open_subkey(scheme).is_ok();
        let (saved, _) = backup_root.create_subkey(scheme)?;
        saved.set_value("Existed", &u32::from(existed))?;
        match existing {
            Some(previous) => saved.set_value("PreviousCommand", &previous)?,
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

    /// Hand `scheme` back: restore the command the previous owner had, or remove the key
    /// entirely when Vibe created it.
    fn restore(classes: &RegKey, backup_root: &RegKey, scheme: &str) -> Result<()> {
        let Ok(saved) = backup_root.open_subkey(scheme) else {
            // No backup to hand back (registered before the backup existed, or somebody cleared
            // it): remove what Vibe registered.
            return delete_scheme(classes, scheme);
        };
        let existed = saved.get_value::<u32, _>("Existed").unwrap_or(0) != 0;
        if !existed {
            delete_scheme(classes, scheme)?;
        } else {
            let (class, _) = classes.create_subkey(scheme)?;
            let (shell, _) = class.create_subkey("shell")?;
            let (open, _) = shell.create_subkey("open")?;
            let (command, _) = open.create_subkey("command")?;
            match saved.get_value::<String, _>("PreviousCommand") {
                Ok(previous) => command.set_value("", &previous)?,
                Err(_) => {
                    let _ = command.delete_value("");
                }
            }
        }
        backup_root.delete_subkey_all(scheme)?;
        Ok(())
    }

    pub fn register_schemes(schemes: &[&str]) -> Result<()> {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let classes = hkcu.open_subkey_with_flags("Software\\Classes", KEY_ALL_ACCESS)?;
        let (backup_root, _) = hkcu.create_subkey(BACKUP_ROOT)?;
        let command_value = current_command()?;
        for scheme in schemes {
            remember(&classes, &backup_root, scheme, &command_value)?;
            let (class, _) = classes.create_subkey(scheme)?;
            class.set_value("", &format!("URL:{scheme}"))?;
            class.set_value("URL Protocol", &"")?;
            let (shell, _) = class.create_subkey("shell")?;
            let (open, _) = shell.create_subkey("open")?;
            let (command, _) = open.create_subkey("command")?;
            command.set_value("", &command_value)?;
        }
        Ok(())
    }

    pub fn unregister_schemes(schemes: &[&str]) -> Result<()> {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let classes = hkcu.open_subkey_with_flags("Software\\Classes", KEY_ALL_ACCESS)?;
        let backup_root = hkcu.open_subkey_with_flags(BACKUP_ROOT, KEY_ALL_ACCESS).ok();
        for scheme in schemes {
            match &backup_root {
                Some(backup_root) => restore(&classes, backup_root, scheme)?,
                None => delete_scheme(&classes, scheme)?,
            }
        }
        Ok(())
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

    fn desktop_file() -> Result<PathBuf> {
        let home = std::env::var("HOME").context("HOME is not set")?;
        Ok(PathBuf::from(home).join(".local/share/applications").join(HANDLER_FILE))
    }

    /// The association list `xdg-mime default` updates.
    fn mimeapps_file() -> Result<PathBuf> {
        if let Some(config_home) = std::env::var_os("XDG_CONFIG_HOME").filter(|value| !value.is_empty()) {
            return Ok(PathBuf::from(config_home).join("mimeapps.list"));
        }
        let home = std::env::var("HOME").context("HOME is not set")?;
        Ok(PathBuf::from(home).join(".config/mimeapps.list"))
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
        // `xdg-mime default` left the handler in mimeapps.list; drop it there too, otherwise the
        // schemes keep pointing at a desktop file that no longer exists.
        let mimeapps = mimeapps_file()?;
        if mimeapps.exists() {
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
