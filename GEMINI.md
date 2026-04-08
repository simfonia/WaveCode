# WaveCode 專案指南 (GEMINI.md)

## 專案概述
WaveCode 是一個結合了 Tauri (Rust) 與 **Web Audio API (JavaScript)** 的獨立音訊編程 IDE。它利用瀏覽器內建的高效能 C++ 音訊引擎處理實時合成，並由 Rust 負責系統外殼與高效檔案管理。

## ⚠️ 核心行為規範 (Critical Mandates)

### 1. 禁止盲目覆寫 (No Blind Overwrite)
- **鐵律**：在使用 `write_file` 進行全檔寫入、或進行涉及多個邏輯點的大型重構前，**必須先執行 `read_file` 讀取最新內容**。
- **目的**：杜絕因長對話導致的「記憶混亂」，防止功能倒退。

### 2. 日誌追加保護 (Append-Only)
- 處理 `log/` 下的檔案時，嚴禁覆寫歷史。必須使用追加模式，確保開發軌跡完整。

### 3. 語法轉譯與執行分離
- **原則**：產生器 (.js) 必須產出合法的 JavaScript 以供底層執行，但在側邊面板顯示時，應透過 `main.js` 的轉譯規則美化為 **「音訊 DSL」** 風格。

## ⚠️ 技術架構：Web Audio 混合模式

### 1. 前端音訊引擎 (ui/src/modules/audio/)
- **AudioManager (`manager.js`)**: 核心管理員。負責 Context 生命週期與 **Master Bus (主輸出總線)** 重建。
- **Master Bus 系統**: 使用者可透過 `wc_master` 積木自定義全域效果鏈（如 Limiter），以防止多聲部合奏破音 (Clipping)。
- **Voice (`voice.js`)**: 封裝單一發聲通道。支援 32+ 複音，具備精確的 ADSR 狀態機與排程釋放。
- **NodeFactory (`factory.js`)**: 組件工廠。支援 Oscillator, Sampler, Additive Synth 及拆分後的獨立效果器 (Filter, Delay, Distortion, Compressor)。

### 2. 安全性與穩定性 (Safety Guard)
- **Loop Guard**: 在所有產生代碼的循環中注入 `WaveCode.checkLoop(_id)`，防止同步無窮迴圈鎖死 UI。
- **Euthanasia (安樂死)**：所有異步任務（`wait`, `setTimeout`）必須綁定 `_execId` 檢查，確保點擊停止時舊腳本立即終止。

### 3. 精確排程系統 (api.js)
- **邏輯節拍**: 使用 `_playbackTime` 維護線性拍點時間，確保 `await playNote` 能精確銜接，不因 JS 執行緒延遲而節奏混亂。

## 工程規範
- **積木前綴 (Namespace)**: 所有自訂積木必須使用 **`wc_`** 前綴。
- **孤兒檢測 (Orphan Blocks)**: 對齊 #nyx 規範。有效的根積木必須包含在 `UIUtils.VALID_ROOTS` (含 `wc_instrument`, `wc_master`, `wc_perform`, `wc_init`, `wc_serial_data_received`)。
- **音訊 DSL 高亮**: Live Code 面板更名為「音訊腳本 (Audio DSL)」，具備自定義配色系統。

---
*最後更新日期：2026-04-06 (Discipline Update, Master Bus & DSL Transformation)*
