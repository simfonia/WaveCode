/**
 * WaveCode Generator: Text
 */

Blockly.JavaScript.forBlock['wc_text_print'] = function(block) {
  const text = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_ATOMIC) || "''";
  return `if (window.LogManager) window.LogManager.appendLog(${text});\nconsole.log(${text});\n`;
};

Blockly.JavaScript.forBlock['wc_comment'] = function(block) {
  const comment = block.getFieldValue('COMMENT') || "";
  return comment.split('\n').map(line => `// ${line}`).join('\n') + '\n';
};

Blockly.JavaScript.forBlock['math_map'] = function(block) {
  const val = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  const fL = Blockly.JavaScript.valueToCode(block, 'FROM_LOW', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  const fH = Blockly.JavaScript.valueToCode(block, 'FROM_HIGH', Blockly.JavaScript.ORDER_ATOMIC) || '1023';
  const tL = Blockly.JavaScript.valueToCode(block, 'TO_LOW', Blockly.JavaScript.ORDER_ATOMIC) || '0';
  const tH = Blockly.JavaScript.valueToCode(block, 'TO_HIGH', Blockly.JavaScript.ORDER_ATOMIC) || '100';

  // 公式: (val - fL) * (tH - tL) / (fH - fL) + tL
  const code = `((${val} - ${fL}) * (${tH} - ${tL}) / (${fH} - ${fL}) + ${tL})`;
  return [code, Blockly.JavaScript.ORDER_ATOMIC];
};
