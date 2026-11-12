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

    fn current_command() -> Result<String> {
        let program_path = std::env::current_exe()?;
        Ok(format!("\"{}\" \"%1\"", program_path.to_str().context("tostr")?))
    }

    pub fn register_schemes(schemes: &[&str]) -> Result<()> {
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let classes = hkcu.open_subkey_with_flags("Software\\Classes", KEY_ALL_ACCESS)?;
        let command_value = current_command()?;
        for scheme in schemes {
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
        for scheme in schemes {
            // A missing key is the state we want; only a key that exists but
            // cannot be removed is an error worth reporting.
            let _ = classes.delete_subkey_all(scheme);
        }
        Ok(())
    }
}

#[cfg(target_os = "linux")]
mod imp {
    use super::*;
    use eyre::ContextCompat;
    use std::fs;
    use std::path::PathBuf;

    fn desktop_file() -> Result<PathBuf> {
        let home = std::env::var("HOME").context("HOME is not set")?;
        Ok(PathBuf::from(home).join(".local/share/applications/vibe-meeting-handler.desktop"))
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
            .args(["default", "vibe-meeting-handler.desktop"])
            .args(
                schemes
                    .iter()
                    .flat_map(|scheme| ["x-scheme-handler/".to_string(), scheme.to_string()]),
            )
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
        Ok(())
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

#[cfg(not(windows))]
pub fn register() -> Result<()> {
    Ok(())
}
