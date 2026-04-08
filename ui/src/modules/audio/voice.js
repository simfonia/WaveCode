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
        this.releasing = false; 
        this.instId = null;
        this.freq = 0;
        this.nodes = [];
        this.nodesMap = new Map(); // 新增：組件類型 -> Web Audio 節點 (用於實時更新)
        this.envNode = null;
        this.adsr = null;
        this.releaseTimer = null;
    }

    /**
     * 演奏音符
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
                if (result.nodes) {
                    this.nodes.push(...result.nodes);
                    
                    // --- 儲存節點以便後續更新 ---
                    const key = comp.type === 'effect' ? `effect_${comp.effect_type}` : comp.type;
                    
                    if (result.namedNodes) {
                        // 如果有具名子節點 (例如 delay/feedback)，分別儲存
                        for (const name in result.namedNodes) {
                            this.nodesMap.set(`${key}_${name}`, result.namedNodes[name]);
                        }
                        // 同時將主輸出存入基本 key
                        this.nodesMap.set(key, result.output);
                    } else {
                        this.nodesMap.set(key, result.output);
                    }
                }
                if (result.output) lastNode = result.output;
                if (result.isEnv) {
                    this.envNode = result.output;
                    this.adsr = comp;
                }
            }
        });

        if (lastNode) {
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
     * 即時更新聲部內的組件參數 (如變動濾波頻率)
     */
    updateParam(compType, paramName, val) {
        // --- 智慧 Key 匹配 ---
        // 優先嘗試效果器前綴 (如 effect_filter)，若找不到則嘗試原始類型 (如 volume)
        const effectKey = `effect_${compType}`;
        const node = this.nodesMap.get(effectKey) || this.nodesMap.get(compType);
        
        if (!node) return;
        const now = this.ctx.currentTime;

        // 映射積木參數名到 Web Audio AudioParam 名稱
        if (compType === 'filter') {
            if (paramName === 'freq' || paramName === 'frequency') {
                node.frequency.setTargetAtTime(val, now, 0.05); 
            } else if (paramName === 'q' || paramName === 'Q') {
                node.Q.setTargetAtTime(val, now, 0.05);
            }
        } else if (compType === 'volume') {
            if (paramName === 'val' || paramName === 'VOL') {
                const gain = val / 100;
                node.gain.setTargetAtTime(gain, now, 0.05);
            }
        } else if (compType === 'delay') {
            // Delay 比較特殊，它在 nodesMap 中可能有子節點
            const delayNode = this.nodesMap.get(`${effectKey}_delay`) || node;
            if (paramName === 'time' || paramName === 'delay_time') {
                delayNode.delayTime.setTargetAtTime(val, now, 0.05);
            } else if (paramName === 'feedback') {
                const feedbackNode = this.nodesMap.get(`${effectKey}_feedback`);
                if (feedbackNode) feedbackNode.gain.setTargetAtTime(val, now, 0.05);
            }
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
