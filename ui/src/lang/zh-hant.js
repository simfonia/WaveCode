(function (Blockly) {
  Blockly.Msg = Blockly.Msg || {};
  Object.assign(Blockly.Msg, {
    // 介面文字
    "WAVECODE_RUN": "執行程式",
    "WAVECODE_STOP": "停止音訊",
    
    // 分類名稱
    "CAT_AUDIO": "音訊處理 (Audio)",
    "CAT_LOGIC": "邏輯判斷 (Logic)",
    "CAT_LOOPS": "迴圈控制 (Loops)",
    "CAT_MATH": "數學運算 (Math)",
    "CAT_VARIABLES": "變數管理 (Variables)",
    "CAT_FUNCTIONS": "函式定義 (Functions)",

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
