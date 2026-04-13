# WaveCode 開發交接與進度

## 2026-03-08 ~ 2026-04-11 (略)

## 2026-04-12 (第一階段：錄音、靜音偵測、Reverb 與尾跡守衛機制)
(此處省略第一階段內容以節省空間，檔案中已保留)

## 2026-04-12 (第二階段：效能重組、樂句封裝與精密排程連動)
(此處省略第二階段內容以節省空間，檔案中已保留)

## 2026-04-13 (樣板載入系統與 IDE 互動修復)

### 1. 本次對話達成
- **專案初始樣板系統 (Template System)**：
    - **[關鍵進化]**：成功實作由外部 XML 檔驅動的樣板載入機制。
    - **檔案位置**：`src-tauri/resources/default_template.wave`。
    - **載入流程**：Tauri 後端 `load_default_template` 指令 -> MDIManager `addNewTab` -> Blockly 注入。
    - **樣板內容**：預設包含 `MasterOut` (含停用 Compressor) 與 `OnInit` (含 SetBPM)。
- **IDE 互動體驗修復 (UX Fixes)**：
    - **搜尋框 Esc 鍵**：解決了與 `KeyboardController` 的事件競爭，現在 Esc 能確實清除搜尋並收合面板，且不會觸發「停止音訊」的副作用。
    - **分頁 Ghosting 防護**：切換分頁時自動隱藏所有 Blockly Widget/DropDown 元素，解決了編輯框殘留的問題。
    - **安樂死機制 (Euthanasia) 穩定化**：修復了產生器中 `_id` 宣告過於簡化的 Bug，確保 MIDI 與鍵盤事件在停止後能被正確回收。
- **專案結構同步**：
    - 更新 `FILE_STRUCTURE.md`，納入 `events.js` 與 `default_template.wave`。

### 2. 下一步行動
- **多採樣映射 (Multi-sampling Map)**：實作 MIDI Note 區間與 Sample 檔案的自動對應。
- **UI 視覺化控制組件**：為效果器（Reverb/Delay）加入圖形化旋鈕或曲線編輯器。

==================================================
2026-04-13 (當前專案狀態)

1. 樣板功能：
   * 使用者可透過編輯 `default_template.wave` 隨時調整「開新專案」的初始狀態。
   * IDE 操作流暢度在細節處（搜尋、切換分頁）得到了顯著改善。

2. 待辦重點：
   * **Multi-sampling Note Mapping (跨音高多採樣映射)**。
==================================================
