/**
 * WaveCode Generator: Performance Commands (執行用 JS 模式)
 */

Blockly.JavaScript.forBlock['wc_perform'] = function(block) {
  const code = Blockly.JavaScript.statementToCode(block, 'DO');
  // 由於是 AsyncFunction，我們可以直接寫代碼
  return code;
};

Blockly.JavaScript.forBlock['wc_play_note'] = function(block) {
  const freq = Blockly.JavaScript.valueToCode(block, 'FREQ', Blockly.JavaScript.ORDER_ATOMIC) || '440';
  const dur = Blockly.JavaScript.valueToCode(block, 'DUR', Blockly.JavaScript.ORDER_ATOMIC) || '500';
  const inst = block.getFieldValue('INSTRUMENT') || 'none';
  return `await WaveCode.playNote(${freq}, ${dur}, "${inst}");\n`;
};

Blockly.JavaScript.forBlock['wc_play_note_async'] = function(block) {
  const freq = Blockly.JavaScript.valueToCode(block, 'FREQ', Blockly.JavaScript.ORDER_ATOMIC) || '440';
  const dur = Blockly.JavaScript.valueToCode(block, 'DUR', Blockly.JavaScript.ORDER_ATOMIC) || '500';
  const inst = block.getFieldValue('INSTRUMENT') || 'none';
  return `WaveCode.triggerNote(${freq}, "${inst}", 0, ${dur});\n`;
};

Blockly.JavaScript.forBlock['wc_wait'] = function(block) {
  const ms = Blockly.JavaScript.valueToCode(block, 'MS', Blockly.JavaScript.ORDER_ATOMIC) || '500';
  return `await WaveCode.wait(${ms});\n`;
};

Blockly.JavaScript.forBlock['wc_note'] = function(block) {
  const note = block.getFieldValue('NOTE');
  const octave = block.getFieldValue('OCTAVE');
  // 轉為字串頻率/音名格式
  return [`"${note}${octave}"`, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript.forBlock['wc_stop'] = function(block) {
  return `WaveCode.stopAudio();\n`;
};

Blockly.JavaScript.forBlock['wc_transport_set_bpm'] = function(block) {
  const bpm = Blockly.JavaScript.valueToCode(block, 'BPM', Blockly.JavaScript.ORDER_ATOMIC) || '120';
  return `await WaveCode.setBPM(${bpm});\n`;
};

Blockly.JavaScript.forBlock['wc_select_current_instrument'] = function(block) {
  const inst = block.getFieldValue('INSTRUMENT');
  return `await WaveCode.setCurrentInstrument("${inst}");\n`;
};

Blockly.JavaScript.forBlock['wc_play_melody'] = function(block) {
  const score = block.getFieldValue('MELODY'); // 注意：積木欄位名是 MELODY
  const inst = block.getFieldValue('INSTRUMENT');
  // 將換行符號轉義
  const cleanScore = score.replace(/\n/g, '\\n');
  return `await WaveCode.playMelody("${cleanScore}", "${inst}");\n`;
};

Blockly.JavaScript.forBlock['wc_define_chord'] = function(block) {
  const name = block.getFieldValue('NAME');
  const notes = block.getFieldValue('NOTES');
  return `await WaveCode.defineChord("${name}", "${notes}");\n`;
};

Blockly.JavaScript.forBlock['wc_play_chord'] = function(block) {
  const name = block.getFieldValue('CHORD'); // 注意：積木欄位名是 CHORD
  const dur = Blockly.JavaScript.valueToCode(block, 'DUR', Blockly.JavaScript.ORDER_ATOMIC) || '500';
  const inst = block.getFieldValue('INSTRUMENT');
  return `await WaveCode.playChord("${name}", ${dur}, "${inst}");\n`;
};

Blockly.JavaScript.forBlock['wc_init'] = function(block) {
  const code = Blockly.JavaScript.statementToCode(block, 'DO');
  return code;
};

Blockly.JavaScript.forBlock['wc_text_print'] = function(block) {
    const text = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_ATOMIC) || "''";
    return `console.log(${text});\n`;
};

Blockly.JavaScript.forBlock['wc_comment'] = function(block) {
    const text = block.getFieldValue('TEXT') || block.getFieldValue('COMMENT');
    return `// ${text}\n`;
};

Blockly.JavaScript.forBlock['wc_serial_data_received'] = function(block) {
  // 目前序列埠在 Web Audio 模式下尚無全域 Event 監聽實作，暫產生註解代碼
  return `// OnSerialData Event\n`;
};
