/**
 * WaveCode API - 提供給積木腳本呼叫的非同步介面
 */

const invoke = window.__TAURI__ ? (window.__TAURI__.core ? window.__TAURI__.core.invoke : window.__TAURI__.invoke) : null;

export const WaveCodeAPI = {
    _execId: 0, // 執行版本號，用於防止舊腳本競爭

    /**
     * 更新版本號並停止所有聲音，這會讓舊腳本的 sleep 失效
     */
    reset: async () => {
        WaveCodeAPI._execId++;
        if (invoke) await invoke('stop_audio');
    },

    /**
     * 非同步等待 (支援版本檢查)
     */
    sleep: (ms) => {
        const id = WaveCodeAPI._execId;
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // 如果目前的版本號與開始 sleep 時不一致，則拋出錯誤以終止舊腳本
                if (id === WaveCodeAPI._execId) resolve();
                else reject('Script cancelled');
            }, ms);
        });
    },

    /**
     * 設定頻率 (支援版本檢查)
     * 在 Pure Rust 模式下，這也擔任「播放音符」的角色，會自動開啟音量
     */
    setFrequency: async (freq, id = 'osc1') => {
        const currentId = WaveCodeAPI._execId;
        if (invoke && currentId === WaveCodeAPI._execId) {
            // 先設定頻率，再開啟音量 (避免舊音高的殘響)
            await invoke('send_float', { receiver: `${id}_freq`, value: parseFloat(freq) });
            await invoke('send_float', { receiver: `vol`, value: 0.5 });
        }
    },

    /**
     * 直接停止聲音
     */
    stop: async () => {
        WaveCodeAPI._execId++; // 失效當前執行
        if (invoke) await invoke('stop_audio');
    },

    /**
     * 獲取 invoke 方法 (供其他模組使用)
     */
    getInvoke: () => invoke
};

// 掛載到全域，方便 Blockly 產出的代碼呼叫
window.WaveCode = WaveCodeAPI;
