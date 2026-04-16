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
    _lookAhead: 0.1, // 初始預覽緩衝 (秒)
    _execId: 0,
    _bpm: 120,
    _currentInstrument: 'none',
    _instruments: {},
    _variables: {},
    _chords: {},
    _loopCounters: new Map(),

    /**
     * 音樂解析工具 (全域唯一真理來源)
     */
    MusicUtils: {
        // 音名/和弦名稱匹配 (支援 #, s, S, b, B)
        NOTE_PATTERN: /^([A-Ga-g][#bsSB]?\d?|[A-Za-z0-9_]+|R)$/,
        // 旋律 Token 匹配 (音名 + 時值 + 力度)
        MELODY_TOKEN_PATTERN: /^([A-Ga-g][#bsSB]?\d?|[A-Za-z0-9_]+|R)([WHQES][^:v]*)(?:[:v](\d+))?$/,
        
        noteToMidi: function(name) {
            if (!name || typeof name !== 'string') return 60;
            const n = name.toUpperCase();
            if (n === 'R') return 0;
            const octaveMatch = n.match(/\d/);
            const octave = octaveMatch ? parseInt(octaveMatch[0]) : 4;
            const baseMap = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
            let base = baseMap[n[0]] || 0;
            
            // 取得除去音名首字與八度數字後的記號部分 (如 Bb4 -> B, Cs4 -> S)
            const accidentalPart = n.slice(1).replace(/\d/g, '');
            if (accidentalPart.includes('#') || accidentalPart.includes('S')) {
                base += 1;
            } else if (accidentalPart.includes('B')) {
                base -= 1;
            }
            return (octave + 1) * 12 + base;
        },
        
        noteToFreq: function(name) {
            const midi = (typeof name === 'string') ? this.noteToMidi(name) : name;
            if (midi === 0) return 0;
            // 標準 MIDI 頻率公式：440 * 2^((midi-69)/12)
            return 440 * Math.pow(2, (midi - 69) / 12);
        },
        
        midiToNoteName: function(midi) {
            const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const octave = Math.floor(midi / 12) - 1;
            const name = notes[midi % 12];
            return `${name}${octave}`;
        },

        midiToFreq: function(midi) {
            if (midi <= 0) return 0;
            return 440 * Math.pow(2, (midi - 69) / 12);
        }
    },
    
    _serialPort: null,
    _serialRaw: "",
    _serialFields: {},
    _lastFields: {},
    _serialHandlers: [],
    _midiHandlers: [],
    _keyHandlers: [], // 新增：自定義按鍵處理器
    _midiInitialized: false,
    _keyInitialized: false,

    startScript: function() {
        this.reset();
        this._initMidi(); // 啟動腳本時確保 MIDI 已初始化
        this._initKeyEvents(); // 啟動腳本時確保按鍵監聽已初始化
        const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
        // 修正：起跑時間動態對齊 Look-ahead
        this._playbackTime = now + this._lookAhead;
        this._contextStartTime = this._playbackTime;
        return this._execId;
    },

    createTrack: function() {
        const track = Object.create(this);
        // 修正：必須拷貝值而非引用，否則重置後所有 Track 的 ID 都會跟著變
        track._execId = this._execId; 
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

    appendLog: function(msg, type = 'info') {
        if (window.LogManager && window.LogManager.appendLog) {
            window.LogManager.appendLog(msg, type);
        } else {
            console.log(`[WaveCode Log] ${type}: ${msg}`);
        }
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
        
        // 修正：落後保護也使用動態比例
        if (this._playbackTime < now - (this._lookAhead + 0.1)) {
            this._playbackTime = now;
        }

        const remainingSec = (this._playbackTime - this._lookAhead) - now;
        if (remainingSec > 0) await this.wait(remainingSec * 1000);
    },

    triggerNote: async function(note, instId = 'none', startTime = 0, duration = 0, velocity = 100) {
        const id = WaveCodeAPI._execId;
        const inst = instId === 'none' ? this._currentInstrument : instId;
        const velVal = velocity / 100;
        const beatSec = 60 / (this._bpm || 120);
        const durSec = (typeof duration === 'string' ? this._parseDuration(duration) : duration) * beatSec;
        const start = startTime > 0 ? startTime : (AudioManager.ctx ? AudioManager.ctx.currentTime : 0);

        // --- 修正：確保傳給底層的是數值頻率 ---
        const freq = (typeof note === 'string') ? this.MusicUtils.noteToFreq(note) : note;

        if (this._chords[note]) {
            this._chords[note].forEach(n => {
                const f = (typeof n === 'string') ? this.MusicUtils.noteToFreq(n) : n;
                const v = AudioManager.triggerNote(f, inst, start, velVal);
                if (v && durSec > 0) v.release(start + durSec);
            });
        } else {
            const v = AudioManager.triggerNote(freq, inst, start, velVal);
            if (v && durSec > 0) v.release(start + durSec);
        }

        // 【關鍵修正】發送視覺化信號給 ADSR 面板
        if (window.EnvelopeManager && window.EnvelopeManager._registry.has(inst)) {
            const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
            const delayMs = Math.max(0, (start - now) * 1000);
            // 如果時值 > 0，執行自動時值動畫；如果時值為 0 (如 A 鍵按住)，啟動長音模式
            setTimeout(() => { 
                if (!this.isScriptCancelled(id)) {
                    if (durSec > 0) {
                        window.EnvelopeManager.trigger(inst, durSec * 1000); 
                    } else {
                        window.EnvelopeManager.triggerStart(inst); // 修正：啟動持續發聲動畫
                    }
                }
            }, delayMs);
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
                const f = (typeof n === 'string') ? this.MusicUtils.noteToFreq(n) : n;
                const v = AudioManager.triggerNote(f, inst, startTime, velVal);
                if (v) v.release(startTime + durSec);
            });
        } else {
            const freq = (typeof note === 'string') ? this.MusicUtils.noteToFreq(note) : note;
            const v = AudioManager.triggerNote(freq, inst, startTime, velVal);
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
            
            // 引用統一音樂解析模式
            const match = token.match(this.MusicUtils.MELODY_TOKEN_PATTERN);
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
                        const f = (typeof n === 'string') ? this.MusicUtils.noteToFreq(n) : n;
                        const v = AudioManager.triggerNote(f, inst, startTime, noteVel);
                        if (v) v.release(startTime + durSec);
                    });
                } else {
                    const freq = (typeof noteOrChord === 'string') ? this.MusicUtils.noteToFreq(noteOrChord) : noteOrChord;
                    const v = AudioManager.triggerNote(freq, inst, startTime, noteVel);
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
                        const f = (typeof n === 'string') ? this.MusicUtils.noteToFreq(n) : n;
                        const v = AudioManager.triggerNote(f, inst, startTime, velVal);
                        if (v) v.release(startTime + durSec * 0.95);
                    });
                } else {
                    const freq = (typeof note === 'string') ? this.MusicUtils.noteToFreq(note) : note;
                    const v = AudioManager.triggerNote(freq, inst, startTime, velVal);
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

    releaseNote: async function(note, startTime = 0, instId = 'none') {
        const inst = instId === 'none' ? this._currentInstrument : instId;
        const time = startTime > 0 ? startTime : (AudioManager.ctx ? AudioManager.ctx.currentTime : 0);
        
        // --- 修正：確保釋放比對時使用的是數值頻率 ---
        if (this._chords[note]) {
            this._chords[note].forEach(n => {
                const f = (typeof n === 'string') ? this.MusicUtils.noteToFreq(n) : n;
                AudioManager.releaseNote(f, time, inst);
            });
        } else {
            const freq = (typeof note === 'string') ? this.MusicUtils.noteToFreq(note) : note;
            AudioManager.releaseNote(freq, time, inst);
        }

        // 通知視覺化面板停止長音動畫
        if (window.EnvelopeManager && window.EnvelopeManager._registry.has(inst)) {
            window.EnvelopeManager.triggerEnd(inst);
        }
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
    
    registerMidiHandler: function(h) { this._midiHandlers.push(h); },
    registerKeyHandler: function(h) { this._keyHandlers.push(h); },

    _initKeyEvents: function() {
        if (this._keyInitialized) return;
        const handle = (type, e) => {
            // 如果正在打字，不觸發音樂事件
            if (window.KeyboardController && window.KeyboardController.isTyping()) return;
            
            // 【關鍵】忽略作業系統的自動重複按鍵，解決第一與第二個音之間的延遲問題
            if (e.repeat) return;

            const key = e.key.toLowerCase();
            const id = WaveCodeAPI._execId;

            // 每個按鍵觸發都獲取獨立的軌道指針
            const eventTrack = this.createTrack();
            const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
            eventTrack._playbackTime = now + this._lookAhead;
            eventTrack._contextStartTime = eventTrack._playbackTime;
            this._keyHandlers.forEach(h => { try { h(type, key, id, eventTrack); } catch (err) {} });
        };
        window.addEventListener('keydown', (e) => handle('down', e), true);
        window.addEventListener('keyup', (e) => handle('up', e), true);
        this._keyInitialized = true;
    },

    _midiInitialized: false,
    _midiAccess: null,
    _midiInputs: [],
    _midiOutputs: [],
    _pressedMidiKeys: new Set(), // 儲存當前被按下的 MIDI 鍵 (0-127)

    _initMidi: async function() {
        if (!navigator.requestMIDIAccess) return;
        try {
            if (!this._midiAccess) {
                this._midiAccess = await navigator.requestMIDIAccess({ sysex: true });
                this._midiAccess.onstatechange = () => {
                    this._updateMidiPorts();
                    this._dispatchMidiState();
                };
            }
            
            this._updateMidiPorts();
            this._midiInitialized = true;
            this._dispatchMidiState();
            
            const inCount = this._midiInputs.length;
            const outCount = this._midiOutputs.length;
            
            if (inCount > 0 || outCount > 0) {
                this.appendLog(`MIDI: 系統已就緒 (${inCount} In / ${outCount} Out)`, "success");
            }
        } catch (err) {
            console.error("MIDI Init Failed:", err);
            this._midiAccess = null;
        }
    },

    _updateMidiPorts: function() {
        if (!this._midiAccess) return;
        
        this._midiInputs = [];
        // 修正：改用 forEach 以提升在不同 WebView 核心中的穩定性
        this._midiAccess.inputs.forEach((input) => {
            this._midiInputs.push(input.name);
            input.onmidimessage = (msg) => this._onMidiMessage(msg);
        });

        this._midiOutputs = [];
        this._midiAccess.outputs.forEach((output) => {
            this._midiOutputs.push(output.name);
        });

        console.log(`MIDI Scan: In=${this._midiInputs.length}, Out=${this._midiOutputs.length}`);
    },

    _dispatchMidiState: function() {
        window.dispatchEvent(new CustomEvent('midi-state-changed', { 
            detail: { inputs: this._midiInputs, outputs: this._midiOutputs } 
        }));
    },

    _onMidiMessage: function(msg) {
        const [status, note, velocity] = msg.data;
        const type = status & 0xf0;
        const channel = (status & 0x0f) + 1;
        const id = WaveCodeAPI._execId;

        // 派發活動事件 (讓圖示閃爍)
        window.dispatchEvent(new CustomEvent('midi-activity'));

        // // --- MIDI 觸發也使用獨立 Track ---
        const eventTrack = this.createTrack();
        const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
        eventTrack._playbackTime = now + this._lookAhead;
        eventTrack._contextStartTime = eventTrack._playbackTime;

        // Note On
        if (type === 0x90 && velocity > 0) {
            this._pressedMidiKeys.add(note);
            const noteName = this.MusicUtils.midiToNoteName(note);
            this.appendLog(`MIDI In: Note On [${noteName} (${note}), Vel: ${velocity}, Ch: ${channel}]`, "info");
            this._midiHandlers.forEach(h => { try { h('noteon', { channel, note, velocity }, id, eventTrack); } catch (e) {} });
        }
        // Note Off
        else if (type === 0x80 || (type === 0x90 && velocity === 0)) {
            this._pressedMidiKeys.delete(note);
            const noteName = this.MusicUtils.midiToNoteName(note);
            this.appendLog(`MIDI In: Note Off [${noteName} (${note}), Ch: ${channel}]`, "info");
            this._midiHandlers.forEach(h => { try { h('noteoff', { channel, note, velocity }, id, eventTrack); } catch (e) {} });
        }
        // Control Change
        else if (type === 0xb0) {
            this.appendLog(`MIDI In: Control Change [No: ${note}, Val: ${velocity}, Ch: ${channel}]`, "info");
            this._midiHandlers.forEach(h => { try { h('cc', { channel, number: note, value: velocity }, id, eventTrack); } catch (e) {} });
        }
    },

    sendMidiNote: function(note, velocity, channel, deviceName) {
        if (!this._midiAccess) return;
        const status = 0x90 | ((channel - 1) & 0x0f);
        this._sendToPort(deviceName, [status, note, velocity]);
    },

    sendMidiNoteOff: function(note, channel, deviceName) {
        if (!this._midiAccess) return;
        const status = 0x80 | ((channel - 1) & 0x0f);
        this._sendToPort(deviceName, [status, note, 0]);
    },

    sendMidiCC: function(number, value, channel, deviceName) {
        if (!this._midiAccess) return;
        const status = 0xb0 | ((channel - 1) & 0x0f);
        this._sendToPort(deviceName, [status, number, value]);
    },

    _sendToPort: function(deviceName, data) {
        if (!this._midiAccess) return;
        for (const output of this._midiAccess.outputs.values()) {
            if (deviceName === 'All' || output.name === deviceName) {
                output.send(data);
            }
        }
    },

    getMidiOutputOptions: function() {
        // 直接讀取 Msg 物件，繞過解析引擎，這在動態選單中是最穩定的作法
        const allLabel = (Blockly.Msg && Blockly.Msg['MIDI_ALL_DEVICES']) || '所有裝置';
        const options = [[allLabel, 'All']];
        if (this._midiOutputs) {
            this._midiOutputs.forEach(name => { options.push([name, name]); });
        }
        return options;
    },

    isMidiKeyPressed: function(note) { return this._pressedMidiKeys.has(note); },

    handleSerialData: function(data) {
        if (!data || data === this._serialRaw) return;
        this._serialRaw = data;
        let prefix = "RAW", value = data;
        if (data.includes(":")) { const pts = data.split(":"); prefix = pts[0]; value = pts[1]; }
        else if (data === "Kick") { prefix = "EVENT"; value = "Kick"; }
        this._lastFields[prefix] = this._serialFields[prefix] || value;
        this._serialFields[prefix] = value;

        // --- 修正：序列埠事件也使用獨立 Track ---
        const eventTrack = this.createTrack();
        const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
        eventTrack._playbackTime = now + this._lookAhead;
        eventTrack._contextStartTime = eventTrack._playbackTime;

        this._serialHandlers.forEach(h => { try { h(data, this._execId, eventTrack); } catch (e) {} });
    },

    reset: function() {
        this._execId++;
        this._playbackTime = 0;
        this._contextStartTime = 0;
        this._bpm = 120;
        this._loopCounters.clear();
        this._serialHandlers = [];
        this._midiHandlers = [];
        this._keyHandlers = []; // 清空按鍵處理器
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

window.WaveCode = WaveCodeAPI;  // 使用作用域遮蔽，若積木在全域使用可調用WaveCode為WaveCodeAPI，在作用域內則為WaveCode
window.WaveCodeAPI = WaveCodeAPI; // 雙重註冊以解決命名不一致問題
if (window.__TAURI__ && window.__TAURI__.event) {
    window.__TAURI__.event.listen('serial-data', (e) => { WaveCodeAPI.handleSerialData(e.payload); });
}
