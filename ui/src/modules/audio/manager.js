/**
 * WaveCode Audio Manager (Web Audio 專用版)
 */
import { Voice } from './voice.js';
import { Visualizer } from './visualizer.js';
import { Recorder } from './recorder.js';

export const AudioManager = {
    ctx: null,
    masterGain: null,
    masterChainNodes: [], // 儲存動態建立的主鏈節點
    analyser: null,
    voices: [],
    maxVoices: 64, // 提升至 64 以應付長釋放 (Release) 的堆疊
    patches: {},
    masterPatch: [], // 主輸出鏈配置
    samples: {}, // ID -> AudioBuffer
    melodicFolders: [], // 旋律類資料夾 (包含音名檔案)
    percussionMap: {},  // 打擊類對照表 { "資料夾名": ["檔案1", "檔案2"] }

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

        // 啟動自動掃描與分類
        await this.loadSamples();

        Recorder.init(this.ctx);

        // --- 全時自動連線 MIDI ---
        if (window.WaveCode) {
            window.WaveCode._initMidi().catch(err => {
                console.warn("WaveCode Engine: MIDI 背景初始化失敗:", err);
            });
        }

        console.log("WaveCode Engine: Web Audio Manager Initialized");
    },

    /**
     * 檢查字串是否符合音名格式 (如 C4, Fs3, Eb2)
     */
    isNoteName(str) {
        if (!str) return false;
        // 支援 A-G + (s/b/#) + 數字，不分大小寫
        const regex = /^[a-gA-G][sb#]?\d$/;
        return regex.test(str);
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
        
        // --- 錄音機接入點 ---
        if (Recorder.getInputNode()) {
            this.analyser.connect(Recorder.getInputNode());
        }
    },

    async loadSamples() {
        const { invoke } = window.__TAURI__.core;
        const startTime = performance.now();
        try {
            const files = await invoke('list_samples_recursive'); 
            let loadedCount = 0;
            const melodicSet = new Set();
            const pMap = {};

            // --- 全並行處理 ---
            await Promise.all(files.map(async (file) => {
                const { path, id, folder, filename } = file;
                
                // --- 根據 Rust 傳回的精確目錄結構進行分類 ---
                // 1. 如果檔名是音名 -> 歸入旋律資料夾
                if (this.isNoteName(filename)) {
                    melodicSet.add(folder);
                } else {
                    // 2. 否則 -> 歸入打擊類對照表
                    if (!pMap[folder]) pMap[folder] = [];
                    pMap[folder].push(filename);
                }

                try {
                    const bytes = await invoke('read_sample_file', { path });
                    const audioBuffer = await this.ctx.decodeAudioData(new Uint8Array(bytes).buffer);
                    this.samples[id] = audioBuffer;
                    loadedCount++;
                } catch (err) {
                    console.error(`WaveCode Engine: 載入取樣 "${id}" 失敗:`, err);
                }
            }));

            this.melodicFolders = Array.from(melodicSet).sort();
            this.percussionMap = pMap;

            const endTime = performance.now();
            const stats = `WaveCode Engine: 載入完成。共 ${loadedCount} 個檔案，耗時 ${((endTime - startTime)/1000).toFixed(2)} 秒 (旋律組: ${this.melodicFolders.length}, 打擊組: ${Object.keys(pMap).length})`;
            console.log(stats);
            
            // 修正：透過 Tauri invoke 傳送到 IDE 日誌面板
            invoke('log', { message: stats, level: "info" });
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
        if (!patch) {
            const errorMsg = `找不到樂器 "${instId}"，請確認您已放置對應的 [定義樂器] 積木，且名稱完全一致。`;
            if (window.LogManager && window.LogManager.appendLog) window.LogManager.appendLog(errorMsg, "error");
            return;
        }

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
        const time = (startTime > now) ? startTime : now + 0.01;
        
        voice.instId = instId; 
        voice.play(freq, patch, time, velocity);
        return voice;
    },

    /**
     * 停止特定樂器的所有發聲通道 (支援自定義釋放時值)
     */
    stopInstrument(instId, startTime = 0, forcedR = 0.01) {
        if (!this.ctx) return;
        const time = startTime > 0 ? startTime : this.ctx.currentTime;
        this.voices.forEach(v => {
            if (v.active && v.instId === instId) {
                v.release(time, forcedR); 
            }
        });
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
        // 跳過主輸出效果器 (masterGain -> masterPatch)，直接送往分析器與最終輸出
        gain.connect(this.analyser);

        osc.start(time);
        osc.stop(time + 0.06);
    },

    stopAll() {
        this.voices.forEach(v => v.kill());
        if (window.Oscilloscope) window.Oscilloscope.clearInstruments();
        if (this.ctx) {
            this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        }
    },

    /**
     * 獲取當前正在發聲的通道數量
     */
    getActiveVoiceCount() {
        return this.voices.filter(v => v.active).length;
    }
};
