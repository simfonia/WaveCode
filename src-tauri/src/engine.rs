use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use fundsp::hacker::*;
use std::sync::atomic::{AtomicUsize, Ordering};

const MAX_VOICES: usize = 16;

struct Voice {
    freq: Shared,
    gate: Shared,
}

pub struct AudioEngine {
    _stream: cpal::Stream,
    voices: Vec<Voice>,
    next_voice: AtomicUsize,
    master_vol: Shared, // 已消除 unused 警告
}

unsafe impl Sync for AudioEngine {}
unsafe impl Send for AudioEngine {}

impl AudioEngine {
    pub fn new() -> Result<Self, String> {
        let host = cpal::default_host();
        let device = host.default_output_device().ok_or("找不到預設音訊輸出裝置")?;
        let config = device.default_output_config().map_err(|e| e.to_string())?;
        let sample_rate = config.sample_rate().0 as f64;

        let mut voices = Vec::new();
        for _ in 0..MAX_VOICES {
            voices.push(Voice {
                freq: shared(0.0),
                gate: shared(0.0),
            });
        }

        let master_vol = shared(0.0);

        // 使用靜態展開的混音器
        let v0 = &voices[0]; let v1 = &voices[1]; let v2 = &voices[2]; let v3 = &voices[3];
        let v4 = &voices[4]; let v5 = &voices[5]; let v6 = &voices[6]; let v7 = &voices[7];
        let v8 = &voices[8]; let v9 = &voices[9]; let v10 = &voices[10]; let v11 = &voices[11];
        let v12 = &voices[12]; let v13 = &voices[13]; let v14 = &voices[14]; let v15 = &voices[15];

        let m = |v: &Voice| (var(&v.freq) >> sine()) * (var(&v.gate) >> adsr_live(0.01, 0.2, 0.5, 0.5));

        // 核心算式：16 聲部混音
        let mut final_dsp: Box<dyn AudioUnit> = Box::new(
            (m(v0) + m(v1) + m(v2) + m(v3) + m(v4) + m(v5) + m(v6) + m(v7) +
             m(v8) + m(v9) + m(v10) + m(v11) + m(v12) + m(v13) + m(v14) + m(v15))
            * var(&master_vol) >> clip_to(-1.0, 1.0) >> split::<U2>()
        );

        final_dsp.set_sample_rate(sample_rate);
        final_dsp.reset();

        let stream = device.build_output_stream(
            &config.into(),
            move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                for frame in data.chunks_mut(2) {
                    let (l, r) = final_dsp.get_stereo();
                    if frame.len() == 2 {
                        frame[0] = l as f32;
                        frame[1] = r as f32;
                    } else {
                        frame[0] = l as f32;
                    }
                }
            },
            |err| eprintln!("音訊串流錯誤: {}", err),
            None
        ).map_err(|e| e.to_string())?;

        stream.play().map_err(|e| e.to_string())?;
        
        // 漸入啟動防爆音
        let master_vol_clone = master_vol.clone();
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(200));
            master_vol_clone.set_value(0.2); 
        });
        
        Ok(AudioEngine { 
            _stream: stream, 
            voices,
            next_voice: AtomicUsize::new(0),
            master_vol,
        })
    }

    pub fn trigger_note(&self, freq: f32) -> usize {
        if self.master_vol.value() < 0.01 {
            self.master_vol.set_value(0.2);
        }

        let index = self.next_voice.fetch_add(1, Ordering::SeqCst) % MAX_VOICES;
        let voice = &self.voices[index];
        voice.gate.set_value(0.0);
        voice.freq.set_value(freq);
        voice.gate.set_value(1.0);
        index
    }

    pub fn release_voice(&self, index: usize) {
        if index < MAX_VOICES {
            self.voices[index].gate.set_value(0.0);
        }
    }

    pub fn stop_all(&self) { 
        self.master_vol.set_value(0.0);
        for v in &self.voices {
            v.gate.set_value(0.0);
        }
    }
}
