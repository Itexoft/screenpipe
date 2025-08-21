fn main() {
    tauri_build::build();
    #[cfg(target_os = "windows")]
    {
        let has = glob::glob("vcredist/vc_redist.x64.exe").unwrap().next().is_some();
        if !has {
            panic!("vcredist not found");
        }
    }
}
