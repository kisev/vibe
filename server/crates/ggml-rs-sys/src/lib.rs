//! Unsafe, generated bindings for the pinned GGML runtime.
//!
//! Safe crates should wrap this API rather than exposing its pointers directly.

#![allow(non_camel_case_types, non_snake_case, non_upper_case_globals, dead_code, improper_ctypes)]
// The remaining allows name what bindgen emits on every regeneration: identity
// transmutes, `offset` with a cast, and undocumented unsafe accessors. Hand-written
// files in this crate (cpu_variant) stay fully linted.
#![allow(unnecessary_transmutes, clippy::ptr_offset_with_cast, clippy::missing_safety_doc)]

include!(concat!(env!("OUT_DIR"), "/bindings.rs"));

#[cfg(target_arch = "x86_64")]
mod cpu_variant;
