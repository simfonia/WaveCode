/**
 * WaveCode Generator: Text
 */

Blockly.JavaScript.forBlock['wc_text_print'] = function(block) {
  const text = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_ATOMIC) || "''";
  return `if (window.LogManager) window.LogManager.appendLog(${text});\nconsole.log(${text});\n`;
};

Blockly.JavaScript.forBlock['wc_comment'] = function(block) {
  const comment = block.getFieldValue('COMMENT');
  return `/*\n${comment}\n*/\n`;
};
