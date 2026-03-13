/**
 * WaveCode API - 複音播放介面 (中斷優化版)
 */

import { EnvelopeManager } from './visualizer.js';

const invoke = window.__TAURI__ ? (window.__TAURI__.core ? window.__TAURI__.core.invoke : window.__TAURI__.invoke) : null;

export const WaveCodeAPI = {
    _execId: 0, 
    _instruments: {},

    /**
     * 設定目前腳本中的樂器配置 (由 Compiler 調用)
     */
    setInstruments: async (configs) => {
        WaveCodeAPI._instruments = configs;
        if (invoke) {
            try {
                await invoke('update_patch', { patches: configs });
            } catch (e) {
                console.error("更新樂器 Patch 失敗:", e);
            }
        }
    },

    /**
     * 檢查當前執行 ID 是否依然有效 (用於安樂死機制)
     * 在生成代碼的循環中會呼叫此函式，若 ID 已變更則拋出錯誤以停止執行。
     */
    isAlive: (id) => {
        if (id !== WaveCodeAPI._execId) {
            throw 'Script cancelled';
        }
        return true;
    },

    getCurrentId: () => WaveCodeAPI._execId,

    /**
     * 重置環境：增加版本號並停止所有音訊
     */
    reset: async () => {
        WaveCodeAPI._execId++;
        // 停止所有視覺動畫
        if (window.EnvelopeManager) {
            window.EnvelopeManager.stopAll();
        }
        if (invoke) {
            try { await invoke('stop_audio'); } catch (e) {}
        }
    },

    /**
     * 支援版本檢查的睡眠，若版本不符則拋出中斷信號
     */
    sleep: (ms) => {
        const id = WaveCodeAPI._execId;
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (id === WaveCodeAPI._execId) resolve();
                else reject('Script cancelled'); 
            }, ms);
        });
    },

    /**
     * 播放音符 (藉由 sleep 拋出的錯誤實現腳本中斷)
     */
    playNote: async (freq, duration = 500, instrumentId = 'default') => {
        if (!invoke) return;
        const currentExecId = WaveCodeAPI._execId;
        
        // 1. 啟動視覺化
        EnvelopeManager.trigger(instrumentId, duration);

        try {
            // 2. 觸發 Rust 引擎 (僅需頻率與樂器 ID)
            const voiceIndex = await invoke('trigger_note', { 
                freq: parseFloat(freq),
                instId: instrumentId
            });
            
            // 3. 等待音符持續時間
            await WaveCodeAPI.sleep(duration);
            
            // 4. 釋放聲部
            if (currentExecId === WaveCodeAPI._execId) {
                await invoke('release_note', { index: voiceIndex });
            }
        } catch (err) {
            if (err === 'Script cancelled') {
                throw err; // 必須重新拋出，才能中斷外層的循環
            } else {
                console.error('演奏指令執行錯誤:', err);
            }
        }
    },

    /**
     * 觸發音符但不等待 (用於和弦)
     * 會在背景自動執行 release_note
     */
    triggerNote: async (freq, duration = 500, instrumentId = 'default') => {
        if (!invoke) return;
        const currentExecId = WaveCodeAPI._execId;
        
        EnvelopeManager.trigger(instrumentId, duration);

        try {
            const voiceIndex = await invoke('trigger_note', { 
                freq: parseFloat(freq),
                instId: instrumentId
            });
            
            // 背景非同步等待並釋放，不阻塞主腳本流
            (async () => {
                await new Promise(r => setTimeout(r, duration));
                if (currentExecId === WaveCodeAPI._execId) {
                    await invoke('release_note', { index: voiceIndex });
                }
            })();
        } catch (err) {
            console.error('觸發指令執行錯誤:', err);
        }
    },

    stop: async () => {
        await WaveCodeAPI.reset();
    },

    getInvoke: () => invoke
};

window.WaveCode = WaveCodeAPI;
