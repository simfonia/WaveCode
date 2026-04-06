use fundsp::hacker32::*;
use std::sync::atomic::{AtomicUsize, AtomicBool, Ordering};
use std::sync::{Arc, Mutex, mpsc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::Emitter;
use lazy_static::lazy_static;
use std::path::{Path, PathBuf};

// --- 背景資源回收器 ---
struct UnitGarbageCollector {
    sender: mpsc::Sender<Box<dyn AudioUnit>>,
}

impl UnitGarbageCollector {
    fn new() -> Self {
        let (tx, rx) = mpsc::channel::<Box<dyn AudioUnit>>();
        std::thread::spawn(move || {
            while let Ok(unit) = rx.recv() { drop(unit); }
        });
        Self { sender: tx }
    }
    fn collect(&self, unit: Box<dyn AudioUnit>) { let _ = self.sender.send(unit); }
}

lazy_static! {
    static ref GC: UnitGarbageCollector = UnitGarbageCollector::new();
}

const MAX_VOICES: usize = 8; 
const FFT_SIZE: usize = 256;
const FADE_SAMPLES: usize = 512; 

// --- 實時視覺緩衝區 (Lock-free 概念) ---
struct VisualBuffer {
    data: Mutex<Vec<f32>>,
    new_data_available: AtomicBool,
    has_clipped: AtomicBool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Component {
    #[serde(rename = "osc")] Osc { wave: u8 },
    #[serde(rename = "additive")] Additive { partials: Vec<Partial> },
    #[serde(rename = "adsr")] Adsr { a: f32, d: f32, s: f32, r: f32 },
    #[serde(rename = "filter")] Filter { kind: String, freq: f32, q: f32 },
    #[serde(rename = "volume")] Volume { val: f32 },
    #[serde(rename = "sampler")] Sampler { sample_id: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Partial {
    pub wave: u8,
    pub ratio: f32,
    pub amp: f32,
}

type Patch = Vec<Component>;

struct Voice {
    freq: Shared,
    gate: Shared,
    ratio: Shared,
    unit: Mutex<Box<dyn AudioUnit>>,
    queued_unit: Mutex<Option<Box<dyn AudioUnit>>>,
    fade_unit: Mutex<Option<Box<dyn AudioUnit>>>, 
    fade_counter: AtomicUsize,                     
    reset_pending: AtomicBool,
    current_inst_id: Mutex<String>,
    last_trigger_time: AtomicUsize,
}

#[derive(Serialize, Clone)]
struct WaveformPayload {
    data: Vec<f32>,
    fft: Vec<f32>,
    clipped: bool,
}

#[derive(Clone)]
struct SampleBuffer {
    data: Arc<Vec<f32>>,
}

#[derive(Clone, Default)]
struct VariableSpeedPlayer {
    data: Arc<Vec<f32>>,
    index: f64,
    ratio: Shared, 
    finished: bool,
}

impl VariableSpeedPlayer {
    fn new(data: Arc<Vec<f32>>, ratio: Shared) -> Self {
        Self { data, index: 0.0, ratio, finished: false }
    }
}

impl AudioNode for VariableSpeedPlayer {
    const ID: u64 = 1234;
    type Inputs = U0;
    type Outputs = U1;
    fn reset(&mut self) { self.index = 0.0; self.finished = false; }
    #[inline]
    fn tick(&mut self, _input: &Frame<f32, Self::Inputs>) -> Frame<f32, Self::Outputs> {
        if self.finished || self.data.is_empty() { return [0.0].into(); }
        let i = self.index as usize;
        let frac = (self.index - i as f64) as f32;
        let out = if i + 1 < self.data.len() {
            let v1 = self.data[i]; let v2 = self.data[i + 1];
            v1 + frac * (v2 - v1)
        } else if i < self.data.len() { self.data[i] } 
        else { self.finished = true; 0.0 };
        self.index += self.ratio.value() as f64;
        [out].into()
    }
}

pub struct AudioEngine {
    stream: Mutex<Option<cpal::Stream>>,
    app_handle: tauri::AppHandle,
    voices: Arc<Vec<Voice>>,
    trigger_counter: AtomicUsize,
    master_vol: Shared,
    patches: Arc<Mutex<HashMap<String, Patch>>>,
    sample_rate: Arc<Mutex<f64>>,
    sample_map: Arc<Mutex<HashMap<String, SampleBuffer>>>,
    visual_buffer: Arc<VisualBuffer>,
}

unsafe impl Sync for AudioEngine {}
unsafe impl Send for AudioEngine {}

impl AudioEngine {
    pub fn new(app_handle: tauri::AppHandle) -> Result<Self, String> {
        let voices = Arc::new((0..MAX_VOICES).map(|_| Voice {
            freq: shared(440.0), gate: shared(0.0), ratio: shared(1.0),
            unit: Mutex::new(Box::new(dc(0.0))),
            queued_unit: Mutex::new(None),
            fade_unit: Mutex::new(None),
            fade_counter: AtomicUsize::new(0),
            reset_pending: AtomicBool::new(false),
            current_inst_id: Mutex::new(String::new()),
            last_trigger_time: AtomicUsize::new(0),
        }).collect());

        let visual_buffer = Arc::new(VisualBuffer {
            data: Mutex::new(vec![0.0; FFT_SIZE]),
            new_data_available: AtomicBool::new(false),
            has_clipped: AtomicBool::new(false),
        });

        let engine = AudioEngine { 
            stream: Mutex::new(None), app_handle: app_handle.clone(), voices, 
            trigger_counter: AtomicUsize::new(0), master_vol: shared(1.0),
            patches: Arc::new(Mutex::new(HashMap::new())),
            sample_rate: Arc::new(Mutex::new(44100.0)),
            sample_map: Arc::new(Mutex::new(HashMap::new())),
            visual_buffer: Arc::clone(&visual_buffer),
        };

        // --- 視覺處理執行緒：將 IPC 與序列化工作移出音訊執行緒 ---
        let handle_clone = app_handle.clone();
        std::thread::spawn(move || {
            use rustfft::{FftPlanner, num_complex::Complex};
            let mut planner = FftPlanner::new();
            let fft = planner.plan_fft_forward(FFT_SIZE);
            let mut fft_input: Vec<Complex<f32>> = vec![Complex::new(0.0, 0.0); FFT_SIZE];
            
            loop {
                std::thread::sleep(std::time::Duration::from_millis(33)); // ~30 FPS
                if visual_buffer.new_data_available.swap(false, Ordering::SeqCst) {
                    let (data, clipped) = {
                        let d = visual_buffer.data.lock().unwrap();
                        let c = visual_buffer.has_clipped.swap(false, Ordering::SeqCst);
                        (d.clone(), c)
                    };
                    
                    // 計算 FFT
                    for i in 0..FFT_SIZE { fft_input[i] = Complex::new(data[i], 0.0); }
                    fft.process(&mut fft_input);
                    let fft_data: Vec<f32> = fft_input[0..FFT_SIZE/2].iter()
                        .map(|c| (c.norm() / (FFT_SIZE as f32 / 2.0)).sqrt())
                        .collect();

                    let _ = handle_clone.emit("waveform", WaveformPayload { data, fft: fft_data, clipped });
                }
            }
        });

        engine.restart()?;
        Ok(engine)
    }

    pub fn restart(&self) -> Result<(), String> {
        self.reset_voices();
        let mut stream_guard = self.stream.lock().unwrap();
        *stream_guard = None;
        let host = cpal::default_host();
        let device = host.default_output_device().ok_or("找不到裝置")?;
        let config_range = device.default_output_config().map_err(|e| e.to_string())?;
        let sr = config_range.sample_rate().0 as f64;
        let channels = config_range.channels() as usize;
        *self.sample_rate.lock().unwrap() = sr;

        let mut config: cpal::StreamConfig = config_range.into();
        config.buffer_size = cpal::BufferSize::Fixed(1024); // 加大緩衝區至 1024

        let voices_clone = Arc::clone(&self.voices);
        let master_vol_clone = self.master_vol.clone();
        let visual_buffer = Arc::clone(&self.visual_buffer);
        
        use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
        
        // --- 預分配示波器內部工作 Buffer (零分配回呼) ---
        let mut local_scope = vec![0.0; FFT_SIZE];
        let mut scope_idx = 0;
        let mut triggered = false;
        let mut armed = false;
        let mut last_raw = 0.0;

        let stream = device.build_output_stream(
            &config,
            move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                for sample in data.iter_mut() { *sample = 0.0; }
                let mut has_clipped_local = false;

                for frame in data.chunks_mut(channels) {
                    let mut sum = 0.0;
                    for v in voices_clone.iter() {
                        if let Ok(mut unit) = v.unit.try_lock() {
                            if let Ok(mut q) = v.queued_unit.try_lock() { 
                                if let Some(new_unit) = q.take() { 
                                    if let Ok(mut f) = v.fade_unit.try_lock() {
                                        if let Some(old) = std::mem::replace(&mut *f, None) { GC.collect(old); }
                                        *f = Some(std::mem::replace(&mut *unit, new_unit));
                                        v.fade_counter.store(FADE_SAMPLES, Ordering::SeqCst);
                                    } else { let old = std::mem::replace(&mut *unit, new_unit); GC.collect(old); }
                                    unit.reset(); 
                                } 
                            }
                            if v.reset_pending.swap(false, Ordering::SeqCst) { unit.reset(); }
                            let current_out = unit.get_mono();
                            let fade_counter = v.fade_counter.load(Ordering::SeqCst);
                            if fade_counter > 0 {
                                if let Ok(mut fade_u) = v.fade_unit.try_lock() {
                                    if let Some(f_unit) = fade_u.as_mut() {
                                        let ratio = fade_counter as f32 / FADE_SAMPLES as f32;
                                        sum += current_out * (1.0 - ratio) + f_unit.get_mono() * ratio;
                                        v.fade_counter.fetch_sub(1, Ordering::SeqCst);
                                    } else { sum += current_out; }
                                } else { sum += current_out; }
                            } else {
                                if let Ok(mut f) = v.fade_unit.try_lock() { if let Some(old) = f.take() { GC.collect(old); } }
                                sum += current_out;
                            }
                        }
                    }
                    let final_raw = sum * master_vol_clone.value() as f32;
                    if final_raw.abs() > 1.0 { has_clipped_local = true; }
                    let clipped = final_raw.clamp(-1.0, 1.0);
                    for sample in frame.iter_mut() { *sample = clipped; }
                    
                    // --- 示波器邏輯：零分配寫入 ---
                    if !triggered {
                        if !armed { if final_raw < -0.1 { armed = true; } }
                        else { if last_raw <= 0.0 && final_raw > 0.0 { triggered = true; scope_idx = 0; } }
                    } else if scope_idx < FFT_SIZE {
                        local_scope[scope_idx] = final_raw;
                        scope_idx += 1;
                        if scope_idx >= FFT_SIZE {
                            // 資料集滿，進行非阻塞交換
                            if let Ok(mut global_data) = visual_buffer.data.try_lock() {
                                global_data.copy_from_slice(&local_scope);
                                visual_buffer.new_data_available.store(true, Ordering::SeqCst);
                                if has_clipped_local { visual_buffer.has_clipped.store(true, Ordering::SeqCst); }
                            }
                            triggered = false; armed = false;
                        }
                    }
                    last_raw = final_raw;
                }
            },
            |err| eprintln!("{}", err), None
        ).map_err(|e| e.to_string())?;
        stream.play().map_err(|e| e.to_string())?;
        *stream_guard = Some(stream);
        Ok(())
    }

    fn reset_voices(&self) {
        for v in self.voices.iter() {
            v.gate.set_value(0.0);
            if let Ok(mut u) = v.unit.lock() { let old = std::mem::replace(&mut *u, Box::new(dc(0.0))); GC.collect(old); }
            if let Ok(mut q) = v.queued_unit.lock() { if let Some(old) = q.take() { GC.collect(old); } }
            if let Ok(mut f) = v.fade_unit.lock() { if let Some(old) = f.take() { GC.collect(old); } }
            v.fade_counter.store(0, Ordering::SeqCst);
            if let Ok(mut id) = v.current_inst_id.lock() { id.clear(); }
        }
    }

    fn find_best_sample(sample_map: &HashMap<String, SampleBuffer>, prefix: &str, target_freq: f32) -> Option<(String, f64)> {
        let target_midi = 69.0 + 12.0 * (target_freq / 440.0).log2();
        let mut best_id = String::new();
        let mut best_dist = 999.0;
        let mut root_midi = 0.0;
        for id in sample_map.keys() {
            if id.contains(prefix) {
                let parts: Vec<&str> = id.split('_').collect(); if parts.len() < 2 { continue; }
                let mid = AudioEngine::note_to_midi(parts[parts.len()-1]);
                let dist = (target_midi - mid as f32).abs();
                if dist < best_dist { best_dist = dist; best_id = id.clone(); root_midi = mid; }
            }
        }
        if best_id.is_empty() { return None; }
        let ratio = 2.0f64.powf((target_midi as f64 - root_midi as f64) / 12.0);
        Some((best_id, ratio))
    }

    fn note_to_midi(name: &str) -> f64 {
        let n = name.to_uppercase();
        let octave = n.chars().find(|c| c.is_ascii_digit()).and_then(|c| c.to_digit(10)).unwrap_or(4) as i32;
        let base = if n.starts_with('C') { 0 } else if n.starts_with('D') { 2 } else if n.starts_with('E') { 4 }
        else if n.starts_with('F') { 5 } else if n.starts_with('G') { 7 } else if n.starts_with('A') { 9 }
        else if n.starts_with('B') { 11 } else { 0 };
        let modifier = if n.contains('S') || n.contains('#') { 1 } else if n.contains("SHARP") { 1 }
        else if n.contains("FLAT") { -1 } else if n.contains('B') && !n.starts_with('B') { -1 } else { 0 };
        ((octave + 1) * 12 + base + modifier) as f64
    }

    pub fn update_patches(&self, new_patches: HashMap<String, Patch>) -> Result<(), String> {
        *self.patches.lock().unwrap() = new_patches;
        for v in self.voices.iter() { if let Ok(mut id) = v.current_inst_id.lock() { id.clear(); } }
        Ok(())
    }

    fn build_voice_unit(
        patch: &Patch, freq_var: &Shared, gate_var: &Shared, ratio_var: &Shared, sample_rate: f64, 
        sample_map: Arc<Mutex<HashMap<String, SampleBuffer>>>, target_freq: f32
    ) -> Box<dyn AudioUnit> {
        let mut net = Net::new(0, 1);
        let f_node = net.push(Box::new(var(freq_var)));
        let g_node = net.push(Box::new(var(gate_var)));
        let r_node = net.push(Box::new(var(ratio_var)));
        let mut last_output = None;
        let mut has_adsr = false;
        for comp in patch {
            match comp {
                Component::Osc { wave } => {
                    let id = match wave { 1 => net.push(Box::new(saw())), 2 => net.push(Box::new(square())), 3 => net.push(Box::new(triangle())), _ => net.push(Box::new(sine())) };
                    net.connect(f_node, 0, id, 0); last_output = Some(id);
                },
                Component::Additive { partials } => {
                    let mut partial_outputs = Vec::new();
                    for p in partials {
                        let osc_id = match p.wave { 1 => net.push(Box::new(saw())), 2 => net.push(Box::new(square())), 3 => net.push(Box::new(triangle())), _ => net.push(Box::new(sine())) };
                        let r_node_partial = net.push(Box::new(mul(p.ratio)));
                        net.connect(f_node, 0, r_node_partial, 0); net.connect(r_node_partial, 0, osc_id, 0);
                        if p.amp != 1.0 {
                            let amp_node = net.push(Box::new(mul(p.amp)));
                            net.connect(osc_id, 0, amp_node, 0); partial_outputs.push(amp_node);
                        } else { partial_outputs.push(osc_id); }
                    }
                    if !partial_outputs.is_empty() {
                        let mut sum_id = partial_outputs[0];
                        for i in 1..partial_outputs.len() {
                            let add_id = net.push(Box::new(pass() + pass()));
                            net.connect(sum_id, 0, add_id, 0); net.connect(partial_outputs[i], 0, add_id, 1);
                            sum_id = add_id;
                        }
                        last_output = Some(sum_id);
                    }
                },
                Component::Sampler { sample_id } => {
                    let map = sample_map.lock().unwrap();
                    let (sid, _) = if sample_id == "piano" || sample_id == "violin_pizz" || sample_id == "violin_sust" {
                        let prefix = if sample_id == "piano" { "piano" } else if sample_id == "violin_pizz" { "pizzicato" } else { "vibrato-sustain" };
                        AudioEngine::find_best_sample(&map, prefix, target_freq).unwrap_or((sample_id.clone(), 1.0))
                    } else { (sample_id.clone(), 1.0) };
                    if let Some(sample) = map.get(&sid) {
                        let player = VariableSpeedPlayer::new(Arc::clone(&sample.data), ratio_var.clone());
                        let id = net.push(Box::new(An(player))); last_output = Some(id);
                    }
                },
                Component::Adsr { a, d, s, r } => {
                    has_adsr = true;
                    let id = net.push(Box::new(adsr_live(*a, *d, *s, *r)));
                    net.connect(g_node, 0, id, 0);
                    if let Some(prev) = last_output {
                        let mul_id = net.push(Box::new(pass() * pass()));
                        net.connect(prev, 0, mul_id, 0); net.connect(id, 0, mul_id, 1); last_output = Some(mul_id);
                    } else { last_output = Some(id); }
                },
                Component::Filter { kind, freq, q } => {
                    let id = if kind == "HP" { net.push(Box::new(highpass_hz(*freq, *q))) } else { net.push(Box::new(lowpass_hz(*freq, *q))) };
                    if let Some(prev) = last_output { net.connect(prev, 0, id, 0); last_output = Some(id); }
                },
                Component::Volume { val } => {
                    let id = net.push(Box::new(mul(*val)));
                    if let Some(prev) = last_output { net.connect(prev, 0, id, 0); last_output = Some(id); }
                }
            }
        }
        let final_node = last_output.unwrap_or_else(|| net.push(Box::new(dc(0.0))));
        if !has_adsr {
            let gate_mul = net.push(Box::new(pass() * pass()));
            net.connect(final_node, 0, gate_mul, 0); net.connect(g_node, 0, gate_mul, 1); net.pipe_output(gate_mul);
        } else { net.pipe_output(final_node); }
        let mut unit: Box<dyn AudioUnit> = Box::new(net);
        unit.set_sample_rate(sample_rate); unit.reset(); unit
    }

    pub fn trigger_note(&self, freq: f32, inst_id: String) -> usize {
        let mut best_voice = 0;
        let mut oldest_time = usize::MAX;
        let current_time = self.trigger_counter.fetch_add(1, Ordering::SeqCst);
        for i in 0..MAX_VOICES {
            let v = &self.voices[i];
            let g = v.gate.value();
            let t = v.last_trigger_time.load(Ordering::SeqCst);
            let score = if g == 0.0 { t } else { t + 1000000 };
            if score < oldest_time { oldest_time = score; best_voice = i; }
        }
        let voice = &self.voices[best_voice];
        voice.last_trigger_time.store(current_time, Ordering::SeqCst);
        let mut build_needed = false;
        if let Ok(mut current_id) = voice.current_inst_id.lock() {
            if *current_id != inst_id { *current_id = inst_id.clone(); build_needed = true; }
        }
        let patches = self.patches.lock().unwrap();
        if let Some(patch) = patches.get(&inst_id) {
            let has_sampler = patch.iter().any(|c| matches!(c, Component::Sampler { .. }));
            let mut current_ratio = 1.0;
            if has_sampler {
                let map = self.sample_map.lock().unwrap();
                let prefix = if inst_id.contains("piano") { "piano" } else if inst_id.contains("violin_pizz") { "pizzicato" } else { "vibrato-sustain" };
                if let Some((_, r)) = AudioEngine::find_best_sample(&map, prefix, freq) { current_ratio = r; }
            }
            if build_needed {
                let sr = *self.sample_rate.lock().unwrap();
                let new_unit = Self::build_voice_unit(patch, &voice.freq, &voice.gate, &voice.ratio, sr, Arc::clone(&self.sample_map), freq);
                if let Ok(mut q) = voice.queued_unit.lock() { if let Some(old) = q.take() { GC.collect(old); } *q = Some(new_unit); }
            }
            voice.freq.set_value(freq);
            voice.ratio.set_value(current_ratio as f32);
        }
        voice.reset_pending.store(true, Ordering::SeqCst);
        voice.gate.set_value(0.0); voice.gate.set_value(1.0);
        best_voice
    }

    pub fn release_voice(&self, index: usize) { if index < MAX_VOICES { self.voices[index].gate.set_value(0.0); } }
    pub fn stop_all(&self) { self.reset_voices(); }
    pub fn set_master_volume(&self, val: f32) { self.master_vol.set_value(val); }
}
