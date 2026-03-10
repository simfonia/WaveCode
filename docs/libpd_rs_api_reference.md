# libpd-rs 0.2.0 全方位 API 參考手冊 (穩定版)

WaveCode 核心已升級至 `libpd-rs 0.2.0`。本文件基於原始碼實測，記錄了所有已使用及未來計畫使用的 API 規格。

## 1. 引擎生命週期與設定 (functions)
- **`init()`**: 引擎基礎初始化。
- **`initialize_audio(in, out, rate)`**: 配置音訊通道與取樣率。
- **`open_patch(path)`**: 開啟指定的 `.pd` 檔案。傳回 `PatchFileHandle`。
- **`close_patch(handle)`**: 關閉已開啟的 Patch。
- **`get_dollar_zero(handle)`**: 取得該 Patch 的實例 ID (用於處理 `$0` 變數)。
- **`add_to_search_paths(path)`**: 加入抽象物件與外部物件的搜尋路徑。
- **`block_size()`**: 取得 Pd 的運算單位，預設為 `64`。

## 2. DSP 與處理 (functions::util & process)
- **`util::dsp_on()`**: 啟動音訊運算。
- **`util::dsp_off()`**: 停止音訊運算。
- **`process::process_float(ticks, in_buf, out_buf)`**: 核心音訊處理回調。

## 3. 訊息通訊 (functions::send)
- **`send::send_float_to(receiver, value)`**: 發送單一數值。
- **`send::send_message_to(receiver, msg, args)`**: 發送帶參數的訊息 (List)。
  - `args`: `&[Atom]`。
- **Atom 轉換**:
  - `Atom::from(f32)`
  - `Atom::from(String)`

## 4. Array 操作 (functions::array) - 計畫用於示波器
- **`array_size(name)`**: 取得 Pd 陣列的長度。
- **`resize_array(name, size)`**: 調整陣列長度。
- **`read_float_array_from(name, offset, dest_buf, len)`**: 從 Pd 陣列讀取資料到 Rust。
- **`write_float_array_to(name, offset, src_buf, len)`**: 從 Rust 寫入資料到 Pd 陣列。

---
*更新日期：2026-03-09 (對應版本 0.2.0)*
