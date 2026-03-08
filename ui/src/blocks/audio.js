/**
 * WaveCode Audio Blocks Definitions
 */

Blockly.defineBlocksWithJsonArray([
  {
    "type": "audio_play_sine",
    "message0": "%{BKY_AUDIO_PLAY_SINE}",
    "args0": [
      {
        "type": "input_value",
        "name": "FREQ",
        "check": "Number"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "style": "audio_blocks",
    "tooltip": "%{BKY_AUDIO_PLAY_SINE_TOOLTIP}"
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
      {
        "type": "input_value",
        "name": "MS",
        "check": "Number"
      }
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

// 映射舊的 play_sine 到新的 audio_play_sine 以防出錯
Blockly.Blocks['play_sine'] = Blockly.Blocks['audio_play_sine'];
