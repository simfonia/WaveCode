/**
 * WaveCode Generator: Events (鍵盤、MIDI、序列埠)
 * [修復]：徹底解決 "Cannot access 'WaveCode' before initialization" 錯誤。
 * [優化]：確保所有事件回呼皆能正確遮蔽作用域並檢查腳本有效性。
 */

Blockly.JavaScript.forBlock['wc_key_event'] = function(block) {
  const key = block.getFieldValue('KEY');
  const action = block.getFieldValue('ACTION') || 'down';
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');
  
  return `
window.WaveCode.registerKeyHandler(async (type, pressedKey, id, track) => {
  if (type === "${action}" && pressedKey === "${key.toLowerCase()}") {
    if (track.isScriptCancelled(id)) return;
    const WaveCode = track; 
    const _id = id;
    try {
      ${branch}
    } catch (err) {
      if (err.message !== 'Script cancelled') {
        const msg = err.message.includes('迴圈次數過多') ? '偵測到疑似無窮迴圈，系統已自動終止鍵盤事件。' : err.message;
        WaveCode.appendLog('鍵盤事件錯誤: ' + msg, 'error');
      }
    }
  }
});
`;
};

Blockly.JavaScript.forBlock['wc_midi_on_note'] = function(block) {
  const varCh = Blockly.JavaScript.nameDB_.getName(block.getFieldValue('CH'), Blockly.Variables.NAME_TYPE);
  const varNote = Blockly.JavaScript.nameDB_.getName(block.getFieldValue('NOTE'), Blockly.Variables.NAME_TYPE);
  const varVel = Blockly.JavaScript.nameDB_.getName(block.getFieldValue('VEL'), Blockly.Variables.NAME_TYPE);
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');

  return `
window.WaveCode.registerMidiHandler(async (type, data, id, track) => {
  if (type === 'noteon') {
    if (track.isScriptCancelled(id)) return;
    const WaveCode = track;
    const _id = id;
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
window.WaveCode.registerMidiHandler(async (type, data, id, track) => {
  if (type === 'noteoff') {
    if (track.isScriptCancelled(id)) return;
    const WaveCode = track;
    const _id = id;
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
window.WaveCode.registerMidiHandler(async (type, data, id, track) => {
  if (type === 'cc') {
    if (track.isScriptCancelled(id)) return;
    const WaveCode = track;
    const _id = id;
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

Blockly.JavaScript.forBlock['wc_midi_send_note'] = function(block) {
  const note = Blockly.JavaScript.valueToCode(block, 'NOTE', Blockly.JavaScript.ORDER_ATOMIC) || '60';
  const vel = Blockly.JavaScript.valueToCode(block, 'VEL', Blockly.JavaScript.ORDER_ATOMIC) || '100';
  const ch = Blockly.JavaScript.valueToCode(block, 'CH', Blockly.JavaScript.ORDER_ATOMIC) || '1';
  const device = block.getFieldValue('DEVICE');
  return `window.WaveCode.sendMidiNote(${note}, ${vel}, ${ch}, "${device}");\n`;
};

Blockly.JavaScript.forBlock['wc_midi_send_note_off'] = function(block) {
  const note = Blockly.JavaScript.valueToCode(block, 'NOTE', Blockly.JavaScript.ORDER_ATOMIC) || '60';
  const ch = Blockly.JavaScript.valueToCode(block, 'CH', Blockly.JavaScript.ORDER_ATOMIC) || '1';
  const device = block.getFieldValue('DEVICE');
  return `window.WaveCode.sendMidiNoteOff(${note}, ${ch}, "${device}");\n`;
};

Blockly.JavaScript.forBlock['wc_midi_send_cc'] = function(block) {
  const no = Blockly.JavaScript.valueToCode(block, 'NO', Blockly.JavaScript.ORDER_ATOMIC) || '1';
  const val = Blockly.JavaScript.valueToCode(block, 'VAL', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  const ch = Blockly.JavaScript.valueToCode(block, 'CH', Blockly.JavaScript.ORDER_ATOMIC) || '1';
  const device = block.getFieldValue('DEVICE');
  return `window.WaveCode.sendMidiCC(${no}, ${val}, ${ch}, "${device}");\n`;
};

Blockly.JavaScript.forBlock['wc_midi_note_to_freq'] = function(block) {
  const note = Blockly.JavaScript.valueToCode(block, 'NOTE', Blockly.JavaScript.ORDER_ATOMIC) || '60';
  return [`window.WaveCode.MusicUtils.noteToFreq(${note})`, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

Blockly.JavaScript.forBlock['wc_midi_note_to_name'] = function(block) {
  const note = Blockly.JavaScript.valueToCode(block, 'NOTE', Blockly.JavaScript.ORDER_ATOMIC) || '60';
  return [`window.WaveCode.MusicUtils.midiToNoteName(${note})`, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

Blockly.JavaScript.forBlock['wc_midi_is_pressed'] = function(block) {
  const note = Blockly.JavaScript.valueToCode(block, 'NOTE', Blockly.JavaScript.ORDER_ATOMIC) || '60';
  return [`window.WaveCode.isMidiKeyPressed(${note})`, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

Blockly.JavaScript.forBlock['wc_serial_data_received'] = function(block) {
  const varId = block.getFieldValue('DATA');
  const varName = Blockly.JavaScript.nameDB_.getName(varId, Blockly.Variables.NAME_TYPE);
  const code = Blockly.JavaScript.statementToCode(block, 'DO');

  return `
window.WaveCode.registerSerialHandler(async (data, id, track) => {
  if (track.isScriptCancelled(id)) return;
  const WaveCode = track;
  const _id = id;
  try {
    WaveCode.setVar("${varName}", data);
    ${code}
  } catch (err) {
    if (err.message !== 'Script cancelled') {
      const msg = err.message.includes('迴圈次數過多') ? '偵測到疑似無窮迴圈，已終止序列埠事件處理。' : err.message;
      WaveCode.appendLog('序列埠事件錯誤: ' + msg, 'error');
    }
  }
});
`;
};

Blockly.JavaScript.forBlock['wc_serial_init'] = function(block) {
  const port = block.getFieldValue('PORT');
  const baud = block.getFieldValue('BAUD');
  return `await window.WaveCode.openSerial("${port}", ${baud});\n`;
};

Blockly.JavaScript.forBlock['wc_serial_check_ttp'] = function(block) {
  const prefix = block.getFieldValue('PREFIX');
  const key = block.getFieldValue('KEY');
  const code = `window.WaveCode.isTtpTriggered("${prefix}", ${key})`;
  return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

Blockly.JavaScript.forBlock['wc_serial_get_field'] = function(block) {
  const prefix = block.getFieldValue('PREFIX');
  const code = `window.WaveCode.getSerialField("${prefix}")`;
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript.forBlock['wc_midi_lp_xy_to_note'] = function(block) {
  const mode = block.getFieldValue('MODE');
  const x = Blockly.JavaScript.valueToCode(block, 'X', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  const y = Blockly.JavaScript.valueToCode(block, 'Y', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  
  let formula = "";
  if (mode === 'XY') {
    formula = `(parseInt(${y}) * 16 + parseInt(${x}))`;
  } else {
    formula = `(11 + parseInt(${x}) + (parseInt(${y}) * 10))`;
  }
  
  return [formula, Blockly.JavaScript.ORDER_MULTIPLICATION];
};
