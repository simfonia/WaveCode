/**
 * WaveCode API - 終極穩定版 (支援非 4/4 拍與萬用序列器)
 * [功能存續查核]：已完整保留精密排程、Look-ahead、序列埠與和弦系統。
 */
import { AudioManager } from './audio/manager.js';

export const WaveCodeAPI = {
    AudioManager: AudioManager,

    // --- 核心狀態 ---
    _playbackTime: 0,
    _contextStartTime: 0,  
    _lookAhead: 0.15,
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
        
        const defaultVel = 1.0; 

        for (const token of tokens) {
            if (this.isScriptCancelled(id)) return;
            
            // 嚴格模式：一個 Token 必須包含 [音名/和弦] + [時值] + [可選力度]
            const match = token.match(/^([A-Ga-g][#bB]?\d?|[A-Za-z0-9_]+|R)([WHQES][^:v]*)(?:[:v](\d+))?$/);
            if (!match) continue;
            
            const noteOrChord = match[1];
            const durCode = match[2];
            const velSuffix = match[3];
            
            const beats = this._parseDuration(durCode);
            const startTime = this._playbackTime;
            const durSec = beats * (60 / (this._bpm || 120));
            const noteVel = velSuffix ? (parseInt(velSuffix) / 100) : defaultVel;

            if (noteOrChord.toUpperCase() !== 'R') {
                if (this._chords[noteOrChord]) {
                    this._chords[noteOrChord].forEach(n => {
                        const v = AudioManager.triggerNote(n, inst, startTime, noteVel);
                        if (v) v.release(startTime + durSec);
                    });
                } else {
                    const v = AudioManager.triggerNote(noteOrChord, inst, startTime, noteVel);
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

    playCountIn: async function(measures, beatsPerMeasure, beatUnit, velocity) {
        const id = WaveCodeAPI._execId;
        const totalBeats = measures * beatsPerMeasure;
        const velVal = (velocity || 100) / 100;
        const bpm = this._bpm || WaveCodeAPI._bpm || 120;
        
        // 根據分母計算每一跳的拍數 (例如 8 分音符為 0.5 拍)
        const beatsPerTick = 4 / beatUnit;

        for (let i = 0; i < totalBeats; i++) {
            if (this.isScriptCancelled(id)) return;
            const isDownbeat = (i % beatsPerMeasure === 0);
            const freq = isDownbeat ? 880 : 440;
            const startTime = this._playbackTime;

            AudioManager.triggerClick(freq, startTime, velVal);
            
            // 按照拍號指定的單位等待
            await this.waitMusical(beatsPerTick, 'BEATS');
        }
    },

    /**
     * 【萬用精密序列器】(支援自定義拍號)
     */
    playRhythmV2: function(instId, pattern, beats, res, vel, isChord, startMeasure = 1, beatUnit = 4) {
        const id = WaveCodeAPI._execId;
        const inst = instId === 'none' ? this._currentInstrument : instId;
        const stepBeats = 1 / res;
        const velVal = vel / 100;
        const bpm = this._bpm || WaveCodeAPI._bpm || 120;
        const beatSec = 60 / bpm;
        
        // --- 核心修正：根據拍號計算一小節的拍數 ---
        // 拍號 3/4 代表 3 拍；拍號 6/8 代表 3 拍 (假設 8 分音符為 0.5 拍)
        const beatsPerMeasure = parseFloat(beats) * (4 / parseFloat(beatUnit));
        const targetStartTime = this._contextStartTime + ((parseFloat(startMeasure) - 1) * beatsPerMeasure * beatSec);
        
        if (targetStartTime > this._playbackTime) this._playbackTime = targetStartTime;

        const tokens = [];
        let buffer = "";
        const raw = pattern.replace(/\|/g, " ");
        for (let i = 0; i < raw.length; i++) {
            const char = raw[i];
            if (char === ' ') { if (buffer.length > 0) { tokens.push(buffer); buffer = ""; } }
            else if (char === '.' || char === '-') { if (buffer.length > 0) { tokens.push(buffer); buffer = ""; } tokens.push(char); }
            else { buffer += char; }
        }
        if (buffer.length > 0) tokens.push(buffer);

        const totalSteps = parseFloat(beats) * res;
        const baseTime = this._playbackTime;

        for (let k = 0; k < Math.min(tokens.length, totalSteps); k++) {
            const rawToken = tokens[k];
            const token = rawToken.toUpperCase();
            const startTime = baseTime + (k * stepBeats * beatSec);

            if (token !== "." && token !== "-") {
                let sustain = 1;
                for (let next = k + 1; next < tokens.length; next++) { if (tokens[next] === "-") sustain++; else break; }
                const durSec = (sustain * stepBeats) * beatSec;
                let note = (token === "X") ? 60 : rawToken;

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
