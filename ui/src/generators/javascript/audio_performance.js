/**
 * WaveCode Generator: Performance Commands (DSL 模式)
 */

Blockly.JavaScript.forBlock['wc_perform'] = function(block) {
  const code = Blockly.JavaScript.statementToCode(block, 'DO');
  return `Perform {\n${code}};\n`;
};

Blockly.JavaScript.forBlock['wc_play_note'] = function(block) {
  const freq = Blockly.JavaScript.valueToCode(block, 'FREQ', Blockly.JavaScript.ORDER_ATOMIC) || '440';
  const dur = Blockly.JavaScript.valueToCode(block, 'DUR', Blockly.JavaScript.ORDER_ATOMIC) || '500';
  const inst = block.getFieldValue('INST');
  return `  play_note(note: ${freq}, dur: ${dur}ms, inst: "${inst}");\n`;
};

Blockly.JavaScript.forBlock['wc_play_note_async'] = function(block) {
  const freq = Blockly.JavaScript.valueToCode(block, 'FREQ', Blockly.JavaScript.ORDER_ATOMIC) || '440';
  const dur = Blockly.JavaScript.valueToCode(block, 'DUR', Blockly.JavaScript.ORDER_ATOMIC) || '500';
  const inst = block.getFieldValue('INST');
  return `  spawn_note(note: ${freq}, dur: ${dur}ms, inst: "${inst}");\n`;
};

Blockly.JavaScript.forBlock['wc_wait'] = function(block) {
  const ms = Blockly.JavaScript.valueToCode(block, 'MS', Blockly.JavaScript.ORDER_ATOMIC) || '500';
  return `  sleep(${ms}ms);\n`;
};

Blockly.JavaScript.forBlock['wc_note'] = function(block) {
  const note = block.getFieldValue('NOTE');
  const octave = block.getFieldValue('OCTAVE');
  return [`"${note}${octave}"`, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript.forBlock['wc_stop'] = function(block) {
  return `  panic_stop();\n`;
};

Blockly.JavaScript.forBlock['wc_transport_set_bpm'] = function(block) {
  const bpm = Blockly.JavaScript.valueToCode(block, 'BPM', Blockly.JavaScript.ORDER_ATOMIC) || '120';
  return `  set_bpm(${bpm});\n`;
};

Blockly.JavaScript.forBlock['wc_select_current_instrument'] = function(block) {
  const inst = block.getFieldValue('INST');
  return `  select_instrument("${inst}");\n`;
};

Blockly.JavaScript.forBlock['wc_play_melody'] = function(block) {
  const score = block.getFieldValue('SCORE');
  const inst = block.getFieldValue('INST');
  return `  play_melody("${score}", inst: "${inst}");\n`;
};

Blockly.JavaScript.forBlock['wc_define_chord'] = function(block) {
  const name = block.getFieldValue('NAME');
  const notes = block.getFieldValue('NOTES');
  return `define_chord("${name}", [${notes}]);\n`;
};

Blockly.JavaScript.forBlock['wc_play_chord'] = function(block) {
  const name = block.getFieldValue('NAME');
  const dur = Blockly.JavaScript.valueToCode(block, 'DUR', Blockly.JavaScript.ORDER_ATOMIC) || '500';
  const inst = block.getFieldValue('INST');
  return `  play_chord("${name}", dur: ${dur}ms, inst: "${inst}");\n`;
};

Blockly.JavaScript.forBlock['wc_init'] = function(block) {
  const code = Blockly.JavaScript.statementToCode(block, 'DO');
  return `OnInit {\n${code}};\n`;
};

Blockly.JavaScript.forBlock['wc_text_print'] = function(block) {
    const text = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_ATOMIC) || "''";
    return `  print(${text});\n`;
};

Blockly.JavaScript.forBlock['wc_comment'] = function(block) {
    const text = block.getFieldValue('TEXT');
    return `  // ${text}\n`;
};
