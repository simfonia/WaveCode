/**
 * WaveCode API - 前端與引擎橋接層 (Web Audio 專用版)
 */
import { AudioManager } from './audio/manager.js';

export const WaveCodeAPI = {
    // --- 引擎引用 ---
    AudioManager: AudioManager,

    // --- 排程器狀態 ---
    _playbackTime: 0,      // 邏輯上的拍點時間 (秒)
    _lookAhead: 0.05,     // 提早 50ms 醒來進行排程
    _execId: 0,           // 腳本執行 ID (用於安樂死)
    _loopCounters: new Map(), // 追蹤每個腳本的同步迴圈次數

    /**
     * 初始化排程器時間
     */
    startScript: () => {
        WaveCodeAPI._execId++;
        WaveCodeAPI._loopCounters.set(WaveCodeAPI._execId, 0);
        if (AudioManager.ctx) {
            WaveCodeAPI._playbackTime = AudioManager.ctx.currentTime;
        } else {
            WaveCodeAPI._playbackTime = 0;
        }
        return WaveCodeAPI._execId;
    },

    isScriptCancelled: (id) => {
        return id !== WaveCodeAPI._execId;
    },

    /**
     * 迴圈守衛：檢查是否產生同步卡死
     */
    checkLoop: (id) => {
        if (WaveCodeAPI.isScriptCancelled(id)) throw new Error('Script cancelled');
        
        let count = WaveCodeAPI._loopCounters.get(id) || 0;
        count++;
        if (count > 10000) {
            throw new Error('同步迴圈執行過多 (10000+)，請在迴圈內加入「等待」積木以防止介面卡死。');
        }
        WaveCodeAPI._loopCounters.set(id, count);
    },

    // --- 音訊控制 ---
    /**
     * 手動觸發 (現場演奏專用，不帶 startTime 則立即發聲)
     */
    triggerNote: async (freq, instId, startTime = 0) => {
        return AudioManager.triggerNote(freq, instId, startTime);
    },

    releaseNote: async (freq, startTime = 0) => {
        return AudioManager.releaseNote(freq, startTime);
    },

    /**
     * 播放一個定時音符 (自動序列專用)
     * 使用 _playbackTime 進行精確排程
     */
    playNote: async (freq, durationMs, instId) => {
        const startTime = WaveCodeAPI._playbackTime;
        const durationSec = durationMs / 1000;
        
        // 預約未來發聲
        const voice = AudioManager.triggerNote(freq, instId, startTime);
        // 直接對該聲部預約未來釋放
        if (voice) voice.release(startTime + durationSec);
    },

    /**
     * 高精度 Sleep (排程器核心)
     */
    sleep: (ms, execId) => {
        WaveCodeAPI._loopCounters.set(execId, 0); // 歸零迴圈守衛
        const msToSec = ms / 1000;
        WaveCodeAPI._playbackTime += msToSec;

        return new Promise((resolve, reject) => {
            const realWaitMs = Math.max(0, ms - (WaveCodeAPI._lookAhead * 1000));
            setTimeout(() => {
                if (execId && WaveCodeAPI.isScriptCancelled(execId)) {
                    reject(new Error('Script cancelled'));
                } else {
                    resolve();
                }
            }, realWaitMs);
        });
    },

    stopAudio: async () => {
        WaveCodeAPI._execId++; 
        return AudioManager.stopAll();
    },

    restartAudio: async () => {
        await WaveCodeAPI.reset(); 
        return AudioManager.restart();
    },

    reset: async () => {
        WaveCodeAPI._execId++; 
        WaveCodeAPI._loopCounters.clear();
        WaveCodeAPI._playbackTime = 0;
        return AudioManager.stopAll();
    },

    setMasterVolume: async (val) => {
        return AudioManager.setMasterVolume(val);
    },

    // --- 樂器定義 ---
    _instruments: {},
    setInstruments: async (configs) => {
        WaveCodeAPI._instruments = configs;
        return AudioManager.setInstruments(configs);
    },

    // --- 系統控制 ---
    getInvoke: () => {
        const invoke = (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) || 
                       (window.__TAURI__ && window.__TAURI__.invoke);
        if (typeof invoke === 'function') return invoke;
        return async (cmd, args) => {
            console.warn(`[Tauri Mock] 指令: ${cmd}`, args);
            if (cmd === 'get_doc_content') return null; 
            return null;
        };
    }
};

window.WaveCode = WaveCodeAPI;
