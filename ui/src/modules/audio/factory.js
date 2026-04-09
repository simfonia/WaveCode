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
     * @param {Object} AudioManager 全域管理員 (提供取樣資料)
     * @param {Object} voice 聲部實體 (提供 velocity)
     */
    create(ctx, comp, freqOrNote, lastNode, startTime, AudioManager, voice) {
        let baseFreq = typeof freqOrNote === 'number' ? freqOrNote : this.noteToFreq(freqOrNote);
        const time = (typeof startTime === 'number' && isFinite(startTime)) ? startTime : ctx.currentTime;

        switch (comp.type) {
            case 'osc': {
                const osc = ctx.createOscillator();
                const waves = ['sine', 'sawtooth', 'square', 'triangle'];
                const waveIdx = parseInt(comp.wave);
                osc.type = isNaN(waveIdx) ? (comp.wave || 'sine') : (waves[waveIdx] || 'sine');
                
                osc.frequency.setValueAtTime(baseFreq, time);
                osc.start(time);
                
                // --- 回歸標準增益 ---
                const oscGain = ctx.createGain();
                oscGain.gain.setValueAtTime(1.0, time); 
                osc.connect(oscGain);

                return { nodes: [osc, oscGain], output: oscGain };
            }

            case 'additive': {
                const groupGain = ctx.createGain();
                const nodes = [groupGain];
                const waves = ['sine', 'sawtooth', 'square', 'triangle'];
                comp.partials.forEach(p => {
                    const osc = ctx.createOscillator();
                    const waveIdx = parseInt(p.wave);
                    osc.type = isNaN(waveIdx) ? (p.wave || 'sine') : (waves[waveIdx] || 'sine');
                    osc.frequency.setValueAtTime(baseFreq * (parseFloat(p.ratio) || 1), time);
                    const pGain = ctx.createGain();
                    pGain.gain.setValueAtTime(parseFloat(p.amp) || 0, time);
                    osc.connect(pGain);
                    pGain.connect(groupGain);
                    osc.start(time);
                    nodes.push(osc, pGain);
                });
                
                // --- 回歸標準增益 ---
                const boost = ctx.createGain();
                boost.gain.value = 1.0;
                groupGain.connect(boost);
                nodes.push(boost);
                return { nodes, output: boost };
            }

            case 'adsr': {
                const env = ctx.createGain();
                const a = Math.max(0.001, parseFloat(comp.a) || 0.01);
                const d = Math.max(0.001, parseFloat(comp.d) || 0.1);
                const s = (typeof comp.s !== 'undefined') ? parseFloat(comp.s) : 0.5;
                const r = parseFloat(comp.r) || 0.1;
                const velocity = (voice && typeof voice.velocity === 'number') ? voice.velocity : 1.0;

                env.gain.cancelScheduledValues(time);
                env.gain.setValueAtTime(0, time);
                // 峰值回歸到 velocity (1.0)
                env.gain.linearRampToValueAtTime(velocity, time + a);
                env.gain.linearRampToValueAtTime(s * velocity, time + a + d);
                
                if (lastNode) lastNode.connect(env);
                return { nodes: [env], output: env, isEnv: true };
            }

            case 'filter': {
                const filter = ctx.createBiquadFilter();
                filter.type = (comp.kind === 'HP') ? 'highpass' : 'lowpass';
                filter.frequency.setValueAtTime(parseFloat(comp.freq) || 1000, time);
                filter.Q.setValueAtTime(parseFloat(comp.q) || 1, time);
                if (lastNode) lastNode.connect(filter);
                return { nodes: [filter], output: filter };
            }

            case 'volume': {
                const gain = ctx.createGain();
                const rawVal = comp.VOLUME ?? comp.VOL ?? comp.val ?? comp.gain ?? 100;
                let numVal = parseFloat(rawVal);
                if (isNaN(numVal)) numVal = 100;
                
                // --- 100% 映射回 1.0 ---
                const baseVol = numVal / 100;
                gain.gain.cancelScheduledValues(time);
                gain.gain.setValueAtTime(baseVol, time);
                
                if (lastNode) lastNode.connect(gain);
                return { nodes: [gain], output: gain };
            }

            case 'effect': {
                const effectType = comp.effect_type;
                let nodes = [];
                let output = null;
                let namedNodes = {};

                if (effectType === 'filter') {
                    const filter = ctx.createBiquadFilter();
                    filter.type = comp.filter_type || 'lowpass';
                    filter.frequency.setValueAtTime(parseFloat(comp.freq) || 1000, time);
                    filter.Q.setValueAtTime(parseFloat(comp.q) || 1, time);
                    nodes.push(filter);
                    output = filter;
                } else if (effectType === 'delay') {
                    const delay = ctx.createDelay(5.0);
                    delay.delayTime.setValueAtTime(parseFloat(comp.delay_time) || 0.5, time);
                    const feedback = ctx.createGain();
                    feedback.gain.setValueAtTime(parseFloat(comp.feedback) || 0.5, time);
                    delay.connect(feedback);
                    feedback.connect(delay);
                    nodes.push(delay, feedback);
                    output = delay;
                    namedNodes = { delay, feedback };
                } else if (effectType === 'compressor') {
                    const compNode = ctx.createDynamicsCompressor();
                    compNode.threshold.setValueAtTime(parseFloat(comp.threshold) || -24, time);
                    compNode.knee.setValueAtTime(parseFloat(comp.knee) || 30, time);
                    compNode.ratio.setValueAtTime(parseFloat(comp.ratio) || 12, time);
                    compNode.attack.setValueAtTime(parseFloat(comp.attack) || 0.003, time);
                    compNode.release.setValueAtTime(parseFloat(comp.release) || 0.25, time);
                    const makeup = ctx.createGain();
                    makeup.gain.value = Math.pow(10, (parseFloat(comp.makeup) || 0) / 20);
                    compNode.connect(makeup);
                    nodes.push(compNode, makeup);
                    output = makeup;
                } else if (effectType === 'distortion') {
                    const shaper = ctx.createWaveShaper();
                    shaper.curve = this.makeDistortionCurve(parseFloat(comp.distortion) || 10);
                    shaper.oversample = '4x';
                    nodes.push(shaper);
                    output = shaper;
                }

                if (output && lastNode) {
                    lastNode.connect(nodes[0]);
                }
                return { nodes, output };
            }

            case 'sampler': {
                if (!AudioManager || !AudioManager.samples) return null;
                let buffer = null;
                let playbackRate = 1.0;
                if (comp.sample_id === 'piano' || comp.sample_id === 'violin_pizz' || comp.sample_id === 'violin_sust') {
                    const prefix = comp.sample_id === 'piano' ? 'piano' : (comp.sample_id === 'violin_pizz' ? 'pizzicato' : 'vibrato-sustain');
                    const bestMatch = this.findBestSample(AudioManager.samples, prefix, baseFreq);
                    if (bestMatch) {
                        buffer = bestMatch.buffer;
                        playbackRate = bestMatch.ratio;
                    }
                } else {
                    buffer = AudioManager.samples[comp.sample_id];
                }
                if (!buffer) return null;

                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.playbackRate.value = playbackRate;
                const velocity = voice ? (voice.velocity || 1) : 1;
                const gain = ctx.createGain();
                // 取樣器通常比較小聲，保持 1.5 倍補償
                gain.gain.value = 1.5 * velocity; 
                source.connect(gain);
                source.start(time);
                if (lastNode) lastNode.connect(source);
                return { nodes: [source, gain], output: gain };
            }

            default:
                return null;
        }
    },

    noteToFreq(name) {
        if (!name || typeof name !== 'string') return 440;
        const midi = this.noteToMidi(name);
        return 440 * Math.pow(2, (midi - 69) / 12);
    },

    findBestSample(sampleMap, prefix, targetFreq) {
        const targetMidi = 69 + 12 * Math.log2(targetFreq / 440);
        let bestId = null, bestDist = 999, rootMidi = 0;
        for (const id in sampleMap) {
            if (id.includes(prefix)) {
                const parts = id.split('_');
                const mid = this.noteToMidi(parts[parts.length - 1]);
                const dist = Math.abs(targetMidi - mid);
                if (dist < bestDist) { bestDist = dist; bestId = id; rootMidi = mid; }
            }
        }
        if (!bestId) return null;
        return { buffer: sampleMap[bestId], ratio: Math.pow(2, (targetMidi - rootMidi) / 12) };
    },

    noteToMidi(name) {
        const n = name.toUpperCase();
        const octave = (n.match(/\d/) || [4])[0];
        const baseMap = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
        let base = baseMap[n[0]] || 0;
        if (n.includes('S') || n.includes('#')) base += 1;
        else if (n.includes('B') && n[0] !== 'B') base -= 1;
        return (parseInt(octave) + 1) * 12 + base;
    },

    makeDistortionCurve(amount) {
        const k = amount, n_samples = 44100, curve = new Float32Array(n_samples), deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }
};
