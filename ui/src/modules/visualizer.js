/**
 * WaveCode Visualizer Module - 多重註冊同步版 (光暈與動態 Sustain 優化)
 */

export class FieldADSR extends Blockly.Field {
    static SERIALIZABLE = false;

    constructor(a = 0.1, d = 0.2, s = 0.5, r = 0.4) {
        super();
        this.A = a; this.D = d; this.S = s; this.R = r;
        this.width_ = 160;
        this.height_ = 60;
        this.svgGroup_ = null;
        this.bgPath_ = null;
        this.dot_ = null;
        this._animationId = null;
        this._startTime = 0;
        this._isPlaying = false;
        this._duration = 0;
        this._isHolding = false;
    }

    isSerializable() { return false; }
    getSize() { return new Blockly.utils.Size(this.width_, this.height_ + 10); }
    updateSize_() {}

    initView() {
        this.svgGroup_ = Blockly.utils.dom.createSvgElement('g', {
            'class': 'field-adsr-group',
            'transform': 'translate(0, 5)'
        }, this.fieldGroup_);

        // 1. 定義光暈濾鏡 (Glow Filter)
        const defs = Blockly.utils.dom.createSvgElement('defs', {}, this.svgGroup_);
        const filter = Blockly.utils.dom.createSvgElement('filter', {
            'id': 'glow-filter',
            'x': '-50%', 'y': '-50%', 'width': '200%', 'height': '200%'
        }, defs);
        Blockly.utils.dom.createSvgElement('feGaussianBlur', {
            'stdDeviation': '2.5',
            'result': 'blur'
        }, filter);
        const feMerge = Blockly.utils.dom.createSvgElement('feMerge', {}, filter);
        Blockly.utils.dom.createSvgElement('feMergeNode', { 'in': 'blur' }, feMerge);
        Blockly.utils.dom.createSvgElement('feMergeNode', { 'in': 'SourceGraphic' }, feMerge);

        // 背景
        Blockly.utils.dom.createSvgElement('rect', {
            'width': this.width_, 'height': this.height_,
            'rx': 4, 'ry': 4, 'fill': '#1a252f'
        }, this.svgGroup_);

        // 網格線
        for (let i = 1; i < 4; i++) {
            Blockly.utils.dom.createSvgElement('line', {
                'x1': 0, 'y1': (this.height_ * i / 4),
                'x2': this.width_, 'y2': (this.height_ * i / 4),
                'stroke': '#2c3e50', 'stroke-width': 1
            }, this.svgGroup_);
        }

        // ADSR 曲線
        this.bgPath_ = Blockly.utils.dom.createSvgElement('path', {
            'fill': 'none', 'stroke': '#3498db', 'stroke-width': 3, 'stroke-linejoin': 'round'
        }, this.svgGroup_);

        // 2. 移動光點 (加上 filter)
        this.dot_ = Blockly.utils.dom.createSvgElement('circle', {
            'r': 4, 'fill': '#f1c40f', 'opacity': 0, 
            'filter': 'url(#glow-filter)'
        }, this.svgGroup_);

        this.render_();
    }

    updateParams(a, d, s, r) {
        this.A = parseFloat(a) || 0;
        this.D = parseFloat(d) || 0;
        this.S = parseFloat(s) || 0;
        this.R = parseFloat(r) || 0;
        this.render_();
    }

    playAnimation(noteDuration) {
        this._duration = noteDuration / 1000;
        this._startTime = performance.now();
        this._isPlaying = true;
        this._isHolding = false;
        if (this.dot_) this.dot_.setAttribute('opacity', 1);
        if (!this._animationId) this.animate_();
    }

    startHold() {
        this._startTime = performance.now();
        this._isPlaying = true;
        this._isHolding = true;
        this._duration = 999; // 預設極大，直到 endHold
        if (this.dot_) this.dot_.setAttribute('opacity', 1);
        if (!this._animationId) this.animate_();
    }

    endHold() {
        if (this._isPlaying && this._isHolding) {
            this._isHolding = false;
            const now = performance.now();
            const elapsedSinceStart = (now - this._startTime) / 1000;
            // 將 _duration 設為目前的偏移量，讓動畫進入 Release 階段
            this._duration = Math.max(elapsedSinceStart - (this.A + this.D), 0);
        }
    }

    stopAnimation() {
        this._isPlaying = false;
        this._isHolding = false;
        if (this.dot_) this.dot_.setAttribute('opacity', 0);
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }
    }

    animate_() {
        if (!this._isPlaying) {
            this._animationId = null;
            if (this.dot_) this.dot_.setAttribute('opacity', 0);
            return;
        }
        this.render_();
        const now = performance.now();
        const elapsed = (now - this._startTime) / 1000;
        const totalDuration = this.A + this.D + (this._isHolding ? 999 : this._duration) + this.R;
        if (!this._isHolding && elapsed > totalDuration + 0.2) {
            this._isPlaying = false;
        }
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
            const now = performance.now();
            const elapsed = (now - this._startTime) / 1000;
            let dotX = padding, dotY = h - padding;
            if (elapsed < this.A) {
                const p = this.A > 0 ? elapsed / this.A : 1;
                dotX += elapsed * scaleX; dotY -= p * innerH;
            } else if (elapsed < this.A + this.D) {
                const p = this.D > 0 ? (elapsed - this.A) / this.D : 1;
                dotX += elapsed * scaleX; dotY = padding + (p * (1 - this.S) * innerH);
            } else if (this._isHolding || elapsed < this.A + this.D + this._duration) {
                const osc = Math.sin(elapsed * 12) * 0.15; 
                dotX += (this.A + this.D + 0.25 + osc) * scaleX; 
                dotY = h - padding - (this.S * innerH);
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

/**
 * 全域包絡線管理員
 */
export const EnvelopeManager = {
    _registry: new Map(),

    register(id, field) {
        if (!this._registry.has(id)) this._registry.set(id, []);
        const list = this._registry.get(id);
        if (!list.includes(field)) list.push(field);
    },

    trigger(id, duration) {
        if (id && this._registry.has(id)) {
            this._registry.get(id).forEach(f => f.playAnimation(duration));
        } else {
            this._registry.forEach(list => list.forEach(f => f.playAnimation(duration)));
        }
    },

    triggerStart(id) {
        if (id && this._registry.has(id)) {
            this._registry.get(id).forEach(f => f.startHold());
        } else {
            this._registry.forEach(list => list.forEach(f => f.startHold()));
        }
    },

    triggerEnd(id) {
        if (id && this._registry.has(id)) {
            this._registry.get(id).forEach(f => f.endHold());
        } else {
            this._registry.forEach(list => list.forEach(f => f.endHold()));
        }
    },

    stopAll() {
        this._registry.forEach(list => list.forEach(f => f.stopAnimation()));
    }
};

window.EnvelopeManager = EnvelopeManager;

/**
 * 即時分析儀 (Visualizer) - 包含示波器與頻譜
 */
export const Oscilloscope = {
    canvas: null,
    fftCanvas: null,
    ctx: null,
    fftCtx: null,
    _data: [],
    _fftData: [],
    _isClipped: false,

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.fftCanvas = document.getElementById('fftCanvas');
        if (!this.canvas || !this.fftCanvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.fftCtx = this.fftCanvas.getContext('2d');
        
        // 確保繪圖解析度正確
        this.resize();
        window.addEventListener('resize', () => this.resize());

        let lastUpdateTime = 0;

        if (window.__TAURI__) {
            window.__TAURI__.event.listen('waveform', (event) => {
                const payload = event.payload;
                this._data = payload.data || [];
                this._fftData = payload.fft || [];
                this._isClipped = payload.clipped || false;
                lastUpdateTime = performance.now();
                this.draw();
            });
        }

        setInterval(() => {
            if (performance.now() - lastUpdateTime > 100 && (this._data.length > 0 || this._fftData.length > 0)) {
                this._data = [];
                this._fftData = [];
                this._isClipped = false;
                this.clear();
            }
        }, 50);
    },

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        
        const fftRect = this.fftCanvas.getBoundingClientRect();
        this.fftCanvas.width = fftRect.width * window.devicePixelRatio;
        this.fftCanvas.height = fftRect.height * window.devicePixelRatio;
    },

    clear() {
        if (!this.ctx || !this.fftCtx) return;
        const w = this.canvas.width, h = this.canvas.height;
        const fw = this.fftCanvas.width, fh = this.fftCanvas.height;

        this.ctx.clearRect(0, 0, w, h);
        this.fftCtx.clearRect(0, 0, fw, fh);
        
        // 繪製零位水平線 (示波器)
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#2ecc71';
        this.ctx.globalAlpha = 0.2;
        this.ctx.moveTo(0, h / 2);
        this.ctx.lineTo(w, h / 2);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
    },

    draw() {
        if (!this.ctx || !this.fftCtx) return;
        this.drawWaveform();
        this.drawFFT();
    },

    drawWaveform() {
        const ctx = this.ctx;
        const w = this.canvas.width, h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);

        if (!this._data.length) return;

        ctx.beginPath();
        ctx.strokeStyle = this._isClipped ? '#e74c3c' : '#2ecc71';
        ctx.lineWidth = 2 * window.devicePixelRatio;
        ctx.lineJoin = 'round';

        const sliceWidth = w / this._data.length;
        let x = 0;

        for (let i = 0; i < this._data.length; i++) {
            const v = this._data[i];
            const y = (h / 2) - (v * h / 2); // 零點在中間

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            x += sliceWidth;
        }
        ctx.stroke();

        if (this._isClipped) {
            ctx.fillStyle = '#e74c3c';
            ctx.font = `bold ${14 * window.devicePixelRatio}px Inter`;
            ctx.textAlign = 'right';
            ctx.fillText('CLIP', w - 10, 20 * window.devicePixelRatio);
        }
    },

    drawFFT() {
        const ctx = this.fftCtx;
        const w = this.fftCanvas.width, h = this.fftCanvas.height;
        ctx.clearRect(0, 0, w, h);

        if (!this._fftData.length) return;

        // --- 頻率範圍調整位置 ---
        // 說明：FFT_SIZE 為 256，對應 0 ~ Nyquist (約 22050Hz)。
        // 這裡取前 60 個 Bins，大約對應 0 ~ 10,000Hz (10kHz)。
        // 如果想看到更寬或更窄，請修改下面的 60。
        const displayBins = 60; 
        const dataToDraw = this._fftData.slice(0, displayBins);
        // -----------------------

        const barWidth = w / dataToDraw.length;
        
        for (let i = 0; i < dataToDraw.length; i++) {
            const val = dataToDraw[i] * h * 1.2; // 稍微拉高增益讓視覺更強烈
            const x = i * barWidth;
            const y = h - val;

            // 多彩呈現：根據頻率位置 (i) 決定顏色 (HSL: 200藍 -> 280紫 -> 330粉)
            const hue = 200 + (i / dataToDraw.length) * 130;
            ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
            
            // 繪製帶有圓角的長條 (或是簡單矩形)
            ctx.fillRect(x, y, barWidth - 1, val);
            
            // 加入頂部高亮，增加質感
            ctx.fillStyle = `hsl(${hue}, 100%, 80%)`;
            ctx.fillRect(x, y, barWidth - 1, 2 * window.devicePixelRatio);
        }
    }
};
