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

        // --- 全域註冊以便 Visualizer 探測 ---
        window.AudioManager = this;

        if (window.Oscilloscope) {
            window.Oscilloscope.init('oscilloscope', this.analyser);
        } else {
            console.warn("WaveCode Engine: window.Oscilloscope not found during init.");
        }

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
        const startTime = performance.now();
        try {
            const files = await invoke('list_samples_recursive'); 
            let loadedCount = 0;

            // --- 全並行處理 (不再分 Chunk) ---
            // 瀏覽器與 Tauri 的非同步機制會自動處理執行緒調度
            await Promise.all(files.map(async (file) => {
                const { path, id } = file;
                try {
                    // 1. 讀取二進位位元組 (傳輸 Vec<u8> 在 Tauri 中極快，不經過 JSON 數值序列化)
                    const bytes = await invoke('read_sample_file', { path });
                    
                    // 2. 利用瀏覽器內建的原生解碼器 (具備 C++ 級別的多執行緒優化)
                    const audioBuffer = await this.ctx.decodeAudioData(new Uint8Array(bytes).buffer);
                    
                    this.samples[id] = audioBuffer;
                    loadedCount++;
                } catch (err) {
                    console.error(`WaveCode Engine: 載入取樣 "${id}" 失敗:`, err);
                }
            }));

            const endTime = performance.now();
            console.log(`WaveCode Engine: 已載入 ${loadedCount} 個取樣檔案，耗時 ${((endTime - startTime)/1000).toFixed(2)} 秒 (並行優化版)`);
        } catch (e) {
            console.error("WaveCode Engine: 載入取樣清單失敗:", e);
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

    /**
     * 即時更新樂器參數 (實現 Wah-wah 等表現效果)
     * @param {string} instId 樂器 ID
     * @param {string} compType 組件類型 (如 'filter')
     * @param {string} paramName 參數名稱 (如 'freq')
     * @param {number} val 數值
     */
    updateInstrumentParam(instId, compType, paramName, val) {
        if (!this.ctx) return;
        const patch = this.patches[instId];
        if (!patch) return;

        // 1. 更新模板 (讓新音符套用此數值)
        patch.forEach(comp => {
            const actualType = comp.type === 'effect' ? comp.effect_type : comp.type;
            if (actualType === compType) {
                comp[paramName] = val;
            }
        });

        // 2. 更新活躍音符 (實現實時變動效果)
        this.voices.forEach(voice => {
            if (voice.active && voice.instId === instId) {
                voice.updateParam(compType, paramName, val);
            }
        });
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

    triggerNote(freq, instId, startTime = 0, velocity = 1.0) {
        if (!this.ctx) this.init();
        
        // 確保 Context 處於運行狀態
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const patch = this.patches[instId];
        if (!patch) return;

        let voice = this.voices.find(v => !v.active);
        if (!voice) {
            if (this.voices.length < this.maxVoices) {
                voice = new Voice(this.ctx, this.masterGain);
                this.voices.push(voice);
            } else {
                // 找最舊的 voice 強行回收
                voice = this.voices.shift();
                voice.kill();
                this.voices.push(voice);
            }
        }

        // --- 核心修正：排程時間補正 ---
        const now = this.ctx.currentTime;
        // 如果傳入的時間已經落後於現在 (now)，則強制設為 now + 0.01s (10ms) 緩衝。
        // 這能解決「快速播完」的問題，因為它給了瀏覽器最起碼的緩衝空間來排程音訊。
        const time = (startTime > now) ? startTime : now + 0.01;
        
        voice.instId = instId; 
        voice.play(freq, patch, time, velocity);
        return voice;
    },

    releaseNote(freq, startTime = 0, instId = 'none') {
        if (!this.ctx) return;
        const time = startTime > 0 ? startTime : this.ctx.currentTime;
        const voice = this.voices.find(v => {
            const freqMatch = Math.abs(v.freq - freq) < 0.5;
            const instMatch = (instId === 'none' || v.instId === instId);
            return v.active && !v.releasing && freqMatch && instMatch;
        });
        if (voice) voice.release(time);
    },

    /**
     * 播放 Click 音效 (預備拍專用)
     */
    triggerClick(freq, time, velocity) {
        if (!this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, time);

        // 極短的衰減 (50ms)，模擬節拍器聲
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(velocity, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(time);
        osc.stop(time + 0.06);
    },

    stopAll() {
        this.voices.forEach(v => v.kill());
        if (window.Oscilloscope) window.Oscilloscope.clearInstruments();
        if (this.ctx) {
            this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        }
    }
};
