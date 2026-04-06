(function (Blockly) {
  Blockly.Msg = Blockly.Msg || {};
  Object.assign(Blockly.Msg, {
    "WAVECODE_RUN": "Run Code (Ctrl+Enter)",
    "WAVECODE_STOP": "Stop Audio (Esc)",
    "WAVECODE_NEW": "New Project",
    "WAVECODE_EXAMPLES": "Examples",
    "WAVECODE_OPEN": "Open Project",
    "WAVECODE_SAVE": "Save Project",
    "WAVECODE_SETTINGS": "Settings",
    "WAVECODE_RESTART_AUDIO": "Restart Audio Engine",
    "WAVECODE_UNTITLED": "Untitled Project",
    "WAVECODE_UPDATE_CHECK": "Checking for updates...",
    "WAVECODE_UPDATE_AVAILABLE": "New version available!",
    "WAVECODE_UPDATE_DOWNLOADING": "Downloading update...",
    "WAVECODE_UPDATE_READY": "Update ready, click to restart",
    "WAVECODE_UPDATE_NONE": "Already up to date",
    
    // UI Labels
    "WAVECODE_OSCILLOSCOPE": "Oscilloscope",
    "WAVECODE_HELP_TITLE": "Help",
    "WAVECODE_TAB_CODE": "Live Code",
    "WAVECODE_STAGE_LOG": "Execution Log",
    "WAVECODE_HELP_HINT": "Click a block to see help",
    "WAVECODE_LANG_SETTING": "Language Setting",

    "MSG_WARNING": "Warning",
    "MSG_UNSAVED_CHANGES": "Current changes are not saved. Discard anyway?",
    "MSG_NEW_PROJECT_CONFIRM": "Are you sure you want to create a new project? This will clear all current blocks.",
    
    "CAT_AUDIO_TRAIN": "Audio Circuit",
    "CAT_AUDIO_CMD": "Performance (Old)",
    "CAT_LOGIC": "Logic",
    "CAT_LOOPS": "Loops",
    "CAT_MATH": "Math",
    "CAT_TEXT": "Text",
    "CAT_VARIABLES": "Variables",
    "CAT_FUNCTIONS": "Functions",
    "CAT_SOUND_SOURCES": "Sound Sources",
    "CAT_INSTRUMENT_CONTROL": "Instrument Control",
    "CAT_EFFECTS": "Audio Effects",
    "CAT_PERFORMANCE": "Performance",

    // Instrument Definition
    "AUDIO_DEFINE_INSTRUMENT": "Define Instrument %1",
    "AUDIO_INSTRUMENT_CHAIN": "%1",
    "AUDIO_INSTRUMENT_TOOLTIP": "Define the audio chain for this instrument. You can add oscillators, ADSR, filters, etc. This is a definition block used by performance commands.",

    // Instrument Components
    "AUDIO_COMP_OSC": "Oscillator %1",
    "AUDIO_COMP_ADSR": "ADSR Envelope %1 A %2 D %3 S %4 R %5",
    "AUDIO_COMP_FILTER": "Filter %1 Freq %2 Q %3",
    "AUDIO_COMP_VOLUME": "Volume %1 %",

    // Component Options
    "AUDIO_WAVE_SINE": "Sine",
    "AUDIO_WAVE_SAW": "Sawtooth",
    "AUDIO_WAVE_SQUARE": "Square",
    "AUDIO_WAVE_TRI": "Triangle",
    "AUDIO_FILTER_LP": "Low-pass",
    "AUDIO_FILTER_HP": "High-pass",

    // Audio Circuit (Train Mode)
    "AUDIO_OSCILLATOR_TRAIN": "Oscillator (ID: %1) wave %2 ❯ send to %3",
    "AUDIO_OSCILLATOR_TOOLTIP": "Start of audio generation. Use alphanumeric IDs (e.g., osc1). Must connect to Master Output to hear sound.",
    "AUDIO_DAC_TRAIN": "Master Output (DAC)",
    "AUDIO_DAC_TOOLTIP": "Endpoint of audio routing, sends sound to speakers.",

    // Performance
    "AUDIO_PLAY_NOTE": "play note freq %1 dur %2 ms using instrument %3",
    "AUDIO_PLAY_NOTE_ASYNC": "trigger note freq %1 dur %2 ms using instrument %3 (async)",
    "AUDIO_PLAY_NOTE_TOOLTIP": "Play a note and wait for its duration to complete before moving to the next block.",
    "AUDIO_PLAY_NOTE_ASYNC_TOOLTIP": "Trigger a note and immediately continue to the next block, useful for creating chords.",
    "AUDIO_NOTE": "note %1",
    "AUDIO_NOTE_TOOLTIP": "Select a musical note and convert it to frequency.",
    "AUDIO_WAIT": "wait %1 ms",
    "AUDIO_WAIT_TOOLTIP": "Pause execution for a specific time.",
    "AUDIO_STOP": "stop all sounds",
    "AUDIO_STOP_TOOLTIP": "Immediately release all voices and stop sound.",

    "AUDIO_WAVE_SINE": "Sine",
    "AUDIO_WAVE_SAW": "Sawtooth",
    "AUDIO_WAVE_SQUARE": "Square",
    "AUDIO_WAVE_TRI": "Triangle",

    // Hue definitions (aligned with #processing)
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
    "WC_TEXT_PRINT": "print %1",
    "WC_TEXT_PRINT_TOOLTIP": "Output message to the browser console (F12)."
  });
})(Blockly);
