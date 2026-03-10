mod engine;
use engine::AudioEngine;
use tauri::State;
use std::fs;
use std::sync::Mutex;
use std::path::PathBuf;

/// 應用程式全域狀態
struct AppState {
    last_dir: Mutex<Option<PathBuf>>,
}

// --- WaveCode 複音指令集 ---

/// 觸發新音符，傳回聲部索引以供後續釋放
#[tauri::command]
fn trigger_note(state: State<'_, AudioEngine>, freq: f32) -> usize {
    state.trigger_note(freq)
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
        trigger_note, release_note, stop_audio,
        save_project, load_project, get_examples_path, get_last_dir
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
