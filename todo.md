# WaveCode 專案任務清單 (TODO)

## 核心引擎 (Engine)
- [x] 整合 Web Audio API 複音架構 (Polyphony)。
- [x] 實作 Master Bus 主輸出總線。
- [x] 實作精確的 `playbackTime` 排程系統。
- [x] 實作樂器參數即時調變 (Real-time Modulation)。
- [x] 實作取樣器 (Sampler) 資源載入流程。
- [x] 修復範例選單與開檔/切換分頁時的樂器名稱顯示。
- [x] 移植#nyx演奏積木群 (拍數/力度/和弦整合)。
- [x] 實作多軌並行 (Multi-track) 數據隔離與獨立排程。
- [ ] 撰寫側邊面板各分類的 HTML 說明文件 (進行中：已完成 melody)。
- [ ] 實作錄音與 WAV 匯出功能。
- [ ] 實作取樣庫管理器與預覽按鈕。

## 硬體整合 (Hardware)
- [x] 實作 Rust 序列埠 (Serial) 讀取與推送。
- [x] 實作 `math_map` 映射積木與邊緣偵測邏輯。
- [x] 驗證 LDR 光控哇哇音 (Wah-wah) 實體範例。

## UI/UX 強化
- [x] 實作 MDI 多分頁管理系統。
- [x] 增強積木搜尋引擎 (支援中文、影子積木、圓角發光樣式)。
- [x] 修正開檔即 Dirty 的時序問題。

## 部署與文件 (DevOps)
- [x] 修正 Tauri 打包配置 (Config/Cargo)。
- [x] 整合 Release 版開發者工具開啟機制。
- [x] 確認獨立執行檔打包流程。

---
*最後更新：2026-04-09 18:00*
