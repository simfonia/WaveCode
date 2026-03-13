(function (Blockly) {
  Blockly.Msg = Blockly.Msg || {};
  Object.assign(Blockly.Msg, {
    "WAVECODE_RUN": "執行程式",
    "WAVECODE_STOP": "停止音訊",
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
    
    // 通用訊息
    "MSG_WARNING": "警告",
    "MSG_UNSAVED_CHANGES": "目前的變更尚未儲存，確定要放棄嗎？",
    "MSG_NEW_PROJECT_CONFIRM": "確定要建立新專案嗎？這將清除目前所有積木。",
    
    // 分類名稱
    "CAT_AUDIO_TRAIN": "音訊電路",
    "CAT_AUDIO_CMD": "演奏指令 (舊)",
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

    // 樂器定義 (C 型帽子模式)
    "AUDIO_DEFINE_INSTRUMENT": "定義樂器 %1",
    "AUDIO_INSTRUMENT_CHAIN": "%1",
    "AUDIO_INSTRUMENT_TOOLTIP": "在此定義樂器的音訊鏈。您可以放入振盪器、ADSR、濾波器等組件。這是一個定義區塊，演奏指令會引用此處的設定。",

    // 樂器組件
    "AUDIO_COMP_OSC": "振盪器 %1",
    "AUDIO_COMP_ADSR": "ADSR 包絡線 %1 A %2 D %3 S %4 R %5",
    "AUDIO_COMP_FILTER": "濾波器 %1 頻率 %2 Q值 %3",
    "AUDIO_COMP_VOLUME": "音量 %1 %",

    // 組件選項
    "AUDIO_WAVE_SINE": "正弦波",
    "AUDIO_WAVE_SAW": "鋸齒波",
    "AUDIO_WAVE_SQUARE": "方波",
    "AUDIO_WAVE_TRI": "三角波",
    "AUDIO_FILTER_LP": "低通",
    "AUDIO_FILTER_HP": "高通",

    // 音訊電路 (火車模式)
    "AUDIO_OSCILLATOR_TRAIN": "振盪器 (ID: %1) 波形 %2 ❯ 傳送到 %3",
    "AUDIO_OSCILLATOR_TOOLTIP": "音訊產生的起點。ID 命名請使用英文字母、數字與下底線，不含空格並區分大小寫（如：osc1）。必須連往主輸出才能發聲。",
    "AUDIO_DAC_TRAIN": "主輸出 (DAC)",
    "AUDIO_DAC_TOOLTIP": "音訊傳送的終點，將聲音送往喇叭。",

    // 演奏指令
    "AUDIO_PLAY_NOTE": "演奏音符 頻率 %1 持續 %2 毫秒 使用樂器 %3",
    "AUDIO_PLAY_NOTE_ASYNC": "觸發音符 頻率 %1 持續 %2 毫秒 使用樂器 %3 (不等待)",
    "AUDIO_PLAY_NOTE_TOOLTIP": "演奏一個音符並等待其持續時間結束才繼續執行下一個積木。",
    "AUDIO_PLAY_NOTE_ASYNC_TOOLTIP": "觸發一個音符並立即繼續執行下一個積木，可用於同時發出多個音符（如和弦）。",
    "AUDIO_NOTE": "音符 %1",
    "AUDIO_NOTE_TOOLTIP": "選取標準音樂音符並轉換為頻率。",
    "AUDIO_WAIT": "等待 %1 毫秒 (ms)",
    "AUDIO_WAIT_TOOLTIP": "暫停程式執行一段時間。",
    "AUDIO_STOP": "全部靜音",
    "AUDIO_STOP_TOOLTIP": "立即關閉所有聲部的閘門並停止聲音。",

    "AUDIO_WAVE_SINE": "正弦波",
    "AUDIO_WAVE_SAW": "鋸齒波",
    "AUDIO_WAVE_SQUARE": "方波",
    "AUDIO_WAVE_TRI": "三角波",

    // 顏色定義 (對齊 #processing)
    "SOUND_SOURCES_HUE": "#016c8d",
    "INSTRUMENT_CONTROL_HUE": "#FF5722",
    "EFFECTS_HUE": "#8E44AD",
    "PERFORMANCE_HUE": "#E67E22",
    "LOGIC_HUE": "#b198de",
    "LOOPS_HUE": "#7fcd81",
    "MATH_HUE": "#5C68A6",
    "VARIABLES_HUE": "#ef9a9a",
    "FUNCTIONS_HUE": "#d22f73",
    "TEXT_HUE": "#6a8871",
    "WC_TEXT_PRINT": "列印 %1",
    "WC_TEXT_PRINT_TOOLTIP": "將訊息輸出至瀏覽器主控台 (F12)。"
  });
})(Blockly);
