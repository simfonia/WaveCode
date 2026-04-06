# WaveCode 專案結構 (File Structure)

## 根目錄
- `src-tauri/`: Tauri 後端 (Rust)
    - `src/main.rs`: 程式進入點
    - `src/lib.rs`: **Tauri 指令、檔案 IO 與 open_url 本地路徑解析**
    - `src/engine.rs`: **[已轉型] 資源管理器 (負責高效載入音訊檔並傳送 Buffer 至前端)**
    - `src/utils.rs`: **資源與快取路徑偵測 (支援開發與生產環境)**
    - `Cargo.toml`: Rust 依賴管理 (**lazy_static, rayon, serde**)
    - `resources/`: **應用程式資源 (統一存放於此處，支援 Tauri v2 打包)**
        - `examples/`: 內建積木範例檔 (.wave)
        - `samples/`: 多取樣音色庫 (WAV/MP3)
- `ui/`: 前端程式碼 (Vite + JavaScript)
    - `index.html`: **雙欄即時分析儀介面 (Waveform + Spectrum)**
    - `src/main.js`: 前端主進入點 (第一行 import preinit.js)
    - `src/preinit.js`: **[新增] 預初始化模組，定義全域工具與 Mutators**
    - `src/blocks/`: Blockly 積木定義 (含 wc_create_additive_synth 與 Mutator)
    - `src/modules/`: 功能模組
        - `audio/`: **[新增] Web Audio API 核心引擎**
            - `manager.js`: 核心音訊管理員與 Context 控制
            - `voice.js`: 單一發聲通道生命週期封裝 (含 ADSR)
            - `factory.js`: 積木 Patch 到 Web Audio Node 的轉換工廠
            - `visualizer.js`: 實時分析儀資料提取器
        - `api.js`: **[更新] 轉發音訊指令至前端 AudioManager**
        - `compiler.js`: **[更新] 針對 Web Audio 模式的最佳化編譯器**
        - `visualizer.js`: **[更新] UI 示波器繪圖 (監聽本地事件，視覺聽覺 100% 同步)**
        - (其餘模組保持穩定...)
    - `src/lang/`: i18n 語系檔 (補齊加法合成器標籤)

---
*最後更新：2026-04-05 (Audio Engine Migration to Web Audio API, Modular Refactoring)*
