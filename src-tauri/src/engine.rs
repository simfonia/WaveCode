use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use libpd_rs::convenience::{PdGlobal, calculate_ticks};
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use std::collections::VecDeque;

pub struct AudioEngine {
    _stream: cpal::Stream,
    _pd: Arc<Mutex<PdGlobal>>,
    active: Arc<AtomicBool>,
}

// 宣告執行緒安全
unsafe impl Sync for AudioEngine {}
unsafe impl Send for AudioEngine {}

impl AudioEngine {
    pub fn new() -> Result<Self, String> {
        // 1. 初始化 cpal 音訊輸出
        let host = cpal::default_host();
        let device = host.default_output_device()
            .ok_or("找不到預設音訊輸出裝置")?;
        
        let config = device.default_output_config()
            .map_err(|e| e.to_string())?;
        let sample_rate = config.sample_rate().0 as i32;
        let channels = config.channels() as i32;

        // 2. 初始化與配置 libpd
        let mut pd_instance = PdGlobal::init_and_configure(0, channels, sample_rate)
            .map_err(|e| format!("libpd 初始化失敗: {:?}", e))?;

        let mut patch_path = std::env::current_dir().map_err(|e| e.to_string())?;
        if patch_path.ends_with("src-tauri") { patch_path.pop(); }
        patch_path.push("resources");
        patch_path.push("engine.pd");
        
        pd_instance.open_patch(patch_path)
            .map_err(|e| format!("無法載入 Patch: {:?}", e))?;

        pd_instance.activate_audio(true)
            .map_err(|e| format!("啟動 DSP 失敗: {:?}", e))?;

        let pd = Arc::new(Mutex::new(pd_instance));
        let pd_for_callback = Arc::clone(&pd);
        
        // 狀態開關
        let active = Arc::new(AtomicBool::new(true));
        let active_for_callback = Arc::clone(&active);

        // --- 初始化音訊佇列與暫存區 ---
        // audio_queue 作為水庫，存放 libpd 算好但還沒播出的樣本
        let mut audio_queue: VecDeque<f32> = VecDeque::with_capacity(8192);
        // pd_block_buffer 用來接收 libpd 每次算出的 1 tick (64 samples * channels)
        let mut pd_block_buffer = vec![0.0f32; (64 * channels) as usize];

        // 3. 建立音訊回調執行緒
        let stream = device.build_output_stream(
            &config.into(),
            move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                if !active_for_callback.load(Ordering::Relaxed) {
                    for sample in data.iter_mut() { *sample = 0.0; }
                    return;
                }

                // 只要水庫裡的樣本不夠填充這次音效卡的請求 (data.len())
                // 就叫 libpd 繼續運算 1 個 tick 並加入水庫
                if let Ok(_lock) = pd_for_callback.lock() {
                    while audio_queue.len() < data.len() {
                        libpd_rs::process::process_float(1, &[], &mut pd_block_buffer);
                        audio_queue.extend(pd_block_buffer.iter());
                    }
                }

                // 從水庫領取精確數量的樣本填入音效卡緩衝區
                for sample in data.iter_mut() {
                    *sample = audio_queue.pop_front().unwrap_or(0.0);
                }
            },
            |err| eprintln!("音訊串流錯誤: {}", err),
            None
        ).map_err(|e| e.to_string())?;

        stream.play().map_err(|e| e.to_string())?;

        Ok(AudioEngine {
            _stream: stream,
            _pd: pd,
            active,
        })
    }

    pub fn send_float(&self, receiver: &str, value: f32) {
        if let Ok(_lock) = self._pd.lock() {
            let _ = libpd_rs::send::send_float_to(receiver, value);
        }
    }

    pub fn stop_dsp(&self) {
        self.active.store(false, Ordering::Relaxed);
    }

    pub fn start_dsp(&self) {
        self.active.store(true, Ordering::Relaxed);
    }
}
