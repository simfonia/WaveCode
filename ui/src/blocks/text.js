/**
 * WaveCode Blocks: Text
 * Definitions for custom text manipulation blocks.
 */

Blockly.defineBlocksWithJsonArray([
  {
    "type": "wc_text_print",
    "message0": "%{BKY_WC_TEXT_PRINT}",
    "args0": [
      { "type": "input_value", "name": "TEXT" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_SYSTEM_HUE}",
    "tooltip": "%{BKY_WC_TEXT_PRINT_TOOLTIP}"
  },
  {
    "type": "wc_comment",
    "message0": "%{BKY_WC_COMMENT}",
    "args0": [
      { "type": "field_multilinetext", "name": "TEXT", "text": "在此輸入註解..." }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_SYSTEM_HUE}",
    "tooltip": "%{BKY_WC_COMMENT_TOOLTIP}"
  },
  {
    "type": "math_map",
    "message0": "將 %1 從 [ %2 , %3 ] 映射至 [ %4 , %5 ]",
    "args0": [
      { "type": "input_value", "name": "VALUE", "check": "Number" },
      { "type": "input_value", "name": "FROM_LOW", "check": "Number" },
      { "type": "input_value", "name": "FROM_HIGH", "check": "Number" },
      { "type": "input_value", "name": "TO_LOW", "check": "Number" },
      { "type": "input_value", "name": "TO_HIGH", "check": "Number" }
    ],
    "inputsInline": true,
    "output": "Number",
    "colour": "%{BKY_MATH_HUE}",
    "tooltip": "將數值從一個範圍按比例轉換到另一個範圍 (Arduino Style Map)。"
  }
]);
