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
    "colour": "%{BKY_TEXT_HUE}",
    "tooltip": "%{BKY_WC_TEXT_PRINT_TOOLTIP}"
  },
  {
    "type": "wc_comment",
    "message0": "%{BKY_WC_COMMENT}",
    "args0": [
      { "type": "field_multilinetext", "name": "COMMENT", "text": "這是一段註解" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#7f8c8d",
    "tooltip": "%{BKY_WC_COMMENT_TOOLTIP}"
  }
]);
