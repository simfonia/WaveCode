/**
 * WaveCode Keyboard Controller - 電腦鍵盤演奏模組 (對齊 HarmoNyx #nyx 標準)
 */
import { WaveCodeAPI } from './api.js';

// MIDI Note to Frequency (A4 = 440Hz)
const mtof = (note) => 440 * Math.pow(2, (note - 69) / 12);

// #nyx 標準對應：Q 鍵排與數字鍵排交錯模擬黑白鍵
const KEY_MAP = {
    'q': 60, // C4
    '2': 61, // C#4
    'w': 62, // D4
    '3': 63, // D#4
    'e': 64, // E4
    'r': 65, // F4
    '5': 66, // F#4
    't': 67, // G4
    '6': 68, // G#4
    'y': 69, // A4
    '7': 70, // A#4
    'u': 71, // B4
    'i': 72, // C5
    '9': 73, // C#5
    'o': 74, // D5
    '0': 75, // D#5
    'p': 76, // E5
    '[': 77, // F5
    ']': 79, // G5
    '\\': 81 // A5
};

export const KeyboardController = {
    activeVoices: new Map(), // key -> freq
    transpose: 0,
    runCallback: null,
    stopCallback: null,

    init: (runCallback, stopCallback) => {
        if (runCallback) KeyboardController.runCallback = runCallback;
        if (stopCallback) KeyboardController.stopCallback = stopCallback;
        window.addEventListener('keydown', KeyboardController.handleKeyDown);
        window.addEventListener('keyup', KeyboardController.handleKeyUp);
        window.addEventListener('blur', () => KeyboardController.stopAll());
        console.log("WaveCode: 鍵盤演奏模式已啟動 (對齊 HarmoNyx #nyx 標準)");
    },

    /**
     * 統一印出移調日誌
     */
    logTranspose: () => {
        const val = KeyboardController.transpose;
        const oct = (val / 12).toFixed(1).replace('.0', '');
        const sign = val > 0 ? '+' : '';
        const msg = `Transpose: ${sign}${val} (${oct} Octaves)`;
        if (window.LogManager) window.LogManager.appendLog(msg, 'info');
    },

    handleKeyDown: async (e) => {
        const isTyping = KeyboardController.isTyping();
        
        // --- 0. 快速鍵優先 (Ctrl + Enter / Escape) ---
        if (e.ctrlKey && e.key === 'Enter') {
            if (KeyboardController.runCallback) {
                e.preventDefault();
                KeyboardController.runCallback();
            }
            return;
        }

        if (e.key === 'Escape') {
            if (KeyboardController.stopCallback) {
                e.preventDefault();
                KeyboardController.stopCallback();
            }
            return;
        }

        if (isTyping) return;
        
        const key = e.key.toLowerCase();

        // 1. 處理移調指令 (#nyx 規格)
        if (e.key === 'ArrowUp') {
            KeyboardController.transpose += 12;
            KeyboardController.logTranspose();
            return;
        }
        if (e.key === 'ArrowDown') {
            KeyboardController.transpose -= 12;
            KeyboardController.logTranspose();
            return;
        }
        if (e.key === '=' || e.key === '+') {
            KeyboardController.transpose += 1;
            KeyboardController.logTranspose();
            return;
        }
        if (e.key === '-' || e.key === '_') {
            KeyboardController.transpose -= 1;
            KeyboardController.logTranspose();
            return;
        }
        if (e.key === 'Backspace') {
            KeyboardController.transpose = 0;
            if (window.LogManager) window.LogManager.appendLog(`Transpose: Reset (0)`, 'info');
            return;
        }

        if (e.repeat) return;

        // 2. 處理演奏按鍵
        if (KEY_MAP[key] && !KeyboardController.activeVoices.has(key)) {
            const midiNote = KEY_MAP[key] + KeyboardController.transpose;
            const freq = mtof(midiNote);
            const instId = KeyboardController.getActiveInstrumentId();

            try {
                if (window.EnvelopeManager) window.EnvelopeManager.triggerStart(instId);
                
                // 觸發音訊引擎 (startTime=0 代表立即)
                await WaveCodeAPI.triggerNote(freq, instId, 0);
                KeyboardController.activeVoices.set(key, freq);

            } catch (err) {
                console.error("鍵盤觸發錯誤:", err);
            }
        }
    },

    handleKeyUp: async (e) => {
        const key = e.key.toLowerCase();
        if (KeyboardController.activeVoices.has(key)) {
            const freq = KeyboardController.activeVoices.get(key);
            const instId = KeyboardController.getActiveInstrumentId();

            if (window.EnvelopeManager) window.EnvelopeManager.triggerEnd(instId);

            // 釋放音訊引擎 (startTime=0 代表立即)
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
        const isInput = tagName === 'input' || tagName === 'textarea' || el.isContentEditable || el.classList.contains('blocklyHtmlInput');
        if (el.type === 'range') return false;
        return isInput;
    },

    getActiveInstrumentId: () => {
        const keys = Object.keys(WaveCodeAPI._instruments);
        return keys.length > 0 ? keys[0] : 'my_piano';
    }
};
