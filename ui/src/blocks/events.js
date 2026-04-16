/**
 * WaveCode Blocks: PC Keyboard & MIDI Events
 * 實作並行事件處理，對齊 #nyx 規範並注入安全守衛。
 */

Blockly.defineBlocksWithJsonArray([
  // --- 1. PC Keyboard 事件 ---
  {
    "type": "wc_key_event",
    "message0": "%{BKY_EVENT_KEY}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "KEY",
        "options": [
          ["A", "a"], ["S", "s"], ["D", "d"], ["F", "f"], ["G", "g"], ["H", "h"], ["J", "j"], ["K", "k"], ["L", "l"], [";", ";"], ["'", "'"],
          ["Z", "z"], ["X", "x"], ["C", "c"], ["V", "v"], ["B", "b"], ["N", "n"], ["M", "m"], [",", ","], [".", "."], ["/", "/"],
          ["1", "1"], ["4", "4"], ["8", "8"],
          ["%{BKY_EVENT_KEY_SPACE}", " "]
        ]
      },
      {
        "type": "field_dropdown",
        "name": "ACTION",
        "options": [
          ["%{BKY_EVENT_ACTION_DOWN}", "down"],
          ["%{BKY_EVENT_ACTION_UP}", "up"]
        ]
      }
    ],
    "message1": "%{BKY_WAVECODE_DO} %1",
    "args1": [
      { "type": "input_statement", "name": "DO" }
    ],
    "colour": "%{BKY_PC_KEYBOARD_HUE}",
    "tooltip": "%{BKY_EVENT_KEY_TOOLTIP}",
    "hat": "cap"
  },

  // --- 2. MIDI 事件 ---
  {
    "type": "wc_midi_on_note",
    "message0": "%{BKY_MIDI_ON_NOTE}",
    "args0": [
      { "type": "field_variable", "name": "CH", "variable": "ch" },
      { "type": "field_variable", "name": "NOTE", "variable": "note" },
      { "type": "field_variable", "name": "VEL", "variable": "vel" }
    ],
    "message1": "%{BKY_WAVECODE_DO} %1",
    "args1": [
      { "type": "input_statement", "name": "DO" }
    ],
    "colour": "%{BKY_MIDI_HUE}",
    "tooltip": "%{BKY_MIDI_ON_NOTE_TOOLTIP}",
    "helpUrl": "launchpad",
    "hat": "cap"
  },
  {
    "type": "wc_midi_on_note_off",
    "message0": "%{BKY_MIDI_OFF_NOTE}",
    "args0": [
      { "type": "field_variable", "name": "CH", "variable": "ch" },
      { "type": "field_variable", "name": "NOTE", "variable": "note" },
      { "type": "field_variable", "name": "VEL", "variable": "vel" }
    ],
    "message1": "%{BKY_WAVECODE_DO} %1",
    "args1": [
      { "type": "input_statement", "name": "DO" }
    ],
    "colour": "%{BKY_MIDI_HUE}",
    "tooltip": "%{BKY_MIDI_OFF_NOTE_TOOLTIP}",
    "helpUrl": "launchpad",
    "hat": "cap"
  },
  {
    "type": "wc_midi_on_cc",
    "message0": "%{BKY_MIDI_ON_CC}",
    "args0": [
      { "type": "field_variable", "name": "CH", "variable": "ch" },
      { "type": "field_variable", "name": "NO", "variable": "number" },
      { "type": "field_variable", "name": "VAL", "variable": "value" }
    ],
    "message1": "%{BKY_WAVECODE_DO} %1",
    "args1": [
      { "type": "input_statement", "name": "DO" }
    ],
    "colour": "%{BKY_MIDI_HUE}",
    "tooltip": "%{BKY_MIDI_ON_CC_TOOLTIP}",
    "helpUrl": "launchpad",
    "hat": "cap"
  },
  {
    "type": "wc_midi_send_note",
    "message0": "%{BKY_WC_MIDI_SEND_NOTE}",
    "args0": [
      { "type": "input_value", "name": "NOTE", "check": ["Number", "String"] },
      { "type": "input_value", "name": "VEL", "check": "Number" },
      { "type": "input_value", "name": "CH", "check": "Number" },
      { "type": "field_dropdown", "name": "DEVICE", "options": [["%{BKY_MIDI_ALL_DEVICES}", "All"]] }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_MIDI_HUE}",
    "tooltip": "%{BKY_WC_MIDI_SEND_NOTE_TOOLTIP}",
    "extensions": ["wc_midi_output_sync"]
  },
  {
    "type": "wc_midi_send_note_off",
    "message0": "%{BKY_WC_MIDI_SEND_NOTE_OFF}",
    "args0": [
      { "type": "input_value", "name": "NOTE", "check": ["Number", "String"] },
      { "type": "input_value", "name": "CH", "check": "Number" },
      { "type": "field_dropdown", "name": "DEVICE", "options": [["%{BKY_MIDI_ALL_DEVICES}", "All"]] }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_MIDI_HUE}",
    "tooltip": "%{BKY_WC_MIDI_SEND_NOTE_OFF_TOOLTIP}",
    "extensions": ["wc_midi_output_sync"]
  },
  {
    "type": "wc_midi_send_cc",
    "message0": "%{BKY_WC_MIDI_SEND_CC}",
    "args0": [
      { "type": "input_value", "name": "NO", "check": "Number" },
      { "type": "input_value", "name": "VAL", "check": "Number" },
      { "type": "input_value", "name": "CH", "check": "Number" },
      { "type": "field_dropdown", "name": "DEVICE", "options": [["%{BKY_MIDI_ALL_DEVICES}", "All"]] }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_MIDI_HUE}",
    "tooltip": "%{BKY_WC_MIDI_SEND_CC_TOOLTIP}",
    "extensions": ["wc_midi_output_sync"]
  },
  {
    "type": "wc_midi_note_to_freq",
    "message0": "%{BKY_WC_MIDI_NOTE_TO_FREQ}",
    "args0": [{ "type": "input_value", "name": "NOTE", "check": ["Number", "String"] }],
    "output": "Number",
    "colour": "%{BKY_MIDI_HUE}",
    "tooltip": "%{BKY_WC_MIDI_NOTE_TO_FREQ_TOOLTIP}"
  },
  {
    "type": "wc_midi_note_to_name",
    "message0": "%{BKY_WC_MIDI_NOTE_TO_NAME}",
    "args0": [{ "type": "input_value", "name": "NOTE", "check": "Number" }],
    "output": "String",
    "colour": "%{BKY_MIDI_HUE}",
    "tooltip": "%{BKY_WC_MIDI_NOTE_TO_NAME_TOOLTIP}"
  },
  {
    "type": "wc_midi_is_pressed",
    "message0": "%{BKY_WC_MIDI_IS_PRESSED}",
    "args0": [{ "type": "input_value", "name": "NOTE", "check": ["Number", "String"] }],
    "output": "Boolean",
    "colour": "%{BKY_MIDI_HUE}",
    "tooltip": "%{BKY_WC_MIDI_IS_PRESSED_TOOLTIP}"
  },
  {
    "type": "wc_midi_lp_xy_to_note",
    "message0": "%{BKY_MIDI_LP_XY_TO_NOTE}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "MODE",
        "options": [
          ["%{BKY_MIDI_LP_MODE_XY}", "XY"],
          ["%{BKY_MIDI_LP_MODE_NOTE}", "NOTE"]
        ]
      },
      { "type": "input_value", "name": "X", "check": "Number" },
      { "type": "input_value", "name": "Y", "check": "Number" }
    ],
    "output": "Number",
    "inputsInline": true,
    "colour": "%{BKY_MIDI_HUE}",
    "tooltip": "%{BKY_MIDI_LP_XY_TO_NOTE_TOOLTIP}",
    "helpUrl": "launchpad"
  }
]);

// --- MIDI 輸出裝置連動選單擴充 (#nyx) ---
Blockly.Extensions.register('wc_midi_output_sync', function() {
  const deviceField = this.getField('DEVICE');
  if (deviceField) {
    deviceField.menuGenerator_ = function() {
      if (window.WaveCode && window.WaveCode.getMidiOutputOptions) {
        const options = window.WaveCode.getMidiOutputOptions();
        if (options && options.length > 0) return options;
      }
      const allLabel = Blockly.Msg['MIDI_ALL_DEVICES'] || '所有裝置';
      return [[allLabel, 'All']];
    };
  }
});
