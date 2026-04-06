/**
 * WaveCode Audio Manager (Web Audio 專用版)
 */
import { Voice } from './voice.js';
import { Visualizer } from './visualizer.js';

export const AudioManager = {
    ctx: null,
    masterGain: null,
    analyser: null,
    voices: [],
    maxVoices: 32,
    patches: {},
    samples: {}, // ID -> AudioBuffer

    async init() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') await this.ctx.resume();
            return;
        }
        
        console.log("WaveCode Engine: Initializing Web Audio Context...");
        this.ctx = new (window.AudioContext || window.webkitAudioContext)({
            latencyHint: 'interactive',
            sampleRate: 44100
        });

        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 1024; 
        this.analyser.smoothingTimeConstant = 0.4; // 頻譜平滑度
        this.masterGain.connect(this.analyser);

        this.visualizer = new Visualizer(this.analyser);
        this.visualizer.start();

        // 只有在取樣庫為空時才載入，避免每次執行都重新解碼耗時
        if (Object.keys(this.samples).length === 0) {
            await this.loadSamples();
        }

        console.log("WaveCode Engine: Web Audio Manager Initialized");
    },

    async loadSamples() {
        const { invoke } = window.__TAURI__.core;
        try {
            // 透過 Tauri 呼叫讀取 samples 目錄清單
            const files = await invoke('list_samples_recursive'); 
            let loadedCount = 0;

            for (const file of files) {
                const { path, id } = file;
                // 透過 Rust 指令讀取檔案位元組，繞過前端 fs 權限限制
                const bytes = await invoke('read_sample_file', { path });
                const audioBuffer = await this.ctx.decodeAudioData(new Uint8Array(bytes).buffer);
                this.samples[id] = audioBuffer;
                loadedCount++;
            }
            console.log(`WaveCode Engine: 已載入 ${loadedCount} 個取樣檔案 (Web Audio)`);
        } catch (e) {
            console.error("WaveCode Engine: 載入取樣失敗:", e);
        }
    },

    async restart() {
        this.stopAll();
        if (this.ctx) {
            if (this.ctx.state === 'suspended') await this.ctx.resume();
            if (this.masterGain) {
                this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
            }
        } else {
            await this.init();
        }
    },

    setInstruments(configs) {
        this.patches = configs;
    },

    setMasterVolume(val) {
        if (!this.ctx) this.init();
        const now = this.ctx.currentTime;
        this.masterGain.gain.setTargetAtTime(val, now, 0.02);
    },

    /**
     * 觸發音符
     * @param {number} freq 頻率
     * @param {string} instId 樂器 ID
     * @param {number} startTime 啟動時間 (0 代表立即)
     */
    triggerNote(freq, instId, startTime = 0) {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const patch = this.patches[instId];
        if (!patch) {
            console.warn(`AudioManager: 找不到樂器 ID "${instId}"，可用樂器:`, Object.keys(this.patches));
            return;
        }

        let voice = this.voices.find(v => !v.active);
        if (!voice) {
            if (this.voices.length < this.maxVoices) {
                voice = new Voice(this.ctx, this.masterGain);
                this.voices.push(voice);
            } else {
                // 回收最舊的 active voice
                voice = this.voices.shift();
                voice.kill();
                this.voices.push(voice);
            }
        }

        const time = startTime > 0 ? startTime : this.ctx.currentTime;
        voice.play(freq, patch, time);
        return voice;
    },

    /**
     * 釋放音符
     * @param {number} freq 頻率
     * @param {number} startTime 釋放時間 (0 代表立即)
     */
    releaseNote(freq, startTime = 0) {
        if (!this.ctx) return;
        const time = startTime > 0 ? startTime : this.ctx.currentTime;

        // 尋找對應頻率且尚未釋放的 Voice
        const voice = this.voices.find(v => v.active && !v.releasing && Math.abs(v.freq - freq) < 0.5);
        if (voice) voice.release(time);
    },

    stopAll() {
        this.voices.forEach(v => v.kill());
        if (this.ctx) {
            this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        }
    }
};
