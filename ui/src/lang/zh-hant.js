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
    "CAT_AUDIO_CMD": "音訊指令",
    "CAT_LOGIC": "邏輯",
    "CAT_LOOPS": "迴圈",
    "CAT_MATH": "數學",
    "CAT_VARIABLES": "變數",
    "CAT_FUNCTIONS": "函數",

    // 音訊電路 (火車模式)
    "AUDIO_OSCILLATOR_TRAIN": "振盪器 (ID: %1) 波形 %2 ❯ 傳送到 %3",
    "AUDIO_OSCILLATOR_TOOLTIP": "音訊產生的起點。ID 命名請使用英文字母、數字與下底線，不含空格並區分大小寫（如：osc1）。必須連往主輸出才能發聲。",
    "AUDIO_DAC_TRAIN": "主輸出 (DAC)",
    "AUDIO_DAC_TOOLTIP": "音訊傳送的終點，將聲音送往喇叭。",

    // 音訊指令
    "AUDIO_SET_FREQ": "設定控制 %1 的頻率為 %2 Hz",
    "AUDIO_SET_FREQ_TOOLTIP": "設定指定 ID 振盪器的頻率。請確保 ID 與電路區定義的完全一致（區分大小寫）。",
    "AUDIO_NOTE": "音符 %1",
    "AUDIO_NOTE_TOOLTIP": "選取標準音樂音符並轉換為頻率。",
    "AUDIO_WAIT": "等待 %1 毫秒 (ms)",
    "AUDIO_WAIT_TOOLTIP": "暫停程式執行一段時間。",
    "AUDIO_STOP": "stopAudio()",
    "AUDIO_STOP_TOOLTIP": "立即停止所有發出的聲音。",

    "AUDIO_WAVE_SINE": "正弦波",
    "AUDIO_WAVE_SAW": "鋸齒波",
    "AUDIO_WAVE_SQUARE": "方波",
    "AUDIO_WAVE_TRI": "三角波"
  });
})(Blockly);
