# WaveCode (下一代音訊編程教育平台)

WaveCode 是一個獨立的、高效能的原生 IDE，讓使用者透過視覺化積木（Blockly）學習合成器原理、數位音訊處理（DSP）與程式邏輯。

## 核心願景
- **開箱即用**：擺脫對 VS Code、Java 或 Processing 的依賴，單一執行檔即可運行。
- **極致效能**：利用 Rust 語言與 libpd 引擎，達成專業級的低延遲與穩定性。
- **直觀教學**：將抽象的聲學原理（波形疊加、濾波、ADSR）轉化為可觸摸的積木與即時波形反饋。

## 技術棧 (Technical Stack)
- **IDE 框架**：[Tauri](https://tauri.app/) (Rust 后端 + Webview 前端)
- **音訊引擎**：[libpd](https://github.com/libpd/libpd) (Pure Data 嵌入式引擎)
- **開發語言**：Rust (Backend), JavaScript (Frontend)
- **邏輯控制**：Blockly (產出指令流)
- **視覺化**：原生 Rust 繪圖 (Raylib 或 wgpu) 結合 HTML5 Canvas

## 目前進度
- [ ] 專案初始化與 MVP 規畫 (進行中)
