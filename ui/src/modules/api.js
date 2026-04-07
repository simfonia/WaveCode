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
    _chords: {}, // 儲存定義的和弦
    
    // 追蹤所有活躍的樂器，由 Compiler 填充
    _instruments: {},

    /**
     * 初始化排程器時間
     */
    startScript: () => {
        WaveCodeAPI._execId++;
        WaveCodeAPI._loopCounters.set(WaveCodeAPI._execId, 0);
        WaveCodeAPI._bpm = 120; // 重置 BPM
        WaveCodeAPI._currentInstrument = 'none';
        WaveCodeAPI._chords = {};
        
        if (AudioManager.ctx) {
            // 從目前的 AudioContext 時間點開始排程
            WaveCodeAPI._playbackTime = AudioManager.ctx.currentTime + 0.1;
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

    setInstruments: (configs) => {
        WaveCodeAPI._instruments = configs;
        AudioManager.setInstruments(configs);
    },

    /**
     * 基礎等待函式 (含安樂死檢查)
     */
    wait: async (ms) => {
        const id = WaveCodeAPI._execId;
        return new Promise(resolve => {
            setTimeout(() => {
                if (WaveCodeAPI.isScriptCancelled(id)) return; // 終止
                // 成功等待後，重置迴圈計數器
                WaveCodeAPI._loopCounters.set(id, 0);
                resolve();
            }, ms);
        });
    },

    /**
     * 手動觸發 (現場演奏或非同步觸發專用)
     */
    triggerNote: async (freq, instId = 'none', startTime = 0, durationMs = 0) => {
        const inst = instId === 'none' ? WaveCodeAPI._currentInstrument : instId;
        
        const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
        const start = startTime > 0 ? startTime : now;
        const delayMs = Math.max(0, (start - now) * 1000);

        // --- 視覺化同步 ---
        if (window.EnvelopeManager) {
            if (durationMs > 0) {
                setTimeout(() => {
                    if (WaveCodeAPI.isScriptCancelled(WaveCodeAPI._execId)) return;
                    window.EnvelopeManager.trigger(inst, durationMs);
                }, delayMs);
            } else {
                setTimeout(() => {
                    if (WaveCodeAPI.isScriptCancelled(WaveCodeAPI._execId)) return;
                    window.EnvelopeManager.triggerStart(inst);
                }, delayMs);
            }
        }
        
        const voice = AudioManager.triggerNote(freq, inst, startTime);
        if (voice && durationMs > 0) {
            voice.release(start + (durationMs / 1000));
        }
        return voice;
    },

    releaseNote: async (freq, startTime = 0) => {
        if (window.EnvelopeManager) window.EnvelopeManager.triggerEnd();
        return AudioManager.releaseNote(freq, startTime);
    },

    /**
     * 播放一個定時音符 (同步阻塞模式)
     */
    playNote: async (freq, durationMs, instId = 'none') => {
        const id = WaveCodeAPI._execId;
        const inst = instId === 'none' ? WaveCodeAPI._currentInstrument : instId;
        
        const startTime = WaveCodeAPI._playbackTime;
        const durationSec = durationMs / 1000;
        const releaseTime = startTime + durationSec;

        if (window.EnvelopeManager) {
            const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
            const delayMs = Math.max(0, (startTime - now) * 1000);
            setTimeout(() => {
                if (WaveCodeAPI.isScriptCancelled(id)) return;
                window.EnvelopeManager.trigger(inst, durationMs);
            }, delayMs);
        }

        const voice = AudioManager.triggerNote(freq, inst, startTime);
        if (voice) voice.release(releaseTime);

        WaveCodeAPI._playbackTime += durationSec;
        await WaveCodeAPI.wait(durationMs);
    },

    /**
     * 旋律解析核心 (對齊 melody_zh-hant.html)
     */
    _parseDuration: (code) => {
        if (!code) return 0;
        const baseMap = { 'W': 4, 'H': 2, 'Q': 1, 'E': 0.5, 'S': 0.25 };
        
        // 處理連結線 +
        if (code.includes('+')) {
            return code.split('+').reduce((acc, part) => acc + WaveCodeAPI._parseDuration(part), 0);
        }

        // 提取基礎時值與修飾符
        const match = code.match(/([WHQES])(\.*)(_T)?/);
        if (!match) return 0;

        let beats = baseMap[match[1]] || 0;
        // 附點 .
        if (match[2]) {
            for (let i = 0; i < match[2].length; i++) beats *= 1.5;
        }
        // 三連音 _T
        if (match[3]) beats *= (2/3);

        return beats;
    },

    /**
     * 播放旋律字串 (對齊完整語法)
     */
    playMelody: async (score, instId = 'none') => {
        const id = WaveCodeAPI._execId;
        const inst = instId === 'none' ? WaveCodeAPI._currentInstrument : instId;
        const beatDuration = 60 / WaveCodeAPI._bpm; // 一拍幾秒

        // 移除註解並分割標記
        const tokens = score.replace(/\/\/.*$/gm, '').split(/[\s,]+/).filter(t => t.length > 0);

        for (const token of tokens) {
            if (WaveCodeAPI.isScriptCancelled(id)) return;

            // 分離「音高/和弦」與「時值」
            // 語法規律：[Note/Chord][Duration] 如 C4Q, CM7H, RQ
            const match = token.match(/^([A-Ga-g][#bB]?\d?|[A-Za-z0-9_]+|R)([WHQES].*)$/);
            if (!match) continue;

            const noteOrChord = match[1];
            const durCode = match[2];
            const beats = WaveCodeAPI._parseDuration(durCode);
            const durationSec = beats * beatDuration;
            const durationMs = durationSec * 1000;

            const startTime = WaveCodeAPI._playbackTime;
            const releaseTime = startTime + durationSec;

            if (noteOrChord.toUpperCase() !== 'R') {
                // 1. 處理視覺化
                if (window.EnvelopeManager) {
                    const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
                    const delayMs = Math.max(0, (startTime - now) * 1000);
                    setTimeout(() => {
                        if (WaveCodeAPI.isScriptCancelled(id)) return;
                        window.EnvelopeManager.trigger(inst, durationMs);
                    }, delayMs);
                }

                // 2. 處理發聲 (單音或和弦)
                if (WaveCodeAPI._chords[noteOrChord]) {
                    // 是和弦
                    WaveCodeAPI._chords[noteOrChord].forEach(n => {
                        const voice = AudioManager.triggerNote(n, inst, startTime);
                        if (voice) voice.release(releaseTime);
                    });
                } else {
                    // 是單音
                    const voice = AudioManager.triggerNote(noteOrChord, inst, startTime);
                    if (voice) voice.release(releaseTime);
                }
            }

            // 3. 更新排程時間
            WaveCodeAPI._playbackTime += durationSec;
            // 4. 實體等待
            await WaveCodeAPI.wait(durationMs);
        }
    },

    /**
     * 定義和弦
     */
    defineChord: async (name, notesStr) => {
        const notes = notesStr.split(/[\s,]+/).filter(n => n.length > 0);
        WaveCodeAPI._chords[name] = notes;
    },

    /**
     * 播放和弦 (同步模式)
     */
    playChord: async (name, durationMs, instId = 'none') => {
        const notes = WaveCodeAPI._chords[name];
        if (!notes || notes.length === 0) return;

        const id = WaveCodeAPI._execId;
        const inst = instId === 'none' ? WaveCodeAPI._currentInstrument : instId;
        
        const startTime = WaveCodeAPI._playbackTime;
        const durationSec = durationMs / 1000;
        const releaseTime = startTime + durationSec;

        if (window.EnvelopeManager) {
            const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
            const delayMs = Math.max(0, (startTime - now) * 1000);
            setTimeout(() => {
                if (WaveCodeAPI.isScriptCancelled(id)) return;
                window.EnvelopeManager.trigger(inst, durationMs);
            }, delayMs);
        }

        notes.forEach(note => {
            const voice = AudioManager.triggerNote(note, inst, startTime);
            if (voice) voice.release(releaseTime);
        });

        WaveCodeAPI._playbackTime += durationSec;
        await WaveCodeAPI.wait(durationMs);
    },

    /**
     * 停止所有音訊並清除腳本
     */
    stopAudio: async () => {
        WaveCodeAPI._execId++; 
        AudioManager.stopAll();
        if (window.EnvelopeManager) window.EnvelopeManager.stopAll();
    },

    reset: async () => {
        await WaveCodeAPI.stopAudio();
    },

    restartAudio: async () => {
        await WaveCodeAPI.stopAudio();
        await AudioManager.restart();
    },

    setMasterVolume: (val) => {
        AudioManager.setMasterVolume(val);
    },

    getInvoke: () => {
        if (window.__TAURI__ && window.__TAURI__.core) return window.__TAURI__.core.invoke;
        return async (cmd, args) => {
            console.warn(`[Tauri Mock] 指令: ${cmd}`, args);
            return null;
        };
    }
};

window.WaveCode = WaveCodeAPI;
