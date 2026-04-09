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
    "colour": "%{BKY_SYSTEM_HUE}",
    "tooltip": "在此放置所有程式開始時僅需執行一次的設定，例如 BPM 設定、和弦定義等。",
    "hat": true
  },
  {
    "type": "wc_play_note",
    "message0": "演奏音符/和弦 %1 持續 %2 拍 音量 %3 樂器 %4",
    "args0": [
      { "type": "input_value", "name": "NOTE" },
      { "type": "input_value", "name": "DUR" },
      { "type": "input_value", "name": "VELOCITY" },
      {
        "type": "field_dropdown",
        "name": "INSTRUMENT",
        "options": [["lead_synth", "lead_synth"]]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "演奏一個音符或已定義的和弦。音符可填如 C4, Eb5；和弦可填 CM7；休止符填 R。持續時間支援拍數(1)或代碼(Q)。音量範圍 0-100。",
    "helpUrl": "melody",
    "extensions": ["wc_play_note_instrument_dropdown"]
  },
  {
    "type": "wc_play_note_async",
    "message0": "觸發音符/和弦 %1 持續 %2 拍 音量 %3 樂器 %4 (不等待)",
    "args0": [
      { "type": "input_value", "name": "NOTE" },
      { "type": "input_value", "name": "DUR" },
      { "type": "input_value", "name": "VELOCITY" },
      {
        "type": "field_dropdown",
        "name": "INSTRUMENT",
        "options": [["lead_synth", "lead_synth"]]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "非同步觸發音符或和弦。音量範圍 0-100。",
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
    "colour": "%{BKY_SERIAL_HUE}",
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
    "colour": "%{BKY_SERIAL_HUE}",
    "tooltip": "從 16-bit 狀態字串中偵測邊緣觸發。注意：最左邊為第 1 位元。"
  },
  {
    "type": "wc_serial_get_field",
    "message0": "擷取序列埠欄位 [%1]",
    "args0": [
      { "type": "field_input", "name": "PREFIX", "text": "LDR" }
    ],
    "output": "String",
    "colour": "%{BKY_SERIAL_HUE}",
    "tooltip": "從目前的序列埠資料中抓取指定前綴的數值 (如 LDR:512)。"
  },
  {
    "type": "wc_wait_musical",
    "message0": "等待 %1 %2",
    "args0": [
      { "type": "input_value", "name": "VALUE", "check": "Number" },
      {
        "type": "field_dropdown",
        "name": "UNIT",
        "options": [
          ["拍 (Beats)", "BEATS"],
          ["小節 (Measures)", "MEASURES"],
          ["秒 (Seconds)", "SECONDS"],
          ["毫秒 (ms)", "MS"]
        ]
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "音樂性等待。系統會自動根據 BPM 計算精確的排程時間。"
  },
  {
    "type": "wc_count_in",
    "message0": "預備拍：播放 %1 小節，每小節 %2 拍 (音量 %3)",
    "args0": [
      { "type": "input_value", "name": "MEASURES", "check": "Number" },
      { "type": "input_value", "name": "BEATS", "check": "Number" },
      { "type": "input_value", "name": "VELOCITY", "check": "Number" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "inputsInline": true,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "播放 Click 預備拍，並將後續所有背景音軌同步推遲。適合現場演奏對齊拍點。"
  },
  {
    "type": "wc_loop",
    "message0": "背景循環執行：每 %1 小節 %2 %3",
    "args0": [
      { "type": "field_number", "name": "INTERVAL", "value": 1, "min": 1 },
      { "type": "input_dummy" },
      { "type": "input_statement", "name": "DO" }
    ],
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "建立背景音軌循環。與 wc_perform 不同，此容器會依據設定的小節長度不斷重複執行。",
    "hat": true
  },
  {
    "type": "wc_release_note",
    "message0": "釋放樂器 %1 的音符 %2",
    "args0": [
      {
        "type": "field_dropdown",
        "name": "INSTRUMENT",
        "options": [["lead_synth", "lead_synth"]]
      },
      { "type": "input_value", "name": "FREQ" }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "inputsInline": true,
    "colour": "%{BKY_PERFORMANCE_HUE}",
    "tooltip": "手動觸發特定音符的 Release 階段。適合現場控制長音的結束時機。",
    "extensions": ["wc_play_note_instrument_dropdown"]
  },
  {
    "type": "wc_rhythm_v2_container",
    "message0": "多軌序列器配置",
    "nextStatement": null,
    "enableContextMenu": false,
    "colour": "#E67E22"
  },
  {
    "type": "wc_rhythm_v2_item",
    "message0": "新增音軌",
    "previousStatement": null,
    "nextStatement": null,
    "enableContextMenu": false,
    "colour": "#E67E22"
  }
  ]);

// --- Rhythm Sequencer V2 (Manual Definition with Mutator) ---
Blockly.Blocks['wc_rhythm_v2'] = {
  init: function() {
    this.jsonInit({
      "type": "wc_rhythm_v2",
      "message0": "進階序列器：第 %1 小節開始, 每小節 %2 拍, 解析度 %3",
      "args0": [
        { "type": "field_input", "name": "MEASURE", "text": "1" },
        { "type": "field_input", "name": "BEATS", "text": "4" },
        { "type": "field_input", "name": "RESOLUTION", "text": "4" }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": "%{BKY_PERFORMANCE_HUE}",
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
          .appendField("樂器")
          .appendField(new Blockly.FieldDropdown([["(讀取中...)", "none"]]), "INST" + j)
          .appendField("音量")
          .appendField(new Blockly.FieldTextInput("100"), "VEL" + j)
          .appendField("和弦")
          .appendField(new Blockly.FieldCheckbox("FALSE"), "MODE" + j)
          .appendField("節奏")
          .appendField(new Blockly.FieldTextInput("x . x ."), "PATTERN" + j);
      
      // 動態刷新樂器選單
      const dropdown = this.getField('INST' + j);
      dropdown.menuGenerator_ = function() {
        const workspace = dropdown.getSourceBlock().workspace;
        const blocks = workspace.getBlocksByType('wc_instrument');
        const options = blocks.map(b => [b.getFieldValue('ID'), b.getFieldValue('ID')]);
        return options.length > 0 ? options : [['(無樂器)', 'none']];
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
