/**
 * WaveCode Keyboard Controller - 索引修復與詳細日誌版
 */
import { WaveCodeAPI } from './api.js';
import { WaveCodeCompiler } from './compiler.js';

const mtof = (note) => 440 * Math.pow(2, (note - 69) / 12);

/**
 * MIDI 編號轉音名 (例如 60 -> C4)
 */
const midiToNoteName = (midi) => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const name = notes[midi % 12];
    return `${name}${octave}`;
};

const KEY_MAP = {
    'q': 60, '2': 61, 'w': 62, '3': 63, 'e': 64, 'r': 65, '5': 66, 't': 67, '6': 68, 'y': 69, '7': 70, 'u': 71,
    'i': 72, '9': 73, 'o': 74, '0': 75, 'p': 76, '[': 77, ']': 79, '\\': 81
};

export const KeyboardController = {
    activeVoices: new Map(), 
    transpose: 0,
    instrumentIndex: 0, 
    runCallback: null,
    stopCallback: null,
    _initialized: false,

    init: (runCallback, stopCallback) => {
        if (KeyboardController._initialized) return;
        
        if (runCallback) KeyboardController.runCallback = runCallback;
        if (stopCallback) KeyboardController.stopCallback = stopCallback;
        
        window.addEventListener('keydown', KeyboardController.handleKeyDown, true);
        window.addEventListener('keyup', KeyboardController.handleKeyUp, true);
        window.addEventListener('blur', () => KeyboardController.stopAll());
        
        window.addEventListener('mdi-tab-changed', () => {
            // 1. 立即停止所有音頻並清空按鍵追蹤，徹底解決掛留音問題
            KeyboardController.stopAll();
            KeyboardController.activeVoices.clear();
            
            // 2. 延時刷新新分頁的樂器清單 (雙重保險以對位 Workspace 載入)
            setTimeout(() => KeyboardController.refreshInstruments(true), 100);
            setTimeout(() => KeyboardController.refreshInstruments(true), 500);
        });

        setTimeout(() => KeyboardController.refreshInstruments(true), 1000);
        KeyboardController._initialized = true;
    },

    refreshInstruments: (shouldResetIndex = false) => {
        const mdi = WaveCodeAPI.mdiManager || (window.WaveCode && window.WaveCode.mdiManager);
        const workspace = mdi ? mdi.getActiveWorkspace() : null;
        if (!workspace) return;

        const configs = WaveCodeCompiler.scanInstruments(workspace);
        WaveCodeAPI.setInstruments(configs);

        const keys = Object.keys(WaveCodeAPI._instruments);
        if (keys.length > 0) {
            if (shouldResetIndex) KeyboardController.instrumentIndex = 0;
            else if (KeyboardController.instrumentIndex >= keys.length) KeyboardController.instrumentIndex = 0;
            
            const instId = keys[KeyboardController.instrumentIndex];
            WaveCodeAPI.setCurrentInstrument(instId);
            if (window.Oscilloscope) window.Oscilloscope.setSelectedInstrument(instId);
        } else {
            if (window.Oscilloscope) window.Oscilloscope.setSelectedInstrument('none');
        }
    },

    /**
     * 補全移調日誌：加入八度換算
     */
    logTranspose: () => {
        const val = KeyboardController.transpose;
        const oct = Math.floor(Math.abs(val) / 12);
        const semi = Math.abs(val) % 12;
        const sign = val >= 0 ? '+' : '-';
        
        let msg = `Transpose: ${val > 0 ? '+' : ''}${val} Semi`;
        if (oct > 0) {
            msg = `Transpose: ${sign}${oct} Oct, ${sign}${semi} Semi (${val > 0 ? '+' : ''}${val})`;
        }
        if (val === 0) msg = "Transpose: Reset (0)";
        
        if (window.LogManager) window.LogManager.appendLog(msg, 'info');
    },

    switchInstrument: (delta) => {
        KeyboardController.refreshInstruments(false);
        const keys = Object.keys(WaveCodeAPI._instruments);
        const len = keys.length;
        if (len === 0) return;

        KeyboardController.instrumentIndex = (KeyboardController.instrumentIndex + delta + len) % len;
        const instId = keys[KeyboardController.instrumentIndex];
        WaveCodeAPI.setCurrentInstrument(instId);
        
        if (window.Oscilloscope) window.Oscilloscope.setSelectedInstrument(instId);
        if (window.LogManager) window.LogManager.appendLog(`Keyboard: [${instId}]`, 'info');
    },

    _globalClipboard: null,

    handleKeyDown: async (e) => {
        const isTyping = KeyboardController.isTyping();
        
        // --- 1. 跨分頁複製貼上處理 ---
        if ((e.ctrlKey || e.metaKey) && !isTyping) {
            const mdi = window.WaveCode.mdiManager;
            const workspace = mdi ? mdi.getActiveWorkspace() : null;
            if (!workspace) return;

            // Ctrl + C (複製)
            if (e.key === 'c' || e.key === 'C') {
                // 【關鍵修正】如果目前有選取文字，優先允許複製文字而非積木
                const textSelection = window.getSelection().toString();
                if (textSelection && textSelection.length > 0) {
                    return; // 讓事件冒泡給瀏覽器進行文字複製
                }

                const selected = Blockly.common.getSelected();
                if (selected) {
                    const xml = Blockly.Xml.blockToDom(selected);
                    KeyboardController._globalClipboard = Blockly.Xml.domToText(xml);
                    if (window.LogManager) window.LogManager.appendLog("Block copied to global clipboard.", "info");
                    
                    // 攔截事件防止內建複製
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }
                return;
            }
            // Ctrl + V (貼上)
            if (e.key === 'v' || e.key === 'V') {
                if (KeyboardController._globalClipboard) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    
                    try {
                        const xml = (Blockly.utils && Blockly.utils.xml) ? 
                                    Blockly.utils.xml.textToDom(KeyboardController._globalClipboard) : 
                                    Blockly.Xml.textToDom(KeyboardController._globalClipboard);
                        const block = Blockly.Xml.domToBlock(xml, workspace);
                        block.moveBy(20, 20);
                        block.select();
                        if (window.LogManager) window.LogManager.appendLog("Block pasted from global clipboard.", "info");
                    } catch (err) {
                        console.warn("Global paste failed:", err);
                    }
                }
                return;
            }
        }

        if (e.ctrlKey && e.key === 'Enter') {
            if (document.activeElement) document.activeElement.blur();
            if (KeyboardController.runCallback) { e.preventDefault(); e.stopImmediatePropagation(); KeyboardController.runCallback(); }
            return;
        }
        if (e.key === 'Escape') {
            if (KeyboardController.stopCallback) { e.preventDefault(); e.stopImmediatePropagation(); KeyboardController.stopCallback(); }
            return;
        }
        if (isTyping) return;
        
        const key = e.key.toLowerCase();
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '=', '+', '-', '_', 'Backspace'].includes(e.key) || KEY_MAP[key]) {
            e.stopPropagation(); e.stopImmediatePropagation();
        }

        if (e.key === 'ArrowUp') { KeyboardController.transpose += 12; KeyboardController.logTranspose(); return; }
        if (e.key === 'ArrowDown') { KeyboardController.transpose -= 12; KeyboardController.logTranspose(); return; }
        if (e.key === 'ArrowLeft') { KeyboardController.switchInstrument(-1); return; }
        if (e.key === 'ArrowRight') { KeyboardController.switchInstrument(1); return; }
        if (e.key === '=' || e.key === '+') { KeyboardController.transpose += 1; KeyboardController.logTranspose(); return; }
        if (e.key === '-' || e.key === '_') { KeyboardController.transpose -= 1; KeyboardController.logTranspose(); return; }
        if (e.key === 'Backspace') { e.preventDefault(); KeyboardController.transpose = 0; KeyboardController.logTranspose(); return; }

        if (e.repeat) return;
        if (KEY_MAP[key] && !KeyboardController.activeVoices.has(key)) {
            const midiNote = KEY_MAP[key] + KeyboardController.transpose;
            const freq = mtof(midiNote);
            const noteName = midiToNoteName(midiNote);
            const instId = KeyboardController.getActiveInstrumentId();
            
            // --- 補全演奏日誌 ---
            const logMsg = `Play: ${noteName} (MIDI: ${midiNote}, ${freq.toFixed(2)}Hz) [${instId}]`;
            if (window.LogManager) window.LogManager.appendLog(logMsg, 'audio');

            try {
                if (window.EnvelopeManager) window.EnvelopeManager.triggerStart(instId);
                await WaveCodeAPI.triggerNote(freq, instId, 0);
                KeyboardController.activeVoices.set(key, { freq, instId });
            } catch (err) {}
        }
    },

    handleKeyUp: async (e) => {
        const key = e.key.toLowerCase();
        if (KeyboardController.activeVoices.has(key)) {
            const voice = KeyboardController.activeVoices.get(key);
            const freq = typeof voice === 'object' ? voice.freq : voice;
            const instId = typeof voice === 'object' ? voice.instId : KeyboardController.getActiveInstrumentId();
            if (window.EnvelopeManager) window.EnvelopeManager.triggerEnd(instId);
            await WaveCodeAPI.releaseNote(freq, 0);
            KeyboardController.activeVoices.delete(key);
        }
    },

    stopAll: () => {
        if (KeyboardController.activeVoices.size > 0) {
            KeyboardController.activeVoices.clear();
            WaveCodeAPI.stopAudio();
            if (window.EnvelopeManager) window.EnvelopeManager.stopAll();
        }
    },

    isTyping: () => {
        const el = document.activeElement;
        if (!el) return false;
        const tagName = el.tagName.toLowerCase();
        return tagName === 'input' || tagName === 'textarea' || el.isContentEditable || el.classList.contains('blocklyHtmlInput');
    },

    getActiveInstrumentId: () => {
        const keys = Object.keys(WaveCodeAPI._instruments);
        if (keys.length === 0) return 'none';
        if (KeyboardController.instrumentIndex >= keys.length) KeyboardController.instrumentIndex = 0;
        return keys[KeyboardController.instrumentIndex];
    }
};
