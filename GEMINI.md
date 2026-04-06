# WaveCode 專案指南 (GEMINI.md)

## 專案概述
WaveCode 是一個結合了 Tauri (Rust) 與 **Web Audio API (JavaScript)** 的獨立音訊編程 IDE。它利用瀏覽器內建的高效能 C++ 音訊引擎處理實時合成，並由 Rust 負責系統外殼與高效檔案管理。

## ⚠️ 核心架構：Web Audio 混合模式 (2026-04-05 遷移)
**本專案已棄用純 Rust (cpal + fundsp) 的後端 DSP 方案，全面轉向 Web Audio API 以解決 Windows 平台下的音訊振動與效能瓶頸。**

### 1. 前端音訊引擎 (ui/src/modules/audio/)
- **AudioManager (`manager.js`)**: 核心管理員單例。負責 AudioContext 生命週期、全域 Gain 與 AnalyserNode。
- **Voice (`voice.js`)**: 封裝單一發聲通道。處理 Web Audio 節點連線與 ADSR 狀態機。支援最高 32+ 複音。
- **NodeFactory (`factory.js`)**: 組件工廠。將積木輸出的 Patch 數據轉換為實體 Web Audio 節點鏈。
- **Visualizer (`visualizer.js`)**: 視覺數據提取。實作了 **滯後觸發 (Hysteresis Trigger)** 邏輯，確保示波器波形水平固定。

### 2. Rust 後端角色轉型 (src-tauri/src/)
- **資源供應器**: Rust 僅負責讀取 samples/ 下的音訊檔，並將數據解碼傳回前端 `AudioBuffer`。
- **系統外殼**: 負責 Tauri 指令呼叫、檔案存取、範例載入與版本更新檢查。
- **[已轉型] `engine.rs`**: 原本的 DSP 邏輯已廢棄，現作為資源與狀態同步的橋接器。

### 3. 前端通訊與指令 (api.js & compiler.js)
- **聯邦編譯器**: `WaveCodeCompiler` 將積木解析為 JSON Patch 後，直接同步至前端 `AudioManager` 而非 Rust。
- **指令分流**: `triggerNote` 與 `releaseNote` 透過 `api.js` 直接調用 Web Audio 引擎，路徑極短，演奏延遲極低。

## 工程規範
- **積木前綴 (Namespace)**: 所有自訂積木必須使用 **`wc_`** 前綴 (例如: `wc_instrument`, `wc_play_note`)。
- **孤兒檢測 (Orphan Blocks)**: 對齊 #nyx 規範。有效的根積木必須包含在 `UIUtils.VALID_ROOTS` (含 `wc_instrument`, `wc_perform`, `wc_comment`)。
- **零 IPC 視覺**: 示波器數據必須直接從前端音訊流獲取，嚴禁透過 Tauri Event 傳輸樣本數據以保護處理頻寬。
- **持久化設定**: 系統偏好（如 `scroll_options`）儲存於 `localStorage` 並於 `main.js` 初始化時讀取。

---
*最後更新日期：2026-04-05 (Web Audio Architecture Transition)*
