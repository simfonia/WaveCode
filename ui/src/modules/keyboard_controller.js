/**
 * WaveCode Keyboard Controller - 電腦鍵盤演奏模組 (對齊 SynthBlockly Stage)
 */
import { WaveCodeAPI } from './api.js';
import { EnvelopeManager } from './visualizer.js';

// MIDI Note to Frequency (A4 = 440Hz)
const mtof = (note) => 440 * Math.pow(2, (note - 69) / 12);

const KEY_MAP = {
    // 第一行：白鍵與黑鍵交錯
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
    '=': 78, // F#5
    ']': 79, // G5
    '\\': 81 // A5
};

export const KeyboardController = {
    activeVoices: new Map(), // key -> voiceIndex
    transpose: 0,
    enabled: true,

    init: () => {
        window.addEventListener('keydown', KeyboardController.handleKeyDown);
        window.addEventListener('keyup', KeyboardController.handleKeyUp);
        if (window.LogManager) window.LogManager.appendLog("WaveCode: 鍵盤演奏模式已啟動");
    },

    handleKeyDown: async (e) => {
        if (KeyboardController.isTyping()) return;
        
        const key = e.key.toLowerCase();

        // 處理位移指令
        if (e.key === 'ArrowUp') {
            e.preventDefault(); // 防止日誌或頁面捲動
            KeyboardController.transpose += 12;
            if (window.LogManager) window.LogManager.appendLog(`Transpose: +12 (目前總值: ${KeyboardController.transpose})`, 'info');
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            KeyboardController.transpose -= 12;
            if (window.LogManager) window.LogManager.appendLog(`Transpose: -12 (目前總值: ${KeyboardController.transpose})`, 'info');
            return;
        }
        if (e.key === '=' || e.key === '+') {
            e.preventDefault();
            KeyboardController.transpose += 1;
            if (window.LogManager) window.LogManager.appendLog(`Transpose: +1 (目前總值: ${KeyboardController.transpose})`, 'info');
            return;
        }
        if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            KeyboardController.transpose -= 1;
            if (window.LogManager) window.LogManager.appendLog(`Transpose: -1 (目前總值: ${KeyboardController.transpose})`, 'info');
            return;
        }
        if (e.key === 'Backspace') {
            e.preventDefault();
            KeyboardController.transpose = 0;
            if (window.LogManager) window.LogManager.appendLog(`Transpose: Reset (目前總值: 0)`, 'info');
            return;
        }

        // 處理演奏按鍵
        if (KEY_MAP[key] && !KeyboardController.activeVoices.has(key)) {
            e.preventDefault(); // 演奏時也防止按鍵產生預設行為
            const midiNote = KEY_MAP[key] + KeyboardController.transpose;
            const freq = mtof(midiNote);
            const invoke = WaveCodeAPI.getInvoke();
            if (!invoke) return;

            try {
                const instId = KeyboardController.getActiveInstrumentId();
                
                // --- 視覺觸發：StartHold ---
                if (window.EnvelopeManager) {
                    window.EnvelopeManager.triggerStart(instId);
                }

                if (window.LogManager) window.LogManager.appendLog(`Note ON: ${midiNote} (${freq.toFixed(2)} Hz) [${instId}]`, 'info');

                const voiceIndex = await invoke('trigger_note', { 
                    freq: parseFloat(freq),
                    instId: instId
                });
                KeyboardController.activeVoices.set(key, voiceIndex);
            } catch (err) {
                console.error("鍵盤觸發錯誤:", err);
            }
        }
    },

    handleKeyUp: async (e) => {
        const key = e.key.toLowerCase();
        if (KeyboardController.activeVoices.has(key)) {
            const voiceIndex = KeyboardController.activeVoices.get(key);
            const invoke = WaveCodeAPI.getInvoke();
            const instId = KeyboardController.getActiveInstrumentId();

            // --- 視覺結束：EndHold (進入 Release) ---
            if (window.EnvelopeManager) {
                window.EnvelopeManager.triggerEnd(instId);
            }

            if (invoke) {
                await invoke('release_note', { index: voiceIndex });
            }
            KeyboardController.activeVoices.delete(key);
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
        return keys.length > 0 ? keys[0] : 'default';
    }
};
