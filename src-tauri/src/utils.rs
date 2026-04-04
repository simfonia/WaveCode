use std::path::PathBuf;
use std::fs;
use tauri::Manager;

/// 獲取資源目錄的輔助函式，支援開發與生產環境
pub fn get_resource_base(app_handle: &tauri::AppHandle) -> PathBuf {
    // 1. 優先嘗試生產環境 (已打包) 的資源路徑
    if let Ok(resource_dir) = app_handle.path().resource_dir() {
        let prod_path = resource_dir.join("resources");
        if prod_path.exists() {
            return prod_path;
        }
    }

    // 2. 開發環境：偵測 src-tauri/resources (現在資源統一放在這裡)
    if let Ok(mut dev_path) = std::env::current_dir() {
        // 如果是在專案根目錄，進入 src-tauri
        let target = if dev_path.ends_with("WaveCode") {
            dev_path.join("src-tauri").join("resources")
        } else if dev_path.ends_with("src-tauri") {
            dev_path.join("resources")
        } else {
            dev_path.join("resources")
        };

        if target.exists() {
            return target;
        }
    }

    // 3. 最後回退
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
