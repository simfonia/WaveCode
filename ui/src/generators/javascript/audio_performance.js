/**
 * WaveCode Generator: Audio Performance
 */

Blockly.JavaScript.forBlock['wc_init'] = function(block) {
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');
  return branch;
};

Blockly.JavaScript.forBlock['wc_play_note'] = function(block) {
  const freq = Blockly.JavaScript.valueToCode(block, 'FREQ', Blockly.JavaScript.ORDER_ATOMIC) || '440';
  const dur = Blockly.JavaScript.valueToCode(block, 'DUR', Blockly.JavaScript.ORDER_ATOMIC) || '500';
  const inst = block.getFieldValue('INSTRUMENT') || 'none';
  // 同步模式：播放並等待時間軸前進
  return `await WaveCode.playNote(${freq}, ${dur}, '${inst}');\nawait WaveCode.sleep(${dur}, _id);\n`;
};

Blockly.JavaScript.forBlock['wc_play_note_async'] = function(block) {
  const freq = Blockly.JavaScript.valueToCode(block, 'FREQ', Blockly.JavaScript.ORDER_ATOMIC) || '440';
  const dur = Blockly.JavaScript.valueToCode(block, 'DUR', Blockly.JavaScript.ORDER_ATOMIC) || '500';
  const inst = block.getFieldValue('INSTRUMENT') || 'none';
  // 異步模式：預約發聲與釋放，但不移動時間軸 (不 await sleep)
  return `await WaveCode.playNote(${freq}, ${dur}, '${inst}');\n`;
};

Blockly.JavaScript.forBlock['wc_note'] = function(block) {
  const note = block.getFieldValue('NOTE');
  const octave = block.getFieldValue('OCTAVE');
  const code = `'${note}${octave}'`;
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript.forBlock['wc_wait'] = function(block) {
  const ms = Blockly.JavaScript.valueToCode(block, 'MS', Blockly.JavaScript.ORDER_ATOMIC) || '500';
  return `await WaveCode.sleep(${ms}, _id);\n`;
};

Blockly.JavaScript.forBlock['wc_stop'] = function(block) {
  return `await WaveCode.stopAudio();\n`;
};

Blockly.JavaScript.forBlock['wc_define_chord'] = function(block) {
  const name = block.getFieldValue('NAME');
  const notes = (block.getFieldValue('NOTES') || "").split(',').map(s => s.trim());
  return `await WaveCode.defineChord("${name}", ${JSON.stringify(notes)});\n`;
};

Blockly.JavaScript.forBlock['wc_play_chord'] = function(block) {
  const chord = block.getFieldValue('CHORD');
  const dur = Blockly.JavaScript.valueToCode(block, 'DUR', Blockly.JavaScript.ORDER_ATOMIC) || '500';
  const inst = block.getFieldValue('INSTRUMENT') || 'none';
  return `await WaveCode.playChord("${chord}", ${dur}, '${inst}');\nawait WaveCode.sleep(${dur}, _id);\n`;
};

Blockly.JavaScript.forBlock['wc_transport_set_bpm'] = function(block) {
  const bpm = Blockly.JavaScript.valueToCode(block, 'BPM', Blockly.JavaScript.ORDER_ATOMIC) || '120';
  return `await WaveCode.setBPM(${bpm});\n`;
};

Blockly.JavaScript.forBlock['wc_select_current_instrument'] = function(block) {
  const name = block.getFieldValue('INSTRUMENT');
  return `await WaveCode.setCurrentInstrument("${name}");\n`;
};

Blockly.JavaScript.forBlock['wc_play_melody'] = function(block) {
  const melody = block.getFieldValue('MELODY') || "";
  const inst = block.getFieldValue('INSTRUMENT') || 'none';
  const cleanMelody = melody.replace(/\n/g, ' ').replace(/"/g, '\\"');
  return `await WaveCode.playMelody("${cleanMelody}", "${inst}");\n`;
};

Blockly.JavaScript.forBlock['wc_perform'] = function(block) {
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');
  // 僅產生內部代碼，外層由 ToolbarManager 統一包裝
  return branch;
};
