/**
 * WaveCode Compiler - 鏈式動態編譯器 (Web Audio 模式)
 */

import { AudioManager } from './audio/manager.js';

export const WaveCodeCompiler = {
  /**
   * 掃描工作區中的所有樂器定義
   */
  scanInstruments: (workspace) => {
    if (!workspace || workspace.isClearing) return {};
    
    // 【關鍵修復】確保產生器已初始化，並統一使用該實例進行轉換
    const generator = (window.javascript && window.javascript.javascriptGenerator) || Blockly.JavaScript;
    if (generator && generator.init) {
        generator.init(workspace);
    }

    const instrumentConfigs = {};
    const instrumentBlocks = workspace.getBlocksByType('wc_instrument');
    
    instrumentBlocks.forEach(instBlock => {
      const instId = instBlock.getFieldValue('ID');
      const chain = [];
      
      let current = instBlock.getInputTargetBlock('CHAIN');
      while (current) {
        if (current.isEnabled()) {
          if (current.type === 'wc_component_osc') {
            chain.push({ type: 'osc', wave: parseInt(current.getFieldValue('WAVE')) });
          } else if (current.type === 'wc_create_additive_synth') {
            const partials = [];
            for (let i = 1; i <= (current.itemCount_ || 0); i++) {
              partials.push({
                wave: parseInt(current.getFieldValue('WAVE' + i)),
                ratio: parseFloat(current.getFieldValue('RATIO' + i)),
                amp: parseFloat(current.getFieldValue('AMP' + i))
              });
            }
            chain.push({ type: 'additive', partials });
          } else if (current.type === 'wc_component_sampler') {
            chain.push({
              type: 'sampler',
              sample_id: current.getFieldValue('SAMPLE_ID')
            });
          } else if (current.type === 'wc_component_adsr') {
            chain.push({
              type: 'adsr',
              a: parseFloat(current.getFieldValue('A')),
              d: parseFloat(current.getFieldValue('D')),
              s: parseFloat(current.getFieldValue('S')),
              r: parseFloat(current.getFieldValue('R'))
            });
          } else if (current.type === 'wc_component_filter') {
            chain.push({
              type: 'filter',
              kind: current.getFieldValue('TYPE'),
              freq: parseFloat(current.getFieldValue('FREQ')),
              q: parseFloat(current.getFieldValue('Q'))
            });
          } else if (current.type === 'wc_component_volume') {
            chain.push({ type: 'volume', val: parseFloat(current.getFieldValue('VOL')) / 100 });
          } else if (current.type.startsWith('wc_effect_')) {
            // 處理拆分後的效果器積木
            const effectType = current.type.replace('wc_effect_', '');
            const effectCfg = { type: 'effect', effect_type: effectType };

            const getVal = (name) => {
                const val = generator.valueToCode(current, name, generator.ORDER_ATOMIC);
                return val ? parseFloat(val) : null;
            };

            if (effectType === 'filter') {
                effectCfg.filter_type = current.getFieldValue('TYPE');
                effectCfg.freq = getVal('FREQ') ?? 1000;
                effectCfg.q = getVal('Q') ?? 1;
            } else if (effectType === 'delay') {
                effectCfg.delay_time = getVal('TIME') ?? 0.5;
                effectCfg.feedback = getVal('FEEDBACK') ?? 0.5;
            } else if (effectType === 'bitcrush') {
                effectCfg.bitdepth = getVal('BITS') ?? 8;
            } else if (effectType === 'distortion') {
                effectCfg.distortion = getVal('AMOUNT') ?? 10;
            } else if (effectType === 'compressor') {
                effectCfg.threshold = getVal('THRESH') ?? -24;
                effectCfg.ratio = getVal('RATIO') ?? 12;
                effectCfg.attack = getVal('ATTACK') ?? 0.003;
                effectCfg.release = getVal('RELEASE') ?? 0.25;
                effectCfg.makeup = getVal('MAKEUP') ?? 0;
            }
            chain.push(effectCfg);
          }

        }
        current = current.getNextBlock();
      }
      
      instrumentConfigs[instId] = chain;
    });
    
    return instrumentConfigs;
  },

  /**
   * 遍歷工作區積木，分析音訊鏈條並同步至 Web Audio 引擎
   */
  run: async (workspace) => {
    if (!workspace || workspace.isClearing) return;

    console.log("WaveCode: 開始 Web Audio 鏈式編譯...");
    
    // 【關鍵修復】確保產生器已初始化，防止 CodeGenerator init 報錯
    const generator = (window.javascript && window.javascript.javascriptGenerator) || Blockly.JavaScript;
    if (generator && generator.init) {
        generator.init(workspace);
    }

    const instrumentConfigs = WaveCodeCompiler.scanInstruments(workspace);
    const masterConfig = WaveCodeCompiler.scanMaster(workspace);

    AudioManager.setInstruments(instrumentConfigs);
    AudioManager.setMasterPatch(masterConfig);
  },

  /**
   * 掃描全域主輸出配置
   */
  scanMaster: (workspace) => {
    const masterBlock = workspace.getBlocksByType('wc_master')[0];
    if (!masterBlock || !masterBlock.isEnabled()) return [];

    const chain = [];
    const generator = (window.javascript && window.javascript.javascriptGenerator) || Blockly.JavaScript;
    
    let current = masterBlock.getInputTargetBlock('CHAIN');
    while (current) {
        if (current.isEnabled()) {
            if (current.type === 'wc_component_volume') {
                chain.push({ type: 'volume', val: parseFloat(current.getFieldValue('VOL')) / 100 });
            } else if (current.type.startsWith('wc_effect_')) {
                const effectType = current.type.replace('wc_effect_', '');
                const effectCfg = { type: 'effect', effect_type: effectType };
                const getVal = (name) => {
                    const val = generator.valueToCode(current, name, generator.ORDER_ATOMIC);
                    return val ? parseFloat(val) : null;
                };

                if (effectType === 'filter') {
                    effectCfg.filter_type = current.getFieldValue('TYPE');
                    effectCfg.freq = getVal('FREQ') ?? 1000;
                    effectCfg.q = getVal('Q') ?? 1;
                } else if (effectType === 'delay') {
                    effectCfg.delay_time = getVal('TIME') ?? 0.5;
                    effectCfg.feedback = getVal('FEEDBACK') ?? 0.5;
                } else if (effectType === 'bitcrush') {
                    effectCfg.bitdepth = getVal('BITS') ?? 8;
                } else if (effectType === 'distortion') {
                    effectCfg.distortion = getVal('AMOUNT') ?? 10;
                } else if (effectType === 'compressor') {
                    effectCfg.threshold = getVal('THRESH') ?? -24;
                    effectCfg.ratio = getVal('RATIO') ?? 12;
                    effectCfg.attack = getVal('ATTACK') ?? 0.003;
                    effectCfg.release = getVal('RELEASE') ?? 0.25;
                    effectCfg.makeup = getVal('MAKEUP') ?? 0;
                }
                chain.push(effectCfg);
            }
        }
        current = current.getNextBlock();
    }
    return chain;
  }
};
