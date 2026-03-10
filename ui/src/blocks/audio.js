/**
 * WaveCode Audio Blocks Definitions
 */

Blockly.defineBlocksWithJsonArray([
  // --- 1. 核心鏈條積木 (火車頭與車廂) ---
  {
    "type": "audio_oscillator",
    "message0": "%{BKY_AUDIO_OSCILLATOR_TRAIN}",
    "args0": [
      { "type": "field_input", "name": "ID", "text": "osc1" },
      {
        "type": "field_dropdown",
        "name": "WAVE",
        "options": [
          ["%{BKY_AUDIO_WAVE_SINE}", "0"], 
          ["%{BKY_AUDIO_WAVE_SAW}", "1"], 
          ["%{BKY_AUDIO_WAVE_SQUARE}", "2"], 
          ["%{BKY_AUDIO_WAVE_TRI}", "3"]
        ]
      },
      { "type": "input_value", "name": "NEXT", "check": "AudioDest" }
    ],
    "inputsInline": true,
    "style": "audio_blocks",
    "tooltip": "%{BKY_AUDIO_OSCILLATOR_TOOLTIP}"
  },
  {
    "type": "audio_dac",
    "message0": "%{BKY_AUDIO_DAC_TRAIN}",
    "output": "AudioDest",
    "style": "audio_blocks",
    "tooltip": "%{BKY_AUDIO_DAC_TOOLTIP}"
  },

  // --- 2. 參數控制積木 (指令型) ---
  {
    "type": "audio_set_frequency",
    "message0": "%{BKY_AUDIO_SET_FREQ}",
    "args0": [
      { "type": "field_input", "name": "ID", "text": "osc1" },
      { "type": "input_value", "name": "FREQ", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "style": "audio_blocks",
    "tooltip": "%{BKY_AUDIO_SET_FREQ_TOOLTIP}"
  },
  {
    "type": "audio_note",
    "message0": "%{BKY_AUDIO_NOTE}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "NOTE",
        "options": [
          ["C4", "261.63"], ["D4", "293.66"], ["E4", "329.63"], ["F4", "349.23"],
          ["G4", "392.00"], ["A4", "440.00"], ["B4", "493.88"], ["C5", "523.25"]
        ]
      }
    ],
    "output": "Number",
    "style": "audio_blocks",
    "tooltip": "%{BKY_AUDIO_NOTE_TOOLTIP}"
  },
  {
    "type": "audio_wait",
    "message0": "%{BKY_AUDIO_WAIT}",
    "args0": [
      { "type": "input_value", "name": "MS", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "style": "audio_blocks",
    "tooltip": "%{BKY_AUDIO_WAIT_TOOLTIP}"
  },
  {
    "type": "audio_stop",
    "message0": "%{BKY_AUDIO_STOP}",
    "previousStatement": null,
    "nextStatement": null,
    "style": "audio_blocks",
    "tooltip": "%{BKY_AUDIO_STOP_TOOLTIP}"
  }
]);

// 建立舊積木別名以相容
Blockly.Blocks['audio_play_sine'] = Blockly.Blocks['audio_set_frequency'];
