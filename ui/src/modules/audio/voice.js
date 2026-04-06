/**
 * WaveCode Voice
 * 封裝單一發聲通道的節點鏈與生命週期。
 */
import { NodeFactory } from './factory.js';

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
            const result = NodeFactory.create(this.ctx, comp, freq, lastNode, startTime);
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
        const isImmediate = (startTime <= 0 || startTime <= now);
        const time = isImmediate ? now : startTime;

        if (this.envNode && this.adsr) {
            this.envNode.gain.cancelScheduledValues(time);
            
            let startVal;
            if (isImmediate) {
                // 即時釋放 (如鍵盤彈奏)：使用當前實際音量作為起點
                startVal = Math.max(0.0001, this.envNode.gain.value);
            } else {
                // 未來預約釋放 (如編序器)：使用 ADSR 階段估算音量
                const isPastAD = time >= (now + this.adsr.a + this.adsr.d);
                startVal = Math.max(0.0001, isPastAD ? this.adsr.s : 1.0);
            }
            
            this.envNode.gain.setValueAtTime(startVal, time);
            
            // 指數衰減至 0 (使用 0.0001 作為目標值)
            this.envNode.gain.exponentialRampToValueAtTime(0.0001, time + this.adsr.r);
            
            // 安全回收 Voice
            const durationToKill = (time - now) + this.adsr.r;
            this.releaseTimer = setTimeout(() => {
                if (this.active) this.kill();
            }, Math.max(0, durationToKill * 1000 + 200));
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
