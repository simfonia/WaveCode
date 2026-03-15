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
    document.title = `${dirty ? '*' : ''}${displayFilename} - WaveCode`;
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
const GITHUB_REPO = "https://github.com/simfonia/WaveCode";
const CURRENT_VERSION = "0.1.0";

async function checkUpdate(manual = false) {
    const btn = document.getElementById('update-btn');
    const img = btn.querySelector('img');
    if (!btn || !img) return;

    // --- 階段 1：檢查中 ---
    updateStatus = 'checking';
    btn.classList.remove('update-hidden', 'update-bounce-pulse');
    btn.classList.add('update-spin-ccw');
    img.src = "/icons/sync_24dp_EA3323.png";
    btn.title = "正在檢查更新...";

    try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 模擬檢查結果：手動按則模擬發現更新，自動則模擬最新
        const hasUpdate = manual; 

        if (hasUpdate) {
            // --- 階段 2：發現新版本 ---
            updateStatus = 'available';
            btn.classList.remove('update-spin-ccw');
            btn.classList.add('update-bounce-pulse');
            img.src = "/icons/cloud_download_24dp_FE2F89.png";
            btn.title = `發現新版本！點擊前往下載 (目前: ${CURRENT_VERSION})`;
        } else {
            // --- 階段 3：目前已是最新 ---
            updateStatus = 'latest';
            btn.classList.remove('update-spin-ccw', 'update-bounce-pulse');
            img.src = "/icons/published_with_changes_24dp_75FB4C.png";
            btn.title = `WaveCode 已是最新版本 (${CURRENT_VERSION})`;
            
            // 如果是自動檢查，3秒後隱藏；如果是手動檢查，則保持顯示 10 秒
            if (!manual) {
                setTimeout(() => { if(updateStatus === 'latest') btn.classList.add('update-hidden'); }, 3000);
            }
        }
    } catch (e) { 
        btn.classList.add('update-hidden'); 
    }
}

document.getElementById('update-btn').addEventListener('click', () => {
    if (updateStatus === 'available') {
        window.open(`${GITHUB_REPO}/releases`, '_blank');
    } else if (updateStatus === 'latest') {
        window.open(GITHUB_REPO, '_blank');
    } else if (updateStatus === 'hidden' || updateStatus === 'latest') {
        checkUpdate(true);
    }
});

setTimeout(() => checkUpdate(false), 1000);

// --- 7. 系統設定選單 ---
let currentLang = 'zh-hant';
const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.createElement('div');
settingsMenu.className = 'dropdown-menu';
settingsMenu.id = 'settings-menu';
settingsMenu.innerHTML = `
    <div class="dropdown-item" id="restart-audio-item">
        <img src="/icons/rocket_launch_24dp_FE2F89.png">
        <span data-i18n="WAVECODE_RESTART_AUDIO">重啟音訊</span>
    </div>
    <div class="dropdown-item has-submenu">
        <div style="display: flex; align-items: center; gap: 10px;">
            <img src="/icons/language_24dp_FE2F89.png">
            <span data-i18n="WAVECODE_LANG_SETTING">語言設定</span>
        </div>
        <span>▸</span>
        <div class="submenu">
            <div class="dropdown-item lang-item" data-lang="zh-hant" style="justify-content: flex-start;">
                <span class="lang-check" style="width: 24px;"></span>
                <span>正體中文</span>
            </div>
            <div class="dropdown-item lang-item" data-lang="en" style="justify-content: flex-start;">
                <span class="lang-check" style="width: 24px;"></span>
                <span>English</span>
            </div>
        </div>
    </div>
`;
document.body.appendChild(settingsMenu);

function updateLangCheck(lang) {
    document.querySelectorAll('.lang-check').forEach(el => {
        el.innerHTML = '';
    });
    const selectedEl = document.querySelector(`.lang-item[data-lang="${lang}"] .lang-check`);
    if (selectedEl) {
        selectedEl.innerHTML = `<img src="/icons/done_24dp_FE2F89.png" style="width: 16px; height: 16px;">`;
    }
}
updateLangCheck(currentLang);

settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = settingsBtn.getBoundingClientRect();
    settingsMenu.style.top = `${rect.bottom + 5}px`;
    settingsMenu.style.left = `${rect.left - 120}px`; 
    settingsMenu.classList.toggle('show');
});

document.addEventListener('click', () => {
    settingsMenu.classList.remove('show');
});

document.getElementById('restart-audio-item').addEventListener('click', async () => {
    settingsMenu.classList.remove('show');
    await WaveCodeAPI.restartAudio();
});

function switchLanguage(lang) {
    if (currentLang === lang) {
        settingsMenu.classList.remove('show');
        return;
    }
    currentLang = lang;
    updateLangCheck(lang);
    settingsMenu.classList.remove('show');
    
    const scriptId = 'lang-script';
    let script = document.getElementById(scriptId);
    if (script) script.remove();
    script = document.createElement('script');
    script.id = scriptId; 
    script.src = `/src/lang/${lang}.js`;
    script.onload = () => {
        applyI18n(); 
        setDirty(isDirty);
        if (workspace.getToolbox()) workspace.updateToolbox(WaveCodeToolbox);
    };
    document.body.appendChild(script);
}

document.querySelectorAll('.lang-item').forEach(item => {
    item.addEventListener('click', (e) => {
        switchLanguage(e.currentTarget.dataset.lang);
    });
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
