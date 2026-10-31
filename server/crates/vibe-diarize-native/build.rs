fn main() {
    // The prebuilt ggml-cpu reads the registry on Windows, so linking needs
    // advapi32. Upstream's vibe-server inherits that library transitively
    // because something in its large graph actually calls a registry
    // function; this helper's dependency tree is too small to do the same,
    // and merely enabling a windows-sys feature emits nothing without a
    // call. The build-script directive lands on the final link line
    // unconditionally, which is exactly what this needs.
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("windows") {
        println!("cargo:rustc-link-lib=dylib=advapi32");
    }
}
