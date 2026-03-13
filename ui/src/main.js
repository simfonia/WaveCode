/**
 * WaveCode IDE - 前端主程式 (主進入點)
 */
import './style.css';
import './lang/zh-hant.js';
import './blocks/audio.js';
import './generators/javascript/audio.js';

import { UIUtils } from './modules/ui_utils.js';
import { WaveCodeAPI } from './modules/api.js';
import { WaveCodeCompiler } from './modules/compiler.js';
import { Oscilloscope } from './modules/visualizer.js';
import { WaveCodeToolbox } from './modules/toolbox.js';

// 初始化示波器
Oscilloscope.init('waveformCanvas');

// 注入 NaN 防護盾
UIUtils.injectNaNShield();

const invoke = WaveCodeAPI.getInvoke();

// --- 1. 註冊 Blockly 插件 ---
if (window.FieldMultilineInput) Blockly.fieldRegistry.register('field_multilinetext', window.FieldMultilineInput);
if (window.FieldColour) Blockly.fieldRegistry.register('field_colour', window.FieldColour);

const ScrollOptionsPlugin = window.ScrollOptions || (window.ScrollOptionsPlugin && window.ScrollOptionsPlugin.ScrollOptions);
const scrollDragger = window.ScrollBlockDragger || (ScrollOptionsPlugin ? ScrollOptionsPlugin.ScrollBlockDragger : undefined);
const scrollMetrics = window.ScrollMetricsManager || (ScrollOptionsPlugin ? ScrollOptionsPlugin.ScrollMetricsManager : undefined);

// --- 2. 初始化 Blockly 工作區 ---
const waveCodeTheme = Blockly.Theme.defineTheme('wavecode_theme', {
    'base': Blockly.Themes.Classic,
    'blockStyles': { 'audio_blocks': { 'colourPrimary': '#E67E22', 'colourSecondary': '#D35400', 'colourTertiary': '#A04000' } },
    'componentStyles': { 'workspaceBackgroundColour': '#1e1e1e', 'toolboxBackgroundColour': '#252526', 'scrollbarColour': '#555555' }
});

const blocklyDiv = document.getElementById('blocklyDiv');
const workspace = Blockly.inject(blocklyDiv, {
    toolbox: WaveCodeToolbox,
    grid: { spacing: 20, length: 3, colour: '#333', snap: true },
    zoom: { controls: true, wheel: true, startScale: 1.0 },
    move: { scrollbars: true, drag: true, wheel: true },
    theme: waveCodeTheme,
    plugins: { 'blockDragger': scrollDragger, 'metricsManager': scrollMetrics }
});

// --- 3. 核心功能實作 ---

let isDirty = false;
let currentFilename = '';

function setDirty(dirty) {
    if (workspace.isClearing && dirty) return;
    isDirty = dirty;
    const displayFilename = currentFilename || Blockly.Msg['WAVECODE_UNTITLED'] || '未命名專案';
    document.title = `${dirty ? '*' : ''}${displayFilename} - WaveCode IDE`;
    const statusContainer = document.getElementById('file-status');
    if (statusContainer) {
        document.getElementById('display-filename').textContent = displayFilename;
        dirty ? statusContainer.classList.add('is-dirty') : statusContainer.classList.remove('is-dirty');
    }
}

function createDefaultBlocks() {
    workspace.isClearing = true;
    workspace.clear();
    setTimeout(() => {
        const osc = workspace.newBlock('audio_oscillator');
        osc.initSvg(); osc.render(); osc.moveBy(50, 100);
        const dac = workspace.newBlock('audio_dac');
        dac.initSvg(); dac.render(); dac.moveBy(350, 100);
        try { dac.outputConnection.connect(osc.getInput('NEXT').connection); } catch (e) {}
        setTimeout(() => {
            workspace.isClearing = false;
            setDirty(false);
        }, 100);
    }, 50);
}

const xmlUtils = {
    textToDom: (text) => (Blockly.utils.xml.textToDom ? Blockly.utils.xml.textToDom(text) : Blockly.Xml.textToDom(text)),
    workspaceToDom: (workspace) => Blockly.Xml.workspaceToDom(workspace),
    domToPrettyText: (dom) => Blockly.Xml.domToPrettyText(dom)
};

async function checkUnsavedChanges() {
    if (!isDirty) return true;
    const { ask } = window.__TAURI__.dialog;
    return await ask(Blockly.Msg['MSG_UNSAVED_CHANGES'], { title: Blockly.Msg['MSG_WARNING'], kind: 'warning' });
}

// --- 5. 事件監聽器 ---

document.getElementById('run-btn').addEventListener('click', async () => {
    const runBtn = document.getElementById('run-btn');
    
    // 1. 無論如何先停止舊腳本與音訊
    await WaveCodeAPI.stop();
    
    // 2. 標記為執行中
    runBtn.classList.add('is-running');
    runBtn.title = Blockly.Msg['WAVECODE_STOP'] || '停止';
    
    const currentId = WaveCodeAPI.getCurrentId();
    
    // 3. 編譯與產出代碼
    await WaveCodeCompiler.compileAndRun(workspace);
    Blockly.JavaScript.init(workspace);
    const rawCode = Blockly.JavaScript.workspaceToCode(workspace);
    
    // 4. 注入環境與中斷檢查
    const finalCode = `
        const _id = WaveCode.getCurrentId();
        try {
            ${rawCode}
        } catch (err) {
            if (err !== 'Script cancelled') throw err;
            // console.log('[Runtime] Script gracefully terminated.');
        }
    `;

    try {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const executeLogic = new AsyncFunction(finalCode);
        await executeLogic();
    } catch (err) { 
        if (err !== 'Script cancelled') console.error('腳本執行錯誤:', err); 
    } finally {
        // 只有當目前的 ID 依然是執行時的 ID，才恢復 UI 狀態
        if (currentId === WaveCodeAPI.getCurrentId()) {
            runBtn.classList.remove('is-running');
            runBtn.title = Blockly.Msg['WAVECODE_RUN'] || '執行';
        }
    }
});

document.getElementById('stop-btn').addEventListener('click', async () => {
    await WaveCodeAPI.stop();
    document.getElementById('run-btn').classList.remove('is-running');
    document.getElementById('run-btn').title = Blockly.Msg['WAVECODE_RUN'] || '執行';
});

document.getElementById('new-btn').addEventListener('click', async () => {
    if (await checkUnsavedChanges()) { 
        currentFilename = ''; 
        createDefaultBlocks(); 
    }
});

document.getElementById('save-btn').addEventListener('click', async () => {
    try {
        const lastDir = await invoke('get_last_dir');
        const path = await window.__TAURI__.dialog.save({ filters: [{ name: 'WaveCode', extensions: ['wave'] }], defaultPath: lastDir ? `${lastDir}/${currentFilename || 'project.wave'}` : 'project.wave' });
        if (path) {
            await invoke('save_project', { xmlContent: xmlUtils.domToPrettyText(xmlUtils.workspaceToDom(workspace)), path: path });
            currentFilename = path.split(/[\\/]/).pop(); setDirty(false);
        }
    } catch (e) {}
});

document.getElementById('open-btn').addEventListener('click', async () => {
    if (await checkUnsavedChanges()) {
        try {
            const { open } = window.__TAURI__.dialog;
            const path = await open({ filters: [{ name: 'WaveCode', extensions: ['wave'] }], multiple: false });
            if (path) {
                const content = await invoke('load_project', { path: path });
                workspace.isClearing = true; 
                workspace.clear();
                Blockly.Xml.domToWorkspace(xmlUtils.textToDom(content), workspace);
                currentFilename = path.split(/[\\/]/).pop(); 

                // 強制註冊樂器
                workspace.getBlocksByType('audio_instrument').forEach(b => {
                    const id = b.getFieldValue('ID');
                    const visual = b.getField('VISUAL');
                    if (id && visual && window.EnvelopeManager) {
                        window.EnvelopeManager.register(id, visual);
                        visual.render_();
                    }
                });

                setTimeout(() => {
                    workspace.isClearing = false;
                    setDirty(false);
                }, 100);

            }
        } catch (e) {}
    }
});

document.getElementById('examples-btn').addEventListener('click', async () => {
    if (await checkUnsavedChanges()) {
        try {
            const examplesPath = await invoke('get_examples_path');
            const { open } = window.__TAURI__.dialog;
            const path = await open({ defaultPath: examplesPath, filters: [{ name: 'WaveCode', extensions: ['wave'] }], multiple: false });
            if (path) {
                const content = await invoke('load_project', { path: path });
                workspace.isClearing = true; 
                workspace.clear();
                Blockly.Xml.domToWorkspace(xmlUtils.textToDom(content), workspace);
                currentFilename = path.split(/[\\/]/).pop(); 

                // 強制註冊樂器
                workspace.getBlocksByType('audio_instrument').forEach(b => {
                    const id = b.getFieldValue('ID');
                    const visual = b.getField('VISUAL');
                    if (id && visual && window.EnvelopeManager) {
                        window.EnvelopeManager.register(id, visual);
                        visual.render_();
                    }
                });

                setTimeout(() => {
                    workspace.isClearing = false;
                    setDirty(false);
                }, 100);

            }
        } catch (e) {}
    }
});

// --- 6. 更新系統實作 ---

let updateStatus = 'hidden'; 
async function checkUpdate(manual = false) {
    const btn = document.getElementById('update-btn');
    if (!btn) return;
    updateStatus = 'checking';
    btn.classList.remove('update-hidden');
    btn.classList.add('update-spin');
    btn.title = Blockly.Msg['WAVECODE_UPDATE_CHECK'] || '檢查更新中...';
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const hasUpdate = manual; 
        if (hasUpdate) {
            updateStatus = 'available';
            btn.classList.remove('update-spin');
            btn.classList.add('has-update', 'update-pulse');
            btn.title = Blockly.Msg['WAVECODE_UPDATE_AVAILABLE'] || '有新版本可用';
        } else {
            updateStatus = 'hidden';
            btn.classList.remove('update-spin');
            btn.classList.add('update-hidden');
            if (manual) alert(Blockly.Msg['WAVECODE_UPDATE_NONE'] || '目前已是最新版本');
        }
    } catch (e) { btn.classList.add('update-hidden'); }
}

document.getElementById('update-btn').addEventListener('click', () => {
    if (updateStatus === 'available' || updateStatus === 'ready') { }
    else checkUpdate(true);
});

setTimeout(() => checkUpdate(false), 1000);

// --- 7. 介面 i18n ---

function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (Blockly.Msg[key]) el.textContent = Blockly.Msg[key];
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (Blockly.Msg[key]) el.title = Blockly.Msg[key];
    });
}

document.getElementById('lang-selector').addEventListener('change', (e) => {
    const lang = e.target.value;
    const scriptId = 'lang-script';
    let script = document.getElementById(scriptId);
    if (script) script.remove();
    
    script = document.createElement('script');
    script.id = scriptId;
    script.src = `/src/lang/${lang}.js`;
    script.onload = () => {
        applyI18n();
        setDirty(isDirty);
        if (workspace.getToolbox()) workspace.updateToolbox(toolbox);
    };
    document.body.appendChild(script);
});

applyI18n();

// --- 8. 啟動與初始化 ---

const resizeObserver = new ResizeObserver(() => Blockly.svgResize(workspace));
resizeObserver.observe(blocklyDiv);

setTimeout(() => { 
    Blockly.svgResize(workspace); 
    UIUtils.initMinimap(workspace); 
    setTimeout(createDefaultBlocks, 200);
}, 300);

workspace.addChangeListener((e) => {
    if (workspace.isClearing || e.isUiEvent) return;
    
    const isBlockChange = [
        Blockly.Events.BLOCK_MOVE, 
        Blockly.Events.BLOCK_CREATE, 
        Blockly.Events.BLOCK_CHANGE, 
        Blockly.Events.BLOCK_DELETE, 
        Blockly.Events.VAR_CREATE, 
        Blockly.Events.VAR_RENAME, 
        Blockly.Events.VAR_DELETE
    ].includes(e.type);
    
    if (isBlockChange) {
        setDirty(true);
    }
});
