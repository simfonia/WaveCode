# WaveCode 專案任務清單 (TODO)

## 核心引擎 (Engine)
- [x] 整合 Web Audio API 複音架構 (Polyphony)。
- [x] 實作 Master Bus 主輸出總線。
- [x] 實作精確的 `playbackTime` 排程系統。
- [x] 實作樂器參數即時調變 (Real-time Modulation)。
- [ ] 實作取樣器 (Sampler) 資源載入流程。

## 視覺與介面 (UI/UX)
- [x] 完成「音訊腳本 (Audio DSL)」視覺美化。
- [x] 實作範例清單橫向展開選單。
- [x] 範例清單 'General' 分類排序優化。
- [ ] 撰寫側邊面板各分類的 HTML 說明文件。
- [ ] 實作取樣庫管理器與預覽按鈕。

## 硬體整合 (Hardware)
- [x] 實作 Rust 序列埠 (Serial) 讀取與推送。
- [x] 實作 `math_map` 映射積木與邊緣偵測邏輯。
- [x] 驗證 LDR 光控哇哇音 (Wah-wah) 實體範例。

## 部署與文件 (DevOps)
- [x] 修正 Tauri 打包配置 (Config/Cargo)。
- [x] 整合 Release 版開發者工具開啟機制。
- [x] 確認獨立執行檔打包流程。

---
*最後更新：2026-04-07 18:30*
