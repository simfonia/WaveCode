/**
 * WaveCode Audio Blocks Definitions (Polyphonic Version)
 */

import { EnvelopeManager } from '../modules/visualizer.js';

Blockly.defineBlocksWithJsonArray([
  // --- 0. 樂器定義 (C 型帽子模式) ---
  {
    "type": "audio_instrument",
    "message0": "%{BKY_AUDIO_DEFINE_INSTRUMENT}",
    "args0": [
      { "type": "field_input", "name": "ID", "text": "lead_synth" }
    ],
    "message1": "%{BKY_AUDIO_INSTRUMENT_CHAIN}",
    "args1": [
      { "type": "input_statement", "name": "CHAIN" }
    ],
    "colour": "%{BKY_SOUND_SOURCES_HUE}",
    "hat": "cap",
    "tooltip": "%{BKY_AUDIO_INSTRUMENT_TOOLTIP}",
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
    "colour": "%{BKY_EFFECTS_HUE}"
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
  },

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
    "colour": "#585858"
  },
  {
    "type": "audio_dac",
    "message0": "%{BKY_AUDIO_DAC_TRAIN}",
    "output": "AudioDest",
    "colour": "#585858"
  },

  // --- 2. 演奏積木 ---
  {
    "type": "audio_play_note",
    "message0": "%{BKY_AUDIO_PLAY_NOTE}",
    "args0": [
      { "type": "input_value", "name": "FREQ", "check": "Number" },
      { "type": "input_value", "name": "DUR", "check": "Number" },
      {
        "type": "field_dropdown",
        "name": "INSTRUMENT",
        "options": [["lead_synth", "lead_synth"]]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_PLAY_NOTE_TOOLTIP}",
    "extensions": ["audio_play_note_instrument_dropdown"]
  },
  {
    "type": "audio_play_note_async",
    "message0": "%{BKY_AUDIO_PLAY_NOTE_ASYNC}",
    "args0": [
      { "type": "input_value", "name": "FREQ", "check": "Number" },
      { "type": "input_value", "name": "DUR", "check": "Number" },
      {
        "type": "field_dropdown",
        "name": "INSTRUMENT",
        "options": [["lead_synth", "lead_synth"]]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_PLAY_NOTE_ASYNC_TOOLTIP}",
    "extensions": ["audio_play_note_instrument_dropdown"]
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
    "colour": "%{BKY_PERFORMANCE_HUE}"
  },
  {
    "type": "audio_wait",
    "message0": "%{BKY_AUDIO_WAIT}",
    "args0": [
      { "type": "input_value", "name": "MS", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}"
  },
  {
    "type": "audio_stop",
    "message0": "%{BKY_AUDIO_STOP}",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}"
  }
]);

// --- 3. 動態擴充與邏輯 ---

// 樂器 ID 同步 (用於下拉選單更新)
Blockly.Extensions.register('audio_instrument_dropdown_sync', function() {
  // 目前僅作為標記，選單產生器會掃描所有 audio_instrument
});

// ADSR 組件與 SVG 預覽同步
Blockly.Extensions.register('audio_adsr_visual_sync', function() {
  const block = this;
  
  const updateVisual = () => {
    const a = parseFloat(block.getFieldValue('A'));
    const d = parseFloat(block.getFieldValue('D'));
    const s = parseFloat(block.getFieldValue('S'));
    const r = parseFloat(block.getFieldValue('R'));
    const visualField = block.getField('VISUAL');
    if (visualField) {
      visualField.updateParams(a, d, s, r);
    }
    
    // 註冊到 EnvelopeManager (由所屬的樂器 ID 決定)
    let parent = block.getSurroundParent();
    while (parent && parent.type !== 'audio_instrument') {
      parent = parent.getSurroundParent();
    }
    if (parent) {
      const instId = parent.getFieldValue('ID');
      EnvelopeManager.register(instId, visualField);
    }
  };

  this.setOnChange(function(event) {
    if (event.type === Blockly.Events.BLOCK_MOVE || event.type === Blockly.Events.BLOCK_CHANGE) {
      updateVisual();
    }
  });
  
  // 延遲初始化，確保父積木已存在
  setTimeout(updateVisual, 100);
});

Blockly.Extensions.register('audio_play_note_instrument_dropdown', function() {
  const dropdown = this.getField('INSTRUMENT');
  dropdown.menuGenerator_ = function() {
    const workspace = dropdown.getSourceBlock().workspace;
    const blocks = workspace.getBlocksByType('audio_instrument');
    const options = blocks.map(b => {
      const id = b.getFieldValue('ID');
      return [id, id];
    });
    return options.length > 0 ? options : [['(無樂器)', 'none']];
  };
});
