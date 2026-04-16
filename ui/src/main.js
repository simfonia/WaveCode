/**
 * WaveCode IDE - 前端主程式 (對齊 #nyx 架構)
 */
import './preinit.js';
import './style.css';
import './lang/zh-hant.js';

// --- 模組化積木與產生器 ---
import './blocks/audio_instruments.js';
import './blocks/audio_performance.js';
import './blocks/events.js';
import './blocks/text.js';

import './generators/javascript/audio_instruments.js';
import './generators/javascript/audio_performance.js';
import './generators/javascript/events.js';
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
        'audio_blocks': { 'colourPrimary': '#E67E22' },
        'procedure_blocks': { 'colourPrimary': Blockly.Msg['FUNCTIONS_HUE'] || '#d22f73' }
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

toolbarManager.onWorkspaceChanged = (e) => {
    // 1. 嚴格過濾無效事件 (如視角變動、點擊、選取、或是 UI 工具列觸發的 UI 事件)
    if (!e || e.type === Blockly.Events.VIEWPORT_CHANGE || 
              e.type === Blockly.Events.SELECTED || 
              e.type === Blockly.Events.CLICK || 
              e.type === Blockly.Events.THEME_CHANGE ||
              e.isUiEvent) {
        return;
    }

    // 2. 更新 Live Code (包含結構與數值變動)
    if (e.type === Blockly.Events.BLOCK_CREATE || 
        e.type === Blockly.Events.BLOCK_DELETE || 
        e.type === Blockly.Events.BLOCK_MOVE || 
        e.type === Blockly.Events.BLOCK_CHANGE) {
        debouncedUpdateLiveCode();
    }

    // 3. 只有「結構性或屬性變動」才觸發孤兒檢測、鍵盤樂器標記與 MDI 狀態同步
    if (e.type === Blockly.Events.BLOCK_CREATE || 
        e.type === Blockly.Events.BLOCK_DELETE || 
        e.type === Blockly.Events.BLOCK_MOVE ||
        e.type === Blockly.Events.BLOCK_CHANGE) {
        
        // 孤兒檢測依然只針對結構變動以節省效能
        if (e.type !== Blockly.Events.BLOCK_CHANGE) {
            debouncedOrphanUpdate();
        }
        
        // 鍵盤控制器標記 Dirty (包含改名等屬性變動)
        KeyboardController.setDirty();
    }
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
                // --- DSL 視覺轉譯 (僅影響顯示，不影響執行) ---
                
                // 1. 將 JS 呼叫轉為 DSL 風格 (使用 [ \t]* 處理可能的縮排)
                code = code.replace(/^[ \t]*await WaveCode\.playNote\((.*?), (.*?), "(.*?)"\);/gm, '  play_note(note: $1, dur: $2ms, inst: "$3");');
                code = code.replace(/^[ \t]*await WaveCode\.wait\((.*?)\);/gm, '  sleep($1ms);');
                code = code.replace(/^[ \t]*await WaveCode\.setBPM\((.*?)\);/gm, '  set_bpm($1);');
                code = code.replace(/^[ \t]*await WaveCode\.setCurrentInstrument\("(.*?)"\);/gm, '  select_instrument("$1");');
                code = code.replace(/^[ \t]*await WaveCode\.playMelody\("(.*?)", "(.*?)"\);/gm, '  play_melody("$1", inst: "$2");');
                code = code.replace(/^[ \t]*await WaveCode\.defineChord\("(.*?)", "(.*?)"\);/gm, '  define_chord("$1", notes: "$2");');
                code = code.replace(/^[ \t]*await WaveCode\.playChord\("(.*?)", (.*?), "(.*?)"\);/gm, '  play_chord("$1", dur: $2ms, inst: "$3");');
                code = code.replace(/^[ \t]*WaveCode\.stopAudio\(\);/gm, '  panic_stop();');
                
                // 2. 將註解組件轉為 DSL 結構，並移除所有隱藏的註解符號
                code = code.replace(/^\/\/ Instrument\("(.*?)"\) \{/gm, 'Instrument("$1") {');
                code = code.replace(/^\/\/ MasterOut \{/gm, 'MasterOut {');
                code = code.replace(/^[ \t]*\/\/ \};/gm, '}');
                code = code.replace(/^[ \t]*\/\/ >> (.*)/gm, '  >> $1');
                // 移除樂器鏈內部的 // 符號，但保留一般註解
                code = code.replace(/^[ \t]*\/\/[ \t]+>>/gm, '  >>');

                // 3. 處理結構化區塊 (將 AsyncFunction 的大括號與 Perform 映射)
                // 如果代碼包含關鍵字但沒有外層，幫它補上視覺上的 Perform 區塊
                if (code.includes('play_note') || code.includes('sleep') || code.includes('play_melody')) {
                    if (!code.includes('Perform {')) {
                        code = `Perform {\n${code}\n}`;
                    }
                }

                // 4. 先轉義基本的 HTML 字元
                let html = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

                // 5. 處理註解
                html = html.replace(/(\/\/.*)/g, '<span class="code-comment">$1</span>');

                // 6. 處理字串
                html = html.replace(/("(.*?)")/g, '<span class="code-string">$1</span>');

                // 7. 處理關鍵字
                html = html.replace(/\b(Instrument|MasterOut|Perform|OnInit|Oscillator|ADSR|Volume|Sampler|Filter|Delay|BitCrush|Distortion|Compressor|play_note|sleep|set_bpm|select_instrument|play_melody|panic_stop)\b/g, '<span class="code-keyword">$1</span>');

                // 8. 處理數值與單位
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
    }, 500); // 增加延遲至 500ms
}

// --- 5. 系統啟動 ---
setTimeout(async () => {
    mdiManager.addNewTab("未命名專案", true);
    Updater.check();
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
