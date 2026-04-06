/**
 * WaveCode Voice
 * 封裝單一發聲通道的節點鏈與生命週期。
 */
import { NodeFactory } from './factory.js';
import { AudioManager } from './manager.js';

export class Voice {
    constructor(ctx, destination) {
        this.ctx = ctx;
        this.destination = destination;
        this.active = false;
        this.releasing = false; // 是否正在釋放階段
        this.freq = 0;
        this.nodes = [];
        this.envNode = null;
        this.adsr = null;
        this.releaseTimer = null;
    }

    /**
     * 演奏音符
     * @param {number} freq 頻率
     * @param {Array} patch 樂器配置
     * @param {number} startTime 啟動時間
     */
    play(freq, patch, startTime) {
        this.kill(); 
        this.active = true;
        this.releasing = false; 
        this.freq = freq;

        let lastNode = null;
        
        patch.forEach(comp => {
            const result = NodeFactory.create(this.ctx, comp, freq, lastNode, startTime, AudioManager);
            if (result) {
                if (result.nodes) this.nodes.push(...result.nodes);
                if (result.output) lastNode = result.output;
                if (result.isEnv) {
                    this.envNode = result.output;
                    this.adsr = comp;
                }
            }
        });

        if (lastNode) {
            // 基礎 Gate (若無 ADSR)
            if (!this.envNode) {
                const gate = this.ctx.createGain();
                gate.gain.setValueAtTime(1, startTime);
                lastNode.connect(gate);
                this.nodes.push(gate);
                lastNode = gate;
            }
            lastNode.connect(this.destination);
        }
    }

    /**
     * 釋放音符
     * @param {number} startTime 釋放時間
     */
    release(startTime) {
        if (!this.active || this.releasing) return;
        this.releasing = true; 

        const now = this.ctx.currentTime;
        const isImmediate = (!startTime || startTime <= now);
        const time = isImmediate ? now : startTime;

        if (this.envNode && this.adsr) {
            try {
                this.envNode.gain.cancelScheduledValues(time);

                let startVal;
                if (isImmediate) {
                    startVal = Math.max(0.0001, this.envNode.gain.value);
                } else {
                    const a = this.adsr.a || 0.01;
                    const d = this.adsr.d || 0.1;
                    const s = (typeof this.adsr.s === 'number') ? this.adsr.s : 0.5;
                    const isPastAD = time >= (now + a + d);
                    startVal = Math.max(0.0001, isPastAD ? s : 1.0);
                }

                if (!isFinite(startVal)) startVal = 0.5;
                if (!isFinite(time)) return;

                this.envNode.gain.setValueAtTime(startVal, time);

                const r = this.adsr.r || 0.1;
                this.envNode.gain.exponentialRampToValueAtTime(0.0001, time + r);

                const durationToKill = (time - now) + r;
                this.releaseTimer = setTimeout(() => {
                    if (this.active) this.kill();
                }, Math.max(0, durationToKill * 1000 + 200));
            } catch (e) {
                console.warn("Voice: Release 執行失敗", e);
                this.kill();
            }
        } else {
            this.kill();
        }
    }

    kill() {
        if (this.releaseTimer) {
            clearTimeout(this.releaseTimer);
            this.releaseTimer = null;
        }
        this.active = false;
        this.releasing = false;
        this.nodes.forEach(node => {
            try {
                node.disconnect();
                if (node.stop) node.stop();
            } catch (e) {}
        });
        this.nodes = [];
        this.envNode = null;
        this.adsr = null;
    }
}
