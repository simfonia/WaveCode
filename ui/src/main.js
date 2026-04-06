/**
 * WaveCode IDE - 前端主程式 (對齊 #nyx 架構)
 */
import './preinit.js';
import './style.css';
import './lang/zh-hant.js';

// --- 模組化積木與產生器 ---
import './blocks/audio_instruments.js';
import './blocks/audio_performance.js';
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
const LogManager = UIUtils.initStagePanel();
window.LogManager = LogManager; // 確保全域可用供產生器與後端監聽使用

Oscilloscope.init('waveformCanvas');

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

// 根據設定決定是否載入捲軸插件 (預設關閉)
const isScrollEnabled = localStorage.getItem('wavecode_scroll_options') === 'true';

const blocklyOptions = {
    toolbox: WaveCodeToolbox,
    grid: { spacing: 20, length: 3, colour: '#222', snap: true },
    zoom: { controls: true, wheel: true, startScale: 1.0 },
    move: { scrollbars: true, drag: true, wheel: true },
    theme: waveCodeTheme,
    renderer: 'geras',
    plugins: isScrollEnabled ? {
        'blockDragger': scrollDragger,
        'metricsManager': scrollMetrics
    } : {}
};

// --- 3. 初始化管理器 ---
const toolbarManager = new ToolbarManager(null, LogManager);
const mdiManager = new MDIManager(toolbarManager, blocklyOptions);
toolbarManager.mdiManager = mdiManager;

// --- 3.1 鍵盤控制器綁定快速鍵 ---
KeyboardController.init(
    () => { if (toolbarManager.elements.runBtn) toolbarManager.elements.runBtn.click(); },
    () => { if (toolbarManager.elements.stopBtn) toolbarManager.elements.stopBtn.click(); }
);

/**
 * 統一開啟說明的處理函式 (保留供右鍵選單使用)
 */
const openBlockHelp = (block) => {
    if (!block || !block.helpUrl) return;
    const url = (typeof block.helpUrl === 'function') ? block.helpUrl() : block.helpUrl;
    const lang = toolbarManager.currentLang;
    const targetUrl = url.startsWith('http') ? url : `${url}_${lang}.html`;
    const invoke = WaveCodeAPI.getInvoke();
    if (invoke) invoke('open_url', { url: targetUrl });
};

// 將 UIUtils 的功能暴露到全域供 MDIManager 使用
window.updateVisualHelp = UIUtils.updateVisualHelp;

toolbarManager.onWorkspaceChanged = () => {
    debouncedUpdateLiveCode();
    debouncedOrphanUpdate();
};

// --- 【關鍵修復】註冊右鍵說明選單 (#nyx 對齊) ---
setTimeout(() => {
    const registry = Blockly.ContextMenuRegistry.registry;
    ['blockHelp', 'help', 'block_help'].forEach(id => { try { registry.unregister(id); } catch (e) {} });
    registry.register({
        displayText: () => '說明',
        preconditionFn: (scope) => (scope.block && scope.block.helpUrl) ? 'enabled' : 'hidden',
        callback: (scope) => {
            const block = scope.block;
            const url = (typeof block.helpUrl === 'function') ? block.helpUrl() : block.helpUrl;
            const lang = toolbarManager.currentLang;
            const targetUrl = url.startsWith('http') ? url : `${url}_${lang}.html`;
            const invoke = WaveCodeAPI.getInvoke();
            if (invoke) invoke('open_url', { url: targetUrl });
        },
        scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
        id: 'wavecode_unique_help',
        weight: 100,
    });
}, 1000);

// --- 4. 輔助功能監聽 ---
let liveCodeTimeout;
function debouncedUpdateLiveCode() {
    clearTimeout(liveCodeTimeout);
    liveCodeTimeout = setTimeout(() => {
        const workspace = toolbarManager.workspace;
        if (!workspace) return;
        
        // 【關鍵修復】確保產生器已初始化，防止 CodeGenerator init 報錯
        Blockly.JavaScript.init(workspace);
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

// --- 5. 系統啟動 ---
setTimeout(async () => {
    mdiManager.addNewTab("未命名專案", true);
    Updater.check('0.1.0');
}, 300);

// 監聽 Rust 端的 Log
if (window.__TAURI__ && window.__TAURI__.event) {
    window.__TAURI__.event.listen('processing-log', (e) => {
        LogManager.appendLog(e.payload);
    });
    window.__TAURI__.event.listen('processing-error', (e) => {
        LogManager.appendLog(e.payload, 'error');
    });
}
