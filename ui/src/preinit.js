/**
 * WaveCode Pre-initialization
 * Defines global utilities and mutators.
 */

window.WC_Utils = window.WC_Utils || {};

// Additive Synth Mutator Logic
window.WC_Utils.ADDITIVE_SYNTH_MUTATOR = {
    itemCount_: 2,
    mutationToDom: function () {
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('items', this.itemCount_);
        return container;
    },
    domToMutation: function (xmlElement) {
        this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
        this.updateShape_();
    },
    decompose: function (workspace) {
        const containerBlock = workspace.newBlock('wc_additive_synth_container');
        containerBlock.initSvg();
        let connection = containerBlock.nextConnection;
        for (let i = 0; i < this.itemCount_; i++) {
            const itemBlock = workspace.newBlock('wc_additive_synth_item');
            itemBlock.initSvg();
            connection.connect(itemBlock.previousConnection);
            connection = itemBlock.nextConnection;
        }
        return containerBlock;
    },
    compose: function (containerBlock) {
        let itemBlock = containerBlock.getNextBlock();
        this.itemCount_ = 0;
        while (itemBlock) {
            this.itemCount_++;
            itemBlock = itemBlock.getNextBlock();
        }
        this.updateShape_();
    },
    updateShape_: function () {
        // 備份舊有的數值
        const vals = [];
        for (let i = 1; i <= 100; i++) {
            if (!this.getField('WAVE' + i)) break;
            vals.push({
                wave: this.getFieldValue('WAVE' + i),
                ratio: this.getFieldValue('RATIO' + i),
                amp: this.getFieldValue('AMP' + i)
            });
        }

        // 移除舊的輸入項
        let i = 1;
        while (this.getInput('COMP' + i)) {
            this.removeInput('COMP' + i);
            i++;
        }

        // 建立新的輸入項
        for (let i = 1; i <= this.itemCount_; i++) {
            const input = this.appendDummyInput('COMP' + i)
                .appendField(Blockly.Msg['AUDIO_WAVE'] || "波形")
                .appendField(new Blockly.FieldDropdown([
                    [Blockly.Msg['AUDIO_WAVE_SINE'] || "Sine", "0"],
                    [Blockly.Msg['AUDIO_WAVE_SAW'] || "Saw", "1"],
                    [Blockly.Msg['AUDIO_WAVE_SQUARE'] || "Square", "2"],
                    [Blockly.Msg['AUDIO_WAVE_TRI'] || "Triangle", "3"]
                ]), "WAVE" + i)
                .appendField(" x")
                .appendField(new Blockly.FieldNumber(vals[i - 1]?.ratio || i, 0, 100, 0.01), "RATIO" + i)
                .appendField(" Vol")
                .appendField(new Blockly.FieldNumber(vals[i - 1]?.amp || (1.0 / i).toFixed(2), 0, 1, 0.01), "AMP" + i);
        }
    }
};

/**
 * --- Effect Chain Field Helper ---
 * 用於監控下拉選單變動並即時更新積木形狀
 */
window.WC_Utils.FIELD_HELPER = {
    onchange: function (e) {
        if (this.disposed || e.type !== Blockly.Events.BLOCK_CHANGE || e.blockId !== this.id) return;
        if (this.workspace && this.workspace.isClearing) return;
        if (e.name === 'EFFECT_TYPE') {
            const newValue = e.newValue;
            if (this.lastType_ !== newValue) {
                this.updateShape_(newValue);
                this.lastType_ = newValue;
            }
        }
    }
};

/**
 * --- Setup Effect Mutator ---
 * 根據選擇的效果器類型動態顯示參數輸入項
 */
window.WC_Utils.SETUP_EFFECT_MUTATOR = {
    mutationToDom: function () {
        const container = Blockly.utils.xml.createElement('mutation');
        const type = this.getFieldValue('EFFECT_TYPE') || 'filter';
        container.setAttribute('effect_type', type);
        return container;
    },
    domToMutation: function (xml) {
        if (xml) this.updateShape_(xml.getAttribute('effect_type') || 'filter');
    },
    updateShape_: function (type) {
        if (this.disposed) return;
        if (this.workspace && this.workspace.isClearing) return;

        // 【關鍵修正】使用 setGroup 確保所有變更為單一原子操作，解決 Minimap 報錯與時序問題
        const groupId = Blockly.Events.getGroup();
        if (!groupId) Blockly.Events.setGroup(true);

        try {
            // 定義所有可能的參數輸入名稱，以便清理
            const params = [
                'FILTER_TYPE', 'FILTER_FREQ', 'FILTER_Q', 
                'DELAY_TIME', 'FEEDBACK', 
                'BITDEPTH', 
                'THRESHOLD', 'RATIO', 'ATTACK', 'RELEASE', 'MAKEUP', 'KNEE',
                'DISTORTION_AMOUNT', 
                'ROOMSIZE', 'DAMPING', 'WET'
            ];
            params.forEach(p => { if (this.getInput(p)) this.removeInput(p); });

            const addShadow = (name, num) => { 
                const inp = this.getInput(name); 
                if (!inp || !inp.connection || inp.connection.targetConnection) return;
                
                try {
                    const s = Blockly.utils.xml.textToDom('<shadow type="math_number"><field name="NUM">' + num + '</field></shadow>'); 
                    inp.connection.setShadowDom(s); 
                } catch(e) {
                    console.warn(`WaveCode Mutator: 無法設定影子積木 [${name}]`, e);
                }
            };

            if (type === 'filter') {
                this.appendDummyInput('FILTER_TYPE').setAlign(Blockly.ALIGN_RIGHT)
                    .appendField(Blockly.Msg['AUDIO_FILTER_TYPE'] || "濾波類型")
                    .appendField(new Blockly.FieldDropdown([
                        [Blockly.Msg['AUDIO_FILTER_LP'] || "lowpass", "lowpass"], 
                        [Blockly.Msg['AUDIO_FILTER_HP'] || "highpass", "highpass"], 
                        ["bandpass", "bandpass"]
                    ]), "FILTER_TYPE_VALUE");
                this.appendValueInput('FILTER_FREQ').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['AUDIO_FILTER_FREQ'] || "頻率");
                this.appendValueInput('FILTER_Q').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['AUDIO_FILTER_Q'] || "Q值");
                addShadow('FILTER_FREQ', 1000); addShadow('FILTER_Q', 1);

            } else if (type === 'delay') {
                this.appendValueInput('DELAY_TIME').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['AUDIO_DELAY_TIME'] || "延遲時間 (s)");
                this.appendValueInput('FEEDBACK').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['AUDIO_DELAY_FEEDBACK'] || "回饋量");
                addShadow('DELAY_TIME', 0.5); addShadow('FEEDBACK', 0.5);

            } else if (type === 'bitcrush') {
                this.appendValueInput('BITDEPTH').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['AUDIO_BIT_DEPTH'] || "位元深度");
                addShadow('BITDEPTH', 8);

            } else if (type === 'waveshaper') {
                this.appendValueInput('DISTORTION_AMOUNT').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['AUDIO_DISTORTION'] || "失真程度");
                addShadow('DISTORTION_AMOUNT', 10);

            } else if (type === 'compressor') {
                this.appendValueInput('THRESHOLD').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField("閾值 (dB)");
                this.appendValueInput('KNEE').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField("轉折 (Knee)");
                this.appendValueInput('RATIO').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField("壓縮比");
                this.appendValueInput('ATTACK').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField("啟動 (s)");
                this.appendValueInput('RELEASE').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField("釋放 (s)");
                this.appendValueInput('MAKEUP').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField("補償 (dB)");
                addShadow('THRESHOLD', -24); addShadow('KNEE', 30); addShadow('RATIO', 12); addShadow('ATTACK', 0.003); addShadow('RELEASE', 0.25); addShadow('MAKEUP', 0);
            }
        } finally {
            if (!groupId) Blockly.Events.setGroup(false);
        }

        if (this.rendered && this.render) this.render();
    }
};
