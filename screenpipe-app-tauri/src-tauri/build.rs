fn main() {
    tauri_build::build();
    #[cfg(target_os = "windows")]
    {
        let has = glob::glob("vcredist/*.dll").unwrap().next().is_some();
        if !has {
            panic!("vcredist dlls not found");
        }
    }
}
