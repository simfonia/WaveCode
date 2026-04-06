/**
 * WaveCode Audio Visualizer (穩定觸發版)
 * 加入滯後觸發邏輯，解決波形閃爍漂移問題。
 */

export class Visualizer {
    constructor(analyser) {
        this.analyser = analyser;
        this.bufferLength = analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        this.active = false;
        this.lastRaw = 0.5;
        this.armed = false;
    }

    start() {
        this.active = true;
        this.update();
    }

    stop() {
        this.active = false;
    }

    update() {
        if (!this.active) return;
        requestAnimationFrame(() => this.update());

        this.analyser.getByteTimeDomainData(this.dataArray);

        // --- 滯後觸發邏輯 (Hysteresis Trigger) ---
        // 尋找適合的起始索引，使波形穩定
        let triggerIdx = 0;
        let found = false;
        const threshold = 128; // 零位 (0.0) 在 ByteData 中是 128

        for (let i = 1; i < this.bufferLength / 2; i++) {
            // 上升邊緣觸發：當前值 > 128 且 前一個值 <= 128
            if (this.dataArray[i] > threshold && this.dataArray[i-1] <= threshold) {
                triggerIdx = i;
                found = true;
                break;
            }
        }

        // 如果沒找到觸發點，就維持現狀 (或不更新) 以減少閃爍
        if (!found && this.active) return;

        // 轉換為 -1.0 ~ 1.0 的 Float32 格式
        const displayLength = Math.floor(this.bufferLength / 2);
        const floatData = new Float32Array(displayLength);
        let hasClipped = false;

        for (let i = 0; i < displayLength; i++) {
            const val = this.dataArray[triggerIdx + i] || 128;
            floatData[i] = (val - 128) / 128.0;
            if (Math.abs(floatData[i]) > 0.98) hasClipped = true;
        }

        window.dispatchEvent(new CustomEvent('waveform-data', {
            detail: { 
                data: Array.from(floatData),
                clipped: hasClipped 
            }
        }));
    }
}
