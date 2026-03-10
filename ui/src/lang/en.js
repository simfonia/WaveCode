(function (Blockly) {
  Blockly.Msg = Blockly.Msg || {};
  Object.assign(Blockly.Msg, {
    "WAVECODE_RUN": "Run",
    "WAVECODE_STOP": "Stop",
    "WAVECODE_NEW": "New",
    "WAVECODE_EXAMPLES": "Examples",
    "WAVECODE_OPEN": "Open",
    "WAVECODE_SAVE": "Save",
    "WAVECODE_SETTINGS": "Settings",
    "WAVECODE_UNTITLED": "Untitled Project",
    "WAVECODE_UPDATE_CHECK": "Checking for updates...",
    "WAVECODE_UPDATE_AVAILABLE": "New version available! Click to download",
    "WAVECODE_UPDATE_DOWNLOADING": "Downloading update...",
    "WAVECODE_UPDATE_READY": "Update ready, click to restart",
    "WAVECODE_UPDATE_NONE": "You are on the latest version",

    // Common Messages
    "MSG_WARNING": "Warning",
    "MSG_UNSAVED_CHANGES": "Current changes are not saved. Are you sure you want to discard them?",
    "MSG_NEW_PROJECT_CONFIRM": "Are you sure you want to create a new project? This will clear all current blocks.",

    // Category Names
    "CAT_AUDIO_TRAIN": "Audio Circuit",
    "CAT_AUDIO_CMD": "Audio Commands",
    "CAT_LOGIC": "Logic",
    "CAT_LOOPS": "Loops",
    "CAT_MATH": "Math",
    "CAT_VARIABLES": "Variables",
    "CAT_FUNCTIONS": "Functions",

    // Audio Circuit (Train Mode)
    "AUDIO_OSCILLATOR_TRAIN": "Oscillator (ID: %1) Wave %2 ❯ Send to %3",
    "AUDIO_OSCILLATOR_TOOLTIP": "Starting point of audio. Use letters, numbers, and underscores for ID (case-sensitive), no spaces (e.g., osc1). Must connect to DAC to produce sound.",
    "AUDIO_DAC_TRAIN": "Main Output (DAC)",
    "AUDIO_DAC_TOOLTIP": "End point of audio. Sends sound to speakers.",

    // Audio Commands
    "AUDIO_SET_FREQ": "Control %1 frequency to %2 Hz",
    "AUDIO_SET_FREQ_TOOLTIP": "Sets the frequency of the specified oscillator. IDs are case-sensitive and must match the circuit definition.",
    "AUDIO_NOTE": "Note %1",
    "AUDIO_NOTE_TOOLTIP": "Choose a musical note frequency.",
    "AUDIO_WAIT": "wait( %1 ms )",
    "AUDIO_WAIT_TOOLTIP": "Pause script execution.",
    "AUDIO_STOP": "stopAudio()",
    "AUDIO_STOP_TOOLTIP": "Stop all active sounds immediately.",

    "AUDIO_WAVE_SINE": "Sine",
    "AUDIO_WAVE_SAW": "Saw",
    "AUDIO_WAVE_SQUARE": "Square",
    "AUDIO_WAVE_TRI": "Triangle"
  });
})(Blockly);
