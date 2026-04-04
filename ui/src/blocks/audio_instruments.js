/**
 * WaveCode Blocks: Audio Instruments
 * Definitions for defining instruments and their components.
 */

import { EnvelopeManager } from '../modules/visualizer.js';

Blockly.defineBlocksWithJsonArray([
  // --- 0. 樂器定義 (C 型帽子模式) ---
  {
    "type": "audio_instrument",
    "message0": "%{BKY_AUDIO_DEFINE_INSTRUMENT}",
    "args0": [
      { "type": "field_input", "name": "ID", "text": "my_piano" }
    ],
    "message1": "%{BKY_AUDIO_INSTRUMENT_CHAIN}",
    "args1": [
      { "type": "input_statement", "name": "CHAIN" }
    ],
    "colour": "%{BKY_SOUND_SOURCES_HUE}",
    "hat": "cap",
    "tooltip": "%{BKY_AUDIO_INSTRUMENT_TOOLTIP}",
    "helpUrl": "sound_sources",
    "extensions": ["audio_instrument_dropdown_sync"]
  },

  // --- 0.1 樂器組件 ---
  {
    "type": "audio_component_osc",
    "message0": "%{BKY_AUDIO_COMP_OSC}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "WAVE",
        "options": [
          ["%{BKY_AUDIO_WAVE_SINE}", "0"], ["%{BKY_AUDIO_WAVE_SAW}", "1"], ["%{BKY_AUDIO_WAVE_SQUARE}", "2"], ["%{BKY_AUDIO_WAVE_TRI}", "3"]
        ]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_SOUND_SOURCES_HUE}"
  },
  {
    "type": "audio_component_sampler",
    "message0": "%{BKY_AUDIO_COMP_SAMPLER}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "SAMPLE_ID",
        "options": [
          ["Drum: Kick", "Roland_TR-909_Bass_BT0A0D3"], 
          ["Drum: Snare", "Roland_TR-909_Snare_ST0T3S3"], 
          ["Drum: Clap", "Roland_TR-909_HANDCLP1"],
          ["Drum: HH Closed", "Roland_TR-909_HiHatClosed_HHCD2"],
          ["Drum: HH Open", "Roland_TR-909_HiHatOpen_HHOD6"],
          ["Drum: Crash", "Roland_TR-909_Crash_CSHD8"],
          ["Drum: Ride", "Roland_TR-909_RIDED8"],
          ["Drum: Rimshot", "Roland_TR-909_Rimshot_RIM63"],
          ["Drum: Tom High", "Roland_TR-909_TomHigh_HT7D3"],
          ["Drum: Tom Mid", "Roland_TR-909_TomMid_MT7D3"],
          ["Drum: Tom Low", "Roland_TR-909_TomLow_LT7D3"],
          ["Piano (Multi)", "piano"], 
          ["Violin Pizz (Multi)", "violin_pizz"],
          ["Violin Sust (Multi)", "violin_sust"]
        ]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_SOUND_SOURCES_HUE}"
  },
  {
    "type": "audio_component_adsr",
    "message0": "%{BKY_AUDIO_COMP_ADSR}",
    "args0": [
      { "type": "field_adsr", "name": "VISUAL", "a": 0.05, "d": 0.2, "s": 0.5, "r": 0.5 },
      { "type": "field_number", "name": "A", "value": 0.05, "min": 0, "max": 2, "precision": 0.01 },
      { "type": "field_number", "name": "D", "value": 0.2, "min": 0, "max": 2, "precision": 0.01 },
      { "type": "field_number", "name": "S", "value": 0.5, "min": 0, "max": 1, "precision": 0.01 },
      { "type": "field_number", "name": "R", "value": 0.5, "min": 0, "max": 5, "precision": 0.01 }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_INSTRUMENT_CONTROL_HUE}",
    "helpUrl": "adsr",
    "extensions": ["audio_adsr_visual_sync"]
  },
  {
    "type": "audio_component_filter",
    "message0": "%{BKY_AUDIO_COMP_FILTER}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "TYPE",
        "options": [ ["%{BKY_AUDIO_FILTER_LP}", "LP"], ["%{BKY_AUDIO_FILTER_HP}", "HP"] ]
      },
      { "type": "field_number", "name": "FREQ", "value": 1000, "min": 20, "max": 20000 },
      { "type": "field_number", "name": "Q", "value": 1, "min": 0.1, "max": 10 }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_EFFECTS_HUE}",
    "helpUrl": "effects"
  },
  {
    "type": "audio_component_volume",
    "message0": "%{BKY_AUDIO_COMP_VOLUME}",
    "args0": [
      { "type": "field_number", "name": "VOL", "value": 80, "min": 0, "max": 500 }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_INSTRUMENT_CONTROL_HUE}"
  }
]);

// --- Extensions ---

Blockly.Extensions.register('audio_instrument_dropdown_sync', function() {});

Blockly.Extensions.register('audio_adsr_visual_sync', function() {
  const block = this;
  const updateVisual = () => {
    const a = parseFloat(block.getFieldValue('A'));
    const d = parseFloat(block.getFieldValue('D'));
    const s = parseFloat(block.getFieldValue('S'));
    const r = parseFloat(block.getFieldValue('R'));
    const visualField = block.getField('VISUAL');
    if (visualField) { visualField.updateParams(a, d, s, r); }
    let parent = block.getSurroundParent();
    while (parent && parent.type !== 'audio_instrument') { parent = parent.getSurroundParent(); }
    if (parent && window.EnvelopeManager) {
      window.EnvelopeManager.register(parent.getFieldValue('ID'), visualField);
    }
  };
  this.setOnChange(function(event) {
    if (event.type === Blockly.Events.BLOCK_MOVE || event.type === Blockly.Events.BLOCK_CHANGE) { updateVisual(); }
  });
  setTimeout(updateVisual, 100);
});
