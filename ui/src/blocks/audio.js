/**
 * WaveCode Audio Blocks Definitions (Polyphonic Version)
 */

Blockly.defineBlocksWithJsonArray([
  // --- 1. 核心鏈條積木 ---
  {
    "type": "audio_oscillator",
    "message0": "%{BKY_AUDIO_OSCILLATOR_TRAIN}",
    "args0": [
      { "type": "field_input", "name": "ID", "text": "osc1" },
      {
        "type": "field_dropdown",
        "name": "WAVE",
        "options": [
          ["%{BKY_AUDIO_WAVE_SINE}", "0"], ["%{BKY_AUDIO_WAVE_SAW}", "1"], ["%{BKY_AUDIO_WAVE_SQUARE}", "2"], ["%{BKY_AUDIO_WAVE_TRI}", "3"]
        ]
      },
      { "type": "input_value", "name": "NEXT", "check": "AudioDest" }
    ],
    "inputsInline": true,
    "style": "audio_blocks"
  },
  {
    "type": "audio_dac",
    "message0": "%{BKY_AUDIO_DAC_TRAIN}",
    "output": "AudioDest",
    "style": "audio_blocks"
  },

  // --- 2. 演奏積木 (對齊 Processing 邏輯) ---
  {
    "type": "audio_play_note",
    "message0": "%{BKY_AUDIO_PLAY_NOTE}",
    "args0": [
      { "type": "input_value", "name": "FREQ", "check": "Number" },
      { "type": "input_value", "name": "DUR", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "style": "audio_blocks",
    "tooltip": "播放指定頻率與持續時間的音符"
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
    "style": "audio_blocks"
  },
  {
    "type": "audio_wait",
    "message0": "%{BKY_AUDIO_WAIT}",
    "args0": [
      { "type": "input_value", "name": "MS", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "style": "audio_blocks"
  },
  {
    "type": "audio_stop",
    "message0": "%{BKY_AUDIO_STOP}",
    "previousStatement": null,
    "nextStatement": null,
    "style": "audio_blocks"
  }
]);
