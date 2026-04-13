# WaveCode 專案結構 (File Structure)

## 根目錄
- `src-tauri/`: Tauri 後端 (Rust)
    - `src/lib.rs`: **[更新] 實作序列埠核心與並行音訊解碼支援 (decode_audio_to_pcm)**
    - `.taurignore`: **[新增] Tauri 忽略檔，避免 resources 資料夾變動導致 App 重啟**
    - `src/engine.rs`: [已轉型] 資源管理器 (負責載入音訊檔至前端)
    - `resources/`: 應用程式資源
        - `default_template.wave`: **[新增] 專案初始樣板 (MasterOut + OnInit)**
        - `examples/`: **[更新] 子目錄結構支援, 新增 Serial_Interactions 專題**
        - `docs/`: [更新] 輔助說明文件 (master, effects, melody)
- `ui/`: 前端程式碼 (Vite + JavaScript)
    - `src/main.js`: 前端主進入點 (整合 DSL 即時語法高亮與轉譯邏輯)
    - `src/preinit.js`: **[關鍵] 全域變數、Mutators 與輔助函式預初始化 (解決 ESM Hoisting 問題)**
    - `src/blocks/`: 積木定義
        - `audio_instruments.js`: 拆分 wc_effect_ 獨立效果器, 新增 wc_master 總線積木, [新增] Reverb 效果器
        - `audio_performance.js`: [新增] 序列埠處理與 TTP229 解析積木
        - `events.js`: **[新增] 鍵盤與 MIDI 事件處理積木 (對齊 #nyx 規範)**
        - `text.js`: 基礎文字處理積木
    - `src/generators/`: 轉型為「音訊 DSL」產生器模式
        - `javascript/`: 產出 DSL 結構的 JS 產生器 (audio_instruments.js, audio_performance.js, system.js)
    - `src/lang/`: 多國語言語系檔 (en.js, zh-hant.js)
    - `src/modules/`: 功能模組
        - `audio/`: Web Audio API 核心引擎
            - `manager.js`: 支援動態主鏈 rebuildMasterChain, 整合 Recorder 接入點
            - `factory.js`: **[重大更新] 實作 ADSR 穩定 Ramp、3.0x 下移懲罰取樣算法與鋼琴亮化濾波器**
            - `voice.js`: **[重大更新] 實作 5ms 安全淡出機制 (De-clicking) 與音量標準化**
            - `recorder.js`: **[新增] 高高品質 OGG 錄音模組，支援智慧靜音偵測結算**
            - `visualizer.js`: 示波器與視覺化邏輯
        - `api.js`: **[終極穩定版] 整合 Look-ahead 預排程、瞬時緩衝序列器與多軌作用域隔離**
        - `toolbar_manager.js`: **[重大更新] 實作動態錄音控制 UI 與連動自動執行邏輯**
        - `toolbox.js`: **[關鍵] 定義 Blockly 工具箱分類與內容結構**
        - `ui_utils.js`: [更新] 補全 Orphan Block 白名單 (含序列埠事件)
        - `keyboard_controller.js`: [重大更新] 實作分頁切換安全鎖、詳細日誌與 UI 同步
    - `ui/src/style.css`: 加入 Code DSL 語法高亮樣式
    - `index.html`: 前端主 HTML
    - `vite.config.js`: Vite 建置設定
- `log/`: 開發紀錄與計畫
    - `handover.md`: 跨對話任務交接紀錄
    - `details.md`: 技術細節與問題解決紀錄
    - `todo.md`: 任務清單與進度管理
    - `work/`: 每日工作摘要 (yyyy-mm-dd.md)
- `backup/`: 檔案備份目錄
- `GEMINI.md`: 專案開發規範 (Mandates)
- `logo.png`: 應用程式圖示

---
*最後更新：2026-04-12 (Reverb Implementation, Full Structure Update)*

# WaveCode 專案結構 (2026-04-13 更新)
## 核心路徑 (Core Paths)
- src-tauri/src/: Rust 後端邏輯。
    - lib.rs: Tauri 指令與取樣掃描 (提供 folder/filename 精確欄位)。
    - engine.rs: 音訊引擎核心。
    - utils.rs: 資源路徑輔助。
- src-tauri/resources/: 唯讀資源與靜態資產。
    - samples/: 取樣庫 (分 Melodic/Percussion 子目錄)。
    - docs/: 積木 HTML 說明文件 (sampler, multisampler 等)。
    - examples/: .wave 格式的官方範例 (已全量遷移至新版積木)。
- ui/src/modules/audio/: Web Audio 引擎。
    - manager.js: 核心管理員 (負責分類掃描、Master Bus、IDE 日誌同步)。
    - factory.js: 組件工廠 (實作 :: 分隔符號支援與智慧映射算法)。
- ui/src/blocks/: Blockly 積木定義。
    - audio_instruments.js: 包含打擊類(兩層選單)與旋律類(資料夾選單)積木。
