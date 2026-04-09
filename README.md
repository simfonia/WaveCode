# WaveCode IDE

WaveCode 是一個專為高中音訊編程教育設計的獨立 IDE。它結合了 Blockly 的視覺化開發體驗與 **Web Audio API** 的強大實時合成能力，旨在提供低延遲、安全且直觀的音樂編程環境。

## 🚀 核心技術 (Hybrid Architecture)
- **音訊引擎**：Web Audio API (JavaScript / C++) - 負責實時合成與多聲部排程。
- **系統外殼**：Tauri v2 (Rust) - 負責高效檔案 IO、並行資源解碼與序列埠通訊。
- **視覺編程**：Google Blockly (對齊 #nyx / HarmoNyx 標準)。
- **通訊協議**：Tauri Invoke (二進位快速通道) - 實現前端與系統的原生級連動。

## ✨ 主要特色
- **音訊 DSL (Audio Scripting)**：支援「底層跑 JS，上層看 DSL」模式，提供專業且易讀的樂理代碼高亮顯示。
- **並行取樣載入 (Parallel Loading)**：利用 Rust 側檔案讀取與瀏覽器 C++ 解碼器，實現 70+ 取樣檔案於 **2 秒內** 完成載入。
- **精確邏輯排程**：內建 `_playbackTime` 維護線性拍點，確保演奏節奏不受 JavaScript 事件循環延遲影響。
- **示波器即時監控**：整合實時波形與 FFT 分析儀，並於標題列即時反映當前鍵盤演奏或腳本指定的樂器名稱。
- **硬體與 AI 連動**：支援序列埠 (Serial) 讀取，可輕鬆將 TTP229 觸控板、LDR 光敏電阻等實體感測器映射為音訊參數 (如 Wah-wah 效果)。

## 🛠️ 開發環境
1. 安裝 Rust (Stable) 與 Tauri 依賴項。
2. 安裝 Node.js。
3. 執行 `npm install` (於 `ui/` 資料夾)。
4. 於根目錄執行 `npm run tauri dev` 啟動開發者視窗。

---
*WaveCode - 讓音樂代碼化，讓創作視覺化。 ( 2026-04-08 穩定版)*
