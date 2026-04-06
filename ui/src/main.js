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
WaveCodeAPI.mdiManager = mdiManager; // 讓 KeyboardController 能全域存取工作區

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
        if (!workspace || workspace.isDragging()) return;
        
        // 【關鍵修復】取得正確的產生器實例並初始化，防止 CodeGenerator init 報錯
        const generator = (window.javascript && window.javascript.javascriptGenerator) || Blockly.JavaScript;
        if (generator && generator.init) {
            generator.init(workspace);
            let code = generator.workspaceToCode(workspace);
            const codeEl = document.getElementById('generated-code');
            if (codeEl) {
                // 先轉義基本的 HTML 字元
                let html = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

                // 1. 處理註解 (最優先，防止內部的字元被高亮)
                html = html.replace(/(\/\/.*)/g, '<span class="code-comment">$1</span>');

                // 2. 處理字串
                html = html.replace(/("(.*?)")/g, '<span class="code-string">$1</span>');

                // 3. 處理關鍵字 (使用 \b 確保只匹配完整單字，且此時 class="code-string" 的引號不會被抓到)
                html = html.replace(/\b(Instrument|MasterOut|Perform|OnInit|Oscillator|ADSR|Volume|Sampler|Filter|Delay|BitCrush|Distortion|Compressor)\b/g, '<span class="code-keyword">$1</span>');

                // 4. 處理數值與單位 (支援小數、負數、以及帶單位的數字如 500ms, -12dB)
                html = html.replace(/(-?\d+\.?\d*(?:ms|s|Hz|%|dB)?)/g, '<span class="code-number">$1</span>');

                codeEl.innerHTML = html || '<span class="code-comment">// 尚未編寫積木...</span>';
            }
        }
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

// --- 6. 背景預加載音訊引擎 ---
setTimeout(() => {
    if (WaveCodeAPI && WaveCodeAPI.AudioManager) {
        WaveCodeAPI.AudioManager.init().catch(err => {
            console.warn("WaveCode: 背景初始化音訊失敗 (可能需要使用者點擊頁面後才能啟動)", err);
        });
    }
}, 1000);
