/**
 * WaveCode Blocks: Audio Train (Legacy/Circuit Mode)
 * Definitions for oscillator and DAC connection blocks.
 */

Blockly.defineBlocksWithJsonArray([
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
    "colour": "#585858",
    "tooltip": "%{BKY_AUDIO_OSCILLATOR_TOOLTIP}"
  },
  {
    "type": "audio_dac",
    "message0": "%{BKY_AUDIO_DAC_TRAIN}",
    "output": "AudioDest",
    "colour": "#585858",
    "tooltip": "%{BKY_AUDIO_DAC_TOOLTIP}"
  }
]);
