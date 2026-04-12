/**
 * WaveCode Generator: Audio Instruments (執行用 JS 模式)
 */

Blockly.JavaScript.forBlock['wc_instrument'] = function(block) {
  const id = block.getFieldValue('ID');
  const chain = Blockly.JavaScript.statementToCode(block, 'CHAIN');
  // 將 DSL 結構藏在註解中，供 side panel 提取，但不影響執行
  return `// Instrument("${id}") {\n${chain}// };\n\n`;
};

Blockly.JavaScript.forBlock['wc_master'] = function(block) {
  const chain = Blockly.JavaScript.statementToCode(block, 'CHAIN');
  return `// MasterOut {\n${chain}// };\n\n`;
};

Blockly.JavaScript.forBlock['wc_component_osc'] = function(block) {
  const waves = ["Sine", "Saw", "Square", "Triangle"];
  const wave = waves[block.getFieldValue('WAVE')] || "Sine";
  return `  // >> Oscillator(${wave})\n`;
};

Blockly.JavaScript.forBlock['wc_create_additive_synth'] = function(block) {
  return `  // >> AdditiveSynth(Partials: ${block.itemCount_ || 0})\n`;
};

Blockly.JavaScript.forBlock['wc_component_sampler'] = function(block) {
  const sample = block.getFieldValue('SAMPLE_ID');
  return `  // >> Sampler("${sample}")\n`;
};

Blockly.JavaScript.forBlock['wc_component_adsr'] = function(block) {
  const a = block.getFieldValue('A');
  const d = block.getFieldValue('D');
  const s = block.getFieldValue('S');
  const r = block.getFieldValue('R');
  return `  // >> ADSR(A:${a}, D:${d}, S:${s}, R:${r})\n`;
};

Blockly.JavaScript.forBlock['wc_component_volume'] = function(block) {
  const vol = block.getFieldValue('VOL');
  return `  // >> Volume(${vol}%)\n`;
};

Blockly.JavaScript.forBlock['wc_effect_filter'] = function(block) {
  const type = block.getFieldValue('TYPE');
  const freq = Blockly.JavaScript.valueToCode(block, 'FREQ', Blockly.JavaScript.ORDER_ATOMIC) || '1000';
  const q = Blockly.JavaScript.valueToCode(block, 'Q', Blockly.JavaScript.ORDER_ATOMIC) || '1';
  return `  // >> Filter(${type}, freq:${freq}, Q:${q})\n`;
};

Blockly.JavaScript.forBlock['wc_effect_delay'] = function(block) {
  const time = Blockly.JavaScript.valueToCode(block, 'TIME', Blockly.JavaScript.ORDER_ATOMIC) || '0.5';
  const feedback = Blockly.JavaScript.valueToCode(block, 'FEEDBACK', Blockly.JavaScript.ORDER_ATOMIC) || '0.5';
  return `  // >> Delay(time:${time}s, fb:${feedback})\n`;
};

Blockly.JavaScript.forBlock['wc_effect_bitcrush'] = function(block) {
  const bits = Blockly.JavaScript.valueToCode(block, 'BITS', Blockly.JavaScript.ORDER_ATOMIC) || '8';
  return `  // >> BitCrush(${bits}-bit)\n`;
};

Blockly.JavaScript.forBlock['wc_effect_distortion'] = function(block) {
  const amount = Blockly.JavaScript.valueToCode(block, 'AMOUNT', Blockly.JavaScript.ORDER_ATOMIC) || '10';
  return `  // >> Distortion(amt:${amount})\n`;
};

Blockly.JavaScript.forBlock['wc_effect_compressor'] = function(block) {
  const thresh = Blockly.JavaScript.valueToCode(block, 'THRESH', Blockly.JavaScript.ORDER_ATOMIC) || '-24';
  const ratio = Blockly.JavaScript.valueToCode(block, 'RATIO', Blockly.JavaScript.ORDER_ATOMIC) || '12';
  const makeup = Blockly.JavaScript.valueToCode(block, 'MAKEUP', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  return `  // >> Compressor(thresh:${thresh}dB, ratio:${ratio}:1, makeup:${makeup}dB)\n`;
};

Blockly.JavaScript.forBlock['wc_effect_reverb'] = function(block) {
  const seconds = Blockly.JavaScript.valueToCode(block, 'SECONDS', Blockly.JavaScript.ORDER_ATOMIC) || '3';
  const decay = Blockly.JavaScript.valueToCode(block, 'DECAY', Blockly.JavaScript.ORDER_ATOMIC) || '2';
  const mix = Blockly.JavaScript.valueToCode(block, 'MIX', Blockly.JavaScript.ORDER_ATOMIC) || '0.5';
  return `  // >> Reverb(sec:${seconds}s, decay:${decay}, mix:${mix})\n`;
};
