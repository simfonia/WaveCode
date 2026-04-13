mod engine;
mod utils;

use engine::{AudioEngine, Component};
use tauri::{State, Manager, Emitter};
use std::fs;
use std::sync::{Mutex, Arc, atomic::{AtomicBool, Ordering}};
use std::path::{PathBuf, Path};
use std::collections::HashMap;
use std::process::Command;
use std::io::{BufRead, BufReader, Cursor};
use serialport;
use rodio::Source;

#[derive(serde::Serialize)]
struct DecodedPCM {
    channels: Vec<Vec<f32>>,
    sample_rate: u32,
    id: String,
}

#[cfg(windows)]
use std::os::windows::process::CommandExt;

/// 序列埠管理狀態
struct SerialState {
    port_name: Mutex<Option<String>>,
    is_running: Arc<AtomicBool>,
}

/// 應用程式全域狀態
struct AppState {
    last_dir: Mutex<Option<PathBuf>>,
    serial: SerialState,
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
async fn load_default_template(app_handle: tauri::AppHandle) -> Result<String, String> {
    let template_path = utils::get_resource_base(&app_handle).join("default_template.wave");
    if !template_path.exists() {
        return Ok("".to_string());
    }
    fs::read_to_string(&template_path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn load_project(app_state: State<'_, AppState>, path: String) -> Result<String, String> {
    let path_buf = PathBuf::from(&path);
    if !path_buf.exists() {
        return Err("檔案不存在，可能已被移動或改名。".to_string());
    }
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
    println!("Scanning examples in: {:?}", examples_dir);
    let mut result = Vec::new();
    let mut general_items = Vec::new();

    if let Ok(entries) = fs::read_dir(&examples_dir) {
        let mut all_entries: Vec<_> = entries.filter_map(|e| e.ok()).collect();
        all_entries.sort_by(|a, b| a.file_name().cmp(&b.file_name()));

        for entry in all_entries {
            let path = entry.path();
            if !path.exists() { continue; }

            let file_name = path.file_name().unwrap().to_str().unwrap();
            println!("- Checking entry: {:?} (Full path: {:?})", file_name, path);

            if path.is_dir() {
                // --- 1. 處理子目錄 (分類) ---
                let mut sub_items = Vec::new();
                if let Ok(sub_entries) = fs::read_dir(&path) {
                    let mut sub_vec: Vec<_> = sub_entries.filter_map(|e| e.ok()).collect();
                    sub_vec.sort_by(|a, b| a.file_name().cmp(&b.file_name()));

                    for sub_entry in sub_vec {
                        let sub_path = sub_entry.path();
                        if sub_path.is_file() && sub_path.exists() {
                            let ext = sub_path.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
                            if ext == "wave" || ext == "xml" {
                                sub_items.push(serde_json::json!({
                                    "name": sub_path.file_stem().unwrap().to_str().unwrap(),
                                    "path": sub_path.to_str().unwrap()
                                }));
                            }
                        }
                    }
                }
                
                if !sub_items.is_empty() {
                    result.push(serde_json::json!({
                        "category": file_name,
                        "items": sub_items
                    }));
                }
            } else if path.is_file() {
                // --- 2. 處理根目錄檔案 (General) ---
                let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
                if ext == "wave" || ext == "xml" {
                    general_items.push(serde_json::json!({
                        "name": path.file_stem().unwrap().to_str().unwrap(),
                        "path": path.to_str().unwrap()
                    }));
                }
            }
        }
    }

    // 將 General 分類排在最後
    if !general_items.is_empty() {
        result.push(serde_json::json!({
            "category": "General",
            "items": general_items
        }));
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

// --- 序列埠核心指令 ---

#[tauri::command]
fn list_serial_ports() -> Vec<String> {
    serialport::available_ports()
        .map(|ports| ports.into_iter().map(|p| p.port_name).collect())
        .unwrap_or_else(|_| Vec::new())
}

#[tauri::command]
fn open_serial(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    port_name: String,
    baud_rate: u32,
) -> Result<(), String> {
    // 1. 如果已經開啟同一個埠，先檢查狀態
    {
        let name_lock = state.serial.port_name.lock().unwrap();
        if let Some(ref current_name) = *name_lock {
            if current_name == &port_name && state.serial.is_running.load(Ordering::SeqCst) {
                // 如果已經在跑同一個埠，不重複開啟
                return Ok(());
            }
        }
    }

    // 2. 請求停止舊執行緒
    state.serial.is_running.store(false, Ordering::SeqCst);
    
    // 3. 給予短暫延遲 (100ms)，讓舊執行緒退出並釋放實體埠資源
    std::thread::sleep(std::time::Duration::from_millis(150));

    {
        let mut name_lock = state.serial.port_name.lock().unwrap();
        *name_lock = Some(port_name.clone());
    }

    state.serial.is_running.store(true, Ordering::SeqCst);
    let is_running = state.serial.is_running.clone();

    std::thread::spawn(move || {
        println!("Attempting to open serial port: {}", port_name);
        let port_result = serialport::new(&port_name, baud_rate)
            .timeout(std::time::Duration::from_millis(50))
            .open();

        match port_result {
            Ok(p) => {
                let mut reader = BufReader::new(p);
                while is_running.load(Ordering::SeqCst) {
                    let mut line = String::new();
                    // 使用 read_line 可能會阻塞，timeout 設短一點
                    if let Ok(_) = reader.read_line(&mut line) {
                        let trimmed = line.trim();
                        if !trimmed.is_empty() {
                            let _ = app_handle.emit("serial-data", trimmed.to_string());
                        }
                    }
                }
                println!("Serial thread exiting for {}", port_name);
            }
            Err(e) => {
                // 使用 serialport 專用的 ErrorKind 進行匹配
                let friendly_msg = match e.kind() {
                    serialport::ErrorKind::NoDevice => "系統找不到指定的裝置，請檢查序列埠選取是否正確。".to_string(),
                    serialport::ErrorKind::Io(std::io::ErrorKind::PermissionDenied) => "存取被拒絕，可能該埠已被其他程式佔用。".to_string(),
                    serialport::ErrorKind::Io(std::io::ErrorKind::TimedOut) => "連線逾時。".to_string(),
                    _ => e.to_string(),
                };
                
                let _ = app_handle.emit("processing-error", format!("無法開啟序列埠 {}: {}", port_name, friendly_msg));
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn close_serial(state: State<'_, AppState>) {
    state.serial.is_running.store(false, Ordering::SeqCst);
    let mut name_lock = state.serial.port_name.lock().unwrap();
    *name_lock = None;
}

#[tauri::command]
async fn decode_audio_to_pcm(path: String) -> Result<DecodedPCM, String> {
    let file_bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    let cursor = Cursor::new(file_bytes);
    let source = rodio::Decoder::new(cursor).map_err(|e| format!("解碼失敗 ({}): {}", path, e))?;
    
    let sample_rate = source.sample_rate();
    let channels_count = source.channels() as usize;
    let samples: Vec<f32> = source.convert_samples().collect();
    
    let mut channels = vec![Vec::with_capacity(samples.len() / channels_count); channels_count];
    for (i, sample) in samples.into_iter().enumerate() {
        channels[i % channels_count].push(sample);
    }
    
    let id = Path::new(&path).file_stem().unwrap_or_default().to_string_lossy().to_string();
    
    Ok(DecodedPCM {
        channels,
        sample_rate,
        id,
    })
}

#[derive(serde::Serialize)]
struct SampleInfo {
    path: String,
    id: String,
}

#[tauri::command]
fn list_samples_recursive(app_handle: tauri::AppHandle) -> Vec<SampleInfo> {
    let samples_dir = utils::get_resource_path(&app_handle, "samples");
    let mut results = Vec::new();
    scan_samples_to_list(&samples_dir, &mut results, "", &samples_dir);
    results
}

#[tauri::command]
async fn read_sample_file(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(path).map_err(|e| e.to_string())
}

fn scan_samples_to_list(dir: &std::path::Path, results: &mut Vec<SampleInfo>, prefix: &str, base_dir: &std::path::Path) {
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_dir() {
                let folder_name = path.file_name().unwrap().to_str().unwrap();
                let new_prefix = if prefix.is_empty() { folder_name.to_string() } else { format!("{}_{}", prefix, folder_name) };
                scan_samples_to_list(&path, results, &new_prefix, base_dir);
            } else {
                let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
                if ext == "wav" || ext == "mp3" || ext == "ogg" || ext == "flac" {
                    let file_stem = path.file_stem().unwrap().to_str().unwrap();
                    let id = if prefix.is_empty() { file_stem.to_string() } else { format!("{}_{}", prefix, file_stem) };
                    results.push(SampleInfo {
                        path: path.to_string_lossy().to_string(),
                        id,
                    });
                }
            }
        }
    }
}

#[tauri::command]
fn get_version(app_handle: tauri::AppHandle) -> String {
    app_handle.package_info().version.to_string()
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
    .manage(AppState { 
        last_dir: Mutex::new(None),
        serial: SerialState {
            port_name: Mutex::new(None),
            is_running: Arc::new(AtomicBool::new(false)),
        }
    })
    .invoke_handler(tauri::generate_handler![
        update_patch, trigger_note, release_note, stop_audio, restart_audio,
        save_project, load_project, load_default_template, list_examples, open_url, get_doc_content, open_samples_dir,
        set_master_volume, log, list_samples_recursive, read_sample_file, decode_audio_to_pcm,
        list_serial_ports, open_serial, close_serial, get_version
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
