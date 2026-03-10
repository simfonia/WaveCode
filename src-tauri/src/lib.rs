mod engine;
use engine::AudioEngine;
use tauri::State;
use serde::Deserialize;
use std::fs;
use std::sync::Mutex;
use std::path::PathBuf;

/// 前端傳入的指令封裝
#[derive(Deserialize)]
struct PdCommand {
    receiver: String,
    args: Vec<String>,
}

/// 應用程式全域狀態 (用於記憶最後儲存路徑)
struct AppState {
    last_dir: Mutex<Option<PathBuf>>,
}

// --- Tauri 指令 ---

/// 更新 Patch (目前主要用於處理編譯器發出的初始參數)
#[tauri::command]
fn update_patch(state: State<'_, AudioEngine>, commands: Vec<PdCommand>) {
    let _ = state.start_dsp();
    for cmd in commands {
        if let Some(val_str) = cmd.args.get(0) {
            if let Ok(val) = val_str.parse::<f32>() {
                state.send_float(&cmd.receiver, val);
            }
        }
    }
}

/// 傳送數值控制 (頻率、音量)
#[tauri::command]
fn send_float(state: State<'_, AudioEngine>, receiver: String, value: f32) {
    // 若設定音量且大於 0，自動啟動引擎
    if receiver.contains("vol") && value > 0.0 {
        state.start_dsp();
    }
    state.send_float(&receiver, value);
}

/// 停止音訊 (靜音並關閉引擎)
#[tauri::command]
fn stop_audio(state: State<'_, AudioEngine>) {
    state.send_float("vol", 0.0);
    state.stop_dsp();
}

// --- 檔案操作指令 ---

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
async fn get_last_dir(app_state: State<'_, AppState>) -> Result<Option<String>, String> {
    let last_dir = app_state.last_dir.lock().unwrap();
    Ok(last_dir.as_ref().map(|p| p.to_string_lossy().into_owned()))
}

#[tauri::command]
async fn get_examples_path() -> Result<String, String> {
    let mut path = std::env::current_dir().map_err(|e| e.to_string())?;
    if path.ends_with("src-tauri") { path.pop(); }
    path.push("resources");
    path.push("examples");
    Ok(path.to_string_lossy().into_owned())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .manage(AudioEngine::new().expect("音訊引擎啟動失敗"))
    .manage(AppState { last_dir: Mutex::new(None) })
    .invoke_handler(tauri::generate_handler![
        update_patch, send_float, stop_audio,
        save_project, load_project, get_examples_path, get_last_dir
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
