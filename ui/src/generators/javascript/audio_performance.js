/**
 * WaveCode Generator: Audio Performance
 */

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
  const code = block.getFieldValue('NOTE');
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript.forBlock['wc_wait'] = function(block) {
  const ms = Blockly.JavaScript.valueToCode(block, 'MS', Blockly.JavaScript.ORDER_ATOMIC) || '500';
  return `await WaveCode.sleep(${ms}, _id);\n`;
};

Blockly.JavaScript.forBlock['wc_stop'] = function(block) {
  return `await WaveCode.stopAudio();\n`;
};

Blockly.JavaScript.forBlock['wc_perform'] = function(block) {
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');
  // 僅產生內部代碼，外層由 ToolbarManager 統一包裝
  return branch;
};
