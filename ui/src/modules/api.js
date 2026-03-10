/**
 * WaveCode API - 複音播放介面 (中斷優化版)
 */

const invoke = window.__TAURI__ ? (window.__TAURI__.core ? window.__TAURI__.core.invoke : window.__TAURI__.invoke) : null;

export const WaveCodeAPI = {
    _execId: 0, 

    /**
     * 重置環境：增加版本號並停止所有音訊
     */
    reset: async () => {
        WaveCodeAPI._execId++;
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
    playNote: async (freq, duration = 500) => {
        if (!invoke) return;
        const currentId = WaveCodeAPI._execId;

        // 1. 觸發音符
        const voiceIndex = await invoke('trigger_note', { freq: parseFloat(freq) });
        
        // 2. 演奏期間等待 (中斷點)
        await WaveCodeAPI.sleep(duration);
        
        // 3. 釋放聲部
        if (currentId === WaveCodeAPI._execId) {
            await invoke('release_note', { index: voiceIndex });
        }
    },

    stop: async () => {
        await WaveCodeAPI.reset();
    },

    getInvoke: () => invoke
};

window.WaveCode = WaveCodeAPI;
