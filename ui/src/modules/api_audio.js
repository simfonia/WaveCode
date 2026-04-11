/**
 * WaveCode API Audio Module
 * 負責發聲、旋律解析、和弦與序列器。
 */
import { AudioManager } from './audio/manager.js';

export const ApiAudio = {
    _chords: {},

    setEffectParam: async function(instId, compType, paramName, val) {
        const inst = instId === 'none' ? this._currentInstrument : instId;
        AudioManager.updateInstrumentParam(inst, compType, paramName, val);
    },

    wait: async function(ms) {
        const id = this._execId;
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
        
        // 防追趕容差 (200ms)
        if (this._playbackTime < now - 0.2) {
            this._playbackTime = now;
        }

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
        const id = this._execId;
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

        if (window.EnvelopeManager && durSec > 0) {
            const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
            const delayMs = Math.max(0, (startTime - now) * 1000);
            setTimeout(() => {
                if (!this.isScriptCancelled(id)) window.EnvelopeManager.trigger(inst, durSec * 1000);
            }, delayMs);
        }
        await this.waitMusical(beats, 'BEATS');
    },

    playMelody: async function(score, instId = 'none') {
        const id = this._execId;
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
                const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
                const delayMs = Math.max(0, (startTime - now) * 1000);
                if (window.EnvelopeManager) {
                    setTimeout(() => {
                        if (!this.isScriptCancelled(id)) window.EnvelopeManager.trigger(inst, durSec * 1000);
                    }, delayMs);
                }
            }
            await this.waitMusical(beats, 'BEATS');
        }
    },

    playCountIn: async function(measures, beatsPerMeasure, velocity) {
        const velVal = (velocity || 100) / 100;
        for (let i = 0; i < measures * beatsPerMeasure; i++) {
            if (this.isScriptCancelled(this._execId)) return;
            const freq = (i % beatsPerMeasure === 0) ? 880 : 440;
            AudioManager.triggerClick(freq, this._playbackTime, velVal);
            await this.waitMusical(1, 'BEATS');
        }
    },

    playRhythmV2: function(instId, pattern, beats, res, vel, isChord) {
        const id = this._execId;
        const inst = instId === 'none' ? this._currentInstrument : instId;
        const stepBeats = 1 / res;
        const velVal = vel / 100;
        const beatSec = 60 / (this._bpm || 120);
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
                const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
                const delayMs = Math.max(0, (startTime - now) * 1000);
                if (window.EnvelopeManager) {
                    setTimeout(() => {
                        if (!this.isScriptCancelled(id)) window.EnvelopeManager.trigger(inst, durSec * 1000);
                    }, delayMs);
                }
            }
        }
    },

    releaseNote: async function(freq, startTime = 0, instId = 'none') {
        const inst = instId === 'none' ? this._currentInstrument : instId;
        return AudioManager.releaseNote(freq, startTime, inst);
    },

    defineChord: function(name, notesStr) {
        this._chords[name] = notesStr.split(/[\s,]+/).filter(n => n.length > 0);
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
    }
};
