/**
 * WaveCode Generator: Audio Instruments
 */

Blockly.JavaScript.forBlock['audio_instrument'] = function(block) {
  const id = block.getFieldValue('ID');
  // 樂器定義由 Compiler 靜態解析，產生器傳回註解
  return `// Instrument defined: ${id}\n`;
};

Blockly.JavaScript.forBlock['audio_component_osc'] = function(block) { return ""; };
Blockly.JavaScript.forBlock['audio_component_adsr'] = function(block) { return ""; };
Blockly.JavaScript.forBlock['audio_component_filter'] = function(block) { return ""; };
Blockly.JavaScript.forBlock['audio_component_volume'] = function(block) { return ""; };
