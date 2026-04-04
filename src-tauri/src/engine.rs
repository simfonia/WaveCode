use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use fundsp::hacker32::*;
use std::sync::atomic::{AtomicUsize, AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::Emitter;
use std::path::{Path, PathBuf};
use rayon::prelude::*;
use rustfft::{FftPlanner, num_complex::Complex};

const MAX_VOICES: usize = 8; 
const FFT_SIZE: usize = 256;
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
    #[serde(rename = "sampler")]
    Sampler { sample_id: String },
}

type Patch = Vec<Component>;

struct Voice {
    freq: Shared,
    gate: Shared,
    unit: Mutex<Box<dyn AudioUnit>>,
    queued_unit: Mutex<Option<Box<dyn AudioUnit>>>,
    reset_pending: AtomicBool,
    current_inst_id: Mutex<String>,
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

/// 自定義變速播放單元：支援線性插值變速
#[derive(Clone, Default)]
struct VariableSpeedPlayer {
    data: Arc<Vec<f32>>,
    index: f64,
    ratio: f64,
    finished: bool,
}

impl VariableSpeedPlayer {
    fn new(data: Arc<Vec<f32>>, ratio: f64) -> Self {
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
        self.index += self.ratio;
        [out].into()
    }
}

pub struct AudioEngine {
    stream: Mutex<Option<cpal::Stream>>,
    app_handle: tauri::AppHandle,
    voices: Arc<Vec<Voice>>,
    next_voice: AtomicUsize,
    master_vol: Shared,
    patches: Arc<Mutex<HashMap<String, Patch>>>,
    sample_rate: Arc<Mutex<f64>>,
    sample_map: Arc<Mutex<HashMap<String, SampleBuffer>>>,
}

unsafe impl Sync for AudioEngine {}
unsafe impl Send for AudioEngine {}

impl AudioEngine {
    pub fn new(app_handle: tauri::AppHandle) -> Result<Self, String> {
        let voices = Arc::new((0..MAX_VOICES).map(|_| Voice {
            freq: shared(0.0), gate: shared(0.0),
            unit: Mutex::new(Box::new(dc(0.0))),
            queued_unit: Mutex::new(None),
            reset_pending: AtomicBool::new(false),
            current_inst_id: Mutex::new(String::new()),
        }).collect());

        let engine = AudioEngine { 
            stream: Mutex::new(None), app_handle: app_handle.clone(), voices, 
            next_voice: AtomicUsize::new(0), master_vol: shared(1.0),
            patches: Arc::new(Mutex::new(HashMap::new())),
            sample_rate: Arc::new(Mutex::new(44100.0)),
            sample_map: Arc::new(Mutex::new(HashMap::new())),
        };

        engine.restart()?;
        let _ = app_handle.emit("processing-log", "WaveCode: 音訊引擎已啟動");
        
        // --- 非同步背景載入 ---
        let engine_handle = app_handle.clone();
        let sample_map_arc = Arc::clone(&engine.sample_map);
        let sr_arc = Arc::clone(&engine.sample_rate);
        
        std::thread::spawn(move || {
            let sr = *sr_arc.lock().unwrap();
            let base_path = crate::utils::get_resource_path(&engine_handle, "samples");
            if base_path.exists() {
                let mut files = Vec::new();
                Self::collect_files(base_path, &mut files);
                    
                    // 使用 Rayon 並行載入
                    let loaded_samples: Vec<(String, SampleBuffer)> = files.into_par_iter().filter_map(|path| {
                        let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("unknown");
                        let parent = path.parent().and_then(|p| p.file_name()).and_then(|s| s.to_str()).unwrap_or("");
                        let id = format!("{}_{}", parent, stem);
                        
                        AudioEngine::load_audio_file(&path, sr).ok().map(|buf| (id, buf))
                    }).collect();

                    let count = loaded_samples.len();
                    {
                        let mut map = sample_map_arc.lock().unwrap();
                        for (id, buf) in loaded_samples { map.insert(id, buf); }
                    }
                    let msg = format!("WaveCode: 背景載入完成 ({} 個音色)", count);
                    println!("{}", msg);
                    let _ = engine_handle.emit("processing-log", msg);
                    let _ = engine_handle.emit("samples_ready", count);
                }
        });
        
        Ok(engine)
    }

    fn collect_files(dir: PathBuf, files: &mut Vec<PathBuf>) {
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() { Self::collect_files(path, files); }
                else {
                    let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
                    if ext == "wav" || ext == "mp3" { files.push(path); }
                }
            }
        }
    }

    fn load_audio_file<P: AsRef<Path>>(path: P, target_sr: f64) -> Result<SampleBuffer, String> {
        let path_ref = path.as_ref();
        let is_kick = path_ref.file_name().and_then(|s| s.to_str()).map(|s| s.contains("Bass") || s.contains("BT0")).unwrap_or(false);
        let ext = path_ref.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();

        let (mono_samples, source_sr): (Vec<f32>, f64) = if ext == "wav" {
            let mut reader = hound::WavReader::open(path_ref).map_err(|e| e.to_string())?;
            let spec = reader.spec();
            let mut samples = Vec::new();
            let channels = spec.channels as usize;
            match (spec.sample_format, spec.bits_per_sample) {
                (hound::SampleFormat::Int, 16) => {
                    let raw: Vec<i16> = reader.samples::<i16>().map(|s| s.unwrap_or(0)).collect();
                    for chunk in raw.chunks_exact(channels) { samples.push(chunk.iter().map(|&s| s as f32).sum::<f32>() / (channels as f32 * 32768.0)); }
                },
                (hound::SampleFormat::Int, 24) => {
                    let raw: Vec<i32> = reader.samples::<i32>().map(|s| s.unwrap_or(0)).collect();
                    for chunk in raw.chunks_exact(channels) { samples.push(chunk.iter().map(|&s| s as f32).sum::<f32>() / (channels as f32 * 8388608.0)); }
                },
                _ => return Err("格式不支援".into()),
            }
            (samples, spec.sample_rate as f64)
        } else if ext == "mp3" {
            let buffer = std::fs::read(path_ref).map_err(|e| e.to_string())?;
            let (header, samples_iter) = puremp3::read_mp3(&buffer[..]).map_err(|e| format!("{:?}", e))?;
            let mut mono = Vec::new();
            for (l, r) in samples_iter { mono.push((l + r) / 2.0); }
            (mono, header.sample_rate.hz() as f64)
        } else { return Err("格式不支援".into()); };

        // 預先重取樣至系統頻率，確保 1.0 倍速時音高準確
        let mut final_samples = if (source_sr - target_sr).abs() < 1.0 { mono_samples } else {
            let ratio = source_sr / target_sr;
            let target_len = (mono_samples.len() as f64 / ratio).floor() as usize;
            let mut resampled = Vec::with_capacity(target_len);
            for i in 0..target_len {
                let pos = i as f64 * ratio; let idx = pos.floor() as usize; let fr = (pos - idx as f64) as f32;
                if idx + 1 < mono_samples.len() { resampled.push(mono_samples[idx] + fr * (mono_samples[idx+1] - mono_samples[idx])); }
                else { resampled.push(mono_samples[idx]); }
            }
            resampled
        };

        let max_peak = final_samples.iter().map(|s| s.abs()).fold(0.0f32, f32::max);
        if max_peak > 0.0 {
            let boost = if is_kick { 1.5 } else { 1.0 };
            let scale = (0.98 / max_peak) * boost;
            for s in final_samples.iter_mut() { *s = (*s * scale).clamp(-1.0, 1.0); }
        }

        Ok(SampleBuffer { data: Arc::new(final_samples) })
    }

    pub fn restart(&self) -> Result<(), String> {
        let mut stream_guard = self.stream.lock().unwrap();
        *stream_guard = None;
        let host = cpal::default_host();
        let device = host.default_output_device().ok_or("找不到裝置")?;
        let config = device.default_output_config().map_err(|e| e.to_string())?;
        let sr = config.sample_rate().0 as f64;
        let channels = config.channels() as usize;
        *self.sample_rate.lock().unwrap() = sr;

        let voices_clone = Arc::clone(&self.voices);
        let master_vol_clone = self.master_vol.clone();
        let app_handle_clone = self.app_handle.clone();
        
        let mut planner = FftPlanner::new();
        let fft = planner.plan_fft_forward(FFT_SIZE);
        
        let stream = device.build_output_stream(
            &config.into(),
            move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                for sample in data.iter_mut() { *sample = 0.0; }
                let mut scope_buffer = Vec::with_capacity(FFT_SIZE);
                let mut triggered = false; let mut armed = false; let mut has_clipped = false;
                for frame in data.chunks_mut(channels) {
                    let mut sum = 0.0;
                    for v in voices_clone.iter() {
                        if let Ok(mut unit) = v.unit.try_lock() {
                            if let Ok(mut q) = v.queued_unit.try_lock() { if let Some(new_unit) = q.take() { *unit = new_unit; unit.reset(); } }
                            if v.reset_pending.swap(false, Ordering::SeqCst) { unit.reset(); }
                            sum += unit.get_mono();
                        }
                    }
                    let final_raw = sum * master_vol_clone.value() as f32;
                    if final_raw.abs() > 1.0 { has_clipped = true; }
                    let clipped = final_raw.clamp(-1.0, 1.0);
                    for sample in frame.iter_mut() { *sample = clipped; }
                    
                    if !triggered { if final_raw < -0.01 { armed = true; } if armed && final_raw > 0.01 { triggered = true; } }
                    if triggered && scope_buffer.len() < FFT_SIZE { scope_buffer.push(final_raw); }
                }

                if triggered && scope_buffer.len() >= FFT_SIZE {
                    let mut buffer: Vec<Complex<f32>> = scope_buffer.iter().map(|&v| Complex::new(v, 0.0)).collect();
                    fft.process(&mut buffer);
                    let fft_data: Vec<f32> = buffer[0..FFT_SIZE/2].iter()
                        .map(|c| (c.norm() / (FFT_SIZE as f32 / 2.0)).sqrt())
                        .collect();

                    let _ = app_handle_clone.emit("waveform", WaveformPayload { 
                        data: scope_buffer[0..FFT_SIZE].to_vec(), 
                        fft: fft_data,
                        clipped: has_clipped 
                    });
                }
            },
            |err| eprintln!("{}", err), None
        ).map_err(|e| e.to_string())?;
        stream.play().map_err(|e| e.to_string())?;
        *stream_guard = Some(stream);
        Ok(())
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

    fn build_voice_unit(
        patch: &Patch, freq: &Shared, gate: &Shared, sample_rate: f64, 
        sample_map: Arc<Mutex<HashMap<String, SampleBuffer>>>, target_freq: f32
    ) -> Box<dyn AudioUnit> {
        let mut net = Net::new(0, 1);
        let f_node = net.push(Box::new(var(freq)));
        let g_node = net.push(Box::new(var(gate)));
        let mut last_output = None;
        let mut has_adsr = false;
        for comp in patch {
            match comp {
                Component::Osc { wave } => {
                    let id = match wave { 1 => net.push(Box::new(saw())), 2 => net.push(Box::new(square())), 3 => net.push(Box::new(triangle())), _ => net.push(Box::new(sine())) };
                    net.connect(f_node, 0, id, 0); last_output = Some(id);
                },
                Component::Sampler { sample_id } => {
                    let map = sample_map.lock().unwrap();
                    let (sid, ratio) = if sample_id == "piano" || sample_id == "violin_pizz" || sample_id == "violin_sust" {
                        let prefix = if sample_id == "piano" { "piano" } else if sample_id == "violin_pizz" { "pizzicato" } else { "vibrato-sustain" };
                        AudioEngine::find_best_sample(&map, prefix, target_freq).unwrap_or((sample_id.clone(), 1.0))
                    } else { (sample_id.clone(), 1.0) };
                    if let Some(sample) = map.get(&sid) {
                        let player = VariableSpeedPlayer::new(Arc::clone(&sample.data), ratio);
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
                Component::Filter { kind, freq: f, q } => {
                    let id = if kind == "HP" { net.push(Box::new(highpass_hz(*f, *q))) } else { net.push(Box::new(lowpass_hz(*f, *q))) };
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

    pub fn update_patches(&self, new_patches: HashMap<String, Patch>) -> Result<(), String> {
        *self.patches.lock().unwrap() = new_patches;
        for v in self.voices.iter() { if let Ok(mut id) = v.current_inst_id.lock() { id.clear(); } }
        Ok(())
    }

    pub fn trigger_note(&self, freq: f32, inst_id: String) -> usize {
        let index = self.next_voice.fetch_add(1, Ordering::SeqCst) % MAX_VOICES;
        let voice = &self.voices[index];
        let mut build_needed = false;
        if let Ok(mut current_id) = voice.current_inst_id.lock() {
            let key = format!("{}_{}", inst_id, freq as i32);
            if *current_id != key { *current_id = key; build_needed = true; }
        }
        if build_needed {
            let patches = self.patches.lock().unwrap();
            if let Some(patch) = patches.get(&inst_id) {
                let sr = *self.sample_rate.lock().unwrap();
                let new_unit = Self::build_voice_unit(patch, &voice.freq, &voice.gate, sr, Arc::clone(&self.sample_map), freq);
                if let Ok(mut q) = voice.queued_unit.lock() { *q = Some(new_unit); }
            }
        }
        voice.freq.set_value(freq);
        voice.reset_pending.store(true, Ordering::SeqCst);
        voice.gate.set_value(0.0); voice.gate.set_value(1.0);
        index
    }

    pub fn release_voice(&self, index: usize) { if index < MAX_VOICES { self.voices[index].gate.set_value(0.0); } }

    pub fn stop_all(&self) { 
        for v in self.voices.iter() { 
            v.gate.set_value(0.0); 
            if let Ok(mut q) = v.queued_unit.lock() { *q = Some(Box::new(dc(0.0))); }
            if let Ok(mut id) = v.current_inst_id.lock() { id.clear(); }
        }
    }

    pub fn set_master_volume(&self, val: f32) {
        self.master_vol.set_value(val);
    }
}
