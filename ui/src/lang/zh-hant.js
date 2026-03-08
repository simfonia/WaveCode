(function (Blockly) {
  Blockly.Msg = Blockly.Msg || {};
  Object.assign(Blockly.Msg, {
    // 介面文字
    "WAVECODE_RUN": "執行程式",
    "WAVECODE_STOP": "停止音訊",
    "WAVECODE_NEW": "新建專案",
    "WAVECODE_EXAMPLES": "範例專案",
    "WAVECODE_OPEN": "開啟專案",
    "WAVECODE_SAVE": "儲存專案",
    "WAVECODE_SETTINGS": "系統設定",
    "WAVECODE_UPDATE_CHECK": "正在檢查更新...",
    "WAVECODE_UPDATE_AVAILABLE": "發現新版本！點擊更新",
    "WAVECODE_UPDATE_DOWNLOADING": "正在下載更新...",
    "WAVECODE_UPDATE_READY": "更新已就緒，重啟套用",
    
    // 分類名稱
    "CAT_AUDIO": "Audio",
    "CAT_LOGIC": "Logic",
    "CAT_LOOPS": "Loops",
    "CAT_MATH": "Math",
    "CAT_VARIABLES": "Variables",
    "CAT_FUNCTIONS": "Functions",

    // 音訊積木 (JS Style)
    "AUDIO_PLAY_SINE": "playSine( frequency: %1 )",
    "AUDIO_PLAY_SINE_TOOLTIP": "產生一個指定頻率的正弦波音訊。",
    "AUDIO_NOTE": "音符 %1",
    "AUDIO_NOTE_TOOLTIP": "選取標準音樂音符並轉換為頻率。",
    "AUDIO_WAIT": "等待 %1 毫秒 (ms)",
    "AUDIO_WAIT_TOOLTIP": "暫停程式執行一段時間。",
    "AUDIO_STOP": "stopAudio()",
    "AUDIO_STOP_TOOLTIP": "立即停止所有發出的聲音。",

    // 變數與邏輯 (對齊 JS 關鍵字)
    "VARIABLES_SET": "let %1 = %2",
    "LOGIC_IF": "if ( %1 )",
    "CONTROLS_FOR": "for ( let %1 = %2; %1 <= %3; %1 += %4 )"
  });
})(Blockly);
