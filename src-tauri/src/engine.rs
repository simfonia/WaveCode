use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::AppHandle;

/**
 * WaveCode Engine - 後端組件定義 (Web Audio 時代)
 * 僅保留資料結構與配置邏輯，實際 DSP 已遷移至前端 Web Audio。
 */

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

pub type Patch = Vec<Component>;

/// 空殼音訊引擎，僅為保持與 lib.rs 的相容性
pub struct AudioEngine {
    _app_handle: AppHandle,
}

impl AudioEngine {
    pub fn new(app_handle: AppHandle) -> Result<Self, String> {
        Ok(AudioEngine { _app_handle: app_handle })
    }

    pub fn restart(&self) -> Result<(), String> {
        // Web Audio 時代不再需要後端重啟
        Ok(())
    }

    pub fn update_patches(&self, _new_patches: HashMap<String, Patch>) -> Result<(), String> {
        // 編譯後的 Patch 現在由前端 WaveCodeAPI 直接處理，此處為空
        Ok(())
    }

    // 廢棄的音訊控制方法 (已轉移至前端)
    pub fn trigger_note(&self, _freq: f32, _inst_id: String) -> usize { 0 }
    pub fn release_voice(&self, _index: usize) {}
    pub fn stop_all(&self) {}
    pub fn set_master_volume(&self, _val: f32) {}
}
