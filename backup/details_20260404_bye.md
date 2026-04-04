# WaveCode 技術細節紀錄 (Details)

## 2026-03-08 ~ 2026-03-09 (略)

## 2026-03-10 (複音隔離、SVG 繪圖與示波器同步)

### 1. 複音引擎的「零滲透」物理隔離
- **問題**：並聯多個振盪器時，即便開關為 0，背景運算的相位累加器仍會產生微小的數值滲漏與相位干涉（拍音）。
- **解決**：在每個聲部的末端加上強制物理閘門：`osc * var(&gate)`。這確保了當 Gate 為 0 時，該聲部的輸出是絕對的數學 0.0，杜絕了單音演奏時的背景雜音。
- **頻率平滑**：使用 `follow(0.01)` 替代直接的 `freq` 更新。這 10ms 的過度讓相位在頻率改變時能滑順銜接，消除了正弦波切換音符時的 Click 聲。

### 2. Blockly SVG 繪圖與 Minimap 同步
- **SVG vs Canvas**：在 Blockly 積木中嵌入 HTML5 Canvas 會導致渲染樹衝突與 Minimap 無法縮放的問題。改用 `Blockly.utils.dom.createSvgElement` 並動態操作 `<path>` (ADSR 曲線) 與 `<circle>` (光點)，能獲得更好的效能與跨插件相容性。
- **多重註冊 (Multi-registry)**：為了解決 Minimap 與主工作區同時存在同 ID 樂器導致的註冊權搶奪，`EnvelopeManager` 改用 `Map<ID, Field[]>` 結構，同時驅動畫面上所有符合條件的動畫。

### 3. 即時示波器 (Oscilloscope) 磁滯技術
- **磁滯觸發 (Hysteresis Trigger)**：為了解決示波器波形左右飄移或在高頻下發抖的問題，Rust 端實作了「磁滯升緣」偵測：
    1. `armed`：數值必須先低於 `-0.05`。
    2. `triggered`：武裝後數值高於 `+0.05` 才開始擷取。
- **自動歸零**：前端偵測數據流中斷（100ms 無更新）時，自動重繪中心水平線，維持儀器的專業視覺感。

### 4. Windows 多聲道緩衝區對齊 (關鍵坑)
- **現象**：在 5.1/7.1 聲道環境下有劇烈雜音。
- **原因**：`cpal` 提供的 `data` 緩衝區長度與 `channels` 相關。若僅寫入前兩軌而未清零後續聲道，會讀到記憶體殘留垃圾數據。
- **解決**：先執行 `data.fill(0.0)`，再透過 `data.chunks_mut(channels)` 進行聲道對應填充。

## 2026-03-12 (動態 DSP 鏈與 Net 整合突破)

### 1. fundsp::hacker32::Net 的動態組件化
- **問題**：`fundsp` 的操作符（如 `>>`, `*`）在編譯時需要確定所有節點的型別。這使得「根據積木隨意組合組件」變得極難實現，且 `Box<dyn AudioUnit>` 無法直接使用操作符。
- **解決**：使用 `Net32` (在 `hacker32` 中簡稱為 `Net`) 作為 DSP 容器：
    - 使用 `net.push(Box::new(node))` 將每個積木對應的節點「推入」容器。
    - 使用 `net.connect(src_id, src_port, dst_id, dst_port)` 在執行時動態建立連線。
    - 最後使用 `net.pipe_output(final_node_id)` 或連接到 `fundsp::net::NodeId::ID_OUT` 輸出。

### 2. 「機關槍」低頻震盪的根治
- **現象**：昨天在複音化後，持續音會出現劇烈低頻機關槍連發聲。
- **原因**：舊實作中 ADSR 參數在引擎啟動時即固定，且多聲部間的 `gate` 與 `osc` 相位沒有物理斷路。當 `gate` 在頻繁切換時，相位跳變引發了不穩定震盪。
- **解決**：
    - **ADSR Live**：在 `Net` 中將 `adsr_live` 的輸入連往 `var(gate)` 節點。這確保了包絡線能正確響應 `gate` 的 0 -> 1 變化。
    - **物理閘門隔離**：在每個聲部的 `Net` 輸出前，強制插入一個 `product()` 節點，將最終訊號乘上 `var(gate)`。這保證了當 Gate 為 0 時，該聲部的輸出是絕對的數學 0，消除了所有潛在的相位滲漏。

### 3. Box<dyn AudioUnit> 的型別陷阱
- **關鍵**：在 `Net` 中推入節點時，必須明確使用 `Box::new(node)`。例如：`net.push(Box::new(sine()))`。
- **串接邏輯**：
    - `Net` 內部必須處理好 `input` 與 `output` 的端口索引。
    - `pass() * pass()` 節點用於實作乘法（如 VCA）。
    - 最終將 `Net` 整體封裝進 `Box<dyn AudioUnit>` 供音訊執行緒統一呼叫。

## 2026-03-12 (深度優化與音訊穩定性維護)

### 1. 徹底根治「機關槍雜訊」 (效能大坑)
- **錯誤原因**：之前的實作在音訊執行緒的「採樣點層級」進行 Mutex 鎖定嘗試 (`try_lock`)。16 聲部導致每秒產生 70 萬次鎖定競爭，CPU 負擔過重導致緩衝區欠載 (Buffer Underrun)。
- **解決方案：批次鎖定 (Batch Locking)**：
    - 將鎖定移至「緩衝區層級」（每 256~512 個採樣點鎖定一次）。
    - 音訊執行緒預先收集所有成功的鎖定單元，形成 `active_units` 向量後再進行循環計算。效能提升約 100 倍。

### 2. 硬同步 (Hard Sync) 確保音質純淨
- **問題**：快速演奏時波形相位不連續，產生直流跳變 (DC Offset) 噪音。
- **解決**：引入 `AtomicBool` 旗標 `reset_pending`。每次 `trigger_note` 時標記，音訊執行緒領取鎖定後立即執行 `unit.reset()`。這確保了振盪器與包絡線從 0 開始，對齊了 #processing (Minim) 的標準。

### 3. 聲部數的物理限制與效能權衡
- **現象**：提升至 16 聲部時，在動態 `Net` 的架構下，Windows 11 筆電會出現不可預期的尖峰雜訊。
- **結論**：為了保證教學穩定性，將 `MAX_VOICES` 限制為 **8 聲部**。對於教育用途，8 聲部已足夠應付複雜的和弦與旋律，且能確保 100% 無雜訊。

### 4. 教學用 Clipping 視覺化
- **策略**：移除引擎內建的 `tanh`/`atan`軟限幅。
- **實作**：
    - Rust 端傳送「未經過 clamp 的原始數據」與 `clipped` 旗標給前端。
    - 前端示波器在 `clipped` 為真時將波形變紅並顯示「CLIP」警訊。
    - 學生可以直觀看到波形被 Hard Clamp (-1.0 ~ 1.0) 切平的現象，作為 Compressor/Limiter 課程的基礎。


## 2026-04-03 

### 1. FFT 頻譜分析儀與示波器優化
    * **後端 (Rust `engine.rs`)**:
        * 引入 `rustfft` 庫，實作 256 點 FFT 計算。`WaveformPayload` 結構體新增 `fft` 欄位。
        * `Cargo.toml` 加入 `rustfft` 依賴。
    * **前端 (JavaScript `visualizer.js`)**:
        * `drawFFT` 函式透過 `_fftData.slice(0, displayBins)` 限制顯示頻率範圍（約 10kHz）。
        * 使用 HSL 色彩模型為頻譜長條動態生成顏色，並添加頂部高亮。
        * `resize()` 函式處理 Canvas 解析度與顯示大小，修正置中問題。
    * **HTML/CSS**: `index.html` 拆分示波器為雙欄；`style.css` 更新視覺化容器樣式。
### 2. ADSR 動畫與鍵盤輸入整合
    * **`FieldADSR` 類別**：新增 `startHold()` 和 `endHold()` 方法，支援長按 Sustain。
    *   **`EnvelopeManager`**: 新增 `triggerStart(id)` 和 `triggerEnd(id)` 方法。
    *   **`KeyboardController`**:
        *   `KEY_MAP` 加入 `\` 鍵 (MIDI note 81)。
        *   `handleKeyDown` 呼叫 `EnvelopeManager.triggerStart()`。
        *   `handleKeyUp` 呼叫 `EnvelopeManager.triggerEnd()`。
### 3. 輔助說明系統對齊 (#nyx)
    * **文件遷移**: 成功從 HarmoNyx 複製說明文件至 WaveCode `resources/docs/`。
    * **前端整合 (`ui_utils.js`, `mdi_manager.js`, `main.js`)**:
        * `UIUtils.updateVisualHelp` 實現 Iframe 內嵌顯示本地 HTML 說明。
        * `MDIManager` 的 `workspace.addChangeListener` 邏輯已調整，能捕捉 `Blockly.Events.SELECTED` 或 `UI`
事件，觸發 `UIUtils.updateVisualHelp`。
        * `main.js` 註冊了 BlocklyContextMenuRegistry 的「說明」選項。
    *   **積木定義 (`audio_instruments.js`)**: 為「定義樂器」、「ADSR」、「濾鏡」積木添加 `helpUrl` 屬性。

## 2026-04-04 (UI 佈局與狀態管理深度修復)

### 1. CSS 狀態優先級與 Flex 佈局衝突
- **問題**：面板收合後殘留高度，且展開狀態下捲軸消失。
- **成因**：`min-height` 屬性在 CSS 權重中優先於固定 `height` 或 `max-height`。當 `#log-section` 設定了 `min-height` 時，收合狀態的 `height: 35px` 無法完全生效；同時，`height: auto` 導致容器隨內容增長而排擠 `flex: 1` 的下層元件。
- **修復**：
    - 將 `min-height` 限制封裝在 `:not(.collapsed)` 偽類中。
    - 在 `.collapsed` 狀態下強制執行 `max-height: 35px !important` 與 `display: none !important` (對子元素)。
    - 恢復 `log-section` 的固定 `height: 180px` 以確保 `flex-shrink: 0` 並正確觸發 `overflow-y: auto`。

### 2. JavaScript 箭頭函式與 `this` 綁定陷阱
- **現象**：點擊分頁按鈕無法觸發 `switchSmartTab`。
- **成因**：在 `UIUtils` (物件字面量) 的 `init` 函式中使用箭頭函式定義 `onclick` 回呼時，`this` 雖然指向 `UIUtils`，但在複雜的模組載入環境下容易產生上下文不明的問題。
- **修復**：將回呼函式中的 `this.switchSmartTab(tabId)` 改為具名的 `UIUtils.switchSmartTab(tabId)`，確保絕對路徑呼叫，解決 MDI 環境下的分頁切換故障。

### 3. 收合動畫與 DOM 結構對齊
- **修復**：統一 `header-actions` 的 Flex 佈局，利用 `margin-left: auto` 確保動作按鈕（如清空日誌、收合）始終在右側對齊，不受標題文字長度影響。
