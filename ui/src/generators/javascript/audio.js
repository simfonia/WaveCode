/**
 * WaveCode Audio JavaScript Generators (Polyphonic Version)
 */

// --- 1. 核心鏈條產生器 ---

Blockly.JavaScript.forBlock['audio_oscillator'] = function(block) {
  return ""; 
};

Blockly.JavaScript.forBlock['audio_dac'] = function(block) {
  return "";
};

// --- 2. 演奏產生器 (對齊 Processing 邏輯) ---

Blockly.JavaScript.forBlock['audio_play_note'] = function(block) {
  const freq = Blockly.JavaScript.valueToCode(block, 'FREQ', Blockly.JavaScript.ORDER_ATOMIC) || '440';
  const dur = Blockly.JavaScript.valueToCode(block, 'DUR', Blockly.JavaScript.ORDER_ATOMIC) || '500';
  // 直接呼叫 API 層的 playNote，它會處理 trigger 與 release
  return `await WaveCode.playNote(${freq}, ${dur});\n`;
};

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
