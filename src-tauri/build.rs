fn main() {
    let profile = std::env::var("PROFILE").unwrap_or_default();
    let display_name = if profile == "debug" {
        "[DEV] Linkly"
    } else {
        "Linkly"
    };
    println!("cargo:rustc-env=LINKLY_DISPLAY_NAME={display_name}");
    tauri_build::build();
}
