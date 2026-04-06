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
    _bpm: 120,            // 預設 BPM
    _currentInstrument: 'none', // 當前預設樂器
    _loopCounters: new Map(), // 追蹤每個腳本的同步迴圈次數

    /**
     * 初始化排程器時間
     */
    startScript: () => {
        WaveCodeAPI._execId++;
        WaveCodeAPI._loopCounters.set(WaveCodeAPI._execId, 0);
        WaveCodeAPI._bpm = 120; // 重置 BPM
        WaveCodeAPI._currentInstrument = 'none';
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
    setBPM: async (val) => {
        WaveCodeAPI._bpm = Math.max(1, val);
    },

    setCurrentInstrument: async (name) => {
        WaveCodeAPI._currentInstrument = name;
    },

    /**
     * 手動觸發 (現場演奏專用，不帶 startTime 則立即發聲)
     */
    triggerNote: async (freq, instId, startTime = 0) => {
        const inst = instId === 'none' ? WaveCodeAPI._currentInstrument : instId;
        
        // 觸發 ADSR 視覺化 (0 代表 Hold 模式)
        if (window.EnvelopeManager) {
            window.EnvelopeManager.trigger(inst, 0);
        }
        
        return AudioManager.triggerNote(freq, inst, startTime);
    },

    releaseNote: async (freq, startTime = 0) => {
        // 結束 ADSR 視覺化 (這裡較難精確對應單一音符，暫時針對樂器結束 Hold)
        if (window.EnvelopeManager) {
            // 注意：這裡我們不知道是哪個樂器釋放的，通常由 KeyboardController 傳入
            window.EnvelopeManager.triggerEnd();
        }
        return AudioManager.releaseNote(freq, startTime);
    },

    /**
     * 播放一個定時音符 (自動序列專用)
     * 使用 _playbackTime 進行精確排程
     */
    playNote: async (freq, durationMs, instId) => {
        const startTime = WaveCodeAPI._playbackTime;
        const durationSec = durationMs / 1000;
        const inst = instId === 'none' ? WaveCodeAPI._currentInstrument : instId;
        
        // 觸發 ADSR 視覺化 (排程模式)
        // 由於 Web Audio 是預約排程，視覺化也需要考慮延遲
        const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
        const delayMs = Math.max(0, (startTime - now) * 1000);
        
        if (window.EnvelopeManager) {
            setTimeout(() => {
                if (window.EnvelopeManager) window.EnvelopeManager.trigger(inst, durationMs);
            }, delayMs);
        }

        // 預約未來發聲
        const voice = AudioManager.triggerNote(freq, inst, startTime);
        // 直接對該聲部預約未來釋放
        if (voice) voice.release(startTime + durationSec);
    },

    /**
     * 播放旋律字串 (完全對齊 #nyx 與 melody_zh-hant.html 規格)
     * 格式範例: C4Q, D4E, RQ, CM7H.+E, G4Q_T
     */
    playMelody: async (melodyStr, instId) => {
        const tokens = melodyStr.replace(/\n/g, ' ').split(/[\s,]+/).map(s => s.trim()).filter(s => s.length > 0);
        const beatMs = 60000 / WaveCodeAPI._bpm;
        
        const lengthMap = { 'W': 4, 'H': 2, 'Q': 1, 'E': 0.5, 'S': 0.25, 'T': 0.125 };

        /**
         * 內部函式：解析複雜時值 (如 H.+E)
         */
        const parseDuration = (durStr) => {
            const parts = durStr.split('+');
            let totalBeats = 0;
            for (let p of parts) {
                // 比對 [時值字母][附點?][三連音標記?]
                const m = p.match(/([WwHhQqEeSsTt])(\.?)(_T)?/);
                if (!m) continue;
                
                let val = lengthMap[m[1].toUpperCase()] || 0;
                if (m[2] === '.') val *= 1.5;
                if (m[3] === '_T') val *= (2 / 3);
                totalBeats += val;
            }
            return totalBeats;
        };

        for (const token of tokens) {
            // 分離「音名/和弦/R」與「時值部分」
            // 正則解釋：從開頭匹配任意字元直到遇到最後一個時值字母 (W,H,Q,E,S,T)
            const match = token.match(/^(.+?)([WwHhQqEeSsTt][\w+._]*)$/);
            if (!match) continue;

            const noteOrChord = match[1];
            const durationPart = match[2];
            
            const beats = parseDuration(durationPart);
            const durMs = beats * beatMs;
            
            if (durMs <= 0) continue;

            if (noteOrChord.toUpperCase() === 'R') {
                // 休止符
                await WaveCodeAPI.sleep(durMs, WaveCodeAPI._execId);
            } else if (WaveCodeAPI._chords[noteOrChord]) {
                // 已定義的和弦
                await WaveCodeAPI.playChord(noteOrChord, durMs, instId);
                await WaveCodeAPI.sleep(durMs, WaveCodeAPI._execId);
            } else {
                // 單音
                await WaveCodeAPI.playNote(noteOrChord, durMs, instId);
                await WaveCodeAPI.sleep(durMs, WaveCodeAPI._execId);
            }
        }
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

    // --- 和弦定義 ---
    _chords: {},
    defineChord: async (name, notes) => {
        WaveCodeAPI._chords[name] = notes;
    },

    playChord: async (chordName, durationMs, instId) => {
        const notes = WaveCodeAPI._chords[chordName];
        if (!notes) {
            console.warn(`未定義的和弦: ${chordName}`);
            return;
        }
        const startTime = WaveCodeAPI._playbackTime;
        const durationSec = durationMs / 1000;
        const inst = instId === 'none' ? WaveCodeAPI._currentInstrument : instId;

        // 觸發 ADSR 視覺化 (排程模式)
        const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
        const delayMs = Math.max(0, (startTime - now) * 1000);

        if (window.EnvelopeManager) {
            setTimeout(() => {
                if (window.EnvelopeManager) window.EnvelopeManager.trigger(inst, durationMs);
            }, delayMs);
        }

        notes.forEach(note => {
            const voice = AudioManager.triggerNote(note, inst, startTime);
            if (voice) voice.release(startTime + durationSec);
        });
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
