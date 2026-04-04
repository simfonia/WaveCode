# WaveCode 開發交接與進度

## 2026-03-08 ~ 2026-03-09 (略)

## 2026-03-10 (視覺化革命與診斷基石)
### 1. 本次對話達成
- **樂器定義帽子積木**：完全對齊 #processing 邏輯，實作「定義音色 -> 引用演奏」的模型。
- **SVG ADSR 視覺化**：開發了自定義 Blockly 欄位 `FieldADSR`，能在積木上繪製曲線並同步顯示演奏進度的「黃色跳動光點」。
- **即時示波器 (Oscilloscope)**：在主介面實作了磁滯觸發示波器，能靜止、穩定地觀察 Rust 輸出的原始波形。
- **音質診斷與優化**：
    - 解決了 Windows 多聲道環境下的緩衝區空洞雜音。
    - 實作了聲部物理隔離（Gate 物理斷路），消除了單音演奏時的並聯滲漏（拍音）。
    - 實作了頻率平滑 (`follow` 節點)，大幅改善了音符切換時的 Pop 聲。

### 2. 技術細節
- **磁滯觸發**：Rust 端的數據抓取採用了 `-0.05 ~ +0.05` 的磁滯區間，確保前端繪圖絕對靜止。
- **SVG vs Canvas**：棄用 Canvas 嵌入 SVG，改用 Blockly 原生 `createSvgElement`，解決了工作區縮放與 Minimap 顯示問題。

### 3. 下一步行動
- **核心穩定化**：目前正弦波在極快速連續演奏時仍有細微雜訊，需研究相位硬同步（Hard Sync）或在 Rust 端實作更細緻的 Crossfade。
- **功能擴充**：實作取樣器 (Sampler) 與 FFT 頻譜分析儀。

==================================================
2026-03-10 (結尾摘要)

1. 專案現狀：
   * 視覺系統已達到專業水準（ADSR 動畫、即時示波器）。
   * 音訊引擎極其穩定，解決了大多數底層雜音問題。
   * 具備 8 聲部複音能力。

2. 待辦重點：
   * 消除正弦波快速演奏時的細微雜訊。
   * 恢復 16 聲部負載測試。


==================================================
## 2026-04-03 

### 1. 實作 FFT 頻譜分析儀與示波器優化
    * 將示波器畫面拆分為波形與 FFT 兩欄，修正置中問題並加入高解析度螢幕支援。
    * 後端加入 FFT 計算 (`engine.rs`, `rustfft`)，更新 `WaveformPayload` 結構。
    * 前端 (`visualizer.js`) 繪製 FFT 長條圖，限制顯示範圍至約 10kHz 並採用多彩漸層。
### 2. ADSR 動畫與鍵盤輸入整合
    * 為 `\` 鍵新增 MIDI note 對應。
    * 實作 `EnvelopeManager` 的 `startHold`/`endHold` 模式，使 PC 鍵盤長按音符時 ADSR 光點無限期停留在 Sustain
階段，直到放開按鍵才進入 Release。
    * `KeyboardController` 已更新以同步觸發 `EnvelopeManager` 的 `triggerStart`/`triggerEnd`。
### 3. 對齊 HarmoNyx (#nyx) 輔助說明系統
    * 成功複製 HarmoNyx 的 HTML 說明文件至 WaveCode 的 `resources/docs/`。
    * 實作 `UIUtils.updateVisualHelp`，支援側邊面板顯示內部 HTML 說明。
    * 更新 `MDIManager` 以正確監聽積木選取事件，觸發說明顯示。
    * 在 `main.js` 註冊右鍵選單的「說明」選項。
    * 為「定義樂器」、「ADSR」、「濾鏡」積木添加 `helpUrl` 屬性。

