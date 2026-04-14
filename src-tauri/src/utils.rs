use std::path::PathBuf;
use std::fs;
use tauri::Manager;

/// 獲取資源目錄的輔助函式，支援開發與生產環境
pub fn get_resource_base(app_handle: &tauri::AppHandle) -> PathBuf {
    // 1. 如果有設定開發環境環境變數，或是在專案目錄下執行，優先使用源碼路徑
    if let Ok(dir) = std::env::current_dir() {
        let is_dev = dir.ends_with("WaveCode") || dir.ends_with("src-tauri");
        if is_dev {
            let target = if dir.ends_with("WaveCode") {
                dir.join("src-tauri").join("resources")
            } else {
                dir.join("resources")
            };
            if target.exists() { return target; }
        }
    }

    // 2. 正式環境：使用 Tauri 內建路徑 (處理打包與安裝情況)
    // 在 Windows 打包後，resource_dir 通常就是 exe 所在的目錄 (或其 resource 子目錄)
    if let Ok(resource_dir) = app_handle.path().resource_dir() {
        // 先嘗試資源包路徑
        let prod_path = resource_dir.join("resources");
        if prod_path.exists() { return prod_path; }
        
        // 如果 resource_dir 本身就是資源根目錄 (某些打包配置)
        if resource_dir.join("default_template.wave").exists() {
            return resource_dir;
        }
    }

    // 3. 最後回退 (目前目錄)
    PathBuf::from("resources")
}

/// 獲取特定的資源子目錄
pub fn get_resource_path(app_handle: &tauri::AppHandle, sub_path: &str) -> PathBuf {
    get_resource_base(app_handle).join(sub_path)
}

/// 獲取使用者資料目錄中的快取位置
pub fn get_app_data_path(app_handle: &tauri::AppHandle, sub_path: &str) -> PathBuf {
    let base = app_handle.path().app_data_dir().expect("無法獲取 AppData 目錄");
    if !base.exists() {
        fs::create_dir_all(&base).ok();
    }
    base.join(sub_path)
}
