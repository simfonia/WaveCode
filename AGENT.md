# WaveCode 專案代理指引 (AGENT.md)

本檔為 Codex 工作規範。進入 `C:/Workspace/WaveCode/` 後，所有實作、除錯、重構與文件更新都必須遵循本檔指示。

## 專案概述

WaveCode 是一個結合 Tauri v2 (Rust) 與 Web Audio API (JavaScript) 的獨立音訊編程 IDE。它利用瀏覽器內建的高效能音訊引擎處理即時合成，並由 Rust 負責系統外殼、高效檔案 IO、並行資源解碼與硬體通訊。

主要目標是提供音訊編程教育使用的低延遲、安全且直觀的音樂編程環境，整合 Blockly 視覺化開發體驗、音訊 DSL 顯示，以及 Web Audio 的即時合成能力。

## 啟動與脈絡讀取

進入本專案後，先切換到 `C:/Workspace/WaveCode/`，並閱讀下列檔案以取得最新狀態：

- `log/todo.md`：唯一任務進度追蹤檔案。
- `log/work/yyyy-mm-dd.md`：每日開發脈絡與診斷紀錄。本專案既有格式為 `.md`。
- `log/mappings/*.html`：長期結構化知識庫；若資料夾尚不存在，需在建立前確認任務確實需要。
- `FILE_STRUCTURE.md`：專案架構與檔案用途。
- `GEMINI.md`：Gemini CLI 規範來源。

## 核心行為規範

### 禁止盲目覆寫

- 使用任何整檔覆寫或等效寫入方式前，必須先實際讀取目標檔案最新全文。
- 若是大型重構或涉及多個邏輯點的修改，也必須先讀取相關檔案最新內容。
- 若因結構重整必須整檔覆寫，先將原檔備份到 `backup/`，檔名加入時間戳記 `yyyyMMdd_HHmmss`。

### 日誌追加保護

- 處理 `log/` 下檔案時，嚴禁覆寫歷史紀錄。
- `log/todo.md` 與 `log/work/*.*` 只能追加新紀錄，或在已讀取最新全文後保留全部歷史再串接新內容。
- 建議使用 PowerShell `Add-Content` 追加日誌。
- 不得刪除已完成任務與既有診斷紀錄。

### 行動前簡短說明

- 執行修改、測試、安裝、重構、刪除、搬移或建立檔案前，先用正體中文簡短說明要做什麼與原因。
- 若工具失敗，改以小步驟處理，不做未確認的大幅替代操作。
- 若 API 調用錯誤，需查詢官方文件或專案內已驗證紀錄，不憑記憶猜測。

## 技術架構

### 前端音訊引擎

位置：`ui/src/modules/audio/`

- `manager.js`：AudioManager，管理 AudioContext 生命週期與 Master Bus 重建。
- Master Bus 系統：使用者可透過 `wc_master` 積木自定義全域效果鏈，例如 Limiter，以避免多聲部合奏破音。
- `voice.js`：封裝單一發聲通道，支援 32+ 複音，具備精確 ADSR 狀態機與排程釋放。
- `factory.js`：NodeFactory，支援 Oscillator、Sampler、Additive Synth，以及 Filter、Delay、Distortion、Compressor 等獨立效果器。

### Rust 後端

位置：`src-tauri/`

- Tauri v2 負責應用程式外殼、檔案 IO、資源管理、序列埠通訊與原生能力。
- 前後端通訊以 Tauri Invoke 為核心。
- 音訊合成核心仍在前端 Web Audio 執行，不應把即時音訊排程邏輯錯置到 Rust 後端。

### Blockly 與音訊 DSL

- 所有自訂積木必須使用 `wc_` 前綴。
- generator 註冊使用 `Blockly.JavaScript.forBlock[]` 或專案既有相容模式。
- 產生器底層需產出可執行 JavaScript；側邊面板顯示則透過 `main.js` 轉譯與高亮成「音訊 DSL」風格。
- Live Code 面板定位為「音訊腳本 (Audio DSL)」，需維持自定義配色與可讀性。

## 安全性與穩定性

### Loop Guard

- 所有產生代碼的同步循環必須注入 `WaveCode.checkLoop(_id)`。
- 目標是防止使用者程式造成同步無窮迴圈並鎖死 UI。

### Euthanasia

- 所有異步任務，例如 `wait`、`setTimeout`、排程 callback，都必須綁定 `_execId` 檢查。
- 點擊停止後，舊腳本與舊動畫不得繼續影響新一輪執行。

### 精確排程

- `api.js` 使用 `_playbackTime` 維護線性拍點時間。
- `await playNote`、旋律、和弦、刷弦與節奏序列應以邏輯節拍銜接，避免受 JS 執行緒延遲影響。

## 工程規範

- 有效根積木需符合 `UIUtils.VALID_ROOTS`，目前包含 `wc_instrument`、`wc_master`、`wc_perform`、`wc_init`、`wc_serial_data_received` 等專案白名單。
- 修改積木時需同步檢查：
  - block definition
  - generator
  - toolbox
  - i18n (`zh-hant.js`, `en.js`)
  - orphan block/root validation
  - 相關範例與說明文件
- 修改音訊 API 時需檢查 Web Audio 節點生命週期、disconnect/cleanup、停止鍵行為與多次執行殘留狀態。
- 修改 MIDI/Serial 功能時需注意熱插拔、狀態追蹤、UI 回饋與 Tauri 權限。
- 修改取樣系統時需保留 `::` 分隔策略，避免 ID 底線歧義回歸。

## 字串、換行與轉義

處理 Blockly 產生器、音訊 DSL 與最終執行 JS 時，必須保持三層字串意識：

1. 工具或 API payload。
2. 磁碟上的 `.js` 產生器檔案。
3. `.js` 執行後回傳給 Blockly 的最終程式字串。

規範：

- 單引號或雙引號 JS 字串中禁止出現實體換行；需要換行時使用 `\n` 字面量。
- 注入長篇程式碼時，可使用 template literal，並確認輸出仍是合法 JavaScript。
- 產生器回傳的程式碼若需換行，字串結尾應明確包含 `\n`。
- 正規表達式與反斜線需確認最終層級，例如需要輸出 `split("\\+")` 時，產生器內必須正確雙重轉義。

## 文件與日誌

當任務包含 `#log` 或使用者要求更新紀錄時：

- 追加更新 `log/work/yyyy-mm-dd.md`，並在「技術深挖 (Technical Deep Dive)」記錄重要診斷、決策與 API 使用細節。
- 更新 `log/todo.md`，保留所有歷史任務，新增或標註當前任務狀態。
- 更新 `FILE_STRUCTURE.md`，簡述新增或異動檔案用途。
- 若建立或驗證 API 知識，整理到 `log/mappings/Framework_API_Index.html` 或對應模組知識庫。
- 在當日日誌末尾追加「下次啟動方向 (Next Steps)」。

## 目前專案重點

- WaveCode 已完成 Web Audio Engine、Master Bus、錄音匯出、MIDI、Serial、取樣、多採樣、吉他刷弦與開發者積木匯出工具等核心功能。
- 目前待辦包含進度除錯、說明文件補完、中英雙語化、i18n 完整性檢查、架構重整與程式碼清理。
- 進行任何修改時，優先維持既有教育用途、Blockly 使用體驗、音訊排程穩定性與停止後清理完整性。

---

最後建立日期：2026-05-31
