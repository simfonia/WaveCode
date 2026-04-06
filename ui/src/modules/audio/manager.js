/**
 * WaveCode Audio Manager (Web Audio 專用版)
 */
import { Voice } from './voice.js';
import { Visualizer } from './visualizer.js';

export const AudioManager = {
    ctx: null,
    masterGain: null,
    masterChainNodes: [], // 儲存動態建立的主鏈節點
    analyser: null,
    voices: [],
    maxVoices: 32,
    patches: {},
    masterPatch: [], // 主輸出鏈配置
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

        // --- 建立主輸出總線 (Master Bus) ---
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 1024; 
        this.analyser.smoothingTimeConstant = 0.4; 

        // 初始連接
        this.rebuildMasterChain();

        this.visualizer = new Visualizer(this.analyser);
        this.visualizer.start();

        if (Object.keys(this.samples).length === 0) {
            await this.loadSamples();
        }

        console.log("WaveCode Engine: Web Audio Manager Initialized");
    },

    /**
     * 重建主鏈效果器
     */
    async rebuildMasterChain() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // 1. 斷開舊有連接並銷毀舊節點
        this.masterGain.disconnect();
        this.masterChainNodes.forEach(node => {
            if (node.disconnect) node.disconnect();
        });
        this.masterChainNodes = [];

        // 2. 根據 masterPatch 建立新節點
        let lastNode = this.masterGain;
        
        const { NodeFactory } = await import('./factory.js');
        
        for (const comp of this.masterPatch) {
            const result = NodeFactory.create(this.ctx, comp, 440, lastNode, now);
            if (result && result.nodes) {
                this.masterChainNodes.push(...result.nodes);
                lastNode = result.output;
            }
        }

        // 3. 最後連接到 Analyser
        lastNode.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
    },

    async loadSamples() {
        const { invoke } = window.__TAURI__.core;
        try {
            const files = await invoke('list_samples_recursive'); 
            let loadedCount = 0;

            for (const file of files) {
                const { path, id } = file;
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

    setMasterPatch(patch) {
        this.masterPatch = patch;
        this.rebuildMasterChain();
    },

    setMasterVolume(val) {
        if (!this.ctx) this.init();
        const now = this.ctx.currentTime;
        this.masterGain.gain.setTargetAtTime(val, now, 0.02);
    },

    triggerNote(freq, instId, startTime = 0) {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const patch = this.patches[instId];
        if (!patch) return;

        let voice = this.voices.find(v => !v.active);
        if (!voice) {
            if (this.voices.length < this.maxVoices) {
                voice = new Voice(this.ctx, this.masterGain);
                this.voices.push(voice);
            } else {
                voice = this.voices.shift();
                voice.kill();
                this.voices.push(voice);
            }
        }

        const time = startTime > 0 ? startTime : this.ctx.currentTime;
        voice.play(freq, patch, time);
        return voice;
    },

    releaseNote(freq, startTime = 0) {
        if (!this.ctx) return;
        const time = startTime > 0 ? startTime : this.ctx.currentTime;
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
