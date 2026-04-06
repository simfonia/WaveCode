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
