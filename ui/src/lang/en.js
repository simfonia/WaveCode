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
    "AUDIO_COMP_SAMPLER": "Sampler %1",
    "AUDIO_COMP_MULTISAMPLER": "Multi-Sampler (Folder Name) %1",
    "AUDIO_MULTISAMPLER_TOOLTIP": "Input a sample prefix (e.g. 'piano'), and the system will automatically find the nearest sample (e.g. piano_C4, piano_Ds4) based on the target frequency and apply pitch shifting.",
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

    "AUDIO_SET_BPM": "set tempo (BPM) %1",
    "AUDIO_SET_BPM_TOOLTIP": "Set global playback tempo. Affects beat duration in 'play melody'.",
    "AUDIO_SELECT_INSTRUMENT": "select instrument %1",
    "AUDIO_SELECT_INSTRUMENT_TOOLTIP": "Set the default instrument for subsequent performance commands.",
    "AUDIO_PLAY_MELODY": "play melody %1 using instrument %2",
    "AUDIO_PLAY_MELODY_SCORE": "score %1",
    "AUDIO_PLAY_MELODY_TOOLTIP": "Play a sequence of notes. Example: C4Q (Quarter), E4H (Half), G4W (Whole).",

    "AUDIO_DEFINE_CHORD": "define chord name %1 notes (comma separated) %2",
    "AUDIO_DEFINE_CHORD_TOOLTIP": "Define a set of notes as a name, which can later be played with 'play chord' block. Format: C4, E4, G4 etc.",
    "AUDIO_PLAY_CHORD": "play chord %1 dur %2 ms using instrument %3",
    "AUDIO_PLAY_CHORD_TOOLTIP": "Simultaneously play all notes in a defined chord. This is a synchronous command and will wait for the duration to end.",

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
    "WC_TEXT_PRINT_TOOLTIP": "Output message to the browser console (F12).",

    // Effects (Split version)
    "AUDIO_EFFECT_FILTER": "Filter %1 Freq %2 Q %3",
    "AUDIO_EFFECT_DELAY": "Delay Time %1 s (Feedback %2)",
    "AUDIO_EFFECT_BITCRUSH": "BitCrush %1 Bits",
    "AUDIO_EFFECT_DISTORTION": "Distortion %1",
    "AUDIO_EFFECT_COMPRESSOR": "Compressor thresh %1 ratio %2 attack %3 release %4 makeup %5",
    "AUDIO_EFFECT_REVERB": "Reverb %1 s decay %2 mix %3",

    "AUDIO_FILTER_TOOLTIP": "Filter out specific frequencies (Low-pass/High-pass/Band-pass).",
    "AUDIO_DELAY_TOOLTIP": "Create an echo delay effect.",
    "AUDIO_BITCRUSH_TOOLTIP": "Reduce bit depth to create vintage digital distortion.",
    "AUDIO_DISTORTION_TOOLTIP": "Create analog-style saturation distortion.",
    "AUDIO_COMPRESSOR_TOOLTIP": "Dynamic compression to balance volume levels.",
    "AUDIO_REVERB_TOOLTIP": "Add spatial reverb effect to simulate room ambience.",

    "AUDIO_SET_EFFECT_PARAM": "instrument %1 effect %2 param %3 value %4",
    "AUDIO_SET_EFFECT_PARAM_TOOLTIP": "Dynamically update effect parameters for active voices. Useful for real-time control with external sensors.",

    // MIDI
    "CAT_MIDI": "MIDI Device",
    "MIDI_HUE": "#d22f73",
    "MIDI_ON_NOTE": "when MIDI note received (Ch: %1, Note: %2, Vel: %3)",
    "MIDI_ON_NOTE_TOOLTIP": "Triggered when an external MIDI keyboard key is pressed. Variables store channel, pitch, and velocity.",
    "MIDI_OFF_NOTE": "when MIDI note released (Ch: %1, Note: %2, Vel: %3)",
    "MIDI_OFF_NOTE_TOOLTIP": "Triggered when an external MIDI keyboard key is released.",
    "MIDI_ON_CC": "when MIDI CC received (Ch: %1, No: %2, Val: %3)",
    "MIDI_ON_CC_TOOLTIP": "Triggered when an external MIDI knob or fader is moved. Variables store channel, number, and value.",
    "MIDI_LP_XY_TO_NOTE": "Launchpad XY %1 X %2 Y %3 to MIDI Note",
    "MIDI_LP_XY_TO_NOTE_TOOLTIP": "Convert Launchpad 8x8 grid coordinates (0-7) to MIDI note number.",
    "MIDI_LP_MODE_XY": "Classic (XY)",
    "MIDI_LP_MODE_NOTE": "Modern (Note)",

    "WC_MIDI_SEND_NOTE": "send MIDI note %1 vel %2 ch %3 device %4",
    "WC_MIDI_SEND_NOTE_TOOLTIP": "Send MIDI NoteOn/Off signal to specified physical or virtual device. Velocity 0 is equivalent to NoteOff.",
    "WC_MIDI_SEND_NOTE_OFF": "release MIDI note %1 ch %2 device %3",
    "WC_MIDI_SEND_NOTE_OFF_TOOLTIP": "Send MIDI NoteOff signal to specified device.",
    "WC_MIDI_SEND_CC": "send MIDI CC %1 value %2 ch %3 device %4",
    "WC_MIDI_SEND_CC_TOOLTIP": "Send MIDI Control Change signal to control external hardware knobs, faders, etc.",
    "WC_MIDI_NOTE_TO_FREQ": "MIDI note %1 to frequency",
    "WC_MIDI_NOTE_TO_FREQ_TOOLTIP": "Convert MIDI note number (0-127) to corresponding frequency (Hz). e.g., 60 to 261.63Hz (C4).",
    "WC_MIDI_NOTE_TO_NAME": "MIDI note %1 to name",
    "WC_MIDI_NOTE_TO_NAME_TOOLTIP": "Convert MIDI note number (0-127) to human-readable note name. e.g., 60 to 'C4'.",
    "WC_MIDI_IS_PRESSED": "MIDI key %1 is pressed?",
    "WC_MIDI_IS_PRESSED_TOOLTIP": "Detect if a specific MIDI key is currently pressed. This is a real-time detection that works regardless of whether the code is running.",
    "WC_MIDI_ALL_DEVICES": "All Devices"
  });
})(Blockly);
