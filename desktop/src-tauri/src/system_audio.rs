//! The macOS "System Audio Recording" permission, which loopback recording needs.
//!
//! Apple exposes no public API for it, so this asks the private TCC framework about the
//! `kTCCServiceAudioCapture` service directly, loading it at runtime so a macOS without the
//! symbols degrades to "not granted" instead of failing to launch. Without the permission,
//! CoreAudio still opens the loopback stream but delivers silence.

use block2::RcBlock;
use libloading::{Library, Symbol};
use objc2_core_foundation::{CFRetained, CFString};
use std::{ffi::c_void, sync::OnceLock};

const TCC_FRAMEWORK: &str = "/System/Library/PrivateFrameworks/TCC.framework/Versions/A/TCC";
const TCC_SERVICE: &str = "kTCCServiceAudioCapture";

/// How long to wait for the request's completion block. TCC normally answers from the prompt;
/// a callback that never arrives must leave the command and the app usable.
const REQUEST_TIMEOUT: std::time::Duration = std::time::Duration::from_secs(120);

fn load_tcc() -> Option<&'static Library> {
    static LIBRARY: OnceLock<Option<Library>> = OnceLock::new();
    LIBRARY.get_or_init(|| unsafe { Library::new(TCC_FRAMEWORK) }.ok()).as_ref()
}

fn tcc_service() -> CFRetained<CFString> {
    CFString::from_str(TCC_SERVICE)
}

/// The status `TCCAccessPreflight` reports, as documented in TCC.framework's private
/// `TCCAccess.h` (`kTCCAccessDenied = 0, kTCCAccessUnknown = 1, kTCCAccessGranted = 2,
/// kTCCAccessRequestable = 3`).
#[derive(Debug, PartialEq, Eq)]
enum Preflight {
    Denied,
    Unknown,
    Granted,
    Requestable,
}

/// Map the raw status to one of the four documented values. Anything else — a TCC that changed
/// its private ABI — is `Unknown`, which fails safe.
fn preflight_status(raw: u8) -> Preflight {
    match raw {
        0 => Preflight::Denied,
        2 => Preflight::Granted,
        3 => Preflight::Requestable,
        // 1 is the documented `Unknown`; an unrecognised code is unknown just the same.
        _ => Preflight::Unknown,
    }
}

/// Only a granted status lets the recording open the loopback stream. `Denied`, `Unknown` and
/// `Requestable` all mean it would deliver silence.
fn status_grants(status: &Preflight) -> bool {
    matches!(status, Preflight::Granted)
}

/// Whether the permission is granted. Every other state (denied, never asked) is `false`.
pub fn is_granted() -> bool {
    let Some(lib) = load_tcc() else { return false };
    // SAFETY: `TCCAccessPreflight` is documented as
    // `Boolean TCCAccessPreflight(CFStringRef service, CFDictionaryRef options)`. `Boolean` is
    // one byte, so the result is read as `u8`; the symbol is resolved at runtime and its absence
    // returns `false` above. The CFString outlives the call.
    let status = unsafe {
        let Ok(preflight): Result<Symbol<unsafe extern "C" fn(*const c_void, *const c_void) -> u8>, _> =
            lib.get(b"TCCAccessPreflight\0")
        else {
            return false;
        };
        let service = tcc_service();
        preflight(&*service as *const _ as *const c_void, std::ptr::null())
    };
    status_grants(&preflight_status(status))
}

/// Shows the system prompt when macOS still allows one, and blocks until it is answered.
pub fn request() -> bool {
    let Some(lib) = load_tcc() else { return false };
    unsafe {
        // SAFETY: `TCCAccessRequest` is documented as
        // `Boolean TCCAccessRequest(CFStringRef service, CFTypeRef clientToken,
        // dispatch_queue_t queue, void (^handler)(Boolean granted, CFErrorRef error))`. The
        // token is null (no client token), the queue is null (TCC uses its own), and the handler
        // takes the two documented arguments. The symbol is resolved at runtime; its absence
        // returns `false` above. The block is heap-allocated, so a late callback cannot touch a
        // dead stack frame.
        let Ok(request): Result<
            Symbol<unsafe extern "C" fn(*const c_void, *const c_void, *const c_void, *const c_void) -> u8>,
            _,
        > = lib.get(b"TCCAccessRequest\0") else {
            return false;
        };

        let (tx, rx) = std::sync::mpsc::sync_channel::<bool>(1);
        let tx_ptr = Box::into_raw(Box::new(tx)) as usize;
        let completion = RcBlock::new(move |granted: u8, _error: *const c_void| {
            // The handler is called once; consuming the sender keeps a second call harmless.
            let tx = Box::from_raw(tx_ptr as *mut std::sync::mpsc::SyncSender<bool>);
            tx.send(granted != 0).ok();
        });

        let service = tcc_service();
        request(
            &*service as *const _ as *const c_void,
            std::ptr::null(),
            std::ptr::null(),
            RcBlock::as_ptr(&completion).cast(),
        );
        // The return value is the status before the request; the answer is the callback's.
        match rx.recv_timeout(REQUEST_TIMEOUT) {
            Ok(granted) => granted,
            Err(_) => {
                // TCC may still call the block later; freeing it now would hand the callback a
                // dead block, so it stays allocated (a bounded one-off leak).
                std::mem::forget(completion);
                tracing::warn!("TCCAccessRequest did not call back; treating the system audio permission as not granted");
                false
            }
        }
    }
}

pub fn open_settings() {
    std::process::Command::new("open")
        .arg("x-apple.systempreferences:com.apple.settings.PrivacySecurity.extension?Privacy_AudioCapture")
        .spawn()
        .ok();
}

#[cfg(test)]
mod tests {
    use super::{preflight_status, status_grants, Preflight};

    #[test]
    fn every_documented_preflight_status_maps_to_its_meaning() {
        assert_eq!(preflight_status(0), Preflight::Denied);
        assert_eq!(preflight_status(1), Preflight::Unknown);
        assert_eq!(preflight_status(2), Preflight::Granted);
        assert_eq!(preflight_status(3), Preflight::Requestable);
        // A code this build does not know must not read as granted.
        assert_eq!(preflight_status(4), Preflight::Unknown);
        assert_eq!(preflight_status(u8::MAX), Preflight::Unknown);
    }

    #[test]
    fn only_the_granted_status_opens_the_stream() {
        assert!(status_grants(&Preflight::Granted));
        assert!(!status_grants(&Preflight::Denied));
        assert!(!status_grants(&Preflight::Unknown));
        assert!(!status_grants(&Preflight::Requestable));
    }
}
