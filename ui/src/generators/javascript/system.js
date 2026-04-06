/**
 * WaveCode Generator: System & Lifecycle
 * 提供基礎系統積木的產生器與全域攔截邏輯。
 */

// 定義 wc_note 產生器 (如果尚未定義)
Blockly.JavaScript.forBlock['wc_note'] = function(block) {
  const code = block.getFieldValue('NOTE');
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};
