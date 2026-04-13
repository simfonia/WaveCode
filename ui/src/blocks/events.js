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
          ["Space", " "]
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

// --- Generators ---

Blockly.JavaScript.forBlock['wc_midi_lp_xy_to_note'] = function(block) {
  const mode = block.getFieldValue('MODE');
  const x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  const y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  
  let formula = "";
  if (mode === 'XY') {
    // 經典 Launchpad (S/Classic) 映射公式: Y * 16 + X
    formula = `(parseInt(${y}) * 16 + parseInt(${x}))`;
  } else {
    // 現代 Launchpad (MK2/X/Pro) Note 模式公式: 11 + X + (Y * 10)
    formula = `(11 + parseInt(${x}) + (parseInt(${y}) * 10))`;
  }
  
  return [formula, Blockly.JavaScript.ORDER_MULTIPLICATION];
};

Blockly.JavaScript.forBlock['wc_key_event'] = function(block) {
  const key = block.getFieldValue('KEY');
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');
  
  return `
window.addEventListener('keydown', async (e) => {
  // 只有當按鍵相符且當前腳本 ID 仍有效時才執行
  if (e.key.toLowerCase() === "${key.toLowerCase()}") {
    const _id = typeof _execId !== 'undefined' ? _execId : window.WaveCode._execId;
    if (window.WaveCode.isScriptCancelled(_id)) return;
    const WaveCode = window.WaveCode.createTrack();
    try {
      ${branch}
    } catch (err) {
      if (err.message !== 'Script cancelled') {
        const msg = err.message.includes('迴圈次數過多') ? '偵測到疑似無窮迴圈，系統已自動終止鍵盤事件。' : err.message;
        WaveCode.appendLog('鍵盤事件錯誤: ' + msg, 'error');
      }
    }
  }
}, { once: false });
`;
};

Blockly.JavaScript.forBlock['wc_midi_on_note'] = function(block) {
  const varCh = Blockly.JavaScript.nameDB_.getName(block.getFieldValue('CH'), Blockly.Variables.NAME_TYPE);
  const varNote = Blockly.JavaScript.nameDB_.getName(block.getFieldValue('NOTE'), Blockly.Variables.NAME_TYPE);
  const varVel = Blockly.JavaScript.nameDB_.getName(block.getFieldValue('VEL'), Blockly.Variables.NAME_TYPE);
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');

  return `
window.WaveCode.registerMidiHandler(async (type, data, id) => {
  if (window.WaveCode.isScriptCancelled(id)) return;
  const _id = id;
  if (type === 'noteon') {
    const WaveCode = window.WaveCode.createTrack();
    try {
      WaveCode.setVar("${varCh}", data.channel);
      WaveCode.setVar("${varNote}", data.note);
      WaveCode.setVar("${varVel}", data.velocity);
      ${branch}
    } catch (err) {
      if (err.message !== 'Script cancelled') {
        const msg = err.message.includes('迴圈次數過多') ? '偵測到疑似無窮迴圈，系統已自動終止 MIDI 事件。' : err.message;
        WaveCode.appendLog('MIDI 錯誤: ' + msg, 'error');
      }
    }
  }
});
`;
};

Blockly.JavaScript.forBlock['wc_midi_on_note_off'] = function(block) {
  const varCh = Blockly.JavaScript.nameDB_.getName(block.getFieldValue('CH'), Blockly.Variables.NAME_TYPE);
  const varNote = Blockly.JavaScript.nameDB_.getName(block.getFieldValue('NOTE'), Blockly.Variables.NAME_TYPE);
  const varVel = Blockly.JavaScript.nameDB_.getName(block.getFieldValue('VEL'), Blockly.Variables.NAME_TYPE);
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');

  return `
window.WaveCode.registerMidiHandler(async (type, data, id) => {
  if (window.WaveCode.isScriptCancelled(id)) return;
  const _id = id;
  if (type === 'noteoff') {
    const WaveCode = window.WaveCode.createTrack();
    try {
      WaveCode.setVar("${varCh}", data.channel);
      WaveCode.setVar("${varNote}", data.note);
      WaveCode.setVar("${varVel}", data.velocity);
      ${branch}
    } catch (err) {
      if (err.message !== 'Script cancelled') {
        const msg = err.message.includes('迴圈次數過多') ? '偵測到疑似無窮迴圈，系統已自動終止 MIDI 放開事件。' : err.message;
        WaveCode.appendLog('MIDI Off 錯誤: ' + msg, 'error');
      }
    }
  }
});
`;
};

Blockly.JavaScript.forBlock['wc_midi_on_cc'] = function(block) {
  const varCh = Blockly.JavaScript.nameDB_.getName(block.getFieldValue('CH'), Blockly.Variables.NAME_TYPE);
  const varNo = Blockly.JavaScript.nameDB_.getName(block.getFieldValue('NO'), Blockly.Variables.NAME_TYPE);
  const varVal = Blockly.JavaScript.nameDB_.getName(block.getFieldValue('VAL'), Blockly.Variables.NAME_TYPE);
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');

  return `
window.WaveCode.registerMidiHandler(async (type, data, id) => {
  if (window.WaveCode.isScriptCancelled(id)) return;
  const _id = id;
  if (type === 'cc') {
    const WaveCode = window.WaveCode.createTrack();
    try {
      WaveCode.setVar("${varCh}", data.channel);
      WaveCode.setVar("${varNo}", data.number);
      WaveCode.setVar("${varVal}", data.value);
      ${branch}
    } catch (err) {
      if (err.message !== 'Script cancelled') {
        const msg = err.message.includes('迴圈次數過多') ? '偵測到疑似無窮迴圈，系統已自動終止 MIDI 控制事件。' : err.message;
        WaveCode.appendLog('MIDI CC 錯誤: ' + msg, 'error');
      }
    }
  }
});
`;
};
