/**
 * WaveCode Node Factory (Web Audio 排程版)
 */

export const NodeFactory = {
    /**
     * 建立節點
     * @param {AudioContext} ctx 上下文
     * @param {Object} comp 組件定義
     * @param {number} baseFreq 基礎頻率
     * @param {AudioNode} lastNode 上一個節點
     * @param {number} startTime 啟動時間
     */
    create(ctx, comp, baseFreq, lastNode, startTime) {
        const time = startTime || ctx.currentTime;

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
                    pGain.gain.setValueAtTime(p.amp, time);
                    osc.connect(pGain);
                    pGain.connect(groupGain);
                    osc.start(time);
                    nodes.push(osc, pGain);
                });
                return { nodes, output: groupGain };
            }

            case 'adsr': {
                const env = ctx.createGain();
                env.gain.setValueAtTime(0, time);
                // Attack
                env.gain.linearRampToValueAtTime(1, time + comp.a);
                // Decay to Sustain
                env.gain.linearRampToValueAtTime(comp.s, time + comp.a + comp.d);
                
                if (lastNode) lastNode.connect(env);
                return { nodes: [env], output: env, isEnv: true };
            }

            case 'filter': {
                const filter = ctx.createBiquadFilter();
                filter.type = (comp.kind === 'HP') ? 'highpass' : 'lowpass';
                filter.frequency.setValueAtTime(comp.freq, time);
                filter.Q.setValueAtTime(comp.q || 1, time);
                
                if (lastNode) lastNode.connect(filter);
                return { nodes: [filter], output: filter };
            }

            case 'volume': {
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(comp.val, time);
                if (lastNode) lastNode.connect(gain);
                return { nodes: [gain], output: gain };
            }

            default:
                return null;
        }
    }
};
