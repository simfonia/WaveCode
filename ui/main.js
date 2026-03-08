/**
 * WaveCode IDE - 前端主程式
 */

// 1. 定義完整的 Toolbox
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

// 2. 定義主題
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

// 3. 初始化工作區
const blocklyDiv = document.getElementById('blocklyDiv');
const workspace = Blockly.inject(blocklyDiv, {
    toolbox: toolbox,
    grid: { spacing: 20, length: 3, colour: '#333', snap: true },
    zoom: { controls: true, wheel: true, startScale: 1.0 },
    theme: waveCodeTheme
});

// 4. 初始化介面 i18n
function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (Blockly.Msg[key]) el.textContent = Blockly.Msg[key];
    });
}
applyI18n();

// 5. 執行環境 (提供給產出的程式碼呼叫)
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

// 6. 運行按鈕邏輯
document.getElementById('run-btn').addEventListener('click', async () => {
    console.log('開始執行旋律...');
    
    // 生成 JS 程式碼
    Blockly.JavaScript.init(workspace);
    const code = Blockly.JavaScript.workspaceToCode(workspace);
    
    // 包裝成非同步函式並執行
    try {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const executeLogic = new AsyncFunction(code);
        await executeLogic();
        console.log('旋律執行完畢');
    } catch (err) {
        console.error('程式執行錯誤:', err);
    }
});

document.getElementById('stop-btn').addEventListener('click', async () => {
    console.log('手動停止...');
    await WaveCode.stop();
});

// 視窗調整自動刷新
window.addEventListener('resize', () => Blockly.svgResize(workspace));
setTimeout(() => Blockly.svgResize(workspace), 200);
