use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use fundsp::hacker::*;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

/// WaveCode 音訊引擎核心 (基於 fundsp)
pub struct AudioEngine {
    _stream: cpal::Stream, // 保持串流生命週期
    freq: Shared,          // 頻率控制變數 (Shared 類型)
    vol: Shared,           // 音量控制變數
    active: Arc<AtomicBool>, // 引擎啟動狀態開關
}

unsafe impl Sync for AudioEngine {}
unsafe impl Send for AudioEngine {}

impl AudioEngine {
    pub fn new() -> Result<Self, String> {
        let host = cpal::default_host();
        let device = host.default_output_device().ok_or("找不到預設音訊輸出裝置")?;
        let config = device.default_output_config().map_err(|e| e.to_string())?;
        let sample_rate = config.sample_rate().0 as f64;

        // 1. 建立控制變數 (預設頻率 440Hz, 靜音)
        let freq = shared(440.0);
        let vol = shared(0.0);
        let active = Arc::new(AtomicBool::new(true));
        let active_for_callback = Arc::clone(&active);

        // 2. 建立 DSP 鏈 (正弦波 -> 裁切限制器 -> 左右聲道分離)
        let mut dsp: Box<dyn AudioUnit> = Box::new(
            (var(&freq) >> sine() >> clip_to(-1.0, 1.0)) * var(&vol) >> split::<U2>()
        );
        dsp.set_sample_rate(sample_rate);
        dsp.reset();

        // 3. 啟動音訊串流
        let stream = device.build_output_stream(
            &config.into(),
            move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                if !active_for_callback.load(Ordering::Acquire) {
                    for sample in data.iter_mut() { *sample = 0.0; }
                    return;
                }
                
                for frame in data.chunks_mut(2) {
                    let (l, r) = dsp.get_stereo();
                    if frame.len() == 2 {
                        frame[0] = l as f32;
                        frame[1] = r as f32;
                    } else if frame.len() == 1 {
                        frame[0] = l as f32;
                    }
                }
            },
            |err| eprintln!("音訊串流錯誤: {}", err),
            None
        ).map_err(|e| e.to_string())?;

        stream.play().map_err(|e| e.to_string())?;
        
        Ok(AudioEngine { 
            _stream: stream, 
            freq,
            vol,
            active 
        })
    }

    /// 設定震盪器頻率
    pub fn set_frequency(&self, value: f32) {
        self.freq.set_value(value);
    }

    /// 設定主音量
    pub fn set_volume(&self, value: f32) {
        self.vol.set_value(value);
    }

    /// 通用數值接收器 (相容前端指令)
    pub fn send_float(&self, receiver: &str, value: f32) {
        if receiver.contains("freq") {
            self.set_frequency(value);
        } else if receiver.contains("vol") {
            self.set_volume(value);
        }
    }

    /// 停止 DSP 處理 (輸出絕對靜音)
    pub fn stop_dsp(&self) { 
        self.active.store(false, Ordering::Release);
    }

    /// 啟動 DSP 處理
    pub fn start_dsp(&self) { 
        self.active.store(true, Ordering::Release);
    }
}
