/**
 * WaveCode Blocks: Audio Performance
 * Definitions for performance commands like playing notes and waiting.
 */

Blockly.defineBlocksWithJsonArray([
  {
    "type": "wc_init",
    "message0": "%{BKY_AUDIO_INIT_TITLE}",
    "args0": [
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "DO" }
    ],
    "colour": "%{BKY_SYSTEM_HUE}",
    "tooltip": "%{BKY_AUDIO_INIT_TOOLTIP}",
    "hat": true
  },
  {
    "type": "wc_play_note",
    "message0": "%{BKY_AUDIO_PLAY_NOTE_V2}",
    "args0": [
      { "type": "input_value", "name": "NOTE" },
      { "type": "input_value", "name": "DUR" },
      { "type": "input_value", "name": "VELOCITY" },
      {
        "type": "field_dropdown",
        "name": "INSTRUMENT",
        "options": [["Piano", "Piano"]]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_CORE_PLAY_HUE}",
    "tooltip": "%{BKY_AUDIO_PLAY_NOTE_TOOLTIP}",
    "helpUrl": "melody",
    "extensions": ["wc_play_note_instrument_dropdown"]
  },
  {
    "type": "wc_play_note_async",
    "message0": "%{BKY_AUDIO_PLAY_NOTE_ASYNC_V2}",
    "args0": [
      { "type": "input_value", "name": "NOTE" },
      { "type": "input_value", "name": "DUR" },
      { "type": "input_value", "name": "VELOCITY" },
      {
        "type": "field_dropdown",
        "name": "INSTRUMENT",
        "options": [["Piano", "Piano"]]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_CORE_PLAY_HUE}",
    "tooltip": "%{BKY_AUDIO_PLAY_NOTE_ASYNC_TOOLTIP}",
    "helpUrl": "melody",
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
    "colour": "%{BKY_ADVANCED_HUE}",
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
    "colour": "%{BKY_CONTROL_HUE}",
    "tooltip": "%{BKY_AUDIO_WAIT_TOOLTIP}"
  },
  {
    "type": "wc_stop",
    "message0": "%{BKY_AUDIO_STOP}",
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_CONTROL_HUE}",
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
    "colour": "%{BKY_PHRASES_HUE}",
    "tooltip": "%{BKY_AUDIO_DEFINE_CHORD_TOOLTIP}",
    "helpUrl": ""
  },
  {
    "type": "wc_define_guitar_chord",
    "message0": "%{BKY_AUDIO_DEFINE_GUITAR_CHORD}",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "MyC" },
      { "type": "field_input", "name": "S6", "text": "X" },
      { "type": "field_input", "name": "S5", "text": "3" },
      { "type": "field_input", "name": "S4", "text": "2" },
      { "type": "field_input", "name": "S3", "text": "0" },
      { "type": "field_input", "name": "S2", "text": "1" },
      { "type": "field_input", "name": "S1", "text": "0" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "inputsInline": true,
    "colour": "%{BKY_PHRASES_HUE}",
    "tooltip": "%{BKY_AUDIO_DEFINE_GUITAR_CHORD_TOOLTIP}",
    "helpUrl": "strum"
  },
  {
    "type": "wc_strum",
    "message0": "%{BKY_AUDIO_STRUM_V2}",
    "args0": [
      { "type": "field_input", "name": "CHORD", "text": "C" },
      { "type": "field_input", "name": "PATTERN", "text": "D-..d-u-" },
      { "type": "input_value", "name": "VELOCITY", "check": "Number" },
      { "type": "input_value", "name": "JITTER", "check": "Number" },
      {
        "type": "field_dropdown",
        "name": "INSTRUMENT",
        "options": [["Piano", "Piano"]]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_CORE_PLAY_HUE}",
    "tooltip": "%{BKY_AUDIO_STRUM_TOOLTIP_V2}",
    "helpUrl": "strum",
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
    "colour": "%{BKY_CONTROL_HUE}",
    "tooltip": "%{BKY_AUDIO_SET_BPM_TOOLTIP}"
  },
  {
    "type": "wc_select_current_instrument",
    "message0": "%{BKY_AUDIO_SELECT_INSTRUMENT}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "INSTRUMENT",
        "options": [["Piano", "Piano"]]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_CONTROL_HUE}",
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
        "options": [["Piano", "Piano"]]
      }
    ],
    "message1": "%{BKY_AUDIO_PLAY_MELODY_SCORE}",
    "args1": [
      { "type": "field_multilinetext", "name": "MELODY", "text": "C4Q, E4Q, G4H" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_CORE_PLAY_HUE}",
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
    "colour": "%{BKY_SERIAL_HUE}",
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
        "options": [["%{BKY_WAVECODE_SCANNING}", "none"]]
      },
      {
        "type": "field_dropdown",
        "name": "BAUD",
        "options": [["115200", "115200"], ["9600", "9600"], ["57600", "57600"]]
      },
      {
        "type": "field_image",
        "src": "/icons/usb_24dp_75FB4C.png",
        "width": 22,
        "height": 22,
        "alt": "Reconnect",
        "name": "RECONNECT"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_SERIAL_HUE}",
    "tooltip": "%{BKY_AUDIO_SERIAL_INIT_TOOLTIP}",
    "extensions": ["wc_serial_port_scanner"]
  },
  {
    "type": "wc_serial_check_bit",
    "message0": "%{BKY_AUDIO_SERIAL_CHECK_BIT_V2}",
    "args0": [
      { "type": "field_input", "name": "PREFIX", "text": "TTP" },
      { "type": "field_number", "name": "KEY", "value": 1, "min": 1 },
      { "type": "field_number", "name": "TOTAL_BITS", "value": 16, "min": 1 }
    ],
    "output": "Boolean",
    "colour": "%{BKY_SERIAL_HUE}",
    "tooltip": "%{BKY_AUDIO_SERIAL_CHECK_BIT_TOOLTIP_V2}"
  },
  {
    "type": "wc_serial_get_field",
    "message0": "%{BKY_AUDIO_SERIAL_GET_FIELD_V2}",
    "args0": [
      { "type": "field_input", "name": "PREFIX", "text": "LDR" }
    ],
    "output": "String",
    "colour": "%{BKY_SERIAL_HUE}",
    "tooltip": "%{BKY_AUDIO_SERIAL_GET_FIELD_TOOLTIP_V2}"
  },
  {
    "type": "wc_wait_musical",
    "message0": "%{BKY_AUDIO_WAIT_MUSICAL_V2}",
    "args0": [
      { "type": "input_value", "name": "VALUE", "check": "Number" },
      {
        "type": "field_dropdown",
        "name": "UNIT",
        "options": [
          ["%{BKY_AUDIO_WAIT_MUSICAL_UNIT_BEATS}", "BEATS"],
          ["%{BKY_AUDIO_WAIT_MUSICAL_UNIT_MEASURES}", "MEASURES"],
          ["%{BKY_AUDIO_WAIT_MUSICAL_UNIT_S}", "SECONDS"],
          ["%{BKY_AUDIO_WAIT_MUSICAL_UNIT_MS}", "MS"]
        ]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_CONTROL_HUE}",
    "tooltip": "%{BKY_AUDIO_WAIT_MUSICAL_TOOLTIP_V2}"
  },
  {
    "type": "wc_count_in",
    "message0": "%{BKY_AUDIO_COUNT_IN_V2}",
    "args0": [
      { "type": "input_value", "name": "MEASURES", "check": "Number" },
      { "type": "input_value", "name": "BEATS", "check": "Number" },
      { "type": "input_value", "name": "BEAT_UNIT", "check": "Number" },
      { "type": "input_value", "name": "VELOCITY", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_CONTROL_HUE}",
    "tooltip": "%{BKY_AUDIO_COUNT_IN_TOOLTIP_V2}"
  },
  {
    "type": "wc_loop",
    "message0": "%{BKY_AUDIO_LOOP_V2}",
    "args0": [
      { "type": "field_number", "name": "INTERVAL", "value": 1, "min": 1 },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "DO" }
    ],
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "%{BKY_AUDIO_LOOP_TOOLTIP_V2}",
    "hat": true
  },
  {
    "type": "wc_phrase_def",
    "message0": "%{BKY_AUDIO_PHRASE_DEF_TITLE}",
    "args0": [
      { "type": "field_input", "name": "NAME", "text": "A段" },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "STACK" }
    ],
    "colour": "%{BKY_PHRASES_HUE}",
    "tooltip": "%{BKY_AUDIO_PHRASE_DEF_TOOLTIP}",
    "hat": true
  },
  {
    "type": "wc_phrase_call",
    "message0": "%{BKY_AUDIO_PHRASE_CALL_TITLE}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "NAME",
        "options": [["%{BKY_WAVECODE_PHRASE_SELECT_HINT}", "none"]]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PHRASES_HUE}",
    "tooltip": "%{BKY_AUDIO_PHRASE_CALL_TOOLTIP}",
    "extensions": ["wc_phrase_call_dropdown"]
  },
  {
    "type": "wc_release_note",
    "message0": "%{BKY_AUDIO_RELEASE_NOTE}",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "INSTRUMENT",
        "options": [["Piano", "Piano"]]
      },
      { "type": "input_value", "name": "NOTE" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "inputsInline": true,
    "colour": "%{BKY_ADVANCED_HUE}",
    "tooltip": "%{BKY_AUDIO_RELEASE_NOTE_TOOLTIP}",
    "extensions": ["wc_play_note_instrument_dropdown"]
  },
  {
    "type": "wc_rhythm_v2_container",
    "message0": "%{BKY_AUDIO_RHYTHM_V2_CONTAINER_TITLE}",
    "nextStatement": null,
    "enableContextMenu": false,
    "colour": "%{BKY_CORE_PLAY_HUE}"
  },
  {
    "type": "wc_rhythm_v2_item",
    "message0": "%{BKY_AUDIO_RHYTHM_V2_ITEM_TITLE}",
    "previousStatement": null,
    "nextStatement": null,
    "enableContextMenu": false,
    "colour": "%{BKY_CORE_PLAY_HUE}"
  }
  ]);

// --- Rhythm Sequencer V2 (Manual Definition with Mutator) ---
Blockly.Blocks['wc_rhythm_v2'] = {
  init: function() {
    this.jsonInit({
      "type": "wc_rhythm_v2",
      "message0": "%{BKY_AUDIO_RHYTHM_V2_TITLE}",
      "args0": [
        { "type": "field_input", "name": "MEASURE", "text": "1" },
        { "type": "field_input", "name": "BEATS", "text": "4" },
        { "type": "field_input", "name": "BEAT_UNIT", "text": "4" },
        { "type": "field_input", "name": "RESOLUTION", "text": "4" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "%{BKY_CORE_PLAY_HUE}",
      "tooltip": "%{BKY_AUDIO_RHYTHM_V2_TOOLTIP_V2}",
      "helpUrl": "sequencer",
      "mutator": "wc_rhythm_v2_mutator"
    });
    this.itemCount_ = 0;
  }
};

Blockly.Extensions.registerMutator('wc_rhythm_v2_mutator', {
  mutationToDom: function() {
    const container = Blockly.utils.xml.createElement('mutation');
    container.setAttribute('items', this.itemCount_);
    return container;
  },
  domToMutation: function(xmlElement) {
    this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10) || 0;
    this.updateShape_();
  },
  decompose: function(workspace) {
    const containerBlock = workspace.newBlock('wc_rhythm_v2_container');
    containerBlock.initSvg();
    let connection = containerBlock.nextConnection;
    for (let i = 0; i < this.itemCount_; i++) {
      const itemBlock = workspace.newBlock('wc_rhythm_v2_item');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    return containerBlock;
  },
  compose: function(containerBlock) {
    let itemBlock = containerBlock.getNextBlock();
    this.itemCount_ = 0;
    while (itemBlock) {
      this.itemCount_++;
      itemBlock = itemBlock.getNextBlock();
    }
    this.updateShape_();
  },
  updateShape_: function() {
    // 移除舊輸入
    let i = 0;
    while (this.getInput('TRACK' + i)) {
      this.removeInput('TRACK' + i);
      i++;
    }
    // 建立新輸入
    for (let j = 0; j < this.itemCount_; j++) {
      this.appendDummyInput('TRACK' + j)
          .appendField(Blockly.Msg['AUDIO_RHYTHM_V2_INST'] || "Instrument")
          .appendField(new Blockly.FieldDropdown([["(讀取中...)", "none"]]), "INST" + j)
          .appendField(Blockly.Msg['AUDIO_RHYTHM_V2_VOL'] || "Volume")
          .appendField(new Blockly.FieldTextInput("100"), "VEL" + j)
          .appendField(Blockly.Msg['AUDIO_RHYTHM_V2_MODE'] || "Mode")
          .appendField(new Blockly.FieldDropdown([
              [Blockly.Msg['AUDIO_RHYTHM_V2_MODE_NOTE'] || "Note", "NOTE"],
              [Blockly.Msg['AUDIO_RHYTHM_V2_MODE_CHORD'] || "Chord", "CHORD"]
          ]), "MODE" + j)
          .appendField(Blockly.Msg['AUDIO_RHYTHM_V2_PATTERN'] || "Pattern")
          .appendField(new Blockly.FieldTextInput("x . x ."), "PATTERN" + j);
      
      // 動態刷新樂器選單
      const dropdown = this.getField('INST' + j);
      dropdown.menuGenerator_ = function() {
        const workspace = dropdown.getSourceBlock().workspace;
        const blocks = workspace.getBlocksByType('wc_instrument');
        const options = blocks.map(b => [b.getFieldValue('ID'), b.getFieldValue('ID')]);
        const noInstMsg = Blockly.Msg['WAVECODE_NO_INSTRUMENT'] || '(No Instrument)';
        return options.length > 0 ? options : [[noInstMsg, 'none']];
      };
    }
  }
}, undefined, ['wc_rhythm_v2_item']);

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
    const noInstMsg = Blockly.Msg['WAVECODE_NO_INSTRUMENT'] || '(No Instrument)';
    return options.length > 0 ? options : [[noInstMsg, 'none']];
  };
});

Blockly.Extensions.register('wc_serial_port_scanner', function() {
  const block = this;
  const dropdown = block.getField('PORT');
  const btn = block.getField('RECONNECT');
  
  const updatePorts = async () => {
    if (!window.WaveCode || !window.WaveCode.listSerialPorts) return;
    try {
      const ports = await window.WaveCode.listSerialPorts();
      const noDeviceMsg = Blockly.Msg['WAVECODE_NO_DEVICE'] || '(No Device)';
      const options = ports.length > 0 ? ports.map(p => [p, p]) : [[noDeviceMsg, 'none']];
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

  // 重新連線按鈕點擊處理
  if (btn) {
    btn.showEditor_ = async function() {
      const port = block.getFieldValue('PORT');
      const baud = block.getFieldValue('BAUD');
      if (port === 'none') {
        if (window.WaveCode && window.WaveCode.appendLog) {
          window.WaveCode.appendLog("Serial: 請先選擇正確的序列埠 (COM Port)", "warning");
        }
        return;
      }
      
      if (window.WaveCode && window.WaveCode.openSerial) {
        try {
          window.WaveCode.appendLog(`Serial: 嘗試連線至 ${port} (${baud})...`, "info");
          await window.WaveCode.openSerial(port, baud);
          window.WaveCode.appendLog(`Serial: 成功連線至 ${port}`, "success");
        } catch (e) {
          window.WaveCode.appendLog(`Serial: 連線失敗 - ${e.message || e}`, "error");
        }
      }
    };
  }
});

Blockly.Extensions.register('wc_phrase_call_dropdown', function() {
  const dropdown = this.getField('NAME');
  dropdown.menuGenerator_ = function() {
    const workspace = dropdown.getSourceBlock().workspace;
    const blocks = workspace.getBlocksByType('wc_phrase_def');
    const options = blocks.map(b => {
      const name = b.getFieldValue('NAME');
      return [name, name];
    });
    const notDefinedMsg = Blockly.Msg['WAVECODE_PHRASE_NOT_DEFINED'] || '(Not Defined)';
    return options.length > 0 ? options : [[notDefinedMsg, 'none']];
  };
});
