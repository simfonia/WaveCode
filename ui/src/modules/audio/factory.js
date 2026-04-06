/**
 * WaveCode Node Factory (Web Audio 排程版)
 */

export const NodeFactory = {
    /**
     * 建立節點
     * @param {AudioContext} ctx 上下文
     * @param {Object} comp 組件定義
     * @param {number|string} freqOrNote 基礎頻率或音名
     * @param {AudioNode} lastNode 上一個節點
     * @param {number} startTime 啟動時間
     */
    create(ctx, comp, freqOrNote, lastNode, startTime) {
        let baseFreq = parseFloat(freqOrNote);
        if (isNaN(baseFreq)) {
            baseFreq = this.noteToFreq(freqOrNote);
        }
        
        const time = (typeof startTime === 'number' && isFinite(startTime)) ? startTime : ctx.currentTime;

        switch (comp.type) {
            case 'osc': {
                const osc = ctx.createOscillator();
                osc.type = ['sine', 'sawtooth', 'square', 'triangle'][comp.wave] || 'sine';
                osc.frequency.setValueAtTime(baseFreq, time);
                osc.start(time);
                return { nodes: [osc], output: osc };
            }

            case 'additive': {
                const groupGain = ctx.createGain();
                const nodes = [groupGain];
                comp.partials.forEach(p => {
                    const osc = ctx.createOscillator();
                    osc.type = ['sine', 'sawtooth', 'square', 'triangle'][p.wave] || 'sine';
                    osc.frequency.setValueAtTime(baseFreq * p.ratio, time);
                    const pGain = ctx.createGain();
                    pGain.gain.setValueAtTime(p.amp || 0, time);
                    osc.connect(pGain);
                    pGain.connect(groupGain);
                    osc.start(time);
                    nodes.push(osc, pGain);
                });
                return { nodes, output: groupGain };
            }

            case 'adsr': {
                const env = ctx.createGain();
                const a = comp.a || 0.01;
                const d = comp.d || 0.1;
                const s = (typeof comp.s === 'number') ? comp.s : 0.5;

                env.gain.setValueAtTime(0, time);
                // Attack
                env.gain.linearRampToValueAtTime(1, time + a);
                // Decay to Sustain
                env.gain.linearRampToValueAtTime(s, time + a + d);
                
                if (lastNode) lastNode.connect(env);
                return { nodes: [env], output: env, isEnv: true };
            }

            case 'filter': {
                const filter = ctx.createBiquadFilter();
                filter.type = (comp.kind === 'HP') ? 'highpass' : 'lowpass';
                filter.frequency.setValueAtTime(comp.freq || 1000, time);
                filter.Q.setValueAtTime(comp.q || 1, time);
                
                if (lastNode) lastNode.connect(filter);
                return { nodes: [filter], output: filter };
            }

            case 'volume': {
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(comp.val || 0, time);
                if (lastNode) lastNode.connect(gain);
                return { nodes: [gain], output: gain };
            }

            case 'sampler': {
                const audioManager = arguments[5]; // 從傳入參數獲取
                if (!audioManager || !audioManager.samples) return null;

                let buffer = null;
                let playbackRate = 1.0;

                // 處理多重取樣 (piano, violin)
                if (comp.sample_id === 'piano' || comp.sample_id === 'violin_pizz' || comp.sample_id === 'violin_sust') {
                    const prefix = comp.sample_id === 'piano' ? 'piano' : (comp.sample_id === 'violin_pizz' ? 'pizzicato' : 'vibrato-sustain');
                    const bestMatch = this.findBestSample(audioManager.samples, prefix, baseFreq);
                    if (bestMatch) {
                        buffer = bestMatch.buffer;
                        playbackRate = bestMatch.ratio;
                    }
                } else {
                    // 一般單一取樣
                    buffer = audioManager.samples[comp.sample_id];
                }

                if (!buffer) {
                    console.warn(`NodeFactory: 找不到取樣 "${comp.sample_id}"`);
                    return null;
                }

                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.playbackRate.setValueAtTime(playbackRate, time);
                
                // --- 音量補償層 ---
                const compensationGain = ctx.createGain();
                compensationGain.gain.setValueAtTime(3.0, time);
                source.connect(compensationGain);

                source.start(time);

                if (lastNode) lastNode.connect(source); 

                return { nodes: [source, compensationGain], output: compensationGain };
            }

            default:
                return null;
        }
    },

    /**
     * 音名轉頻率
     */
    noteToFreq(name) {
        if (!name || typeof name !== 'string') return 440;
        const midi = this.noteToMidi(name);
        return 440 * Math.pow(2, (midi - 69) / 12);
    },

    /**
     * 多重取樣尋找邏輯 (移植自 Rust 版)
     */
    findBestSample(sampleMap, prefix, targetFreq) {
        const targetMidi = 69 + 12 * Math.log2(targetFreq / 440);
        let bestId = null;
        let bestDist = 999;
        let rootMidi = 0;

        for (const id in sampleMap) {
            if (id.includes(prefix)) {
                const parts = id.split('_');
                if (parts.length < 2) continue;
                const mid = this.noteToMidi(parts[parts.length - 1]);
                const dist = Math.abs(targetMidi - mid);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestId = id;
                    rootMidi = mid;
                }
            }
        }

        if (!bestId) return null;
        const ratio = Math.pow(2, (targetMidi - rootMidi) / 12);
        return { buffer: sampleMap[bestId], ratio };
    },

    /**
     * 音名轉 MIDI (移植自 Rust 版)
     */
    noteToMidi(name) {
        const n = name.toUpperCase();
        const octaveMatch = n.match(/\d/);
        const octave = octaveMatch ? parseInt(octaveMatch[0]) : 4;
        const baseMap = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
        let base = baseMap[n[0]] || 0;
        let modifier = 0;
        if (n.includes('S') || n.includes('#')) modifier = 1;
        else if (n.includes('B') && n[0] !== 'B') modifier = -1;
        return (octave + 1) * 12 + base + modifier;
    }
};
