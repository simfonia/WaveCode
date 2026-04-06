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
            - `manager.js`: 核心管理員 (支援背景預載與 Context 持久化)
            - `voice.js`: 聲部封裝 (含 ADSR 邏輯與數值安全檢查)
            - `factory.js`: 節點工廠 (支援音名頻率自動轉換與多重取樣尋找)
            - `visualizer.js`: 實時分析儀資料提取器
        - `api.js`: **[更新] 旋律解析 (支援連結線/附點/三連音) 與 ADSR 視覺化聯動**
        - `ui_utils.js`: **[更新] IME 中文搜尋優化與 Unicode 正規化索引**
        - (其餘模組保持穩定...)
        - `src/lang/`: i18n 語系檔 (更新演奏音符與音名標籤)

        ---
        *最後更新：2026-04-06 (Melody Parser Refactor, IME Search Optimization, Background Loading)*
