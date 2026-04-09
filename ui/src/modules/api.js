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
    _variables: {}, // 儲存積木變數
    
    // --- 序列埠狀態 ---
    _serialPort: null,
    _serialState: "0000000000000000",
    _lastSerialState: "0000000000000000",
    _serialRaw: "",
    _serialFields: {},   // 儲存所有前綴的最新數值 (如 "LDR", "TTP")
    _lastFields: {},     // 儲存上一次的數值，用於偵測變化
    _serialHandlers: [], // 儲存當前腳本註冊的處理器

    // 追蹤所有活躍的樂器，由 Compiler 填充
    _instruments: {},

    /**
     * 初始化排程器時間
     */
    startScript: () => {
        WaveCodeAPI.reset(); // 啟動前先徹底重置

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
     * 建立獨立軌道 (Multi-track)
     * 利用 Object.create 繼承全域 API，但擁有獨立的 _playbackTime 副本
     */
    createTrack: function() {
        const track = Object.create(this);
        // 分叉目前的時間點作為該軌道的起點
        track._playbackTime = this._playbackTime;
        return track;
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

    // --- 變數存取 (確保在非同步回呼中也能運作) ---
    setVar: (name, val) => {
        WaveCodeAPI._variables[name] = val;
    },
    getVar: (name) => {
        return WaveCodeAPI._variables[name];
    },

    // --- 音訊控制 ---
    setBPM: async (val) => {
        WaveCodeAPI._bpm = Math.max(1, val);
    },

    setCurrentInstrument: async (name) => {
        WaveCodeAPI._currentInstrument = name;
        // 更新示波器標題列的樂器顯示
        const display = document.getElementById('current-instrument-display');
        if (display) {
            display.textContent = name === 'none' ? '' : `(${name})`;
            display.classList.toggle('active', name !== 'none');
        }
    },

    setInstruments: (configs) => {
        WaveCodeAPI._instruments = configs;
        AudioManager.setInstruments(configs);
    },

    /**
     * 動態更新樂器效果器參數 (實現表現力控制)
     */
    setEffectParam: async (instId, compType, paramName, val) => {
        const inst = instId === 'none' ? WaveCodeAPI._currentInstrument : instId;
        AudioManager.updateInstrumentParam(inst, compType, paramName, val);
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
     * @param {string|number} note 音名(C4)、頻率(440) 或 和弦名稱(CM7)
     * @param {string} instId 樂器 ID
     * @param {number} startTime 啟動時間 (0 為立即)
     * @param {string|number} duration 拍數或時值代碼
     * @param {number} velocity 音量力度 (0-100)
     */
    triggerNote: async function(note, instId = 'none', startTime = 0, duration = 0, velocity = 100) {
        const inst = instId === 'none' ? this._currentInstrument : instId;
        const bpm = WaveCodeAPI._bpm;
        const beatSec = 60 / bpm;
        
        // 確保 velocity 是有效數字且在 0-100 之間
        const velNum = parseFloat(velocity);
        const velVal = (isNaN(velNum) ? 100 : velNum) / 100;

        // 解析時值
        let beats = 0;
        if (typeof duration === 'string') {
            beats = this._parseDuration(duration);
        } else {
            beats = parseFloat(duration) || 0;
        }

        const durationSec = beats * beatSec;
        const durationMs = durationSec * 1000;

        const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
        const start = startTime > 0 ? startTime : now;
        const delayMs = Math.max(0, (start - now) * 1000);

        // --- 視覺化同步 ---
        if (window.EnvelopeManager && durationMs > 0) {
            setTimeout(() => {
                if (WaveCodeAPI.isScriptCancelled(WaveCodeAPI._execId)) return;
                window.EnvelopeManager.trigger(inst, durationMs);
            }, delayMs);
        }

        // --- 觸發發聲 ---
        if (WaveCodeAPI._chords[note]) {
            WaveCodeAPI._chords[note].forEach(n => {
                const voice = AudioManager.triggerNote(n, inst, start, velVal);
                if (voice && durationSec > 0) voice.release(start + durationSec);
            });
            return null;
        } else {
            const voice = AudioManager.triggerNote(note, inst, start, velVal);
            if (voice && durationSec > 0) voice.release(start + durationSec);
            return voice;
        }
    },

    /**
     * 音樂性等待 (拍數或小節)
     */
    waitMusical: async function(val, unit) {
        let beats = val;
        if (unit === 'MEASURES') beats = val * 4; // 預設小節為 4 拍，除非有更進階的拍號管理
        
        if (unit === 'SECONDS') {
            await this.wait(val * 1000);
            this._playbackTime += val;
            return;
        }
        if (unit === 'MS') {
            await this.wait(val);
            this._playbackTime += (val / 1000);
            return;
        }

        const beatSec = 60 / WaveCodeAPI._bpm;
        const totalSec = beats * beatSec;
        
        this._playbackTime += totalSec;
        await this.wait(totalSec * 1000);
    },

    /**
     * 播放預備拍 (Count-in)
     */
    playCountIn: async function(measures, beatsPerMeasure, velocity) {
        const id = WaveCodeAPI._execId;
        const bpm = WaveCodeAPI._bpm;
        const beatSec = 60 / bpm;
        const totalBeats = measures * beatsPerMeasure;
        const totalSec = totalBeats * beatSec;

        console.log(`WaveCode: Count-in start (${measures} measures, ${beatsPerMeasure} beats)`);

        for (let i = 0; i < totalBeats; i++) {
            if (this.isScriptCancelled(id)) return;
            
            const isDownbeat = (i % beatsPerMeasure === 0);
            const freq = isDownbeat ? 880 : 440;
            const time = this._playbackTime;

            // 播放 Click 音效 (使用內建 Oscillator 模擬)
            AudioManager.triggerClick(freq, time, velocity / 100);
            
            this._playbackTime += beatSec;
            await this.wait(beatSec * 1000);
        }
        
        console.log("WaveCode: Count-in finished, PLAY!");
    },

    /**
     * 進階序列器 V2 核心實作
     */
    playRhythmV2: async function(instId, pattern, beats, res, vel, isChord, startMeasure) {
        const id = WaveCodeAPI._execId;
        const inst = instId === 'none' ? this._currentInstrument : instId;
        const bpm = WaveCodeAPI._bpm;
        
        const stepSec = (60 / bpm) / res;
        const totalSteps = beats * res;
        
        // 1. 解析 Pattern 字串 (支援空格、點、x 與音名)
        const tokens = pattern.split(/[\s|]+/).filter(t => t.length > 0);
        
        // 2. 如果指定了起始小節且目前時間還沒到，先等待
        const measureSec = (60 / bpm) * beats;
        const targetStartTime = (startMeasure - 1) * measureSec;

        for (let i = 0; i < Math.min(tokens.length, totalSteps); i++) {
            if (this.isScriptCancelled(id)) return;

            const token = tokens[i];
            const startTime = this._playbackTime;

            if (token !== '.' && token !== '-') {
                // 偵測持續長度 (連音符 '-')
                let sustainSteps = 1;
                for (let j = i + 1; j < tokens.length; j++) {
                    if (tokens[j] === '-') sustainSteps++;
                    else break;
                }
                const durationSec = sustainSteps * stepSec;

                // 觸發音符
                if (token.toLowerCase() === 'x') {
                    // 預設音符 (大鼓或 C4)
                    const voice = AudioManager.triggerNote(60, inst, startTime);
                    if (voice) voice.release(startTime + durationSec * 0.9);
                } else if (isChord && WaveCodeAPI._chords[token]) {
                    WaveCodeAPI._chords[token].forEach(n => {
                        const voice = AudioManager.triggerNote(n, inst, startTime);
                        if (voice) voice.release(startTime + durationSec * 0.9);
                    });
                } else {
                    // 可能是音名 (如 C4, D#4)
                    const voice = AudioManager.triggerNote(token, inst, startTime);
                    if (voice) voice.release(startTime + durationSec * 0.9);
                }

                if (window.EnvelopeManager) {
                    const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
                    const delayMs = Math.max(0, (startTime - now) * 1000);
                    setTimeout(() => {
                        if (this.isScriptCancelled(id)) return;
                        window.EnvelopeManager.trigger(inst, durationSec * 1000);
                    }, delayMs);
                }
            }

            this._playbackTime += stepSec;
            await this.wait(stepSec * 1000);
        }
    },

    releaseNote: async (freq, startTime = 0, instId = 'none') => {
        const inst = instId === 'none' ? WaveCodeAPI._currentInstrument : instId;
        if (window.EnvelopeManager) window.EnvelopeManager.triggerEnd();
        return AudioManager.releaseNote(freq, startTime, inst);
    },

    /**
     * 播放一個定時音符 (同步阻塞模式)
     * @param {string|number} note 音名(C4)、頻率(440) 或 和弦名稱(CM7)
     * @param {string|number} duration 拍數或時值代碼
     * @param {string} instId 樂器 ID
     * @param {number} velocity 音量力度 (0-100)
     */
    playNote: async function(note, duration, instId = 'none', velocity = 100) {
        const id = this._execId;
        const inst = instId === 'none' ? this._currentInstrument : instId;
        const bpm = this._bpm;
        const beatSec = 60 / bpm;
        const velVal = velocity / 100;

        // 解析時值
        let beats = 0;
        if (typeof duration === 'string') {
            beats = this._parseDuration(duration);
        } else {
            beats = parseFloat(duration) || 0;
        }
        
        const durationSec = beats * beatSec;
        const durationMs = durationSec * 1000;
        const startTime = this._playbackTime;

        if (window.EnvelopeManager && durationMs > 0) {
            const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
            const delayMs = Math.max(0, (startTime - now) * 1000);
            setTimeout(() => {
                if (this.isScriptCancelled(id)) return;
                window.EnvelopeManager.trigger(inst, durationMs);
            }, delayMs);
        }

        // --- 觸發發聲 ---
        if (this._chords[note]) {
            this._chords[note].forEach(n => {
                const voice = AudioManager.triggerNote(n, inst, startTime, velVal);
                if (voice) voice.release(startTime + durationSec);
            });
        } else {
            const voice = AudioManager.triggerNote(note, inst, startTime, velVal);
            if (voice) voice.release(startTime + durationSec);
        }

        this._playbackTime += durationSec;
        await this.wait(durationMs);
    },

    /**
     * 旋律解析核心 (對齊 melody_zh-hant.html)
     */
    _parseDuration: function(code) {
        if (!code) return 0;
        
        // 1. 如果是純數字字串，直接解析
        if (!isNaN(code)) return parseFloat(code);

        const baseMap = { 'W': 4, 'H': 2, 'Q': 1, 'E': 0.5, 'S': 0.25 };
        
        // 處理連結線 +
        if (code.includes('+')) {
            return code.split('+').reduce((acc, part) => acc + this._parseDuration(part), 0);
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
    playMelody: async function(score, instId = 'none') {
        const id = WaveCodeAPI._execId;
        const inst = instId === 'none' ? this._currentInstrument : instId;
        const beatDuration = 60 / WaveCodeAPI._bpm; // 一拍幾秒

        // 移除註解並分割標記
        const tokens = score.replace(/\/\/.*$/gm, '').split(/[\s,]+/).filter(t => t.length > 0);

        for (const token of tokens) {
            if (this.isScriptCancelled(id)) return;

            // 分離「音高/和弦」與「時值」
            const match = token.match(/^([A-Ga-g][#bB]?\d?|[A-Za-z0-9_]+|R)([WHQES].*)$/);
            if (!match) continue;

            const noteOrChord = match[1];
            const durCode = match[2];
            const beats = this._parseDuration(durCode);
            const durationSec = beats * beatDuration;
            const durationMs = durationSec * 1000;

            const startTime = this._playbackTime;
            const releaseTime = startTime + durationSec;

            if (noteOrChord.toUpperCase() !== 'R') {
                if (window.EnvelopeManager) {
                    const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
                    const delayMs = Math.max(0, (startTime - now) * 1000);
                    setTimeout(() => {
                        if (this.isScriptCancelled(id)) return;
                        window.EnvelopeManager.trigger(inst, durationMs);
                    }, delayMs);
                }

                if (WaveCodeAPI._chords[noteOrChord]) {
                    WaveCodeAPI._chords[noteOrChord].forEach(n => {
                        const voice = AudioManager.triggerNote(n, inst, startTime);
                        if (voice) voice.release(releaseTime);
                    });
                } else {
                    const voice = AudioManager.triggerNote(noteOrChord, inst, startTime);
                    if (voice) voice.release(releaseTime);
                }
            }

            this._playbackTime += durationSec;
            await this.wait(durationMs);
        }
    },

    /**
     * 定義和弦
     */
    defineChord: async function(name, notesStr) {
        const notes = notesStr.split(/[\s,]+/).filter(n => n.length > 0);
        WaveCodeAPI._chords[name] = notes;
    },

    /**
     * 播放和弦 (同步模式)
     */
    playChord: async function(name, durationMs, instId = 'none') {
        const notes = WaveCodeAPI._chords[name];
        if (!notes || notes.length === 0) return;

        const id = WaveCodeAPI._execId;
        const inst = instId === 'none' ? this._currentInstrument : instId;
        
        const startTime = this._playbackTime;
        const durationSec = durationMs / 1000;
        const releaseTime = startTime + durationSec;

        if (window.EnvelopeManager) {
            const now = AudioManager.ctx ? AudioManager.ctx.currentTime : 0;
            const delayMs = Math.max(0, (startTime - now) * 1000);
            setTimeout(() => {
                if (this.isScriptCancelled(id)) return;
                window.EnvelopeManager.trigger(inst, durationMs);
            }, delayMs);
        }

        notes.forEach(note => {
            const voice = AudioManager.triggerNote(note, inst, startTime);
            if (voice) voice.release(releaseTime);
        });

        this._playbackTime += durationSec;
        await this.wait(durationMs);
    },

    // --- 序列埠核心功能 ---

    listSerialPorts: async () => {
        const invoke = WaveCodeAPI.getInvoke();
        return await invoke('list_serial_ports');
    },

    openSerial: async (port, baud) => {
        try {
            const invoke = WaveCodeAPI.getInvoke();
            await invoke('open_serial', { portName: port, baudRate: parseInt(baud) });
            WaveCodeAPI._serialPort = port;
            console.log(`WaveCode: Serial Port ${port} opened at ${baud} baud.`);
        } catch (err) {
            // 取得原始錯誤字串
            let msg = typeof err === 'string' ? err : (err.message || String(err));
            // 優化錯誤訊息：將技術性的「檔案」改為語意化的「裝置」
            msg = msg.replace(/系統找不到指定的檔案/g, "系統找不到指定的裝置");
            msg = msg.replace(/The system cannot find the file specified/g, "系統找不到指定的裝置");
            
            console.warn("WaveCode Serial Error:", msg);
            throw msg; // 拋出處理後的字串
        }
    },

    closeSerial: async () => {
        const invoke = WaveCodeAPI.getInvoke();
        await invoke('close_serial');
        WaveCodeAPI._serialPort = null;
    },

    /**
     * 判斷指定欄位 (通常是 TTP) 的特定按鍵是否剛被按下 (邊緣偵測)
     * @param {string} prefix 欄位名稱 (如 "TTP")
     * @param {number} keyIndex 1-based 按鍵索引
     */
    isTtpTriggered: (prefix, keyIndex) => {
        const current = WaveCodeAPI._serialFields[prefix] || "0000000000000000";
        const last = WaveCodeAPI._lastFields[prefix] || "0000000000000000";
        const idx = keyIndex - 1;
        // 偵測 0 -> 1 的變化
        return current[idx] === '1' && last[idx] === '0';
    },

    /**
     * 獲取指定欄位的最新數值
     */
    getSerialField: (prefix) => {
        return WaveCodeAPI._serialFields[prefix] || "";
    },

    /**
     * 註冊序列埠資料處理器
     */
    registerSerialHandler: (handler) => {
        WaveCodeAPI._serialHandlers.push(handler);
    },

    /**
     * 處理收到的原始資料並更新狀態
     */
    handleSerialData: (data) => {
        if (!data || data === WaveCodeAPI._serialRaw) return;
        WaveCodeAPI._serialRaw = data;

        let prefix = "RAW";
        let value = data;

        // 1. 智慧欄位解析 (格式 Prefix:Value)
        if (data.includes(":")) {
            const parts = data.split(":");
            prefix = parts[0];
            value = parts[1];
        } else if (data === "Kick") {
            prefix = "EVENT";
            value = "Kick";
        }

        // 2. 更新欄位快取 (隔離狀態)
        // 注意：我們必須先備份舊狀態，再更新新狀態
        WaveCodeAPI._lastFields[prefix] = WaveCodeAPI._serialFields[prefix] || value;
        WaveCodeAPI._serialFields[prefix] = value;

        // 3. 執行所有已註冊的處理器
        const currentId = WaveCodeAPI._execId;
        WaveCodeAPI._serialHandlers.forEach(handler => {
            try {
                // 傳遞原始資料，積木內部可以透過 WaveCode.getSerialField 獲取歸一化數值
                handler(data, currentId);
            } catch (err) {
                console.error("WaveCode: Serial handler error:", err);
            }
        });

        // 4. 發出全域事件
        if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('wavecode-serial', { detail: data }));
        }
    },

    /**
     * 重設引擎與所有狀態 (停止或開始新腳本時呼叫)
     */
    reset: () => {
        WaveCodeAPI._execId++; // 遞增 ID 以安樂死舊腳本
        WaveCodeAPI._playbackTime = 0;
        WaveCodeAPI._bpm = 120;
        WaveCodeAPI._loopCounters.clear();
        WaveCodeAPI._serialHandlers = []; // 清空序列埠處理器
        WaveCodeAPI._serialFields = {};   // 重置欄位快取
        WaveCodeAPI._lastFields = {};
        WaveCodeAPI._currentInstrument = 'none';
        WaveCodeAPI._chords = {};
        
        AudioManager.stopAll();
        if (window.EnvelopeManager) window.EnvelopeManager.stopAll();
    },

    /**
     * 停止所有音訊並清除腳本
     */
    stopAudio: async () => {
        WaveCodeAPI.reset();
    },

    restartAudio: async () => {
        WaveCodeAPI.reset();
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

// 監聽來自 Rust 的序列埠事件
if (window.__TAURI__ && window.__TAURI__.event) {
    window.__TAURI__.event.listen('serial-data', (e) => {
        WaveCodeAPI.handleSerialData(e.payload);
    });
}

window.WaveCode = WaveCodeAPI;
