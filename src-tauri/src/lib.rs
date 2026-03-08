mod engine;
use engine::AudioEngine;
use tauri::State;

// Tauri Command: 讓前端設定頻率
#[tauri::command]
fn set_frequency(state: State<'_, AudioEngine>, freq: f32) {
    let _ = state.start_dsp();
    state.send_float("freq", freq);
    println!("後端收到頻率設定: {} Hz (DSP 已開啟)", freq);
}

// Tauri Command: 停止聲音
#[tauri::command]
fn stop_audio(state: State<'_, AudioEngine>) {
    state.send_float("freq", 0.0);
    // 徹底關閉 DSP 計算以消除底噪
    let _ = state.stop_dsp();
    println!("後端指令：停止音訊並關閉 DSP");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::default().build())
    .manage(AudioEngine::new().expect("音訊引擎啟動失敗"))
    .invoke_handler(tauri::generate_handler![set_frequency, stop_audio])
    .setup(|_app| {
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
