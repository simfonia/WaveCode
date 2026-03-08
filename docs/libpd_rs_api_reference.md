# libpd-rs 0.1.10 API 參考手冊 (WaveCode 實戰版)

由於 `libpd-rs` 0.1.x 版本與現代 0.3.x 版本 API 差異較大，且線上文件不穩定，本手冊透過直接分析 `C:\Users\simfonia\.cargo\registry\src\index.crates.io-1949cf8c6b5b557f\libpd-rs-0.1.10` 源碼彙整而成。

---

## 1. 核心架構
- **底層性質**：`libpd` 本質上是 C 語言寫的單例 (Singleton)，因此 Rust 封裝層主要透過 `PdGlobal` 結構體來管理生命週期。
- **執行緒安全**：音訊回調執行緒與主執行緒同時存取 `libpd` 時，必須使用 `Arc<Mutex<PdGlobal>>` 進行保護。

---

## 2. 初始化與配置 (convenience 模組)

### 初始化引擎
```rust
use libpd_rs::convenience::PdGlobal;

// 參數：(輸入聲道, 輸出聲道, 採樣率)
// 回傳：Result<PdGlobal, Box<dyn Error>>
let mut pd_instance = PdGlobal::init_and_configure(0, 2, 44100)?;
```

### 計算 Ticks
在音訊回調中，需要將緩衝區長度轉換為 PD 的 Ticks (1 tick = 64 samples)。
```rust
use libpd_rs::convenience::calculate_ticks;

let ticks = calculate_ticks(channels, data.len() as i32);
```

---

## 3. Patch 檔案管理

### 開啟 Patch
**注意**：0.1.10 版的 `PdGlobal::open_patch` 僅接受**一個參數**（完整路徑）。
```rust
pd_instance.open_patch("path/to/engine.pd")?;
```

### 關閉 Patch
```rust
pd_instance.close_patch()?;
```

---

## 4. 音訊處理 (process 模組)

### DSP 開關
```rust
pd_instance.activate_audio(true)?;  // 開啟
pd_instance.activate_audio(false)?; // 關閉
```

### 處理音訊緩衝區
在 `cpal` 或其他音訊驅動的回調函式中呼叫。
```rust
// 參數：(ticks, 輸入緩衝區, 輸出緩衝區)
// 注意：即使沒有輸入，也要傳入空切片 &[]
libpd_rs::process::process_float(ticks, &[], data);
```

---

## 5. 訊息通訊 (send 模組)

### 發送數值 (Float)
這是最常用的指令，用於控制頻率、音量等參數。
```rust
// 參數：(接收者名稱, 數值)
libpd_rs::send::send_float_to("freq", 440.0)?;
```

### 發送 Bang (觸發)
```rust
libpd_rs::send::send_bang_to("trigger_name")?;
```

### 發送列表 (List)
```rust
// 尚未在 MVP 使用，但格式如下：
libpd_rs::send::send_list_to("receiver", &[1.0, 2.0, 3.0])?;
```

---

## 6. 重要路徑提示
在開發環境下（`cargo tauri dev`），工作目錄預設為 `src-tauri`。
若要讀取根目錄資源，建議使用以下偵測邏輯：
```rust
let mut patch_path = std::env::current_dir()?;
if patch_path.ends_with("src-tauri") {
    patch_path.pop(); // 回到專案根目錄
}
patch_path.push("resources");
patch_path.push("engine.pd");
```

---

## 7. 故障排除 (Troubleshooting)
- **Error: unresolved import `PdHandle`**：0.1.10 版已移除 `PdHandle`，改用 `PdGlobal`。
- **Error: cannot be sent between threads safely**：確保 `AudioEngine` 結構體實作了 `unsafe impl Send` 與 `unsafe impl Sync`。
- **雜音或低頻嗡鳴**：在停止時，除了 `activate_audio(false)`，必須手動將音訊緩衝區清零（`sample = 0.0`）。
