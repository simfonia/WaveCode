/**
 * WaveCode Generator: System & Lifecycle
 * 提供基礎系統積木的產生器與全域攔截邏輯。
 */

// 覆寫內建變數取得積木，使其支援非同步回呼中的變數共用
Blockly.JavaScript.forBlock['variables_get'] = function(block) {
  const varId = block.getFieldValue('VAR');
  const varName = Blockly.JavaScript.nameDB_.getName(varId, Blockly.Variables.NAME_TYPE);
  return [`WaveCode.getVar("${varName}")`, Blockly.JavaScript.ORDER_ATOMIC];
};

// 覆寫內建變數設定積木
Blockly.JavaScript.forBlock['variables_set'] = function(block) {
  const varId = block.getFieldValue('VAR');
  const varName = Blockly.JavaScript.nameDB_.getName(varId, Blockly.Variables.NAME_TYPE);
  const value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ASSIGNMENT) || '0';
  return `WaveCode.setVar("${varName}", ${value});\n`;
};
