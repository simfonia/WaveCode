(function (Blockly) {
  Blockly.Msg = Blockly.Msg || {};
  Object.assign(Blockly.Msg, {
    "WAVECODE_RUN": "執行程式 (Ctrl+Enter)",
    "WAVECODE_STOP": "停止音訊 (Esc)",
    "WAVECODE_NEW": "新建專案",
    "WAVECODE_EXAMPLES": "範例專案",
    "WAVECODE_OPEN": "開啟專案",
    "WAVECODE_SAVE": "儲存專案",
    "WAVECODE_SETTINGS": "系統設定",
    "WAVECODE_RESTART_AUDIO": "重啟音訊引擎",
    "WAVECODE_UNTITLED": "未命名專案",
    "WAVECODE_UPDATE_CHECK": "正在檢查更新...",
    "WAVECODE_UPDATE_AVAILABLE": "發現新版本！點擊下載更新",
    "WAVECODE_UPDATE_DOWNLOADING": "正在下載更新...",
    "WAVECODE_UPDATE_READY": "更新已就緒，點擊重啟套用",
    "WAVECODE_UPDATE_NONE": "目前已是最新版本",
    
    // UI 標籤
    "WAVECODE_OSCILLOSCOPE": "示波器",
    "WAVECODE_HELP_TITLE": "輔助說明",
    "WAVECODE_TAB_CODE": "音訊腳本 (Audio DSL)",
    "WAVECODE_STAGE_LOG": "系統日誌",
    "WAVECODE_HELP_HINT": "點擊積木以查看說明",
    "WAVECODE_LANG_SETTING": "語言設定",
    "WAVECODE_SCROLL_OPTIONS": "自動捲動功能 (Scroll Options)",
    
    // 通用訊息
    "MSG_WARNING": "警告",
    "MSG_UNSAVED_CHANGES": "目前的變更尚未儲存，確定要放棄嗎？",
    "MSG_NEW_PROJECT_CONFIRM": "確定要建立新專案嗎？這將清除目前所有積木。",
    
    // 分類名稱
    "CAT_AUDIO_TRAIN": "音訊電路",
    "CAT_AUDIO_CMD": "演奏指令 (舊)",
    "CAT_SYSTEM": "系統與工具",
    "CAT_SERIAL": "序列埠通訊",
    "CAT_LOGIC": "邏輯判斷",
    "CAT_LOOPS": "迴圈控制",
    "CAT_MATH": "數學運算",
    "CAT_TEXT": "文字處理",
    "CAT_VARIABLES": "變數管理",
    "CAT_FUNCTIONS": "自訂函數",
    "CAT_SOUND_SOURCES": "建立音源",
    "CAT_INSTRUMENT_CONTROL": "樂器控制",
    "CAT_EFFECTS": "音訊效果",
    "CAT_PERFORMANCE": "音樂演奏",
    "CAT_MASTER": "主輸出控制",

    // 樂器定義 (C 型帽子模式)
    "AUDIO_DEFINE_INSTRUMENT": "定義樂器 %1",
    "AUDIO_DEFINE_MASTER": "主輸出控制 (Master Out)",
    "AUDIO_MASTER_TOOLTIP": "定義全域主輸出的處理鏈。您可以在此加入 Limiter 或 Compressor 來防止複音合奏時產生的 Clipping (破音)。",
    "AUDIO_INSTRUMENT_CHAIN": "%1",
    "AUDIO_INSTRUMENT_TOOLTIP": "在此定義樂器的音訊鏈。您可以放入振盪器、ADSR、濾過器等組件。這是一個定義區塊，演奏指令會引用此處的設定。",

    // 樂器組件
    "AUDIO_COMP_OSC": "振盪器 %1",
    "AUDIO_COMP_SAMPLER": "取樣器 %1",
    "AUDIO_CREATE_ADDITIVE_SYNTH": "加法合成器",
    "AUDIO_CREATE_ADDITIVE_SYNTH_CONTAINER": "加法合成器 (分音列表)",
    "AUDIO_CREATE_ADDITIVE_SYNTH_ITEM": "分音 (Partial)",
    "AUDIO_CREATE_ADDITIVE_SYNTH_TOOLTIP": "建立一個高彈性的加法合成器，您可以自由設定每個分音的波形、頻率比例與音量比例。",
    
    // 鍵盤與系統訊息
    "WAVECODE_KEYBOARD_SWITCH": "Keyboard: 已切換至樂器 [%1]",
    "WAVECODE_KEYBOARD_NO_INSTRUMENT": "目前工作區尚未定義任何樂器 (請使用「定義樂器」積木)",
    "WAVECODE_TRANSPOSE_MSG": "移調: %1 (%2 八度)",
    "AUDIO_WAVE": "波形",
    "AUDIO_COMP_ADSR": "ADSR 包絡線 %1 A %2 D %3 S %4 R %5",
    "AUDIO_COMP_FILTER": "濾波器 %1 頻率 %2 Q值 %3",
    "AUDIO_COMP_VOLUME": "音量 %1 %",

    // 效果器 (拆分版)
    "AUDIO_EFFECT_FILTER": "濾波器 %1 頻率 %2 Q值 %3",
    "AUDIO_EFFECT_DELAY": "延遲時間 %1 秒 (Feedback %2)",
    "AUDIO_EFFECT_BITCRUSH": "位元粉碎 (BitCrush) %1 Bits",
    "AUDIO_EFFECT_DISTORTION": "失真 (Distortion) %1",
    "AUDIO_EFFECT_COMPRESSOR": "壓縮器 (Compressor) 閾值 %1 比率 %2 啟動 %3 釋放 %4 增益 %5",
    "AUDIO_EFFECT_REVERB": "殘響 (Reverb) 時間 %1 秒 衰減 %2 混合 %3",

    "AUDIO_FILTER_TOOLTIP": "使用濾波器過濾特定頻率（低通/高通/帶通）。",
    "AUDIO_DELAY_TOOLTIP": "產生回聲延遲效果。",
    "AUDIO_BITCRUSH_TOOLTIP": "降低位元深度，產生復古的數位失真感。",
    "AUDIO_DISTORTION_TOOLTIP": "產生類比風格的飽和失真效果。",
    "AUDIO_COMPRESSOR_TOOLTIP": "動態壓縮音訊，使大聲變小、小聲變大，平衡動態。",
    "AUDIO_REVERB_TOOLTIP": "產生空間殘響效果，模擬室內空間感。",

    "AUDIO_SET_EFFECT_PARAM": "樂器 %1 效果器 %2 參數 %3 數值 %4",
    "AUDIO_SET_EFFECT_PARAM_TOOLTIP": "動態更新正在發聲的樂器參數。這對於使用外部感測器（如光敏電阻、滑桿）進行實時控制非常有用。",

    "AUDIO_FILTER_TYPE": "濾波器",

    // 組件選項
    "AUDIO_WAVE_SINE": "正弦波",
    "AUDIO_WAVE_SAW": "鋸齒波",
    "AUDIO_WAVE_SQUARE": "方波",
    "AUDIO_WAVE_TRI": "三角波",
    "AUDIO_FILTER_LP": "低通",
    "AUDIO_FILTER_HP": "高通",

    // 演奏指令
    "AUDIO_PLAY_NOTE": "演奏音符 頻率/音名 %1 持續 %2 毫秒 樂器 %3",
    "AUDIO_PLAY_NOTE_ASYNC": "觸發音符 頻率/音名 %1 持續 %2 毫秒 樂器 %3 (不等待)",
    "AUDIO_PLAY_NOTE_TOOLTIP": "演奏一個音符並等待其持續時間結束。支援輸入數字頻率（如 440）或音名文字（如 'C4', 'E#5'）。",
    "AUDIO_PLAY_NOTE_ASYNC_TOOLTIP": "觸發一個音符並立即執行下一個積木。支援輸入數字頻率或音名文字。",
    "AUDIO_NOTE": "音名 %1 八度 %2",
    "AUDIO_NOTE_TOOLTIP": "選取標準音樂音符並轉換為頻率。",
    "AUDIO_WAIT": "等待 %1 毫秒 (ms)",
    "AUDIO_WAIT_TOOLTIP": "暫停程式執行一段時間。",
    "AUDIO_STOP": "全部靜音",
    "AUDIO_STOP_TOOLTIP": "立即關閉所有聲部的閘門並停止聲音。",
    "AUDIO_PERFORM_ONCE": "演奏 %1",
    "AUDIO_PERFORM_ONCE_TOOLTIP": "在背景執行一次內部的演奏積木，適合用於單次表演。多個演奏積木可同時進行多聲部合奏。",

    "AUDIO_SERIAL_DATA_RECEIVED_TITLE": "當序列埠收到資料",
    "AUDIO_SERIAL_DATA_RECEIVED_VAR": "存入變數 %1",
    "AUDIO_SERIAL_DATA_RECEIVED_TOOLTIP": "當序列埠收到以換行符號結尾的資料時，自動執行內部的程式碼。",
    "AUDIO_SERIAL_INIT": "連接序列埠 %1 波特率 %2",
    "AUDIO_SERIAL_INIT_TOOLTIP": "掃描並連接實體裝置 (如 Arduino)。請確保裝置已插入且波特率設定正確。",
    "AUDIO_SERIAL_CHECK_TTP": "當狀態 %1 的第 %2 個按鍵被按下",
    "AUDIO_SERIAL_CHECK_TTP_TOOLTIP": "解析 TTP229 的 16-bit 狀態字串。僅在該按鍵從「放開」變為「按下」的瞬間回傳 True (邊緣偵測)。",

    "AUDIO_SERIAL_GET_FIELD_TITLE": "序列埠欄位數值 [前綴 %1]",
    "AUDIO_SERIAL_GET_FIELD_TOOLTIP": "從序列埠資料中解析並抓取 Prefix:Value 格式的數值 (例如 LDR:512)。",

    "AUDIO_SET_BPM": "設定演奏速度 (BPM) %1",
    "AUDIO_SET_BPM_TOOLTIP": "設定全域的演奏速度。這會影響「演奏旋律」中的節拍長度。",
    "AUDIO_SELECT_INSTRUMENT": "選取當前樂器 %1",
    "AUDIO_SELECT_INSTRUMENT_TOOLTIP": "設定後續演奏指令若未指定樂器時所使用的預設樂器。",
    "AUDIO_PLAY_MELODY": "使用樂器 %1",
    "AUDIO_PLAY_MELODY_SCORE": "播放旋律 %1",
    "AUDIO_PLAY_MELODY_TOOLTIP": "依序演奏一段旋律。格式範例: C4Q (四分音符), E4H (二分音符), G4W (全音符)。",

    "AUDIO_DEFINE_CHORD": "定義和弦 名稱 %1 音符 (用逗號隔開) %2",
    "AUDIO_DEFINE_CHORD_TOOLTIP": "將一組音符定義為一個名稱，稍後可透過「演奏和弦」積木呼叫。音符格式可為 C4, E4, G4 等。",
    "AUDIO_PLAY_CHORD": "演奏和弦 %1 長度 %2 毫秒 使用樂器 %3",
    "AUDIO_PLAY_CHORD_TOOLTIP": "同時演奏已定義和弦中的所有音符。這是一個同步指令，會等待長度結束才繼續執行下一個積木。",

    "AUDIO_WAIT_MUSICAL": "等待 %1 %2",
    "AUDIO_WAIT_MUSICAL_UNIT_BEATS": "拍 (Beats)",
    "AUDIO_WAIT_MUSICAL_UNIT_MEASURES": "小節 (Measures)",
    "AUDIO_WAIT_MUSICAL_UNIT_S": "秒 (Seconds)",
    "AUDIO_WAIT_MUSICAL_UNIT_MS": "毫秒 (ms)",
    "AUDIO_WAIT_MUSICAL_TOOLTIP": "音樂性等待。系統會自動根據 BPM 計算精確的排程時間，確保背景音樂節奏穩定。",

    "AUDIO_COUNT_IN": "預備拍：播放 %1 小節，每小節 %2 拍 (音量 %3)",
    "AUDIO_COUNT_IN_TOOLTIP": "在正式演奏前播放 Click 聲。這會推遲所有背景音軌的起始時間，讓現場演奏者能預備起拍。",

    "AUDIO_LOOP": "背景循環執行 %1",
    "AUDIO_LOOP_TOOLTIP": "建立一個不斷重複的背景音軌（如鼓點或貝斯線）。多個循環積木可同時並行執行。",

    "AUDIO_RELEASE_NOTE": "釋放樂器 %1 的音符 %2",
    "AUDIO_RELEASE_NOTE_TOOLTIP": "手動停止特定音符的發聲（進入 ADSR 釋放階段）。適合在現場表演時精確控制長音的結束時機。",

    "AUDIO_RHYTHM_V2_HEADER": "進階序列器：第 %1 小節開始, 每小節 %2 拍, 解析度 %3",
    "AUDIO_RHYTHM_V2_TRACK": "音軌 %1 樂器 %2 音量 %3 和弦 %4 節奏 %5",
    "AUDIO_RHYTHM_V2_TOOLTIP": "多軌、跨小節的節奏序列器。支援自定義拍號（如 3/4, 7/8）與解析度。節奏格式：x (觸發), . (靜音), - (延音)。",

    "AUDIO_WAVE_SINE": "正弦波",
    "AUDIO_WAVE_SAW": "鋸齒波",
    "AUDIO_WAVE_SQUARE": "方波",
    "AUDIO_WAVE_TRI": "三角波",

    // 顏色定義 (對齊 #processing)
    "SOUND_SOURCES_HUE": "#016c8d",
    "INSTRUMENT_CONTROL_HUE": "#FF5722",
    "EFFECTS_HUE": "#8E44AD",
    "PERFORMANCE_HUE": "#E67E22",
    "SYSTEM_HUE": "#546e7a",
    "SERIAL_HUE": "#2c3e50",
    "LOGIC_HUE": "#b198de",
    "LOOPS_HUE": "#7fcd81",
    "MATH_HUE": "#5C68A6",
    "VARIABLES_HUE": "#ef9a9a",
    "FUNCTIONS_HUE": "#d22f73",
    "TEXT_HUE": "#6a8871",
    "WC_TEXT_PRINT": "列印 %1",
    "WC_TEXT_PRINT_TOOLTIP": "將訊息輸出至瀏覽器主控台 (F12)。",
    "WC_COMMENT": "註解 %1",
    "WC_COMMENT_TOOLTIP": "這是一段不會執行的文字說明，用來標記程式碼邏輯。"
  });
})(Blockly);
