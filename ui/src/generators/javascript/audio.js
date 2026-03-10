/**
 * WaveCode Audio JavaScript Generators
 */

// --- 1. 核心鏈條產生器 (不產出代碼，由 Compiler 分析) ---

Blockly.JavaScript.forBlock['audio_oscillator'] = function(block) {
  return ""; 
};

Blockly.JavaScript.forBlock['audio_dac'] = function(block) {
  return "";
};

// --- 2. 參數控制產生器 ---

Blockly.JavaScript.forBlock['audio_set_frequency'] = function(block) {
  const id = block.getFieldValue('ID');
  const freq = Blockly.JavaScript.valueToCode(block, 'FREQ', Blockly.JavaScript.ORDER_ATOMIC) || '440';
  return `await WaveCode.setFrequency(${freq}, '${id}');\n`;
};

Blockly.JavaScript.forBlock['audio_play_sine'] = Blockly.JavaScript.forBlock['audio_set_frequency'];

Blockly.JavaScript.forBlock['audio_note'] = function(block) {
  const code = block.getFieldValue('NOTE');
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript.forBlock['audio_wait'] = function(block) {
  const ms = Blockly.JavaScript.valueToCode(block, 'MS', Blockly.JavaScript.ORDER_ATOMIC) || '500';
  return `await WaveCode.sleep(${ms});\n`;
};

Blockly.JavaScript.forBlock['audio_stop'] = function(block) {
  return `await WaveCode.stop();\n`;
};
