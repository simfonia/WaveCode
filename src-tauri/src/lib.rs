mod engine;
use engine::{AudioEngine, Component};
use tauri::{State, Manager};
use std::fs;
use std::sync::Mutex;
use std::path::PathBuf;
use std::collections::HashMap;

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
    .setup(|app| {
        let engine = AudioEngine::new(app.handle().clone()).expect("音訊引擎啟動失敗");
        app.manage(engine);
        Ok(())
    })
    .manage(AppState { last_dir: Mutex::new(None) })
    .invoke_handler(tauri::generate_handler![
        update_patch, trigger_note, release_note, stop_audio, restart_audio,
        save_project, load_project, get_examples_path, get_last_dir
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
