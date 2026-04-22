/**
 * WaveCode Blocks: Audio Instruments
 * Definitions for defining instruments and their components.
 */

import { EnvelopeManager } from '../modules/visualizer.js';

Blockly.defineBlocksWithJsonArray([
  // --- 0. 樂器定義 (C 型帽子模式) ---
  {
    "type": "wc_instrument",
    "message0": "%{BKY_AUDIO_DEFINE_INSTRUMENT}",
    "args0": [
      { "type": "field_input", "name": "ID", "text": "Piano" }
    ],
    "message1": "%{BKY_AUDIO_INSTRUMENT_CHAIN}",
    "args1": [
      { "type": "input_statement", "name": "CHAIN" }
    ],
    "colour": "%{BKY_SOUND_SOURCES_HUE}",
    "hat": "cap",
    "tooltip": "%{BKY_AUDIO_INSTRUMENT_TOOLTIP}",
    "helpUrl": "sound_sources",
    "extensions": ["wc_instrument_dropdown_sync"]
  },

  // --- 0.1 全域主輸出 ---
  {
    "type": "wc_master",
    "message0": "%{BKY_AUDIO_DEFINE_MASTER}",
    "message1": "%{BKY_AUDIO_INSTRUMENT_CHAIN}",
    "args1": [
      { "type": "input_statement", "name": "CHAIN" }
    ],
    "colour": "#e74c3c",
    "hat": "cap",
    "tooltip": "%{BKY_AUDIO_MASTER_TOOLTIP}",
    "helpUrl": "master"
  },

  // --- 0.1 樂器組件 ---
  {
    "type": "wc_component_osc",
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
    "type": "wc_create_additive_synth",
    "message0": "%{BKY_AUDIO_CREATE_ADDITIVE_SYNTH}",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_SOUND_SOURCES_HUE}",
    "tooltip": "%{BKY_AUDIO_CREATE_ADDITIVE_SYNTH_TOOLTIP}%{BKY_WAVECODE_HELP_HINT}",
    "mutator": "wc_additive_mutator",
    "helpUrl": "custom_synth"
  },
  {
    "type": "wc_additive_synth_container",
    "message0": "%{BKY_AUDIO_CREATE_ADDITIVE_SYNTH_CONTAINER}",
    "nextStatement": null,
    "colour": "%{BKY_SOUND_SOURCES_HUE}",
    "enableContextMenu": false
  },
  {
    "type": "wc_additive_synth_item",
    "message0": "%{BKY_AUDIO_CREATE_ADDITIVE_SYNTH_ITEM}",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_SOUND_SOURCES_HUE}",
    "enableContextMenu": false
  },
  {
    "type": "wc_sampler_percussion",
    "message0": "%{BKY_AUDIO_COMP_SAMPLER_PERCUSSION}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "FOLDER",
        "options": [["%{BKY_WAVECODE_LOADING}", "none"]]
      },
      {
        "type": "field_dropdown",
        "name": "FILE",
        "options": [["%{BKY_WAVECODE_LOADING}", "none"]]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_SOUND_SOURCES_HUE}",
    "helpUrl": "sampler",
    "extensions": ["wc_percussion_menu_sync"]
  },
  {
    "type": "wc_sampler_melodic",
    "message0": "%{BKY_AUDIO_COMP_SAMPLER_MELODIC}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "FOLDER",
        "options": [["%{BKY_WAVECODE_LOADING}", "none"]]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_SOUND_SOURCES_HUE}",
    "tooltip": "%{BKY_AUDIO_MULTISAMPLER_TOOLTIP}",
    "helpUrl": "multisampler",
    "extensions": ["wc_melodic_menu_sync"]
  },
  {
    "type": "wc_component_adsr",
    "message0": "%{BKY_AUDIO_COMP_ADSR}",
    "args0": [
      { "type": "field_adsr", "name": "VISUAL", "a": 0.01, "d": 0.2, "s": 0.5, "r": 0.5 },
      { "type": "field_number", "name": "A", "value": 0.01, "min": 0, "max": 2, "precision": 0.001 },
      { "type": "field_number", "name": "D", "value": 0.2, "min": 0, "max": 2, "precision": 0.001 },
      { "type": "field_number", "name": "S", "value": 0.5, "min": 0, "max": 1, "precision": 0.001 },
      { "type": "field_number", "name": "R", "value": 0.5, "min": 0, "max": 5, "precision": 0.001 }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_INSTRUMENT_CONTROL_HUE}",
    "helpUrl": "adsr",
    "extensions": ["wc_adsr_visual_sync"]
  },
  {
    "type": "wc_component_volume",
    "message0": "%{BKY_AUDIO_COMP_VOLUME}",
    "args0": [
      { "type": "field_number", "name": "VOL", "value": 80, "min": 0, "max": 500 }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_INSTRUMENT_CONTROL_HUE}"
  },

  // --- 0.2 專業效果器 (拆分版) ---
  {
    "type": "wc_effect_filter",
    "message0": "%{BKY_AUDIO_EFFECT_FILTER}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "TYPE",
        "options": [
          ["%{BKY_AUDIO_FILTER_LP}", "lowpass"], 
          ["%{BKY_AUDIO_FILTER_HP}", "highpass"], 
          ["%{BKY_AUDIO_FILTER_BP}", "bandpass"]
        ]
      },
      { "type": "input_value", "name": "FREQ", "check": "Number" },
      { "type": "input_value", "name": "Q", "check": "Number" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_EFFECTS_HUE}",
    "tooltip": "%{BKY_AUDIO_FILTER_TOOLTIP}%{BKY_WAVECODE_HELP_HINT}",
    "helpUrl": "effects"
  },

  {
    "type": "wc_effect_reverb",
    "message0": "%{BKY_AUDIO_EFFECT_REVERB}",
    "args0": [
      { "type": "input_value", "name": "SECONDS", "check": "Number" },
      { "type": "input_value", "name": "DECAY", "check": "Number" },
      { "type": "input_value", "name": "MIX", "check": "Number" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_EFFECTS_HUE}",
    "tooltip": "%{BKY_AUDIO_REVERB_TOOLTIP}%{BKY_WAVECODE_HELP_HINT}",
    "helpUrl": "effects"
  },


  {
    "type": "wc_effect_delay",
    "message0": "%{BKY_AUDIO_EFFECT_DELAY}",
    "args0": [
      { "type": "input_value", "name": "TIME", "check": "Number" },
      { "type": "input_value", "name": "FEEDBACK", "check": "Number" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_EFFECTS_HUE}",
    "tooltip": "%{BKY_AUDIO_DELAY_TOOLTIP}%{BKY_WAVECODE_HELP_HINT}",
    "helpUrl": "effects"
  },
  {
    "type": "wc_effect_bitcrush",
    "message0": "%{BKY_AUDIO_EFFECT_BITCRUSH}",
    "args0": [
      { "type": "input_value", "name": "BITS", "check": "Number" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_EFFECTS_HUE}",
    "tooltip": "%{BKY_AUDIO_BITCRUSH_TOOLTIP}%{BKY_WAVECODE_HELP_HINT}",
    "helpUrl": "effects"
  },
  {
    "type": "wc_effect_distortion",
    "message0": "%{BKY_AUDIO_EFFECT_DISTORTION}",
    "args0": [
      { "type": "input_value", "name": "AMOUNT", "check": "Number" }
    ],
    "inputsInline": true,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_EFFECTS_HUE}",
    "tooltip": "%{BKY_AUDIO_DISTORTION_TOOLTIP}%{BKY_WAVECODE_HELP_HINT}",
    "helpUrl": "effects"
  },
  {
    "type": "wc_effect_compressor",
    "message0": "%{BKY_AUDIO_EFFECT_COMPRESSOR}",
    "args0": [
      { "type": "input_value", "name": "THRESH", "check": "Number" },
      { "type": "input_value", "name": "RATIO", "check": "Number" },
      { "type": "input_value", "name": "ATTACK", "check": "Number" },
      { "type": "input_value", "name": "RELEASE", "check": "Number" },
      { "type": "input_value", "name": "MAKEUP", "check": "Number" }
    ],
    "inputsInline": false,
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_EFFECTS_HUE}",
    "tooltip": "%{BKY_AUDIO_COMPRESSOR_TOOLTIP}%{BKY_WAVECODE_HELP_HINT}",
    "helpUrl": "effects"
  },

  // --- 0.3 即時控制 ---
  {
    "type": "wc_set_effect_param",
    "message0": "%{BKY_AUDIO_SET_EFFECT_PARAM}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "INSTRUMENT",
        "options": [["%{BKY_AUDIO_CURRENT_INSTRUMENT}", "none"]]
      },
      {
        "type": "field_dropdown",
        "name": "EFFECT_TYPE",
        "options": [
          ["%{BKY_AUDIO_FILTER_TYPE}", "filter"],
          ["%{BKY_AUDIO_PARAM_VOLUME}", "volume"],
          ["%{BKY_AUDIO_PARAM_DELAY}", "delay"],
          ["%{BKY_AUDIO_PARAM_REVERB}", "reverb"],
          ["%{BKY_AUDIO_PARAM_BITCRUSH}", "bitcrush"],
          ["%{BKY_AUDIO_PARAM_DISTORTION}", "distortion"]
        ]
      },
      {
        "type": "field_dropdown",
        "name": "PARAM_NAME",
        "options": [["%{BKY_AUDIO_PARAM_FREQ}", "freq"]]
      },
      { "type": "input_value", "name": "VALUE", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_EFFECTS_HUE}",
    "tooltip": "%{BKY_AUDIO_SET_EFFECT_PARAM_TOOLTIP}",
    "extensions": ["wc_play_note_instrument_dropdown", "wc_set_effect_param_sync"]
  }
]);

// --- Extensions ---

Blockly.Extensions.register('wc_set_effect_param_sync', function() {
  const block = this;
  const effectField = this.getField('EFFECT_TYPE');
  const paramField = this.getField('PARAM_NAME');
  
  const updateParams = (type) => {
    let options = [];
    if (type === 'filter') {
      options = [
        [Blockly.Msg['AUDIO_PARAM_FREQ'] || 'Frequency', 'freq'], 
        [Blockly.Msg['AUDIO_PARAM_Q'] || 'Q', 'q']
      ];
    } else if (type === 'volume') {
      options = [[Blockly.Msg['AUDIO_PARAM_VALUE'] || 'Value', 'val']];
    } else if (type === 'delay') {
      options = [
        [Blockly.Msg['AUDIO_PARAM_TIME'] || 'Time', 'time'], 
        [Blockly.Msg['AUDIO_PARAM_FEEDBACK'] || 'Feedback', 'feedback']
      ];
    } else if (type === 'reverb') {
      options = [
        [Blockly.Msg['AUDIO_PARAM_SECONDS'] || 'Seconds', 'seconds'], 
        [Blockly.Msg['AUDIO_PARAM_DECAY'] || 'Decay', 'decay'], 
        [Blockly.Msg['AUDIO_PARAM_MIX'] || 'Mix', 'mix']
      ];
    } else if (type === 'bitcrush') {
      options = [[Blockly.Msg['AUDIO_PARAM_BITS'] || 'Bits', 'bits']];
    } else if (type === 'distortion') {
      options = [[Blockly.Msg['AUDIO_PARAM_AMOUNT'] || 'Amount', 'amount']];
    }
    
    // 如果目前的選項不在新清單中，重置為第一個
    const currentVal = paramField.getValue();
    paramField.menuGenerator_ = options;
    const isValid = options.some(opt => opt[1] === currentVal);
    if (!isValid && options.length > 0) {
      paramField.setValue(options[0][1]);
    }
  };

  this.setOnChange(function(event) {
    if (event.type === Blockly.Events.BLOCK_CHANGE && event.name === 'EFFECT_TYPE' && event.blockId === block.id) {
      updateParams(block.getFieldValue('EFFECT_TYPE'));
    }
  });
  
  // 延遲初始化，確保多國語言與欄位已載入
  setTimeout(() => {
    if (block.workspace) updateParams(block.getFieldValue('EFFECT_TYPE'));
  }, 100);
});

Blockly.Extensions.register('wc_instrument_dropdown_sync', function() {});

Blockly.Extensions.register('wc_adsr_visual_sync', function() {
  const block = this;
  const updateVisual = () => {
    const a = parseFloat(block.getFieldValue('A'));
    const d = parseFloat(block.getFieldValue('D'));
    const s = parseFloat(block.getFieldValue('S'));
    const r = parseFloat(block.getFieldValue('R'));
    const visualField = block.getField('VISUAL');
    if (visualField) { visualField.updateParams(a, d, s, r); }
    let parent = block.getSurroundParent();
    while (parent && parent.type !== 'wc_instrument') { parent = parent.getSurroundParent(); }
    if (parent && window.EnvelopeManager) {
      window.EnvelopeManager.register(parent.getFieldValue('ID'), visualField);
    }
  };
  this.setOnChange(function(event) {
    if (event.type === Blockly.Events.BLOCK_MOVE || event.type === Blockly.Events.BLOCK_CHANGE) { updateVisual(); }
  });
  setTimeout(updateVisual, 100);
});

Blockly.Extensions.registerMutator('wc_additive_mutator', window.WC_Utils.ADDITIVE_SYNTH_MUTATOR, undefined, ['wc_additive_synth_item']);

// --- 旋律類選單同步 ---
Blockly.Extensions.register('wc_melodic_menu_sync', function() {
  const field = this.getField('FOLDER');
  field.menuGenerator_ = () => {
    const folders = (window.AudioManager && window.AudioManager.melodicFolders) || [];
    const noFoldersMsg = Blockly.Msg['WAVECODE_NO_FOLDERS'] || '(No Folders)';
    return folders.length > 0 ? folders.map(f => [f, f]) : [[noFoldersMsg, 'none']];
  };
});

// --- 打擊類選單同步 (兩層連動) ---
Blockly.Extensions.register('wc_percussion_menu_sync', function() {
  const folderField = this.getField('FOLDER');
  const fileField = this.getField('FILE');

  folderField.menuGenerator_ = () => {
    const pMap = (window.AudioManager && window.AudioManager.percussionMap) || {};
    const folders = Object.keys(pMap);
    const noFoldersMsg = Blockly.Msg['WAVECODE_NO_FOLDERS'] || '(No Folders)';
    return folders.length > 0 ? folders.map(f => [f, f]) : [[noFoldersMsg, 'none']];
  };

  fileField.menuGenerator_ = () => {
    const folder = folderField.getValue();
    const pMap = (window.AudioManager && window.AudioManager.percussionMap) || {};
    const files = pMap[folder] || [];
    const selectFolderFirstMsg = Blockly.Msg['WAVECODE_SELECT_FOLDER_FIRST'] || '(Select Folder First)';
    return files.length > 0 ? files.map(f => [f, f]) : [[selectFolderFirstMsg, 'none']];
  };

  this.setOnChange((e) => {
    if (e.type === Blockly.Events.BLOCK_CHANGE && e.blockId === this.id && e.name === 'FOLDER') {
      // 當資料夾變動時，強制更新檔案選單並選取第一個檔案
      const pMap = (window.AudioManager && window.AudioManager.percussionMap) || {};
      const files = pMap[folderField.getValue()] || [];
      if (files.length > 0) fileField.setValue(files[0]);
    }
  });
});
