/**
 * WaveCode Generator: Audio Performance
 */

Blockly.JavaScript.forBlock['wc_play_note'] = function(block) {
  const freq = Blockly.JavaScript.valueToCode(block, 'FREQ', Blockly.JavaScript.ORDER_ATOMIC) || '440';
  const dur = Blockly.JavaScript.valueToCode(block, 'DUR', Blockly.JavaScript.ORDER_ATOMIC) || '500';
  const inst = block.getFieldValue('INSTRUMENT') || 'default';
  return `await WaveCode.playNote(${freq}, ${dur}, '${inst}');\n`;
};

Blockly.JavaScript.forBlock['wc_play_note_async'] = function(block) {
  const freq = Blockly.JavaScript.valueToCode(block, 'FREQ', Blockly.JavaScript.ORDER_ATOMIC) || '440';
  const dur = Blockly.JavaScript.valueToCode(block, 'DUR', Blockly.JavaScript.ORDER_ATOMIC) || '500';
  const inst = block.getFieldValue('INSTRUMENT') || 'default';
  // 異步觸發不等待
  return `WaveCode.triggerNote(${freq}, ${dur}, '${inst}');\n`;
};

Blockly.JavaScript.forBlock['wc_note'] = function(block) {
  const code = block.getFieldValue('NOTE');
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript.forBlock['wc_wait'] = function(block) {
  const ms = Blockly.JavaScript.valueToCode(block, 'MS', Blockly.JavaScript.ORDER_ATOMIC) || '500';
  return `await WaveCode.sleep(${ms});\n`;
};

Blockly.JavaScript.forBlock['wc_stop'] = function(block) {
  return `await WaveCode.stop();\n`;
};

Blockly.JavaScript.forBlock['wc_perform'] = function(block) {
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');
  // 使用 IIFE 實作異步執行，讓它像 Java 的 Thread 一樣在背景運行
  const code = `(async () => {\n${branch}})();\n`;
  return code;
};
