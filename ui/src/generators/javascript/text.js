/**
 * WaveCode Generator: Text
 */

Blockly.JavaScript.forBlock['wc_text_print'] = function(block) {
  const text = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_ATOMIC) || "''";
  return `if (window.LogManager) window.LogManager.appendLog(${text});\nconsole.log(${text});\n`;
};
