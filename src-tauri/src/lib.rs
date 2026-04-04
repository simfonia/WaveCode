mod engine;
mod utils;

use engine::{AudioEngine, Component};
use tauri::{State, Manager, Emitter};
use std::fs;
use std::sync::Mutex;
use std::path::PathBuf;
use std::collections::HashMap;
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

/// 應用程式全域狀態
struct AppState {
    last_dir: Mutex<Option<PathBuf>>,
}

// --- WaveCode 複音指令集 ---

/// 更新樂器配置 (Patch)
#[tauri::command]
fn update_patch(state: State<'_, AudioEngine>, patches: HashMap<String, Vec<Component>>) -> Result<(), String> {
    state.update_patches(patches)
}

/// 觸發新音符，傳回聲部索引以供後續釋放
#[tauri::command]
fn trigger_note(state: State<'_, AudioEngine>, freq: f32, inst_id: String) -> usize {
    state.trigger_note(freq, inst_id)
}

/// 釋放指定聲部，進入 ADSR Release 階段
#[tauri::command]
fn release_note(state: State<'_, AudioEngine>, index: usize) {
    state.release_voice(index);
}

/// 立即關閉所有聲部的閘門 (常用於切換腳本或按 Stop)
#[tauri::command]
fn stop_audio(state: State<'_, AudioEngine>) {
    state.stop_all();
}

/// 重啟音訊引擎 (用於解決系統睡眠喚醒後的時鐘同步問題)
#[tauri::command]
fn restart_audio(state: State<'_, AudioEngine>) -> Result<(), String> {
    state.restart()
}

/// 設定總輸出音量
#[tauri::command]
fn set_master_volume(state: State<'_, AudioEngine>, val: f32) {
    state.set_master_volume(val);
}

// --- 檔案與資源操作指令 ---

#[tauri::command]
async fn save_project(app_state: State<'_, AppState>, xml_content: String, path: String) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);
    fs::write(&path_buf, xml_content).map_err(|e| e.to_string())?;
    if let Some(parent) = path_buf.parent() {
        let mut last_dir = app_state.last_dir.lock().unwrap();
        *last_dir = Some(parent.to_path_buf());
    }
    Ok(())
}

#[tauri::command]
async fn load_project(app_state: State<'_, AppState>, path: String) -> Result<String, String> {
    let path_buf = PathBuf::from(&path);
    let content = fs::read_to_string(&path_buf).map_err(|e| e.to_string())?;
    if let Some(parent) = path_buf.parent() {
        let mut last_dir = app_state.last_dir.lock().unwrap();
        *last_dir = Some(parent.to_path_buf());
    }
    Ok(content)
}

#[tauri::command]
async fn list_examples(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let examples_dir = utils::get_resource_path(&app_handle, "examples");
    
    let mut result = Vec::new();
    if let Ok(entries) = fs::read_dir(examples_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_dir() {
                let category = path.file_name().unwrap().to_str().unwrap().to_string();
                let mut items = Vec::new();
                if let Ok(sub_entries) = fs::read_dir(&path) {
                    for sub_entry in sub_entries.filter_map(|e| e.ok()) {
                        let sub_path = sub_entry.path();
                        let ext = sub_path.extension().and_then(|s| s.to_str()).unwrap_or("");
                        if ext == "wave" || ext == "xml" {
                            items.push(serde_json::json!({
                                "name": sub_path.file_stem().unwrap().to_str().unwrap(),
                                "path": sub_path.to_str().unwrap()
                            }));
                        }
                    }
                }
                if !items.is_empty() {
                    result.push(serde_json::json!({ "category": category, "items": items }));
                }
            } else {
                let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("");
                if ext == "wave" || ext == "xml" {
                    result.push(serde_json::json!({
                        "name": path.file_stem().unwrap().to_str().unwrap(),
                        "path": path.to_str().unwrap()
                    }));
                }
            }
        }
    }
    Ok(serde_json::json!(result))
}

#[tauri::command]
async fn get_doc_content(app_handle: tauri::AppHandle, filename: String) -> Result<String, String> {
    let docs_dir = utils::get_resource_path(&app_handle, "docs");
    let full_path = docs_dir.join(&filename);
    
    if full_path.exists() {
        return fs::read_to_string(full_path).map_err(|e| e.to_string());
    }
    
    // 嘗試不同語系後綴
    let lang_path = docs_dir.join(filename.replace(".html", "_zh-hant.html"));
    if lang_path.exists() {
        return fs::read_to_string(lang_path).map_err(|e| e.to_string());
    }

    Err(format!("Help file not found: {}", filename))
}

#[tauri::command]
async fn open_samples_dir(app_handle: tauri::AppHandle) -> Result<(), String> {
    let samples_dir = utils::get_resource_path(&app_handle, "samples");
    if samples_dir.exists() {
        #[cfg(windows)]
        {
            Command::new("explorer")
                .arg(samples_dir.to_str().unwrap())
                .creation_flags(0x08000000)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
async fn open_url(app_handle: tauri::AppHandle, url: String) -> Result<(), String> {
    #[cfg(windows)]
    {
        let target = if url.starts_with("http") {
            url
        } else {
            // 如果不是 http 開頭，視為本地說明文件，解析完整路徑
            let docs_dir = utils::get_resource_path(&app_handle, "docs");
            let full_path = docs_dir.join(&url);
            if !full_path.exists() {
                return Err(format!("Help file not found: {}", url));
            }
            full_path.to_str().unwrap_or("").to_string()
        };

        Command::new("cmd")
            .args(&["/c", "start", "", &target])
            .creation_flags(0x08000000)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn log(app_handle: tauri::AppHandle, message: String, level: String) {
    let event_name = if level == "error" { "processing-error" } else { "processing-log" };
    let _ = app_handle.emit(event_name, message);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .setup(|app| {
        let engine = AudioEngine::new(app.handle().clone()).expect("音訊引擎啟動失敗");
        app.manage(engine);
        Ok(())
    })
    .manage(AppState { last_dir: Mutex::new(None) })
    .invoke_handler(tauri::generate_handler![
        update_patch, trigger_note, release_note, stop_audio, restart_audio,
        save_project, load_project, list_examples, open_url, get_doc_content, open_samples_dir,
        set_master_volume, log
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
