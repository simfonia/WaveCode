/**
 * WaveCode Blocks: Audio Performance
 * Definitions for performance commands like playing notes and waiting.
 */

Blockly.defineBlocksWithJsonArray([
  {
    "type": "audio_play_note",
    "message0": "%{BKY_AUDIO_PLAY_NOTE}",
    "args0": [
      { "type": "input_value", "name": "FREQ", "check": "Number" },
      { "type": "input_value", "name": "DUR", "check": "Number" },
      {
        "type": "field_dropdown",
        "name": "INSTRUMENT",
        "options": [["lead_synth", "lead_synth"]]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_PLAY_NOTE_TOOLTIP}",
    "extensions": ["audio_play_note_instrument_dropdown"]
  },
  {
    "type": "audio_play_note_async",
    "message0": "%{BKY_AUDIO_PLAY_NOTE_ASYNC}",
    "args0": [
      { "type": "input_value", "name": "FREQ", "check": "Number" },
      { "type": "input_value", "name": "DUR", "check": "Number" },
      {
        "type": "field_dropdown",
        "name": "INSTRUMENT",
        "options": [["lead_synth", "lead_synth"]]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_PLAY_NOTE_ASYNC_TOOLTIP}",
    "extensions": ["audio_play_note_instrument_dropdown"]
  },
  {
    "type": "audio_note",
    "message0": "%{BKY_AUDIO_NOTE}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "NOTE",
        "options": [
          ["C4", "261.63"], ["D4", "293.66"], ["E4", "329.63"], ["F4", "349.23"],
          ["G4", "392.00"], ["A4", "440.00"], ["B4", "493.88"], ["C5", "523.25"]
        ]
      }
    ],
    "output": "Number",
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_NOTE_TOOLTIP}"
  },
  {
    "type": "audio_wait",
    "message0": "%{BKY_AUDIO_WAIT}",
    "args0": [
      { "type": "input_value", "name": "MS", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_WAIT_TOOLTIP}"
  },
  {
    "type": "audio_stop",
    "message0": "%{BKY_AUDIO_STOP}",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_STOP_TOOLTIP}"
  }
]);

Blockly.Extensions.register('audio_play_note_instrument_dropdown', function() {
  const dropdown = this.getField('INSTRUMENT');
  dropdown.menuGenerator_ = function() {
    const workspace = dropdown.getSourceBlock().workspace;
    const blocks = workspace.getBlocksByType('audio_instrument');
    const options = blocks.map(b => {
      const id = b.getFieldValue('ID');
      return [id, id];
    });
    return options.length > 0 ? options : [['(無樂器)', 'none']];
  };
});
