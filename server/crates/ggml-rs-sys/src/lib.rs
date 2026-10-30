//! Unsafe, generated bindings for the pinned GGML runtime.
//!
//! Safe crates should wrap this API rather than exposing its pointers directly.

#![allow(non_camel_case_types, non_snake_case, non_upper_case_globals, dead_code, improper_ctypes)]
// Fork addition: upstream never lints server/ (its root workspace excludes it),
// while this fork's server:clippy runs -D warnings over every workspace member
// in the graph. The generated bindings are the only dirty spot; these three
// allows are the whole fork-side delta in this crate.
#![allow(clippy::missing_safety_doc, unnecessary_transmutes, clippy::ptr_offset_with_cast)]

include!(concat!(env!("OUT_DIR"), "/bindings.rs"));

#[cfg(target_arch = "x86_64")]
mod cpu_variant;
