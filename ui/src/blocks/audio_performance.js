/**
 * WaveCode Blocks: Audio Performance
 * Definitions for performance commands like playing notes and waiting.
 */

Blockly.defineBlocksWithJsonArray([
  {
    "type": "wc_init",
    "message0": "初始化設定 %1 %2",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "DO" }
    ],
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "在此放置所有程式開始時僅需執行一次的設定，例如 BPM 設定、和弦定義等。",
    "hat": true
  },
  {
    "type": "wc_play_note",
    "message0": "%{BKY_AUDIO_PLAY_NOTE}",
    "args0": [
      { "type": "input_value", "name": "FREQ" },
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
    "extensions": ["wc_play_note_instrument_dropdown"]
  },
  {
    "type": "wc_play_note_async",
    "message0": "%{BKY_AUDIO_PLAY_NOTE_ASYNC}",
    "args0": [
      { "type": "input_value", "name": "FREQ" },
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
    "extensions": ["wc_play_note_instrument_dropdown"]
  },
  {
    "type": "wc_note",
    "message0": "%{BKY_AUDIO_NOTE}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "NOTE",
        "options": [
          ["C", "C"], ["C#", "C#"], ["D", "D"], ["D#", "D#"], ["E", "E"], ["F", "F"],
          ["F#", "F#"], ["G", "G"], ["G#", "G#"], ["A", "A"], ["A#", "A#"], ["B", "B"]
        ]
      },
      {
        "type": "field_dropdown",
        "name": "OCTAVE",
        "options": [
          ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"],
          ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"]
        ]
      }
    ],
    "output": "String",
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_NOTE_TOOLTIP}"
  },
  {
    "type": "wc_wait",
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
    "type": "wc_stop",
    "message0": "%{BKY_AUDIO_STOP}",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_STOP_TOOLTIP}"
  },
  {
    "type": "wc_define_chord",
    "message0": "%{BKY_AUDIO_DEFINE_CHORD}",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "CM7" },
      { "type": "field_input", "name": "NOTES", "text": "C4,E4,G4,B4" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_DEFINE_CHORD_TOOLTIP}",
    "helpUrl": ""
  },
  {
    "type": "wc_play_chord",
    "message0": "%{BKY_AUDIO_PLAY_CHORD}",
    "args0": [
      { "type": "field_input", "name": "CHORD", "text": "CM7" },
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
    "tooltip": "%{BKY_AUDIO_PLAY_CHORD_TOOLTIP}",
    "extensions": ["wc_play_note_instrument_dropdown"]
  },
  {
    "type": "wc_transport_set_bpm",
    "message0": "%{BKY_AUDIO_SET_BPM}",
    "args0": [
      { "type": "input_value", "name": "BPM", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_SET_BPM_TOOLTIP}"
  },
  {
    "type": "wc_select_current_instrument",
    "message0": "%{BKY_AUDIO_SELECT_INSTRUMENT}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "INSTRUMENT",
        "options": [["lead_synth", "lead_synth"]]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_SELECT_INSTRUMENT_TOOLTIP}",
    "extensions": ["wc_play_note_instrument_dropdown"]
  },
  {
    "type": "wc_play_melody",
    "message0": "%{BKY_AUDIO_PLAY_MELODY}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "INSTRUMENT",
        "options": [["lead_synth", "lead_synth"]]
      }
    ],
    "message1": "%{BKY_AUDIO_PLAY_MELODY_SCORE}",
    "args1": [
      { "type": "field_multilinetext", "name": "MELODY", "text": "C4Q, E4Q, G4H" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_PLAY_MELODY_TOOLTIP}",
    "helpUrl": "melody",
    "extensions": ["wc_play_note_instrument_dropdown"]
  },
  {
    "type": "wc_perform",
    "message0": "%{BKY_AUDIO_PERFORM_ONCE}",
    "args0": [
      { "type": "input_statement", "name": "DO" }
    ],
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_PERFORM_ONCE_TOOLTIP}",
    "hat": true
  },
  {
    "type": "wc_serial_data_received",
    "message0": "%{BKY_AUDIO_SERIAL_DATA_RECEIVED_TITLE}",
    "message1": "%{BKY_AUDIO_SERIAL_DATA_RECEIVED_VAR}",
    "args1": [
      { "type": "field_variable", "name": "DATA", "variable": "serial_data" }
    ],
    "message2": "%1",
    "args2": [
      { "type": "input_statement", "name": "DO" }
    ],
    "colour": "#2c3e50",
    "tooltip": "%{BKY_AUDIO_SERIAL_DATA_RECEIVED_TOOLTIP}",
    "hat": true
  },
  {
    "type": "wc_serial_init",
    "message0": "%{BKY_AUDIO_SERIAL_INIT}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "PORT",
        "options": [["(掃描中...)", "none"]]
      },
      {
        "type": "field_dropdown",
        "name": "BAUD",
        "options": [["115200", "115200"], ["9600", "9600"], ["57600", "57600"]]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "#2c3e50",
    "tooltip": "%{BKY_AUDIO_SERIAL_INIT_TOOLTIP}",
    "extensions": ["wc_serial_port_scanner"]
  },
  {
    "type": "wc_serial_check_ttp",
    "message0": "解析 16-bits 字串：欄位 %1 的第 %2 個位元由 0 轉 1",
    "args0": [
      { "type": "field_input", "name": "PREFIX", "text": "TTP" },
      { "type": "field_number", "name": "KEY", "value": 1, "min": 1, "max": 16 }
    ],
    "output": "Boolean",
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "從 16-bit 狀態字串中偵測邊緣觸發。注意：最左邊為第 1 位元。"
  },
  {
    "type": "wc_serial_get_field",
    "message0": "擷取序列埠欄位 [%1]",
    "args0": [
      { "type": "field_input", "name": "PREFIX", "text": "LDR" }
    ],
    "output": "String",
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "從目前的序列埠資料中抓取指定前綴的數值 (如 LDR:512)。"
  }
  ]);
// --- Extensions ---

Blockly.Extensions.register('wc_play_note_instrument_dropdown', function() {
  const dropdown = this.getField('INSTRUMENT');
  dropdown.menuGenerator_ = function() {
    const workspace = dropdown.getSourceBlock().workspace;
    const blocks = workspace.getBlocksByType('wc_instrument');
    const options = blocks.map(b => {
      const id = b.getFieldValue('ID');
      return [id, id];
    });
    return options.length > 0 ? options : [['(無樂器)', 'none']];
  };
});

Blockly.Extensions.register('wc_serial_port_scanner', function() {
  const block = this;
  const dropdown = block.getField('PORT');
  
  const updatePorts = async () => {
    if (!window.WaveCode || !window.WaveCode.listSerialPorts) return;
    try {
      const ports = await window.WaveCode.listSerialPorts();
      const options = ports.length > 0 ? ports.map(p => [p, p]) : [['(找不到裝置)', 'none']];
      dropdown.menuGenerator_ = options;
    } catch (e) {
      console.warn("WaveCode: 掃描序列埠失敗", e);
    }
  };

  // 點擊選單時刷新
  const originalShow = dropdown.showEditor_;
  dropdown.showEditor_ = function() {
    updatePorts().then(() => {
      originalShow.call(dropdown);
    });
  };
});
