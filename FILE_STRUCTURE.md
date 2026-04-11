# WaveCode 專案結構 (File Structure)

## 根目錄
- `src-tauri/`: Tauri 後端 (Rust)
    - `src/lib.rs`: **[更新] 實作序列埠核心與並行音訊解碼支援 (decode_audio_to_pcm)**
    - `.taurignore`: **[新增] Tauri 忽略檔，避免 resources 資料夾變動導致 App 重啟**
    - `src/engine.rs`: [已轉型] 資源管理器 (負責載入音訊檔至前端)
    - `resources/`: 應用程式資源
        - `examples/`: **[更新] 子目錄結構支援, 新增 Serial_Interactions 專題**
        - `docs/`: [更新] 輔助說明文件 (master, effects, melody)
- `ui/`: 前端程式碼 (Vite + JavaScript)
    - `src/main.js`: 前端主進入點 (整合 DSL 即時語法高亮與轉譯邏輯)
    - `src/blocks/`: 積木定義
        - `audio_instruments.js`: 拆分 wc_effect_ 獨立效果器, 新增 wc_master 總線積木
        - `audio_performance.js`: **[新增] 序列埠初始化與 TTP229 解析積木**
    - `src/generators/`: 轉型為「音訊 DSL」產生器模式
    - `src/modules/`: 功能模組
        - `audio/`: Web Audio API 核心引擎
            - `manager.js`: 支援動態主鏈 rebuildMasterChain, 移除強制 Limiter
            - `factory.js`: **[重大更新] 實作 ADSR 穩定 Ramp、3.0x 下移懲罰取樣算法與鋼琴亮化濾波器**
            - `voice.js`: **[重大更新] 實作 5ms 安全淡出機制 (De-clicking) 與音量標準化**
        - `api.js`: **[終極穩定版] 整合 Look-ahead 預排程、瞬時緩衝序列器與多軌作用域隔離**
        - `ui_utils.js`: [更新] 補全 Orphan Block 白名單 (含序列埠事件)
        - `visualizer.js`: [更新] 實作精確動畫隔離與負載優化版 EnvelopeManager
        - `keyboard_controller.js`: [重大更新] 實作分頁切換安全鎖、詳細日誌與 UI 同步
    - `ui/src/style.css`: 加入 Code DSL 語法高亮樣式


---
*最後更新：2026-04-11 (Precision Scheduling, MDI Sync, Scope Isolation)*
