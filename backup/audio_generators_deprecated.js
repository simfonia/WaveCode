/**
 * WaveCode Audio JavaScript Generators (Polyphonic Version)
 */

// --- 1. 核心鏈條產生器 ---

Blockly.JavaScript.forBlock['wc_instrument'] = function(block) {
  // 樂器定義由 Compiler 靜態解析，產生器傳回註解
  const id = block.getFieldValue('ID');
  return `// Instrument defined: ${id}\n`;
};

Blockly.JavaScript.forBlock['wc_oscillator'] = function(block) {
  return ""; 
};

Blockly.JavaScript.forBlock['wc_dac'] = function(block) {
  return "";
};

// --- 2. 演奏產生器 ---

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
  // 移除 await，實現異步觸發不等待
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

// --- 3. 系統中斷機制 (安樂死) ---

/**
 * 為所有循環積木注入中斷檢查
 */
const patchGenerator = (blockType) => {
  const original = Blockly.JavaScript.forBlock[blockType];
  if (!original) return;
  Blockly.JavaScript.forBlock[blockType] = function(block) {
    const code = original.call(this, block);
    // 在第一個左大括號後注入檢查
    return code.replace('{', '{\n  WaveCode.isAlive(_id);');
  };
};

// 延遲執行，確保基礎產生器已載入
setTimeout(() => {
  ['controls_repeat_ext', 'controls_whileUntil', 'controls_for', 'controls_forEach'].forEach(patchGenerator);
}, 100);
