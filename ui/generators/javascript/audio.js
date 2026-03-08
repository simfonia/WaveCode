/**
 * WaveCode Audio JavaScript Generators
 */

Blockly.JavaScript.forBlock['audio_play_sine'] = function(block) {
  const freq = Blockly.JavaScript.valueToCode(block, 'FREQ', Blockly.JavaScript.ORDER_ATOMIC) || '440';
  return `await WaveCode.setFrequency(${freq});\n`;
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
