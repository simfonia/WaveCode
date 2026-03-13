use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use fundsp::hacker32::*;
use std::sync::atomic::{AtomicUsize, AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::Emitter;

const MAX_VOICES: usize = 8; 

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Component {
    #[serde(rename = "osc")]
    Osc { wave: u8 },
    #[serde(rename = "adsr")]
    Adsr { a: f32, d: f32, s: f32, r: f32 },
    #[serde(rename = "filter")]
    Filter { kind: String, freq: f32, q: f32 },
    #[serde(rename = "volume")]
    Volume { val: f32 },
}

type Patch = Vec<Component>;

struct Voice {
    freq: Shared,
    gate: Shared,
    unit: Mutex<Box<dyn AudioUnit>>,
    queued_unit: Mutex<Option<Box<dyn AudioUnit>>>,
    reset_pending: AtomicBool,
    // 紀錄目前聲部所屬的樂器 ID
    current_inst_id: Mutex<String>,
}

#[derive(Serialize, Clone)]
struct WaveformPayload {
    data: Vec<f32>,
    clipped: bool,
}

pub struct AudioEngine {
    _stream: Option<cpal::Stream>,
    voices: Arc<Vec<Voice>>,
    next_voice: AtomicUsize,
    master_vol: Shared,
    patches: Arc<Mutex<HashMap<String, Patch>>>,
    sample_rate: f64,
}

unsafe impl Sync for AudioEngine {}
unsafe impl Send for AudioEngine {}

impl AudioEngine {
    pub fn new(app_handle: tauri::AppHandle) -> Result<Self, String> {
        let host = cpal::default_host();
        let device = host.default_output_device().ok_or("找不到輸出裝置")?;
        let config = device.default_output_config().map_err(|e| e.to_string())?;
        let sample_rate = config.sample_rate().0 as f64;
        let channels = config.channels() as usize;

        let mut voices = Vec::new();
        for _ in 0..MAX_VOICES {
            voices.push(Voice { 
                freq: shared(0.0), 
                gate: shared(0.0), 
                unit: Mutex::new(Box::new(dc(0.0))),
                queued_unit: Mutex::new(None),
                reset_pending: AtomicBool::new(false),
                current_inst_id: Mutex::new(String::new()),
            });
        }
        let voices = Arc::new(voices);
        let master_vol = shared(1.0);
        let patches = Arc::new(Mutex::new(HashMap::new()));

        let voices_clone = Arc::clone(&voices);
        let master_vol_clone = master_vol.clone();
        
        let stream = device.build_output_stream(
            &config.into(),
            move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                for sample in data.iter_mut() { *sample = 0.0; }
                
                let mut scope_buffer = Vec::with_capacity(256);
                let mut triggered = false;
                let mut armed = false;
                let trigger_threshold = 0.01;
                let mut has_clipped = false;

                for frame in data.chunks_mut(channels) {
                    let mut unclipped_sample = 0.0;
                    
                    for v in voices_clone.iter() {
                        if let Ok(mut unit) = v.unit.try_lock() {
                            if let Ok(mut q) = v.queued_unit.try_lock() {
                                if let Some(new_unit) = q.take() {
                                    *unit = new_unit;
                                    unit.reset();
                                }
                            }
                            if v.reset_pending.swap(false, Ordering::SeqCst) {
                                unit.reset();
                            }
                            unclipped_sample += unit.get_mono();
                        }
                    }
                    
                    let master_gain = master_vol_clone.value() as f32;
                    let final_raw = unclipped_sample * master_gain;

                    if final_raw.abs() > 1.0 { has_clipped = true; }

                    let clipped_sample = final_raw.clamp(-1.0, 1.0);
                    for sample in frame.iter_mut() { *sample = clipped_sample; }

                    if !triggered {
                        if final_raw < -trigger_threshold { armed = true; }
                        if armed && final_raw > trigger_threshold { triggered = true; }
                    }
                    if triggered && scope_buffer.len() < 256 { 
                        scope_buffer.push(final_raw); 
                    }
                }

                if !triggered && scope_buffer.is_empty() {
                    scope_buffer = vec![0.0; 256];
                } else if triggered && scope_buffer.len() < 256 {
                    while scope_buffer.len() < 256 { scope_buffer.push(0.0); }
                }

                if scope_buffer.len() >= 256 {
                    let _ = app_handle.emit("waveform", WaveformPayload {
                        data: scope_buffer[0..256].to_vec(),
                        clipped: has_clipped,
                    });
                }
            },
            |err| eprintln!("錯誤: {}", err),
            None
        ).map_err(|e| e.to_string())?;

        stream.play().map_err(|e| e.to_string())?;

        Ok(AudioEngine { 
            _stream: Some(stream), 
            voices, 
            next_voice: AtomicUsize::new(0), 
            master_vol,
            patches,
            sample_rate,
        })
    }

    fn build_voice_unit(patch: &Patch, freq: &Shared, gate: &Shared, sample_rate: f64) -> Box<dyn AudioUnit> {
        let mut net = Net::new(0, 1);
        let f_node = net.push(Box::new(var(freq)));
        let g_node = net.push(Box::new(var(gate)));
        let mut last_output = None;

        for comp in patch {
            match comp {
                Component::Osc { wave } => {
                    let osc_id = match wave {
                        1 => net.push(Box::new(saw())),
                        2 => net.push(Box::new(square())),
                        3 => net.push(Box::new(triangle())),
                        _ => net.push(Box::new(sine())),
                    };
                    net.connect(f_node, 0, osc_id, 0);
                    last_output = Some(osc_id);
                },
                Component::Adsr { a, d, s, r } => {
                    let adsr_id = net.push(Box::new(adsr_live(*a, *d, *s, *r)));
                    net.connect(g_node, 0, adsr_id, 0);
                    if let Some(prev) = last_output {
                        let mul_id = net.push(Box::new(pass() * pass()));
                        net.connect(prev, 0, mul_id, 0);
                        net.connect(adsr_id, 0, mul_id, 1);
                        last_output = Some(mul_id);
                    } else { last_output = Some(adsr_id); }
                },
                Component::Filter { kind, freq: f, q } => {
                    let filter_id = if kind == "HP" { net.push(Box::new(highpass_hz(*f, *q))) }
                    else { net.push(Box::new(lowpass_hz(*f, *q))) };
                    if let Some(prev) = last_output {
                        net.connect(prev, 0, filter_id, 0);
                        last_output = Some(filter_id);
                    }
                },
                Component::Volume { val } => {
                    let vol_id = net.push(Box::new(mul(*val)));
                    if let Some(prev) = last_output {
                        net.connect(prev, 0, vol_id, 0);
                        last_output = Some(vol_id);
                    }
                }
            }
        }

        if let Some(final_node) = last_output {
            let final_mul = net.push(Box::new(pass() * pass()));
            net.connect(final_node, 0, final_mul, 0);
            net.connect(g_node, 0, final_mul, 1);
            net.pipe_output(final_mul);
        } else {
            let silence = net.push(Box::new(dc(0.0)));
            net.pipe_output(silence);
        }

        let mut unit: Box<dyn AudioUnit> = Box::new(net);
        unit.set_sample_rate(sample_rate);
        unit.reset();
        unit
    }

    pub fn update_patches(&self, new_patches: HashMap<String, Patch>) -> Result<(), String> {
        {
            let mut patches = self.patches.lock().unwrap();
            *patches = new_patches;
        }
        
        // 點擊執行時，將所有聲部的樂器 ID 清空，強制下次 trigger 時重構（以套用新參數）
        for v in self.voices.iter() {
            if let Ok(mut id_guard) = v.current_inst_id.lock() {
                id_guard.clear();
            }
        }
        
        Ok(())
    }

    pub fn trigger_note(&self, freq: f32, inst_id: String) -> usize {
        let index = self.next_voice.fetch_add(1, Ordering::SeqCst) % MAX_VOICES;
        let voice = &self.voices[index];
        
        // 檢查樂器 ID 是否變更
        let mut build_needed = false;
        if let Ok(mut current_id) = voice.current_inst_id.lock() {
            if *current_id != inst_id {
                *current_id = inst_id.clone();
                build_needed = true;
            }
        }

        if build_needed {
            let patches = self.patches.lock().unwrap();
            if let Some(patch) = patches.get(&inst_id) {
                let new_unit = Self::build_voice_unit(patch, &voice.freq, &voice.gate, self.sample_rate);
                if let Ok(mut q) = voice.queued_unit.lock() {
                    *q = Some(new_unit);
                }
            }
        }

        voice.freq.set_value(freq);
        voice.reset_pending.store(true, Ordering::SeqCst);
        voice.gate.set_value(0.0);
        voice.gate.set_value(1.0);
        index
    }

    pub fn release_voice(&self, index: usize) {
        if index < MAX_VOICES {
            self.voices[index].gate.set_value(0.0);
        }
    }

    pub fn stop_all(&self) { 
        for v in self.voices.iter() { v.gate.set_value(0.0); }
    }
}
