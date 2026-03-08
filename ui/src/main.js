/**
 * WaveCode IDE - 前端主程式 (Vite ES Module 版)
 */
import './style.css';
import './lang/zh-hant.js';
import './blocks/audio.js';
import './generators/javascript/audio.js';

// --- 1. 註冊插件 (Fields & Scroll Options) ---
if (window.FieldMultilineInput) Blockly.fieldRegistry.register('field_multilinetext', window.FieldMultilineInput);
if (window.FieldColour) Blockly.fieldRegistry.register('field_colour', window.FieldColour);

const ScrollOptionsPlugin = window.ScrollOptions || (window.ScrollOptionsPlugin && window.ScrollOptionsPlugin.ScrollOptions);
const scrollDragger = window.ScrollBlockDragger || (ScrollOptionsPlugin ? ScrollOptionsPlugin.ScrollBlockDragger : undefined);
const scrollMetrics = window.ScrollMetricsManager || (ScrollOptionsPlugin ? ScrollOptionsPlugin.ScrollMetricsManager : undefined);

// --- 關鍵補丁：徹底禁用 ScrollOptions 的向左自動捲動 ---
if (scrollDragger && scrollDragger.prototype) {
    // 攔截計算整體捲動向量的方法
    const originalGetOverallScrollVector = scrollDragger.prototype.getOverallScrollVector_;
    if (originalGetOverallScrollVector) {
        scrollDragger.prototype.getOverallScrollVector_ = function(t) {
            // t 是一個包含 top, bottom, left, right 陣列的物件
            // 我們直接清空 left 陣列，讓它永遠不會產生向左的動力
            if (t && t.left) {
                t.left = [];
            }
            return originalGetOverallScrollVector.call(this, t);
        };
        console.log('ScrollOptions: 已成功禁用左側自動捲動。');
    }
}

// 2. 定義完整的 Toolbox
const toolbox = {
    'kind': 'categoryToolbox',
    'contents': [
        {
            'kind': 'category',
            'name': '%{BKY_CAT_AUDIO}',
            'style': 'audio_category',
            'contents': [
                { 'kind': 'block', 'type': 'audio_play_sine', 'inputs': { 'FREQ': { 'shadow': { 'type': 'audio_note' } } } },
                { 'kind': 'block', 'type': 'audio_stop' },
                { 'kind': 'block', 'type': 'audio_note' },
                { 'kind': 'block', 'type': 'audio_wait', 'inputs': { 'MS': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 500 } } } } }
            ]
        },
        { 'kind': 'sep' },
        {
            'kind': 'category',
            'name': '%{BKY_CAT_LOGIC}',
            'colour': '#5C81A6',
            'contents': [
                { 'kind': 'block', 'type': 'logic_compare' },
                { 'kind': 'block', 'type': 'logic_operation' },
                { 'kind': 'block', 'type': 'logic_boolean' }
            ]
        },
        {
            'kind': 'category',
            'name': '%{BKY_CAT_LOOPS}',
            'colour': '#5CA65C',
            'contents': [
                { 'kind': 'block', 'type': 'controls_repeat_ext', 'inputs': { 'TIMES': { 'shadow': { 'type': 'math_number', 'fields': { 'NUM': 4 } } } } },
                { 'kind': 'block', 'type': 'controls_whileUntil' },
                { 'kind': 'block', 'type': 'controls_for' }
            ]
        },
        {
            'kind': 'category',
            'name': '%{BKY_CAT_MATH}',
            'colour': '#5C68A6',
            'contents': [
                { 'kind': 'block', 'type': 'math_number' },
                { 'kind': 'block', 'type': 'math_arithmetic' },
                { 'kind': 'block', 'type': 'math_random_int' }
            ]
        },
        { 'kind': 'sep' },
        {
            'kind': 'category',
            'name': '%{BKY_CAT_VARIABLES}',
            'custom': 'VARIABLE',
            'colour': '#A65C81'
        },
        {
            'kind': 'category',
            'name': '%{BKY_CAT_FUNCTIONS}',
            'custom': 'PROCEDURE',
            'colour': '#9A5CA6'
        }
    ]
};

// 3. 定義主題
const waveCodeTheme = Blockly.Theme.defineTheme('wavecode_theme', {
    'base': Blockly.Themes.Classic,
    'blockStyles': {
        'audio_blocks': { 'colourPrimary': '#E67E22', 'colourSecondary': '#D35400', 'colourTertiary': '#A04000' }
    },
    'componentStyles': {
        'workspaceBackgroundColour': '#1e1e1e',
        'toolboxBackgroundColour': '#252526',
        'toolboxForegroundColour': '#cccccc',
        'flyoutBackgroundColour': '#2d2d2d',
        'flyoutForegroundColour': '#cccccc',
        'scrollbarColour': '#555555'
    }
});

// 4. 初始化工作區
const blocklyDiv = document.getElementById('blocklyDiv');
const workspace = Blockly.inject(blocklyDiv, {
    toolbox: toolbox,
    grid: { spacing: 20, length: 3, colour: '#333', snap: true },
    zoom: { controls: true, wheel: true, startScale: 1.0 },
    move: { scrollbars: true, drag: true, wheel: true },
    theme: waveCodeTheme,
    plugins: {
        'blockDragger': scrollDragger,
        'metricsManager': scrollMetrics
    }
});

// --- 初始化 Scroll Options (調低捲動速度) ---
if (ScrollOptionsPlugin) {
    try {
        const scrollOptions = new ScrollOptionsPlugin(workspace);
        scrollOptions.init({
            enableWheelScroll: true,
            enableEdgeScroll: true,
            edgeScrollOptions: {
                slowBlockSpeed: 0.15,
                fastBlockSpeed: 0.5,
                slowMouseSpeed: 0.25,
                fastMouseSpeed: 1.0,
                fastBlockStartDistance: 80,
                fastMouseStartDistance: 60
            }
        });
    } catch (e) { console.error('ScrollOptions init failed:', e); }
}

// --- 初始化 Minimap (全方位防護) ---
function initMinimap(primaryWorkspace) {
    try {
        const MinimapClass = (window.workspaceMinimap && window.workspaceMinimap.PositionedMinimap) || 
                           (window.PositionedMinimap) || 
                           (Blockly.workspaceMinimap && Blockly.workspaceMinimap.PositionedMinimap);
        if (!MinimapClass) return;

        const originalUpdate = MinimapClass.prototype.update;
        MinimapClass.prototype.update = function() {
            try {
                if (!this.primaryWorkspace) return;
                const pm = this.primaryWorkspace.getMetricsManager().getContentMetrics(true);
                if (!pm || !pm.width || isNaN(pm.width)) return;
                originalUpdate.apply(this, arguments);
            } catch (e) { }
        };

        const minimap = new MinimapClass(primaryWorkspace);
        minimap.init();

        const originalMirror = minimap.mirror.bind(minimap);
        minimap.mirror = (event) => {
            if (minimap._isPaused) return;
            try {
                if (event.type === Blockly.Events.BLOCK_CREATE && !primaryWorkspace.getBlockById(event.blockId)) return;
                originalMirror(event);
            } catch (e) { }
        };

        const toggleBtn = document.createElement('div');
        toggleBtn.id = 'minimap-toggle';
        toggleBtn.innerHTML = '&#10005;';
        blocklyDiv.appendChild(toggleBtn);
        toggleBtn.onclick = () => {
            const mWrapper = document.querySelector('.blockly-minimap');
            if (mWrapper) {
                const isCollapsed = mWrapper.classList.toggle('collapsed');
                toggleBtn.classList.toggle('collapsed', isCollapsed);
                toggleBtn.innerHTML = isCollapsed ? '&#128506;' : '&#10005;';
                minimap._isPaused = isCollapsed;
                if (!isCollapsed) {
                    setTimeout(() => {
                        if (minimap.minimapWorkspace) {
                            minimap.minimapWorkspace.zoomToFit();
                            Blockly.svgResize(minimap.minimapWorkspace);
                        }
                    }, 100);
                }
            }
        };
    } catch (e) { console.warn('Minimap init failed:', e); }
}
initMinimap(workspace);

// 5. 初始化介面 i18n
function applyI18n() {
    // 處理一般文字
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (Blockly.Msg[key]) el.textContent = Blockly.Msg[key];
    });
    // 處理 Tooltip Title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (Blockly.Msg[key]) el.title = Blockly.Msg[key];
    });
}

// 介面控制助手
window.WaveCodeUI = {
    setUpdateStatus: function(state) {
        const btn = document.getElementById('update-btn');
        const icon = btn.querySelector('.update-icon');
        if (!btn || !icon) return;
        btn.classList.remove('update-hidden', 'has-update');
        icon.classList.remove('update-spin', 'update-pulse');
        switch (state) {
            case 'checking':
                btn.classList.remove('update-hidden');
                icon.classList.add('update-spin');
                btn.setAttribute('data-i18n-title', 'WAVECODE_UPDATE_CHECK');
                break;
            case 'available':
                btn.classList.add('has-update');
                icon.classList.add('update-pulse');
                btn.setAttribute('data-i18n-title', 'WAVECODE_UPDATE_AVAILABLE');
                break;
            case 'downloading':
                btn.classList.remove('update-hidden');
                icon.classList.add('update-spin');
                btn.setAttribute('data-i18n-title', 'WAVECODE_UPDATE_DOWNLOADING');
                break;
            case 'ready':
                btn.classList.add('has-update');
                btn.setAttribute('data-i18n-title', 'WAVECODE_UPDATE_READY');
                break;
            case 'hidden':
            default:
                btn.classList.add('update-hidden');
                break;
        }
        applyI18n(); // 刷新 Title 翻譯
    }
};

// 模擬測試：3 秒後顯示更新可用
setTimeout(() => WaveCodeUI.setUpdateStatus('available'), 3000);

// 語系切換邏輯
async function setLanguage(lang) {
    console.log(`切換語系至: ${lang}`);
    const loadScript = (url) => new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        document.head.appendChild(script);
    });
    await loadScript(`/lib/zh-hant.js`);
    await loadScript(`/src/lang/${lang}.js`);
    applyI18n();
    workspace.updateToolbox(toolbox);
    workspace.getAllBlocks(false).forEach(block => {
        if (block.rendered) { block.unrender(); block.render(); }
    });
}

document.getElementById('lang-selector').addEventListener('change', (e) => {
    setLanguage(e.target.value);
});

applyI18n();

// 6. 建立預設積木
const startBlock = workspace.newBlock('audio_play_sine');
startBlock.initSvg(); startBlock.render(); startBlock.moveBy(50, 50);

// --- 通訊邏輯 ---
const invoke = window.__TAURI__ ? window.__TAURI__.core.invoke : null;

window.WaveCode = {
    setFrequency: async (freq) => {
        console.log(`播放頻率: ${freq}`);
        if (invoke) await invoke('set_frequency', { freq: parseFloat(freq) });
    },
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    stop: async () => {
        if (invoke) await invoke('stop_audio');
    }
};

// 工具列按鈕事件監聽
document.getElementById('run-btn').addEventListener('click', async () => {
    console.log('開始執行旋律...');
    Blockly.JavaScript.init(workspace);
    const code = Blockly.JavaScript.workspaceToCode(workspace);
    try {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const executeLogic = new AsyncFunction(code);
        await executeLogic();
    } catch (err) { console.error('程式執行錯誤:', err); }
});

document.getElementById('stop-btn').addEventListener('click', async () => {
    await WaveCode.stop();
});

document.getElementById('new-btn').addEventListener('click', () => {
    if (confirm('確定要建立新專案嗎？未儲存的變更將會遺失。')) {
        workspace.clear();
        const startBlock = workspace.newBlock('audio_play_sine');
        startBlock.initSvg(); startBlock.render(); startBlock.moveBy(50, 50);
    }
});

document.getElementById('examples-btn').addEventListener('click', () => {
    alert('範例專案功能即將推出！');
});

document.getElementById('open-btn').addEventListener('click', () => {
    alert('開啟專案功能即將推出！');
});

document.getElementById('save-btn').addEventListener('click', () => {
    alert('儲存專案功能即將推出！');
});

document.getElementById('settings-btn').addEventListener('click', () => {
    alert('系統設定功能即將推出！');
});

// 視窗調整自動刷新
window.addEventListener('resize', () => Blockly.svgResize(workspace));
setTimeout(() => Blockly.svgResize(workspace), 200);
