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
        this.nodesMap = new Map(); 
        this.envNode = null;
        this.adsr = null;
        this.releaseTimer = null;
        this.gateNode = null; // 紀錄預設 gate
    }

    /**
     * 演奏音符
     */
    play(freq, originalPatch, startTime, velocity = 1.0) {
        this.kill(); 
        this.active = true;
        this.releasing = false; 
        this.freq = freq;
        this.velocity = (typeof velocity === 'number' && isFinite(velocity)) ? velocity : 1.0;
        this.extraTail = 0; // 紀錄效果器尾跡

        // --- 通知全域示波器 ---
        const targetInstId = this.instId || 'unknown';
        if (window.Oscilloscope) window.Oscilloscope.updateInstrumentStatus(targetInstId, true);

        const patch = JSON.parse(JSON.stringify(originalPatch));
        let lastNode = null;
        
        patch.forEach(comp => {
            const result = NodeFactory.create(this.ctx, comp, freq, lastNode, startTime, AudioManager, this);
            if (result) {
                if (result.nodes) {
                    this.nodes.push(...result.nodes);
                    const key = comp.type === 'effect' ? `effect_${comp.effect_type}` : comp.type;
                    
                    // --- 計算尾跡 ---
                    if (key === 'effect_reverb') {
                        this.extraTail = Math.max(this.extraTail, parseFloat(comp.seconds) || 3);
                    } else if (key === 'effect_delay') {
                        this.extraTail = Math.max(this.extraTail, 2.0); // 預留給 Delay 的尾跡
                    }

                    if (result.namedNodes) {
                        for (const name in result.namedNodes) { this.nodesMap.set(`${key}_${name}`, result.namedNodes[name]); }
                        this.nodesMap.set(key, result.output);
                    } else { this.nodesMap.set(key, result.output); }
                }
                if (result.output) lastNode = result.output;
                if (result.isEnv) { this.envNode = result.output; this.adsr = comp; }
            }
        });

        if (lastNode) {
            if (!this.envNode) {
                const gate = this.ctx.createGain();
                // 修正：當沒有 ADSR 時，由 Gate 負責套用力度 (Velocity)
                gate.gain.setValueAtTime(this.velocity, startTime);
                lastNode.connect(gate);
                this.nodes.push(gate);
                this.gateNode = gate;
                lastNode = gate;
            } else {
                this.gateNode = null;
            }
            lastNode.connect(this.destination);
        }
    }

    updateParam(compType, paramName, val) {
        const effectKey = `effect_${compType}`;
        const node = this.nodesMap.get(effectKey) || this.nodesMap.get(compType);
        if (!node) return;
        const now = this.ctx.currentTime;
        if (compType === 'filter') {
            if (paramName === 'freq' || paramName === 'frequency') { node.frequency.setTargetAtTime(val, now, 0.05); }
            else if (paramName === 'q' || paramName === 'Q') { node.Q.setTargetAtTime(val, now, 0.05); }
        } else if (compType === 'volume') {
            if (paramName === 'val' || paramName === 'VOL') { node.gain.setTargetAtTime(val / 100, now, 0.05); }
        } else if (compType === 'delay') {
            const delayNode = this.nodesMap.get(`${effectKey}_delay`) || node;
            if (paramName === 'time' || paramName === 'delay_time') { delayNode.delayTime.setTargetAtTime(val, now, 0.05); }
            else if (paramName === 'feedback') {
                const feedbackNode = this.nodesMap.get(`${effectKey}_feedback`);
                if (feedbackNode) feedbackNode.gain.setTargetAtTime(val, now, 0.05);
            }
        } else if (compType === 'reverb') {
            const dryNode = this.nodesMap.get(`${effectKey}_dry`);
            const wetNode = this.nodesMap.get(`${effectKey}_wet`);
            if (paramName === 'mix') {
                if (dryNode) dryNode.gain.setTargetAtTime(1 - val, now, 0.05);
                if (wetNode) wetNode.gain.setTargetAtTime(val, now, 0.05);
            }
        }
    }

    release(startTime) {
        if (!this.active || this.releasing) return;
        this.releasing = true; 
        const now = this.ctx.currentTime;
        const isImmediate = (!startTime || startTime <= now);
        const time = isImmediate ? now : startTime;

        if (this.envNode && this.adsr) {
            try {
                this.envNode.gain.cancelScheduledValues(time);
                // 取得目前音量作為 Release 起點
                let startVal = isImmediate ? Math.max(0.0001, this.envNode.gain.value) : (this.adsr.s || 0.5) * this.velocity;
                this.envNode.gain.setValueAtTime(startVal, time);
                const r = Math.max(0.005, this.adsr.r || 0.1);
                this.envNode.gain.exponentialRampToValueAtTime(0.0001, time + r);
                
                // 考慮效果器尾跡 (Reverb/Delay)
                const totalReleaseTime = r + (this.extraTail || 0);
                this.releaseTimer = setTimeout(() => { if (this.active) this.kill(); }, Math.max(0, (time - now + totalReleaseTime) * 1000 + 100));
            } catch (e) { this.kill(); }
        } else if (this.gateNode) {
            // --- 關鍵修正：實施隱形安全淡出 (De-clicking) ---
            try {
                this.gateNode.gain.cancelScheduledValues(time);
                let startVal = isImmediate ? Math.max(0.0001, this.gateNode.gain.value) : this.velocity;
                this.gateNode.gain.setValueAtTime(startVal, time);
                // 5毫秒的淡出足以消除爆音且耳朵幾乎聽不出延遲
                const safetyRelease = 0.005; 
                this.gateNode.gain.exponentialRampToValueAtTime(0.0001, time + safetyRelease);

                const totalReleaseTime = safetyRelease + (this.extraTail || 0);
                this.releaseTimer = setTimeout(() => { if (this.active) this.kill(); }, Math.max(0, (time - now + totalReleaseTime) * 1000 + 50));
            } catch (e) { this.kill(); }
        } else { this.kill(); }
    }

    kill() {
        if (this.releaseTimer) { clearTimeout(this.releaseTimer); this.releaseTimer = null; }
        
        // --- 通知示波器樂器已關閉 ---
        if (window.Oscilloscope) window.Oscilloscope.updateInstrumentStatus(this.instId, false);

        this.active = false;
        this.releasing = false;
        this.nodes.forEach(node => { try { node.disconnect(); if (node.stop) node.stop(); } catch (e) {} });
        this.nodes = [];
        this.nodesMap.clear();
        this.envNode = null;
        this.adsr = null;
        this.gateNode = null;
    }
}
