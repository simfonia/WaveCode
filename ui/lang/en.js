(function (Blockly) {
  Blockly.Msg = Blockly.Msg || {};
  Object.assign(Blockly.Msg, {
    // UI
    "WAVECODE_RUN": "Run Code",
    "WAVECODE_STOP": "Stop Audio",
    
    // Categories
    "CAT_AUDIO": "Audio",
    "CAT_LOGIC": "Logic",
    "CAT_LOOPS": "Loops",
    "CAT_MATH": "Math",
    "CAT_VARIABLES": "Variables",
    "CAT_FUNCTIONS": "Functions",

    // Audio Blocks
    "AUDIO_PLAY_SINE": "playSine( frequency: %1 )",
    "AUDIO_PLAY_SINE_TOOLTIP": "Generates a sine wave with specified frequency.",

    // Core Logic
    "VARIABLES_SET": "let %1 = %2",
    "LOGIC_IF": "if ( %1 )",
    "CONTROLS_FOR": "for ( let %1 = %2; %1 <= %3; %1 += %4 )"
  });
})(Blockly);
