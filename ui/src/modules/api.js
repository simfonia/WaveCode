/**
 * WaveCode API - 終極穩定版 (上下文對位與冗餘清理)
 * 解決 Loop 環境下絕對時間失效導致的對位錯誤。
 */
import { AudioManager } from './audio/manager.js';

export const WaveCodeAPI = {
    AudioManager: AudioManager,

    // --- 核心狀態 ---
    _playbackTime: 0,
    _contextStartTime: 0,  // 此軌道或容器啟動的基準點
    _lookAhead: 0.15,      // 增加至 150ms 以應付更高負載
    _execId: 0,
    _bpm: 120,
    _currentInstrument: 'none',
    _instruments: {},
    _variables: {},
    _chords: {},
    _loopCounters: new Map(),
    
    _serialPort: null,
    _serialRaw: "",
    _serialFields: {},
    _lastFields: {},
    _serialHandlers: [],

    startScript: function() {
        this.reset();
        const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
        this._playbackTime = now + 0.15;
        this._contextStartTime = this._playbackTime;
        return this._execId;
    },

    createTrack: function() {
        const track = Object.create(this);
        track._playbackTime = this._playbackTime;
        // 關鍵修正：將目前的進度設為新軌道的「上下文起點」
        track._contextStartTime = this._playbackTime;
        track._currentInstrument = this._currentInstrument;
        return track;
    },

    isScriptCancelled: function(id) {
        return id !== WaveCodeAPI._execId;
    },

    checkLoop: function(id) {
        if (this.isScriptCancelled(id)) throw new Error('Script cancelled');
        let count = this._loopCounters.get(id) || 0;
        count++;
        if (count > 10000) throw new Error('迴圈次數過多');
        this._loopCounters.set(id, count);
    },

    setVar: function(name, val) { this._variables[name] = val; },
    getVar: function(name) { return this._variables[name]; },
    setBPM: function(val) { 
        this._bpm = Math.max(1, val); 
        WaveCodeAPI._bpm = this._bpm;
    },

    setCurrentInstrument: function(name) {
        this._currentInstrument = name;
        const display = document.getElementById('current-instrument-display');
        if (display && (this === WaveCodeAPI || !this._playbackTime)) {
            display.textContent = name === 'none' ? '' : `(${name})`;
            display.classList.toggle('active', name !== 'none');
        }
    },

    setInstruments: function(configs) {
        this._instruments = configs;
        AudioManager.setInstruments(configs);
    },

    setEffectParam: function(instId, compType, paramName, val) {
        const inst = instId === 'none' ? this._currentInstrument : instId;
        AudioManager.updateInstrumentParam(inst, compType, paramName, val);
    },

    setMasterVolume: function(val) {
        AudioManager.setMasterVolume(val);
    },

    wait: async function(ms) {
        const id = WaveCodeAPI._execId;
        return new Promise(resolve => {
            setTimeout(() => {
                if (this.isScriptCancelled(id)) return;
                this._loopCounters.set(id, 0);
                resolve();
            }, Math.max(0, ms));
        });
    },

    waitMusical: async function(val, unit) {
        let beats = val;
        if (unit === 'MEASURES') beats = val * 4;
        const beatSec = 60 / (this._bpm || 120);
        let totalSec = beats * beatSec;
        if (unit === 'SECONDS') totalSec = val;
        if (unit === 'MS') totalSec = val / 1000;

        this._playbackTime += totalSec;
        const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
        // 防追趕
        if (this._playbackTime < now - 0.2) this._playbackTime = now;

        const remainingSec = (this._playbackTime - this._lookAhead) - now;
        if (remainingSec > 0) await this.wait(remainingSec * 1000);
    },

    triggerNote: async function(note, instId = 'none', startTime = 0, duration = 0, velocity = 100) {
        const inst = instId === 'none' ? this._currentInstrument : instId;
        const velVal = velocity / 100;
        const beatSec = 60 / (this._bpm || 120);
        const durSec = (typeof duration === 'string' ? this._parseDuration(duration) : duration) * beatSec;
        const start = startTime > 0 ? startTime : (AudioManager.ctx ? AudioManager.ctx.currentTime : 0);

        if (this._chords[note]) {
            this._chords[note].forEach(n => {
                const v = AudioManager.triggerNote(n, inst, start, velVal);
                if (v && durSec > 0) v.release(start + durSec);
            });
        } else {
            const v = AudioManager.triggerNote(note, inst, start, velVal);
            if (v && durSec > 0) v.release(start + durSec);
        }
    },

    playNote: async function(note, duration, instId = 'none', velocity = 100) {
        const id = WaveCodeAPI._execId;
        const inst = instId === 'none' ? this._currentInstrument : instId;
        const velVal = velocity / 100;
        const beats = (typeof duration === 'string') ? this._parseDuration(duration) : duration;
        const durSec = beats * (60 / (this._bpm || 120));
        const startTime = this._playbackTime;

        if (this._chords[note]) {
            this._chords[note].forEach(n => {
                const v = AudioManager.triggerNote(n, inst, startTime, velVal);
                if (v) v.release(startTime + durSec);
            });
        } else {
            const v = AudioManager.triggerNote(note, inst, startTime, velVal);
            if (v) v.release(startTime + durSec);
        }

        if (window.EnvelopeManager && window.EnvelopeManager._registry.has(inst) && durSec > 0) {
            const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
            const delayMs = Math.max(0, (startTime - now) * 1000);
            setTimeout(() => { if (!this.isScriptCancelled(id)) window.EnvelopeManager.trigger(inst, durSec * 1000); }, delayMs);
        }
        await this.waitMusical(beats, 'BEATS');
    },

    playMelody: async function(score, instId = 'none') {
        const id = WaveCodeAPI._execId;
        const inst = instId === 'none' ? this._currentInstrument : instId;
        const tokens = score.replace(/\/\/.*$/gm, '').split(/[\s,]+/).filter(t => t.length > 0);
        for (const token of tokens) {
            if (this.isScriptCancelled(id)) return;
            const match = token.match(/^([A-Ga-g][#bB]?\d?|[A-Za-z0-9_]+|R)([WHQES].*)$/);
            if (!match) continue;
            const noteOrChord = match[1], durCode = match[2];
            const beats = this._parseDuration(durCode);
            const startTime = this._playbackTime;
            const durSec = beats * (60 / (this._bpm || 120));

            if (noteOrChord.toUpperCase() !== 'R') {
                if (this._chords[noteOrChord]) {
                    this._chords[noteOrChord].forEach(n => {
                        const v = AudioManager.triggerNote(n, inst, startTime);
                        if (v) v.release(startTime + durSec);
                    });
                } else {
                    const v = AudioManager.triggerNote(noteOrChord, inst, startTime);
                    if (v) v.release(startTime + durSec);
                }
                if (window.EnvelopeManager && window.EnvelopeManager._registry.has(inst)) {
                    const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
                    const delayMs = Math.max(0, (startTime - now) * 1000);
                    setTimeout(() => { if (!this.isScriptCancelled(id)) window.EnvelopeManager.trigger(inst, durSec * 1000); }, delayMs);
                }
            }
            await this.waitMusical(beats, 'BEATS');
        }
    },

    playCountIn: async function(measures, beatsPerMeasure, velocity) {
        const velVal = (velocity || 100) / 100;
        for (let i = 0; i < measures * beatsPerMeasure; i++) {
            if (this.isScriptCancelled(WaveCodeAPI._execId)) return;
            const freq = (i % beatsPerMeasure === 0) ? 880 : 440;
            AudioManager.triggerClick(freq, this._playbackTime, velVal);
            await this.waitMusical(1, 'BEATS');
        }
    },

    playRhythmV2: function(instId, pattern, beats, res, vel, isChord, startMeasure = 1) {
        const id = WaveCodeAPI._execId;
        const inst = instId === 'none' ? this._currentInstrument : instId;
        const stepBeats = 1 / res;
        const velVal = vel / 100;
        const bpm = this._bpm || WaveCodeAPI._bpm || 120;
        const beatSec = 60 / bpm;
        
        // 修正：基於上下文起點 (容器開始的時間) 來計算偏移
        const targetStartTime = this._contextStartTime + ((parseFloat(startMeasure) - 1) * 4 * beatSec);
        
        if (targetStartTime > this._playbackTime) {
            this._playbackTime = targetStartTime;
        }

        const cleanPattern = pattern.replace(/[\s|]+/g, '');
        const baseTime = this._playbackTime;

        for (let i = 0; i < Math.min(cleanPattern.length, beats * res); i++) {
            const char = cleanPattern[i];
            const startTime = baseTime + (i * stepBeats * beatSec);
            if (char.toLowerCase() === 'x' || (isChord && this._chords[char])) {
                let sustain = 1;
                while (i + sustain < cleanPattern.length && cleanPattern[i + sustain] === '-') sustain++;
                const durSec = (sustain * stepBeats) * beatSec;
                const note = (char.toLowerCase() === 'x') ? 60 : char;

                if (isChord && this._chords[note]) {
                    this._chords[note].forEach(n => {
                        const v = AudioManager.triggerNote(n, inst, startTime, velVal);
                        if (v) v.release(startTime + durSec * 0.95);
                    });
                } else {
                    const v = AudioManager.triggerNote(note, inst, startTime, velVal);
                    if (v) v.release(startTime + durSec * 0.95);
                }
                
                if (window.EnvelopeManager && window.EnvelopeManager._registry.has(inst)) {
                    const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
                    const delayMs = Math.max(0, (startTime - now) * 1000);
                    setTimeout(() => { if (!this.isScriptCancelled(id)) window.EnvelopeManager.trigger(inst, durSec * 1000); }, delayMs);
                }
            }
        }
    },

    defineChord: function(name, notesStr) {
        this._chords[name] = notesStr.split(/[\s,]+/).filter(n => n.length > 0);
    },

    releaseNote: async function(freq, startTime = 0, instId = 'none') {
        const inst = instId === 'none' ? this._currentInstrument : instId;
        return AudioManager.releaseNote(freq, startTime, inst);
    },

    _parseDuration: function(code) {
        if (!code) return 0;
        if (!isNaN(code)) return parseFloat(code);
        const baseMap = { 'W': 4, 'H': 2, 'Q': 1, 'E': 0.5, 'S': 0.25 };
        const match = code.match(/([WHQES])(\.*)(_T)?/);
        if (!match) return 0;
        let b = baseMap[match[1]] || 0;
        if (match[2]) { for (let i = 0; i < match[2].length; i++) b *= 1.5; }
        if (match[3]) b *= (2/3);
        return b;
    },

    listSerialPorts: async function() { return await this.getInvoke()('list_serial_ports'); },
    openSerial: async function(port, baud) {
        try {
            await this.getInvoke()('open_serial', { portName: port, baudRate: parseInt(baud) });
            this._serialPort = port;
        } catch (err) { throw err; }
    },
    closeSerial: async function() { await this.getInvoke()('close_serial'); this._serialPort = null; },
    isTtpTriggered: function(prefix, keyIndex) {
        const current = this._serialFields[prefix] || "0000000000000000";
        const last = this._lastFields[prefix] || "0000000000000000";
        return current[keyIndex-1] === '1' && last[keyIndex-1] === '0';
    },
    getSerialField: function(prefix) { return this._serialFields[prefix] || ""; },
    registerSerialHandler: function(h) { this._serialHandlers.push(h); },
    handleSerialData: function(data) {
        if (!data || data === this._serialRaw) return;
        this._serialRaw = data;
        let prefix = "RAW", value = data;
        if (data.includes(":")) { const pts = data.split(":"); prefix = pts[0]; value = pts[1]; }
        else if (data === "Kick") { prefix = "EVENT"; value = "Kick"; }
        this._lastFields[prefix] = this._serialFields[prefix] || value;
        this._serialFields[prefix] = value;
        this._serialHandlers.forEach(h => { try { h(data, this._execId); } catch (e) {} });
    },

    reset: function() {
        this._execId++;
        this._playbackTime = 0;
        this._contextStartTime = 0;
        this._bpm = 120;
        this._loopCounters.clear();
        this._serialHandlers = [];
        this._serialFields = {};
        this._lastFields = {};
        this._currentInstrument = 'none';
        this._variables = {};
        this._chords = {};
        AudioManager.stopAll();
        if (window.EnvelopeManager) window.EnvelopeManager.stopAll();
    },
    stopAudio: async function() { this.reset(); },
    restartAudio: async function() { this.reset(); await AudioManager.restart(); },
    getInvoke: function() {
        if (window.__TAURI__ && window.__TAURI__.core) return window.__TAURI__.core.invoke;
        return async () => null;
    }
};

window.WaveCode = WaveCodeAPI;
if (window.__TAURI__ && window.__TAURI__.event) {
    window.__TAURI__.event.listen('serial-data', (e) => { WaveCodeAPI.handleSerialData(e.payload); });
}
