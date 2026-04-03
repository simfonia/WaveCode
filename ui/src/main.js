/**
 * WaveCode IDE - 前端主程式 (對齊 #nyx 架構)
 */
import './style.css';
import './lang/zh-hant.js';

// --- 模組化積木與產生器 ---
import './blocks/audio_instruments.js';
import './blocks/audio_performance.js';
import './blocks/audio_train.js';
import './blocks/text.js';

import './generators/javascript/audio_instruments.js';
import './generators/javascript/audio_performance.js';
import './generators/javascript/text.js';
import './generators/javascript/system.js';

// --- 核心模組 ---
import { UIUtils } from './modules/ui_utils.js';
import { WaveCodeAPI } from './modules/api.js';
import { WaveCodeCompiler } from './modules/compiler.js';
import { Oscilloscope, EnvelopeManager } from './modules/visualizer.js';
import { WaveCodeToolbox } from './modules/toolbox.js';
import { KeyboardController } from './modules/keyboard_controller.js';
import { MDIManager } from './modules/mdi_manager.js';
import { ToolbarManager } from './modules/toolbar_manager.js';
import { Updater } from './modules/updater.js';

// --- 0. 基礎初始化 ---
UIUtils.injectNaNShield();
const stageUI = UIUtils.initStagePanel();
Oscilloscope.init('waveformCanvas');
KeyboardController.init();

// --- 1. 註冊 Blockly 插件 ---
if (window.FieldMultilineInput) Blockly.fieldRegistry.register('field_multilinetext', window.FieldMultilineInput);
if (window.FieldColour) Blockly.fieldRegistry.register('field_colour', window.FieldColour);

const ScrollOptionsPlugin = window.ScrollOptions || (window.ScrollOptionsPlugin && window.ScrollOptionsPlugin.ScrollOptions);
const scrollDragger = window.ScrollBlockDragger || (ScrollOptionsPlugin ? ScrollOptionsPlugin.ScrollBlockDragger : undefined);
const scrollMetrics = window.ScrollMetricsManager || (ScrollOptionsPlugin ? ScrollOptionsPlugin.ScrollMetricsManager : undefined);

// --- 2. 定義主題 ---
const waveCodeTheme = Blockly.Theme.defineTheme('wavecode_theme', {
    'base': Blockly.Themes.Classic,
    'blockStyles': { 
        'audio_blocks': { 'colourPrimary': '#E67E22' } 
    },
    'componentStyles': { 
        'workspaceBackgroundColour': '#050505', 
        'toolboxBackgroundColour': '#1a1a20' 
    }
});

const blocklyOptions = {
    toolbox: WaveCodeToolbox,
    grid: { spacing: 20, length: 3, colour: '#222', snap: true },
    zoom: { controls: true, wheel: true, startScale: 1.0 },
    move: { scrollbars: true, drag: true, wheel: true },
    theme: waveCodeTheme,
    renderer: 'geras',
    plugins: {
        'blockDragger': scrollDragger,
        'metricsManager': scrollMetrics
    }
};

// --- 3. 初始化管理器 ---
const toolbarManager = new ToolbarManager(null, stageUI);
const mdiManager = new MDIManager(toolbarManager, blocklyOptions);
toolbarManager.mdiManager = mdiManager;

// 曝露全域函式供分頁管理器使用
window.updateVisualHelp = updateVisualHelp;

toolbarManager.onWorkspaceChanged = () => {
    debouncedUpdateLiveCode();
    debouncedOrphanUpdate();
};

// --- 4. 輔助功能監聽 ---
let liveCodeTimeout;
function debouncedUpdateLiveCode() {
    clearTimeout(liveCodeTimeout);
    liveCodeTimeout = setTimeout(() => {
        const workspace = toolbarManager.workspace;
        if (!workspace) return;
        const code = Blockly.JavaScript.workspaceToCode(workspace);
        const codeEl = document.getElementById('generated-code');
        if (codeEl) codeEl.textContent = code;
    }, 500);
}

let orphanTimeout;
function debouncedOrphanUpdate() {
    clearTimeout(orphanTimeout);
    orphanTimeout = setTimeout(() => {
        const workspace = toolbarManager.workspace;
        if (workspace) UIUtils.updateOrphanBlocks(workspace);
    }, 100);
}

async function updateVisualHelp(block, lang) {
    const placeholder = document.getElementById('help-placeholder');
    const content = document.getElementById('block-help-content');
    const titleEl = document.getElementById('help-title');
    const descEl = document.getElementById('help-desc');
    const previewEl = document.getElementById('help-preview');
    if (!placeholder || !content) return;

    if (!block) {
        placeholder.style.display = 'flex';
        content.style.display = 'none';
        return;
    }

    placeholder.style.display = 'none';
    content.style.display = 'block';

    titleEl.innerHTML = `ID: &lt;${block.type}&gt;`;
    
    // WaveCode 目前主要依賴 Tooltip 作為說明
    let tooltip = block.getTooltip();
    if (typeof tooltip === 'function') tooltip = tooltip();
    descEl.innerHTML = tooltip ? tooltip.replace(/\n/g, '<br>') : '<i>(此積木暫無詳細說明)</i>';

    // 如果積木有視覺化 (FieldADSR)，可以在這裡預覽
    previewEl.innerHTML = '';
    const visualField = block.getField('VISUAL');
    if (visualField) {
        // 這裡可以考慮複製一個 SVG 元素過來，但目前先保持空白或顯示圖示
        previewEl.innerHTML = '<img src="/icons/waves_24dp_75FB4C.png" class="nyx-icon-green" style="width:48px; opacity:0.5;">';
    } else {
        previewEl.innerHTML = '<img src="/icons/auto_stories_24dp_FE2F89.png" class="nyx-icon-purple" style="width:48px; opacity:0.5;">';
    }
}

// --- 5. 系統啟動 ---
setTimeout(async () => {
    mdiManager.addNewTab("未命名專案", true);
    Updater.check('0.1.0');
}, 300);

// 監聽 Rust 端的 Log
if (window.__TAURI__ && window.__TAURI__.event) {
    window.__TAURI__.event.listen('processing-log', (e) => {
        stageUI.appendLog(e.payload);
    });
    window.__TAURI__.event.listen('processing-error', (e) => {
        stageUI.appendLog(e.payload, 'error');
    });
}
