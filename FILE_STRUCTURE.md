# WaveCode 專案結構 (File Structure)

## 根目錄
- `src-tauri/`: Tauri 後端 (Rust)
    - `src/lib.rs`: **[更新] 實作序列埠核心穩定化、同步連線驗證與精密錯誤攔截**
    - `.taurignore`: Tauri 忽略檔，避免 resources 資料夾變動導致 App 重啟
    - `src/engine.rs`: 資源管理器 (負責載入音訊檔至前端)
    - `resources/`: 應用程式資源
        - `default_template.wave`: 專案初始樣板 (MasterOut + OnInit)
        - `examples/`: **[更新] TTP229 範例專案已全量遷移至通用 Bit Check 積木**
        - `docs/`: 輔助說明文件 (master, effects, melody)
- `ui/`: 前端程式碼 (Vite + JavaScript)
    - `src/main.js`: 前端主進入點 (整合 DSL 即時語法高亮與轉譯邏輯)
    - `src/preinit.js`: [關鍵] 全域變數、Mutators 與輔助函式預初始化
    - `src/blocks/`: 積木定義
        - `audio_instruments.js`: 獨立效果器、wc_master 總線積木
        - `audio_performance.js`: **[重大更新] 加入 wc_serial_init 重新連線按鈕與通用 wc_serial_check_bit 積木**
        - `events.js`: 鍵盤與 MIDI 事件處理積木
        - `text.js`: 基礎文字處理積木
    - `src/generators/`: 轉型為「音訊 DSL」產生器模式
        - `javascript/`: 產出 DSL 結構的 JS 產生器 (audio_instruments.js, audio_performance.js, system.js, events.js)
    - `src/lang/`: **[更新] 多國語言語系檔 (同步 Serial Bit Check 與連線訊息)**
    - ui/src/modules/: 功能模組
            - `audio/`: Web Audio API 核心引擎
            - `api.js`: **[重大更新] reset() 整合序列埠主動釋放邏輯與詳細清理日誌**
            - `dev_tools.js`: **[新增] 積木圖示匯出工具 (BlockExporter)**
            - `toolbar_manager.js`: 錄音控制與 MIDI 連線狀態回饋
            - `toolbox.js`: **[更新] 序列埠分類積木 ID 重構**
            - `ui_utils.js`: 補全 Orphan Block 白名單
            - `keyboard_controller.js`: 分頁切換安全鎖與 UI 同步
        - `ui/src/style.css`: **[新增] 序列埠重新連線按鈕亮度/發光 Hover 效果樣式**
    - `log/`: 開發紀錄與計畫
    - `work/`: 每日工作摘要 (yyyy-mm-dd.md)
- `backup/`: 檔案備份目錄
- `GEMINI.md`: 專案開發規範 (Mandates)
- `logo.png`: 應用程式圖示

---
*最後更新：2026-04-18 (Developer Tools & Asset Automation)*
