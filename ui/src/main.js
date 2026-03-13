/**
 * WaveCode IDE - 前端主程式 (主進入點)
 */
import './style.css';
import './lang/zh-hant.js';

// --- 模組化積木定義 ---
import './blocks/audio_instruments.js';
import './blocks/audio_performance.js';
import './blocks/audio_train.js';
import './blocks/text.js';

// --- 模組化產生器 ---
import './generators/javascript/audio_instruments.js';
import './generators/javascript/audio_performance.js';
import './generators/javascript/text.js';
import './generators/javascript/system.js';

import { UIUtils } from './modules/ui_utils.js';
import { WaveCodeAPI } from './modules/api.js';
import { WaveCodeCompiler } from './modules/compiler.js';
import { Oscilloscope } from './modules/visualizer.js';
import { WaveCodeToolbox } from './modules/toolbox.js';
import { KeyboardController } from './modules/keyboard_controller.js';

// 初始化示波器
Oscilloscope.init('waveformCanvas');

// 初始化鍵盤演奏
KeyboardController.init();

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
        const inst = workspace.newBlock('audio_instrument');
        inst.setFieldValue('my_piano', 'ID');
        inst.initSvg(); inst.render(); inst.moveBy(50, 50);
        
        // 建立內部組件鏈：Osc -> ADSR -> Vol
        const osc = workspace.newBlock('audio_component_osc');
        osc.initSvg(); osc.render();
        inst.getInput('CHAIN').connection.connect(osc.previousConnection);

        const adsr = workspace.newBlock('audio_component_adsr');
        adsr.initSvg(); adsr.render();
        osc.nextConnection.connect(adsr.previousConnection);

        const vol = workspace.newBlock('audio_component_volume');
        vol.initSvg(); vol.render();
        adsr.nextConnection.connect(vol.previousConnection);

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
    await WaveCodeAPI.stop();
    runBtn.classList.add('is-running');
    runBtn.title = Blockly.Msg['WAVECODE_STOP'] || '停止';
    const currentId = WaveCodeAPI.getCurrentId();
    await WaveCodeCompiler.compileAndRun(workspace);
    Blockly.JavaScript.init(workspace);
    const rawCode = Blockly.JavaScript.workspaceToCode(workspace);
    const finalCode = `
        const _id = WaveCode.getCurrentId();
        try {
            ${rawCode}
        } catch (err) {
            if (err !== 'Script cancelled') throw err;
        }
    `;
    try {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const executeLogic = new AsyncFunction(finalCode);
        await executeLogic();
    } catch (err) { 
        if (err !== 'Script cancelled') console.error('腳本執行錯誤:', err); 
    } finally {
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
    if (await checkUnsavedChanges()) { currentFilename = ''; createDefaultBlocks(); }
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
                workspace.isClearing = true; workspace.clear();
                Blockly.Xml.domToWorkspace(xmlUtils.textToDom(content), workspace);
                currentFilename = path.split(/[\\/]/).pop(); 
                workspace.getBlocksByType('audio_instrument').forEach(b => {
                    const id = b.getFieldValue('ID');
                    const visual = b.getField('VISUAL');
                    if (id && visual && window.EnvelopeManager) {
                        window.EnvelopeManager.register(id, visual);
                        visual.render_();
                    }
                });
                setTimeout(() => { workspace.isClearing = false; setDirty(false); }, 100);
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
                workspace.isClearing = true; workspace.clear();
                Blockly.Xml.domToWorkspace(xmlUtils.textToDom(content), workspace);
                currentFilename = path.split(/[\\/]/).pop(); 
                workspace.getBlocksByType('audio_instrument').forEach(b => {
                    const id = b.getFieldValue('ID');
                    const visual = b.getField('VISUAL');
                    if (id && visual && window.EnvelopeManager) {
                        window.EnvelopeManager.register(id, visual);
                        visual.render_();
                    }
                });
                setTimeout(() => { workspace.isClearing = false; setDirty(false); }, 100);
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
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const hasUpdate = manual; 
        if (hasUpdate) {
            updateStatus = 'available';
            btn.classList.remove('update-spin');
            btn.classList.add('has-update', 'update-pulse');
        } else {
            updateStatus = 'hidden';
            btn.classList.remove('update-spin');
            btn.classList.add('update-hidden');
            if (manual) alert(Blockly.Msg['WAVECODE_UPDATE_NONE'] || '目前已是最新版本');
        }
    } catch (e) { btn.classList.add('update-hidden'); }
}

document.getElementById('update-btn').addEventListener('click', () => {
    if (updateStatus !== 'available') checkUpdate(true);
});

setTimeout(() => checkUpdate(false), 1000);

// --- 7. 系統設定選單 ---
const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.createElement('div');
settingsMenu.className = 'dropdown-menu';
settingsMenu.id = 'settings-menu';
settingsMenu.innerHTML = `
    <div class="dropdown-item" id="restart-audio-item">
        <img src="/icons/published_with_changes_24dp_75FB4C.png">
        <span data-i18n="WAVECODE_RESTART_AUDIO">重啟音訊</span>
    </div>
`;
document.body.appendChild(settingsMenu);

settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = settingsBtn.getBoundingClientRect();
    settingsMenu.style.top = `${rect.bottom + 5}px`;
    settingsMenu.style.left = `${rect.left - 120}px`; // 稍微向左偏移以對齊
    settingsMenu.classList.toggle('show');
});

document.addEventListener('click', () => {
    settingsMenu.classList.remove('show');
});

document.getElementById('restart-audio-item').addEventListener('click', async () => {
    settingsMenu.classList.remove('show');
    await WaveCodeAPI.restartAudio();
});

// --- 8. 介面 i18n ---
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
    script.id = scriptId; script.src = `/src/lang/${lang}.js`;
    script.onload = () => {
        applyI18n(); setDirty(isDirty);
        if (workspace.getToolbox()) workspace.updateToolbox(WaveCodeToolbox);
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
    const isBlockChange = [Blockly.Events.BLOCK_MOVE, Blockly.Events.BLOCK_CREATE, Blockly.Events.BLOCK_CHANGE, Blockly.Events.BLOCK_DELETE, Blockly.Events.VAR_CREATE, Blockly.Events.VAR_RENAME, Blockly.Events.VAR_DELETE].includes(e.type);
    if (isBlockChange) { setDirty(true); }
});
