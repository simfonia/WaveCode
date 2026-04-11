/**
 * WaveCode Generator: Performance Commands (執行用 JS 模式)
 */

Blockly.JavaScript.forBlock['wc_perform'] = function(block) {
  const code = Blockly.JavaScript.statementToCode(block, 'DO');
  return `
(async () => {
  const _id = typeof _execId !== 'undefined' ? _execId : window.WaveCode._execId;
  const _track = window.WaveCode.createTrack();
  const WaveCode = _track; // 作用域遮蔽
  ${code}
})();
`;
};

Blockly.JavaScript.forBlock['wc_play_note'] = function(block) {
  const note = Blockly.JavaScript.valueToCode(block, 'NOTE', Blockly.JavaScript.ORDER_ATOMIC) || '"C4"';
  const dur = Blockly.JavaScript.valueToCode(block, 'DUR', Blockly.JavaScript.ORDER_ATOMIC) || '1';
  const velocity = Blockly.JavaScript.valueToCode(block, 'VELOCITY', Blockly.JavaScript.ORDER_ATOMIC) || '100';
  const inst = block.getFieldValue('INSTRUMENT') || 'none';
  return `await WaveCode.playNote(${note}, ${dur}, "${inst}", ${velocity});\n`;
};

Blockly.JavaScript.forBlock['wc_play_note_async'] = function(block) {
  const note = Blockly.JavaScript.valueToCode(block, 'NOTE', Blockly.JavaScript.ORDER_ATOMIC) || '"C4"';
  const dur = Blockly.JavaScript.valueToCode(block, 'DUR', Blockly.JavaScript.ORDER_ATOMIC) || '1';
  const velocity = Blockly.JavaScript.valueToCode(block, 'VELOCITY', Blockly.JavaScript.ORDER_ATOMIC) || '100';
  const inst = block.getFieldValue('INSTRUMENT') || 'none';
  return `WaveCode.triggerNote(${note}, "${inst}", 0, ${dur}, ${velocity});\n`;
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

Blockly.JavaScript.forBlock['wc_set_effect_param'] = function(block) {
  const inst = block.getFieldValue('INSTRUMENT');
  const type = block.getFieldValue('EFFECT_TYPE');
  const param = block.getFieldValue('PARAM_NAME');
  const val = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  return `await WaveCode.setEffectParam("${inst}", "${type}", "${param}", ${val});\n`;
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

Blockly.JavaScript.forBlock['wc_init'] = function(block) {
  const code = Blockly.JavaScript.statementToCode(block, 'DO');
  return code;
};

Blockly.JavaScript.forBlock['wc_text_print'] = function(block) {
    const text = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_ATOMIC) || "''";
    return `console.log(${text});\n`;
};

Blockly.JavaScript.forBlock['wc_comment'] = function(block) {
    const text = block.getFieldValue('TEXT') || block.getFieldValue('COMMENT') || "";
    // 將每一行都加上 // 註解符號，這能安全處理包含 */ 的文字
    const commentedText = text.split('\n').map(line => `// ${line}`).join('\n');
    return `${commentedText}\n`;
};
Blockly.JavaScript.forBlock['wc_serial_data_received'] = function(block) {
  const varId = block.getFieldValue('DATA');
  const varName = Blockly.JavaScript.nameDB_.getName(varId, Blockly.Variables.NAME_TYPE);
  const code = Blockly.JavaScript.statementToCode(block, 'DO');

  // 使用 WaveCode.registerSerialHandler 訂閱
  // 使用 setVar 賦值，解決變數作用域與宣告問題
  return `
WaveCode.registerSerialHandler(async (data, id) => {
  if (WaveCode.isScriptCancelled(id)) return;
  WaveCode.setVar("${varName}", data);
  ${code}
});
`;
};

Blockly.JavaScript.forBlock['wc_serial_init'] = function(block) {
  const port = block.getFieldValue('PORT');
  const baud = block.getFieldValue('BAUD');
  return `await WaveCode.openSerial("${port}", ${baud});\n`;
};

Blockly.JavaScript.forBlock['wc_serial_check_ttp'] = function(block) {
  const prefix = block.getFieldValue('PREFIX');
  const key = block.getFieldValue('KEY');
  const code = `WaveCode.isTtpTriggered("${prefix}", ${key})`;
  return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
};

Blockly.JavaScript.forBlock['wc_serial_get_field'] = function(block) {
  const prefix = block.getFieldValue('PREFIX');
  const code = `WaveCode.getSerialField("${prefix}")`;
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};

Blockly.JavaScript.forBlock['wc_wait_musical'] = function(block) {
  const val = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC) || '1';
  const unit = block.getFieldValue('UNIT');
  return `await WaveCode.waitMusical(${val}, "${unit}");\n`;
};

Blockly.JavaScript.forBlock['wc_count_in'] = function(block) {
  const measures = Blockly.JavaScript.valueToCode(block, 'MEASURES', Blockly.JavaScript.ORDER_ATOMIC) || '1';
  const beats = Blockly.JavaScript.valueToCode(block, 'BEATS', Blockly.JavaScript.ORDER_ATOMIC) || '4';
  const vel = Blockly.JavaScript.valueToCode(block, 'VELOCITY', Blockly.JavaScript.ORDER_ATOMIC) || '100';
  return `await WaveCode.playCountIn(${measures}, ${beats}, ${vel});\n`;
};

Blockly.JavaScript.forBlock['wc_loop'] = function(block) {
  const interval = block.getFieldValue('INTERVAL') || '1';
  const branch = Blockly.JavaScript.statementToCode(block, 'DO');
  return `
(async () => {
  const _id = typeof _execId !== 'undefined' ? _execId : window.WaveCode._execId;
  const _track = window.WaveCode.createTrack();
  const WaveCode = _track; // 作用域遮蔽
  const _loopInterval = ${interval};
  try {
    while (!WaveCode.isScriptCancelled(_id)) {
      const _startLoopTime = WaveCode._playbackTime;
      WaveCode.checkLoop(_id);
      ${branch}
      
      // 自動補足小節剩餘時間 (預設 4/4 拍)
      const _measureSec = (60 / window.WaveCode._bpm) * 4;
      const _targetEnd = _startLoopTime + (_loopInterval * _measureSec);
      const _waitSec = _targetEnd - WaveCode._playbackTime;
      
      if (_waitSec > 0) {
          await WaveCode.waitMusical(_waitSec, 'SECONDS');
      } else {
          await WaveCode.wait(10); 
      }
    }
  } catch (err) {
    if (err.message !== 'Script cancelled') console.error('Loop Error:', err);
  }
})();
`;
};

Blockly.JavaScript.forBlock['wc_release_note'] = function(block) {
  const inst = block.getFieldValue('INSTRUMENT');
  const freq = Blockly.JavaScript.valueToCode(block, 'FREQ', Blockly.JavaScript.ORDER_ATOMIC) || '440';
  return `await WaveCode.releaseNote(${freq}, 0, "${inst}");\n`;
};

Blockly.JavaScript.forBlock['wc_rhythm_v2'] = function(block) {
  const measure = block.getFieldValue('MEASURE') || '1';
  const beats = block.getFieldValue('BEATS') || '4';
  const res = block.getFieldValue('RESOLUTION') || '4';
  let code = "";
  
  // 1. 同步啟動所有音軌的排程
  for (let i = 0; i < block.itemCount_; i++) {
    const inst = block.getFieldValue('INST' + i) || "none";
    const vel = block.getFieldValue('VEL' + i) || "100";
    const isChord = block.getFieldValue('MODE' + i) === 'TRUE';
    const pattern = block.getFieldValue('PATTERN' + i) || "";
    // 修正：補上 ${measure} 參數
    code += `WaveCode.playRhythmV2("${inst}", "${pattern}", ${beats}, ${res}, ${vel}, ${isChord}, ${measure});\n`;
  }
  
  // 2. 統一等待
  code += `await WaveCode.waitMusical(${beats}, "BEATS");\n`;
  
  return code;
};
