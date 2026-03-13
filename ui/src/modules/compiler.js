/**
 * WaveCode Compiler - 鏈式動態編譯器 (Rust 原生模式)
 */

import { WaveCodeAPI } from './api.js';

export const WaveCodeCompiler = {
  /**
   * 遍歷工作區積木，分析音訊鏈條並傳送啟動指令給 Rust 引擎
   */
  compileAndRun: async (workspace) => {
    if (!workspace || workspace.isClearing) return;

    console.log("WaveCode: 開始 Rust 原生鏈式編譯...");
    const invoke = WaveCodeAPI.getInvoke();
    
    // 取得所有積木
    const allBlocks = workspace.getAllBlocks(false);
    
    /**
     * 追蹤積木鏈條，判斷是否最終連接到 DAC (喇叭)
     */
    const traceChain = (startBlock) => {
      let current = startBlock;
      while (current) {
        if (current.disabled) return null;
        
        // 尋找下一個輸入連接 (火車嵌套模式)
        const nextInput = current.getInput('NEXT');
        if (nextInput && nextInput.connection && nextInput.connection.targetBlock()) {
          current = nextInput.connection.targetBlock();
        } else {
          // 到達鏈條末端，檢查是否為 DAC
          return (current.type === 'audio_dac');
        }
      }
      return false;
    };

    // 檢查是否有任何有效的 Oscillator 連接到喇叭
    const hasActiveOsc = allBlocks.some(b => b.type === 'audio_oscillator' && traceChain(b));

    // --- 新增：掃描樂器定義 (遞迴 CHAIN) ---
    const instrumentConfigs = {};
    const instrumentBlocks = workspace.getBlocksByType('audio_instrument');
    
    instrumentBlocks.forEach(instBlock => {
      const instId = instBlock.getFieldValue('ID');
      const chain = [];
      
      let current = instBlock.getInputTargetBlock('CHAIN');
      while (current) {
        if (!current.disabled) {
          if (current.type === 'audio_component_osc') {
            chain.push({ type: 'osc', wave: parseInt(current.getFieldValue('WAVE')) });
          } else if (current.type === 'audio_component_adsr') {
            chain.push({
              type: 'adsr',
              a: parseFloat(current.getFieldValue('A')),
              d: parseFloat(current.getFieldValue('D')),
              s: parseFloat(current.getFieldValue('S')),
              r: parseFloat(current.getFieldValue('R'))
            });
          } else if (current.type === 'audio_component_filter') {
            chain.push({
              type: 'filter',
              kind: current.getFieldValue('TYPE'),
              freq: parseFloat(current.getFieldValue('FREQ')),
              q: parseFloat(current.getFieldValue('Q'))
            });
          } else if (current.type === 'audio_component_volume') {
            chain.push({ type: 'volume', val: parseFloat(current.getFieldValue('VOL')) / 100 });
          }
        }
        current = current.getNextBlock();
      }
      
      instrumentConfigs[instId] = chain;
    });
    
    WaveCodeAPI.setInstruments(instrumentConfigs);

    if (hasActiveOsc || instrumentBlocks.length > 0) {
      console.log("WaveCode: 偵測到有效音訊鏈，準備演奏...");
      // 未來可在這裡傳送更複雜的結構建立指令 (如音色定義)
    }
  }
};
