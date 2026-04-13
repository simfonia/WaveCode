/**
 * WaveCode Node Factory (Web Audio 排程版)
 * 實施訊號路徑強化，解決 Volume 失控問題。
 */

export const NodeFactory = {
    /**
     * 將積木傳來的波形值轉換為合法的 Web Audio OscillatorType
     */
    mapWaveType(val) {
        if (!val) return 'sine';
        const v = String(val).toLowerCase();
        const map = {
            '0': 'sine', '1': 'square', '2': 'sawtooth', '3': 'triangle',
            'sine': 'sine', 'square': 'square', 'sawtooth': 'sawtooth', 'triangle': 'triangle'
        };
        return map[v] || 'sine';
    },

    /**
     * 建立節點
     */
    create(ctx, comp, freqOrNote, lastNode, startTime, AudioManager, voice) {
        let baseFreq = typeof freqOrNote === 'number' ? freqOrNote : this.noteToFreq(freqOrNote);
        const time = (typeof startTime === 'number' && isFinite(startTime)) ? startTime : ctx.currentTime;

        switch (comp.type) {
            case 'osc': {
                const osc = ctx.createOscillator();
                osc.type = this.mapWaveType(comp.wave);
                osc.frequency.setValueAtTime(baseFreq, time);
                osc.start(time);
                
                const oscGain = ctx.createGain();
                oscGain.gain.setValueAtTime(1.0, time); 
                osc.connect(oscGain);

                // 振盪器是源頭，如果前方有 lastNode，則進行混音
                if (lastNode) lastNode.connect(oscGain);
                return { nodes: [osc, oscGain], output: oscGain };
            }

            case 'additive': {
                const groupGain = ctx.createGain();
                const nodes = [groupGain];
                comp.partials.forEach(p => {
                    const osc = ctx.createOscillator();
                    osc.type = this.mapWaveType(p.wave);
                    osc.frequency.setValueAtTime(baseFreq * (parseFloat(p.ratio) || 1), time);
                    const pGain = ctx.createGain();
                    pGain.gain.setValueAtTime(parseFloat(p.amp) || 0, time);
                    osc.connect(pGain);
                    pGain.connect(groupGain);
                    osc.start(time);
                    nodes.push(osc, pGain);
                });
                const boost = ctx.createGain();
                boost.gain.setValueAtTime(1.0, time);
                groupGain.connect(boost);
                if (lastNode) lastNode.connect(boost);
                nodes.push(boost);
                return { nodes, output: boost };
            }

            case 'adsr': {
                const env = ctx.createGain();
                const a = Math.max(0.005, parseFloat(comp.a) || 0.01);
                const d = Math.max(0.005, parseFloat(comp.d) || 0.1);
                const s = (typeof comp.s !== 'undefined') ? parseFloat(comp.s) : 0.5;
                const r = Math.max(0.005, parseFloat(comp.r) || 0.1);
                let velocity = (voice && typeof voice.velocity === 'number') ? voice.velocity : 1.0;
                if (velocity < 0.001) velocity = 1.0; 
                
                env.gain.cancelScheduledValues(time);
                env.gain.setValueAtTime(0, time);
                env.gain.linearRampToValueAtTime(velocity, time + a);
                env.gain.linearRampToValueAtTime(s * velocity, time + a + d);
                
                // ADSR 是處理器，必須接收上一級訊號
                if (lastNode) lastNode.connect(env);
                return { nodes: [env], output: env, isEnv: true };
            }

            case 'filter': {
                const filter = ctx.createBiquadFilter();
                filter.type = comp.kind === 'HP' ? 'highpass' : 'lowpass';
                filter.frequency.setValueAtTime(parseFloat(comp.freq) || 1000, time);
                filter.Q.setValueAtTime(parseFloat(comp.q) || 1, time);
                
                if (lastNode) lastNode.connect(filter);
                return { nodes: [filter], output: filter };
            }

            case 'volume': {
                const gain = ctx.createGain();
                const rawVal = comp.VOLUME ?? comp.VOL ?? comp.val ?? comp.gain ?? 100;
                const targetVol = parseFloat(rawVal) / 100;
                
                gain.gain.cancelScheduledValues(time);
                gain.gain.setValueAtTime(targetVol, time);
                
                // 關鍵：Volume 必須連接 lastNode
                if (lastNode) {
                    lastNode.connect(gain);
                }
                return { nodes: [gain], output: gain };
            }

            case 'effect': {
                const effectType = comp.effect_type;
                let nodes = [], output = null, namedNodes = {};
                if (effectType === 'filter') {
                    const filter = ctx.createBiquadFilter();
                    filter.type = comp.filter_type || 'lowpass';
                    filter.frequency.setValueAtTime(parseFloat(comp.freq) || 1000, time);
                    filter.Q.setValueAtTime(parseFloat(comp.q) || 1, time);
                    nodes.push(filter); output = filter;
                } else if (effectType === 'delay') {
                    const delay = ctx.createDelay(5.0);
                    delay.delayTime.setValueAtTime(parseFloat(comp.delay_time) || 0.5, time);
                    const feedback = ctx.createGain();
                    feedback.gain.setValueAtTime(parseFloat(comp.feedback) || 0.5, time);
                    delay.connect(feedback); feedback.connect(delay);
                    nodes.push(delay, feedback); output = delay;
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
                    nodes.push(compNode, makeup); output = makeup;
                } else if (effectType === 'distortion') {
                    const shaper = ctx.createWaveShaper();
                    shaper.curve = this.makeDistortionCurve(parseFloat(comp.distortion) || 10);
                    shaper.oversample = '4x';
                    nodes.push(shaper); output = shaper;
                } else if (effectType === 'bitcrush') {
                    const bits = parseFloat(comp.bits || comp.bitdepth) || 8;
                    const bufferSize = 4096;
                    const node = ctx.createScriptProcessor(bufferSize, 1, 1);
                    node.onaudioprocess = (e) => {
                        const input = e.inputBuffer.getChannelData(0);
                        const output = e.outputBuffer.getChannelData(0);
                        const step = Math.pow(0.5, bits);
                        for (let i = 0; i < bufferSize; i++) {
                            output[i] = step * Math.floor(input[i] / step);
                        }
                    };
                    nodes.push(node); output = node;
                } else if (effectType === 'reverb') {
                    const seconds = parseFloat(comp.seconds) || 3;
                    const decay = parseFloat(comp.decay) || 2;
                    const mix = (typeof comp.mix !== 'undefined') ? parseFloat(comp.mix) : 0.5;
                    
                    const input = ctx.createGain();
                    const dry = ctx.createGain();
                    const wet = ctx.createGain();
                    const convolver = ctx.createConvolver();
                    const outputNode = ctx.createGain();
                    
                    convolver.buffer = this.buildImpulseResponse(ctx, seconds, decay);
                    
                    dry.gain.setValueAtTime(1 - mix, time);
                    wet.gain.setValueAtTime(mix, time);
                    
                    input.connect(dry);
                    input.connect(convolver);
                    convolver.connect(wet);
                    dry.connect(outputNode);
                    wet.connect(outputNode);
                    
                    nodes.push(input, dry, wet, convolver, outputNode);
                    output = outputNode;
                    namedNodes = { input, dry, wet, output: outputNode };
                }
                if (output && lastNode) lastNode.connect(nodes[0]);
                return { nodes, output };
            }

            case 'sampler': {
                if (!AudioManager || !AudioManager.samples) return null;
                let buffer = null, playbackRate = 1.0;
                const isPiano = comp.sample_id === 'piano';
                if (isPiano || comp.sample_id === 'violin_pizz' || comp.sample_id === 'violin_sust') {
                    const prefix = isPiano ? 'piano' : (comp.sample_id === 'violin_pizz' ? 'pizzicato' : 'vibrato-sustain');
                    const bestMatch = this.findBestSample(AudioManager.samples, prefix, baseFreq);
                    if (bestMatch) { buffer = bestMatch.buffer; playbackRate = bestMatch.ratio; }
                } else {
                    buffer = AudioManager.samples[comp.sample_id];
                }
                if (!buffer) return null;

                const nodes = [];
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.playbackRate.value = playbackRate;
                nodes.push(source);

                const samplerGain = ctx.createGain();
                samplerGain.gain.setValueAtTime(1.5, time); 
                source.connect(samplerGain);
                nodes.push(samplerGain);

                // 如果取樣器前方有節點 (混音)，連接它
                if (lastNode) lastNode.connect(samplerGain);

                source.start(time);
                // 回傳 samplerGain 作為輸出，確保後續 Volume 能控制它
                return { nodes, output: samplerGain };
            }

            default: return null;
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
                let diff = targetMidi - mid;
                let dist = diff < 0 ? Math.abs(diff) * 3.0 : Math.abs(diff);
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
    },

    buildImpulseResponse(ctx, seconds, decay) {
        const rate = ctx.sampleRate;
        const length = rate * seconds;
        const buffer = ctx.createBuffer(2, length, rate);
        for (let j = 0; j < 2; j++) {
            const channel = buffer.getChannelData(j);
            for (let i = 0; i < length; i++) {
                channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        return buffer;
    }
};
