(function (Blockly) {
  Blockly.Msg = Blockly.Msg || {};
  Object.assign(Blockly.Msg, {
    "WAVECODE_RUN": "Run Code",
    "WAVECODE_STOP": "Stop Audio",
    "WAVECODE_NEW": "New Project",
    "WAVECODE_EXAMPLES": "Examples",
    "WAVECODE_OPEN": "Open Project",
    "WAVECODE_SAVE": "Save Project",
    "WAVECODE_SETTINGS": "Settings",
    "WAVECODE_UNTITLED": "Untitled Project",
    "WAVECODE_UPDATE_CHECK": "Checking for updates...",
    "WAVECODE_UPDATE_AVAILABLE": "New version available!",
    "WAVECODE_UPDATE_DOWNLOADING": "Downloading update...",
    "WAVECODE_UPDATE_READY": "Update ready, click to restart",
    "WAVECODE_UPDATE_NONE": "Already up to date",
    
    "MSG_WARNING": "Warning",
    "MSG_UNSAVED_CHANGES": "Current changes are not saved. Discard anyway?",
    "MSG_NEW_PROJECT_CONFIRM": "Are you sure you want to create a new project? This will clear all current blocks.",
    
    "CAT_AUDIO_TRAIN": "Audio Circuit",
    "CAT_AUDIO_CMD": "Performance",
    "CAT_LOGIC": "Logic",
    "CAT_LOOPS": "Loops",
    "CAT_MATH": "Math",
    "CAT_VARIABLES": "Variables",
    "CAT_FUNCTIONS": "Functions",

    "AUDIO_OSCILLATOR_TRAIN": "Oscillator (ID: %1) wave %2 ❯ send to %3",
    "AUDIO_OSCILLATOR_TOOLTIP": "Start of audio generation. Use alphanumeric IDs (e.g., osc1). Must connect to Master Output to hear sound.",
    "AUDIO_DAC_TRAIN": "Master Output (DAC)",
    "AUDIO_DAC_TOOLTIP": "Endpoint of audio routing, sends sound to speakers.",

    "AUDIO_PLAY_NOTE": "play note frequency %1 duration %2 ms",
    "AUDIO_PLAY_NOTE_TOOLTIP": "Play a note with specific frequency and duration. Supports polyphony with natural release.",
    "AUDIO_NOTE": "note %1",
    "AUDIO_NOTE_TOOLTIP": "Select a musical note and convert it to frequency.",
    "AUDIO_WAIT": "wait %1 ms",
    "AUDIO_WAIT_TOOLTIP": "Pause execution for a specific time.",
    "AUDIO_STOP": "stop all sounds",
    "AUDIO_STOP_TOOLTIP": "Immediately release all voices and stop sound.",

    "AUDIO_WAVE_SINE": "Sine",
    "AUDIO_WAVE_SAW": "Sawtooth",
    "AUDIO_WAVE_SQUARE": "Square",
    "AUDIO_WAVE_TRI": "Triangle"
  });
})(Blockly);
