/**
 * WaveCode API Core Module
 * 負責生命週期、狀態變數與同步守衛。
 */
import { AudioManager } from './audio/manager.js';

export const ApiCore = {
    _playbackTime: 0,
    _lookAhead: 0.1,
    _execId: 0,
    _bpm: 120,
    _currentInstrument: 'none',
    _instruments: {}, // 儲存當前掃描到的樂器配置
    _variables: {},   // 儲存積木自定義變數
    _loopCounters: new Map(),

    startScript: function() {
        this.reset();
        const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
        // 起點預留緩衝，確保第一拍能被 Web Audio 捕捉
        this._playbackTime = now + 0.15;
        return this._execId;
    },

    isScriptCancelled: function(id) {
        return id !== this._execId;
    },

    checkLoop: function(id) {
        if (this.isScriptCancelled(id)) throw new Error('Script cancelled');
        let count = this._loopCounters.get(id) || 0;
        count++;
        if (count > 10000) throw new Error('同步迴圈過多，請加入等待。');
        this._loopCounters.set(id, count);
    },

    setVar: function(name, val) { this._variables[name] = val; },
    getVar: function(name) { return this._variables[name]; },
    
    setBPM: function(val) { 
        this._bpm = Math.max(1, val); 
    },

    setInstruments: function(configs) {
        this._instruments = configs;
        AudioManager.setInstruments(configs);
    },

    reset: function() {
        this._execId++;
        this._playbackTime = 0;
        this._bpm = 120;
        this._loopCounters.clear();
        this._currentInstrument = 'none';
        this._variables = {};
        AudioManager.stopAll();
        if (window.EnvelopeManager) window.EnvelopeManager.stopAll();
    }
};
