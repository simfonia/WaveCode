/**
 * WaveCode Visualizer Module - 預覽與視覺停留穩定版
 */

export class FieldADSR extends Blockly.Field {
    static SERIALIZABLE = false;
    constructor(a = 0.1, d = 0.2, s = 0.5, r = 0.4) {
        super();
        this.A = a; this.D = d; this.S = s; this.R = r;
        this.width_ = 160; this.height_ = 60;
    }
    isSerializable() { return false; }
    getSize() { return new Blockly.utils.Size(this.width_, this.height_ + 10); }
    initView() {
        this.svgGroup_ = Blockly.utils.dom.createSvgElement('g', { 'transform': 'translate(0, 5)' }, this.fieldGroup_);
        Blockly.utils.dom.createSvgElement('rect', { 'width': this.width_, 'height': this.height_, 'rx': 4, 'ry': 4, 'fill': '#1a252f' }, this.svgGroup_);
        this.bgPath_ = Blockly.utils.dom.createSvgElement('path', { 'fill': 'none', 'stroke': '#3498db', 'stroke-width': 3, 'stroke-linejoin': 'round' }, this.svgGroup_);
        this.dot_ = Blockly.utils.dom.createSvgElement('circle', { 'r': 4, 'fill': '#f1c40f', 'opacity': 0 }, this.svgGroup_);
        this.render_();
    }
    updateParams(a, d, s, r) {
        this.A = parseFloat(a) || 0; this.D = parseFloat(d) || 0; this.S = parseFloat(s) || 0; this.R = parseFloat(r) || 0;
        this.render_();
    }
    playAnimation(noteDuration) {
        this._duration = noteDuration / 1000; this._startTime = performance.now(); this._isPlaying = true;
        if (this.dot_) this.dot_.setAttribute('opacity', 1);
        if (!this._animationId) this.animate_();
    }
    startHold() {
        this._startTime = performance.now(); this._isPlaying = true; this._isHolding = true; this._duration = 999; 
        if (this.dot_) this.dot_.setAttribute('opacity', 1);
        if (!this._animationId) this.animate_();
    }
    endHold() {
        if (this._isPlaying && this._isHolding) {
            this._isHolding = false;
            const elapsedSinceStart = (performance.now() - this._startTime) / 1000;
            this._duration = Math.max(elapsedSinceStart - (this.A + this.D), 0);
        }
    }
    stopAnimation() {
        this._isPlaying = false; this._isHolding = false;
        if (this.dot_) this.dot_.setAttribute('opacity', 0);
    }
    animate_() {
        if (!this._isPlaying) { this._animationId = null; return; }
        this.render_();
        const elapsed = (performance.now() - this._startTime) / 1000;
        const totalDuration = this.A + this.D + (this._isHolding ? 999 : this._duration) + this.R;
        if (!this._isHolding && elapsed > totalDuration + 0.2) { this._isPlaying = false; this._animationId = null; return; }
        this._animationId = requestAnimationFrame(() => this.animate_());
    }
    render_() {
        if (!this.bgPath_) return;
        const w = this.width_, h = this.height_, padding = 8;
        const innerW = w - padding * 2, innerH = h - padding * 2;
        const totalT = Math.max(0.5, this.A + this.D + 0.5 + this.R);
        const scaleX = innerW / totalT;
        let points = [], curX = padding;
        points.push(`M ${curX},${h - padding}`);
        curX += this.A * scaleX; points.push(`L ${curX},${padding}`);
        curX += this.D * scaleX; points.push(`L ${curX},${h - padding - (this.S * innerH)}`);
        curX += 0.5 * scaleX; points.push(`L ${curX},${h - padding - (this.S * innerH)}`);
        curX += this.R * scaleX; points.push(`L ${curX},${h - padding}`);
        this.bgPath_.setAttribute('d', points.join(' '));
        if (this._isPlaying && this.dot_) {
            const elapsed = (performance.now() - this._startTime) / 1000;
            let dotX = padding, dotY = h - padding;
            if (elapsed < this.A) {
                const p = this.A > 0 ? elapsed / this.A : 1;
                dotX += elapsed * scaleX; dotY -= p * innerH;
            } else if (elapsed < this.A + this.D) {
                const p = this.D > 0 ? (elapsed - this.A) / this.D : 1;
                dotX += elapsed * scaleX; dotY = padding + (p * (1 - this.S) * innerH);
            } else if (this._isHolding || elapsed < this.A + this.D + this._duration) {
                dotX += (this.A + this.D + 0.25) * scaleX; dotY = h - padding - (this.S * innerH);
            } else if (elapsed < this.A + this.D + this._duration + this.R) {
                const p = (elapsed - (this.A + this.D + this._duration)) / this.R;
                dotX += (this.A + this.D + 0.5 + (p * this.R)) * scaleX;
                dotY = (h - padding - (this.S * innerH)) + (p * this.S * innerH);
            }
            this.dot_.setAttribute('cx', dotX); this.dot_.setAttribute('cy', dotY);
        }
    }
    static fromJson(options) { return new FieldADSR(options.a, options.d, options.s, options.r); }
}
Blockly.fieldRegistry.register('field_adsr', FieldADSR);

export const EnvelopeManager = {
    _registry: new Map(),
    clearRegistry() { this._registry.clear(); },
    register(id, field) {
        if (!this._registry.has(id)) this._registry.set(id, []);
        this._registry.get(id).push(field);
    },
    trigger(id, duration) {
        if (id && this._registry.has(id)) {
            this._registry.get(id).forEach(f => f.playAnimation(duration));
        }
        // 修正：移除全域觸發 fallback，找不到 ID 就保持安靜
    },
    triggerStart(id) {
        if (id && this._registry.has(id)) {
            this._registry.get(id).forEach(f => f.startHold());
        }
    },
    triggerEnd(id) {
        if (id && this._registry.has(id)) {
            this._registry.get(id).forEach(f => f.endHold());
        }
    },
    stopAll() { this._registry.forEach(list => list.forEach(f => f.stopAnimation())); }
};
window.EnvelopeManager = EnvelopeManager;

/**
 * 即時分析儀 (Oscilloscope) - 支援預選樂器預覽版
 */
export const Oscilloscope = {
    canvas: null, fftCanvas: null, ctx: null, fftCtx: null, analyser: null,
    _data: null, _fftData: [], _isClipped: false, 
    _activeInstruments: new Set(),
    _instrumentTimers: new Map(), 
    _selectedInstrument: null, 
    _fftMode: 'linear', // 'linear' (1/n) 或 'log' (專業)
    LINGER_TIME: 1500,

    init(canvasId, analyser) {
        this.canvas = document.getElementById(canvasId) || document.querySelector('canvas:not([id*="fft"])');
        this.fftCanvas = document.getElementById('fftCanvas') || document.getElementById('fft-canvas') || document.querySelector('canvas[id*="fft"]');
        if (analyser) this.analyser = analyser;
        if (!this.canvas || !this.fftCanvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.fftCtx = this.fftCanvas.getContext('2d');
        
        // --- 使用 ResizeObserver 徹底解決隱藏後展開的尺寸問題 ---
        const resizeObserver = new ResizeObserver(() => {
            this.resize();
        });
        if (this.canvas.parentElement) resizeObserver.observe(this.canvas.parentElement);
        if (this.fftCanvas.parentElement) resizeObserver.observe(this.fftCanvas.parentElement);

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // --- 綁定模式切換開關 ---
        const modeCheckbox = document.getElementById('fft-mode-checkbox');
        if (modeCheckbox) {
            modeCheckbox.addEventListener('change', (e) => {
                this._fftMode = e.target.checked ? 'log' : 'linear';
                // 更新標籤狀態
                document.querySelectorAll('.mode-label').forEach(el => {
                    el.classList.toggle('active', el.dataset.mode === this._fftMode);
                });
            });
        }

        if (this._uiInterval) clearInterval(this._uiInterval);
        this._uiInterval = setInterval(() => {
            const hasEngine = this.analyser || window.AudioManager || (window.WaveCode && window.WaveCode.AudioManager);
            if (hasEngine) this._updateBadge();
        }, 100);

        this.loop();
    },

    // 鍵盤切換樂器時主動調用
    setSelectedInstrument(instId) {
        this._selectedInstrument = instId;
        // 立即反應一次以確保手感
        this._updateBadge();
    },

    updateInstrumentStatus(instId, active) {
        if (!instId || instId === 'none') return;
        if (active) {
            this._activeInstruments.add(instId);
            this._instrumentTimers.set(instId, Date.now()); 
        } else {
            this._activeInstruments.delete(instId);
        }
        // 不再於此處立即調用 _updateBadge()，改由 100ms 定時器處理
    },

    clearInstruments() { 
        this._activeInstruments.clear(); 
        this._instrumentTimers.clear();
        this._updateBadge(); 
    },

    _updateBadge() {
        const badge = document.getElementById('current-instrument-display');
        if (!badge) return;

        const now = Date.now();
        const displayList = Array.from(this._instrumentTimers.keys()).filter(id => {
            const isPlaying = this._activeInstruments.has(id);
            const lastActive = this._instrumentTimers.get(id) || 0;
            const isLingering = (now - lastActive < this.LINGER_TIME);
            return isPlaying || isLingering;
        });

        // 清理超時的 Timer 條目
        for (const id of this._instrumentTimers.keys()) {
            if (!displayList.includes(id) && !this._activeInstruments.has(id)) {
                this._instrumentTimers.delete(id);
            }
        }

        // --- 效能優化：計算新文字並進行比對，減少 DOM 操作 ---
        let newText = '';
        if (displayList.length === 0) { 
            if (this._selectedInstrument) {
                newText = `[ ${this._selectedInstrument} ]`; 
            }
        } else if (displayList.length === 1) { 
            newText = `(${displayList[0]})`; 
        } else { 
            newText = `(混合輸出: ${displayList.length} 聲部)`; 
        }

        if (badge.textContent !== newText) {
            badge.textContent = newText;
            if (newText) badge.classList.add('active');
            else badge.classList.remove('active');
        }
    },

    loop() {
        if (!this.ctx || !this.fftCtx) return;

        const now = Date.now();
        if (this._lastDrawTime && (now - this._lastDrawTime < 32)) {
            requestAnimationFrame(() => this.loop());
            return;
        }
        this._lastDrawTime = now;

        const analyser = this.analyser || 
                        (window.AudioManager && window.AudioManager.analyser) || 
                        (window.WaveCode && window.WaveCode.AudioManager && window.WaveCode.AudioManager.analyser);
        if (analyser) {
            const bufferLength = analyser.frequencyBinCount;
            
            // 處理波形數據
            if (!this._data || this._data.length !== bufferLength) this._data = new Float32Array(bufferLength);
            analyser.getFloatTimeDomainData(this._data);
            
            // 處理頻譜數據 (dB)
            if (!this._fftRaw || this._fftRaw.length !== bufferLength) this._fftRaw = new Float32Array(bufferLength);
            analyser.getFloatFrequencyData(this._fftRaw);
            
            // 計算線性數據供線性模式 (1/n) 使用
            const sensitivity = 20.0; 
            this._fftData = Array.from(this._fftRaw).map(db => {
                if (db === -Infinity || db < -100) return 0;
                return Math.pow(10, db / 20) * sensitivity;
            });

            this._isClipped = false;
            for (let i = 0; i < this._data.length; i++) { if (Math.abs(this._data[i]) >= 0.99) { this._isClipped = true; break; } }
            this.draw();
        } else { this.clear(); }
        requestAnimationFrame(() => this.loop());
    },

    resize() {
        if (!this.canvas || !this.fftCanvas) return;
        const r1 = this.canvas.getBoundingClientRect();
        this.canvas.width = r1.width * window.devicePixelRatio;
        this.canvas.height = r1.height * window.devicePixelRatio;
        const r2 = this.fftCanvas.getBoundingClientRect();
        this.fftCanvas.width = r2.width * window.devicePixelRatio;
        this.fftCanvas.height = r2.height * window.devicePixelRatio;
    },

    clear() {
        if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.fftCtx) this.fftCtx.clearRect(0, 0, this.fftCanvas.width, this.fftCanvas.height);
    },

    draw() { if (this.ctx && this.fftCtx) { this.drawWaveform(); this.drawFFT(); } },

    drawWaveform() {
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
        ctx.clearRect(0, 0, w, h); if (!this._data || !this._data.length) return;
        let offset = 0, maxSlope = -1;
        for (let i = 1; i < this._data.length * 0.7; i++) {
            if (this._data[i-1] < 0 && this._data[i] >= 0) {
                const s = this._data[i] - this._data[i-1]; if (s > maxSlope) { maxSlope = s; offset = i; }
            }
        }
        ctx.beginPath(); ctx.strokeStyle = this._isClipped ? '#e74c3c' : '#75FB4C'; ctx.lineWidth = 2.5 * window.devicePixelRatio;
        const len = Math.floor(this._data.length / 4), step = w / len;
        for (let i = 0; i < len; i++) {
            const v = this._data[offset + i] || 0; const y = (h / 2) - (v * h / 2.2);
            if (i === 0) ctx.moveTo(0, y); else ctx.lineTo(i * step, y);
        }
        ctx.stroke();
    },

    drawFFT() {
        const ctx = this.fftCtx, w = this.fftCanvas.width, h = this.fftCanvas.height;
        ctx.clearRect(0, 0, w, h);
        if (!this._fftData || !this._fftData.length) return;

        const drawH = h - 2 * window.devicePixelRatio;
        const pixelRatio = window.devicePixelRatio;

        if (this._fftMode === 'linear') {
            // --- 模式一：線性模式 (教學用 1/n 視覺) ---
            const bins = 240;
            const data = this._fftData.slice(0, bins);
            const barW = w / bins;
            for (let i = 0; i < bins; i++) {
                const val = Math.min(drawH, data[i] * drawH); 
                const x = i * barW, y = drawH - val;
                const hue = 200 + (i / bins) * 180;
                ctx.fillStyle = `hsl(${hue}, 85%, 65%)`;
                ctx.fillRect(x, y, barW - 0.5, val);
                ctx.fillStyle = `hsl(${hue}, 100%, 85%)`;
                ctx.fillRect(x, y, barW - 0.5, 1.5 * pixelRatio);
            }
        } else {
            // --- 模式二：分貝模式 (線性頻率 X + 對數分貝 Y) ---
            const bins = 240; // 維持與線性模式相同的頻率範圍 (約 0-5kHz)
            const barW = w / bins;
            
            for (let i = 0; i < bins; i++) {
                const db = this._fftRaw[i] || -120;
                
                // 將 -70dB ~ -10dB 映射到高度 (這會讓微弱諧波變得非常清晰)
                const minDB = -70, maxDB = -10;
                const norm = Math.max(0, (db - minDB) / (maxDB - minDB));
                const val = norm * drawH;
                
                const x = i * barW, y = drawH - val;
                const hue = 200 + (i / bins) * 180;
                
                // 繪製細針譜線 (與線性模式對齊，但高度反映 dB)
                ctx.fillStyle = `hsl(${hue}, 85%, 50%)`;
                ctx.fillRect(x, y, Math.max(1, barW - 0.5), val);
                
                // 頂部高亮
                if (val > 2) {
                    ctx.fillStyle = `hsl(${hue}, 100%, 80%)`;
                    ctx.fillRect(x, y, Math.max(1, barW - 0.5), 1.5 * pixelRatio);
                }
            }
        }
    }
};

window.Oscilloscope = Oscilloscope;
export class Visualizer {
    constructor(analyser) { Oscilloscope.init('oscilloscope', analyser); }
    start() {} 
}
