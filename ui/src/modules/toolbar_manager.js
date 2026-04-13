/**
 * WaveCode Toolbar Manager - 負責工具列的視覺與邏輯 (對齊 #nyx)
 */
import { WaveCodeAPI } from './api.js';
import { WaveCodeCompiler } from './compiler.js';
import { KeyboardController } from './keyboard_controller.js';
import { Recorder } from './audio/recorder.js';
import '../toolbar.css';

export class ToolbarManager {
    constructor(workspace, stageUI) {
        this.workspace = workspace;
        this.stageUI = stageUI;
        
        this.isDirty = false;
        this.currentFilename = '';
        this.isProcessing = false;
        this.currentLang = 'zh-hant'; // 預設
        this.animationTimeout = null; 
        this.recordTimerInterval = null;
        this.silencePollingInterval = null;
        
        // --- 錄音狀態旗標 ---
        this._isSyncRecording = false; // 當前錄音是否為連動模式
        this._syncRecordPending = false; // 是否正在等待 Run 以啟動連動錄音
        this._recordStartTime = 0; // 錄音開始的時間點

        // DOM Elements
        this.elements = {
            openBtn: document.getElementById('open-btn'),
            saveBtn: document.getElementById('save-btn'),
            runBtn: document.getElementById('run-btn'),
            stopBtn: document.getElementById('stop-btn'),
            recordInstantBtn: document.getElementById('record-instant-btn'),
            recordSyncBtn: document.getElementById('record-sync-btn'),
            recordIdleWrapper: document.getElementById('record-idle-wrapper'),
            recordActiveWrapper: document.getElementById('record-active-wrapper'),
            stopRecordBtn: document.getElementById('stop-record-btn'),
            recordTimer: document.getElementById('record-timer'),
            settingsBtn: document.getElementById('settings-btn'),
            examplesBtn: document.getElementById('examples-btn'),
            updateBtn: document.getElementById('update-btn'),
            masterGain: document.getElementById('master-gain'),
            gainValue: document.getElementById('gain-value'),
            latencyAdjust: document.getElementById('latency-adjust'),
            latencyValue: document.getElementById('latency-value')
        };

        this.menus = {
            settings: this.createMenu('dropdown-menu'),
            examples: this.createMenu('dropdown-menu')
        };

        this.init();
    }

    createMenu(className) {
        const menu = document.createElement('div');
        menu.className = className;
        document.body.appendChild(menu);
        return menu;
    }

    init() {
        this.initI18n();
        this.bindEvents();
        this.setupSettingsMenu();
        this.setupGlobalClick();
        this.setupMasterGain();
        this.setupLatencyAdjust();
    }

    setupMasterGain() {
        if (this.elements.masterGain) {
            this.elements.masterGain.oninput = (e) => {
                const val = parseFloat(e.target.value);
                this.elements.gainValue.textContent = val.toFixed(1);
                WaveCodeAPI.setMasterVolume(val);
            };
            // 調整結束後釋放焦點，確保鍵盤事件能回到工作區
            this.elements.masterGain.onchange = (e) => {
                e.target.blur();
                if (this.workspace) this.workspace.markFocused();
            };
        }
    }

    setupLatencyAdjust() {
        if (this.elements.latencyAdjust) {
            // 從 localStorage 讀取舊設定 (預設 50ms)
            const savedLatency = localStorage.getItem('wavecode_latency_compensation') || '50';
            const val = parseInt(savedLatency);
            
            this.elements.latencyAdjust.value = val;
            this.elements.latencyValue.textContent = val + 'ms';
            WaveCodeAPI._lookAhead = val / 1000;

            this.elements.latencyAdjust.oninput = (e) => {
                const ms = parseInt(e.target.value);
                this.elements.latencyValue.textContent = ms + 'ms';
                WaveCodeAPI._lookAhead = ms / 1000;
                localStorage.setItem('wavecode_latency_compensation', ms);
            };

            this.elements.latencyAdjust.onchange = (e) => {
                e.target.blur();
                if (this.workspace) this.workspace.markFocused();
            };
        }
    }

    initI18n() {
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (Blockly.Msg[key]) el.title = Blockly.Msg[key];
        });
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (Blockly.Msg[key]) el.textContent = Blockly.Msg[key];
        });
    }

    bindEvents() {
        const invoke = WaveCodeAPI.getInvoke();

        this.elements.openBtn.onclick = async () => {
            if (await this.checkUnsavedChanges()) {
                const path = await window.__TAURI__.dialog.open({
                    filters: [{ name: 'WaveCode', extensions: ['wave', 'xml'] }]
                });
                if (path) {
                    const content = await invoke('load_project', { path });
                    this.loadXMLToWorkspace(content);
                    this.currentFilename = path.split(/[\\/]/).pop();
                    if (this.mdiManager) this.mdiManager.updateActiveTabTitle(this.currentFilename);
                    setTimeout(() => {
                        this.workspace.isClearing = false;
                        this.setDirty(false);
                    }, 100);
                }
            }
        };

        this.elements.saveBtn.onclick = async () => {
            const path = await window.__TAURI__.dialog.save({
                filters: [{ name: 'WaveCode', extensions: ['wave', 'xml'] }]
            });
            if (path) {
                const xmlContent = Blockly.Xml.domToPrettyText(Blockly.Xml.workspaceToDom(this.workspace));
                await invoke('save_project', { xmlContent, path });
                this.currentFilename = path.split(/[\\/]/).pop();
                if (this.mdiManager) this.mdiManager.updateActiveTabTitle(this.currentFilename);
                this.setDirty(false);
            }
        };

        this.elements.runBtn.onclick = async () => {
            if (this.animationTimeout) {
                clearTimeout(this.animationTimeout);
                this.animationTimeout = null;
            }

            // --- 【錄音連動核心】若有連動錄音請求，先處理 UI 狀態並標記 ---
            if (this._syncRecordPending) {
                this.startRecordingUI(); // 立即顯示計時器
                this._isSyncRecording = true;
                this._syncRecordPending = false;
            }

            await WaveCodeAPI.restartAudio(); // 確保引擎重置並初始化 Context
            
            // --- 【錄音連動核心】引擎重置完畢，正式開始錄音串流 ---
            if (this._isSyncRecording && !Recorder.isRecording) {
                Recorder.start();
                this._recordStartTime = Date.now();
            }

            // --- 關鍵修正：重置後立刻重新同步鍵盤選取的樂器 ---
            const currentInst = KeyboardController.getActiveInstrumentId();
            WaveCodeAPI.setCurrentInstrument(currentInst);

            this.elements.runBtn.classList.add('is-running');
            this.elements.runBtn.classList.add('pulse-animation');
            this.isProcessing = true;
            
            if (this.stageUI && this.stageUI.clearLog) this.stageUI.clearLog();

            const currentId = WaveCodeAPI.startScript();
            
            // 1. 編譯樂器配置
            await WaveCodeCompiler.run(this.workspace);

            // 2. 生成並執行腳本
            let rawCode = '';
            
            // 【關鍵修正】取得正確的產生器實例 (V10+ 標準為 javascriptGenerator)
            const generator = (window.javascript && window.javascript.javascriptGenerator) || Blockly.JavaScript;
            
            if (!generator) {
                console.error('WaveCode: 找不到 JavaScript 產生器');
                return;
            }

            // 初始化產生器狀態
            generator.init(this.workspace);

            // 【安全性強化】同步迴圈守衛：防止無窮迴圈鎖死 UI
            // 修正：改用 WaveCode._execId 確保在 Phrase 等函式作用域內也能正確存取 ID
            generator.INFINITE_LOOP_TRAP = `WaveCode.checkLoop(WaveCode._execId);\n`;
            
            // 【關鍵修正】直接獲取完整工作區代碼，這能自動處理帽子積木 (wc_perform) 的順序 with 同步
            const blocksCode = generator.workspaceToCode(this.workspace);
            rawCode = generator.finish(blocksCode);

            // 偵錯用：將生成的代碼印出
            console.log("=== WaveCode Generated Script ===\n" + rawCode + "\n================================");

            // --- 2. 執行產生的代碼 ---
            const finalCode = `
                const _id = ${currentId};
                try {
                    ${rawCode}
                } catch (err) {
                    if (err.message !== 'Script cancelled') throw err;
                }
            `;

            try {
                if (rawCode.trim().length > 0) {
                    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                    const executeLogic = new AsyncFunction('WaveCode', finalCode);
                    await executeLogic(WaveCodeAPI);
                }
            } catch (err) {
                if (err.message !== 'Script cancelled') {
                    console.error('腳本執行錯誤:', err);
                    let errorMsg = err.message || err;
                    if (errorMsg.includes('迴圈次數過多')) {
                        errorMsg = '偵測到疑似無窮迴圈，系統已自動終止程式以防止當機。';
                    }
                    if (this.stageUI && this.stageUI.appendLog) {
                        this.stageUI.appendLog('腳本執行錯誤: ' + errorMsg, 'error');
                    }
                }
            } finally {
                if (currentId === WaveCodeAPI._execId) {
                    this.elements.runBtn.classList.remove('is-running');
                    this.isProcessing = false;

                    // 程式結束後，延遲 2 秒才停止縮放動畫
                    this.animationTimeout = setTimeout(() => {
                        this.elements.runBtn.classList.remove('pulse-animation');
                        this.animationTimeout = null;
                    }, 2000);
                    
                    // --- 【自動錄音連動守衛】 ---
                    // 若程式執行時長 > 500ms，判定為線性腳本結束，自動停止錄音。
                    // 若 < 500ms，判定為「啟動類腳本」(例如帽子積木註冊)，啟動智慧靜音偵測。
                    const elapsed = Date.now() - this._recordStartTime;
                    if (Recorder.isRecording && this._isSyncRecording) {
                        if (elapsed > 500) {
                            console.log("WaveCode: 偵測到線性程式執行結束，自動停止錄音");
                            this.stopRecording();
                        } else {
                            // 呼叫我們剛才定義好的智慧偵測方法
                            this.startSilencePolling();
                        }
                    }
                }
            }
        };

        this.elements.stopBtn.onclick = async () => {
            if (this.animationTimeout) {
                clearTimeout(this.animationTimeout);
                this.animationTimeout = null;
            }
            this.isProcessing = false;
            
            // 如果正在錄音，按下停止也一併結束錄音
            if (Recorder.isRecording || this._syncRecordPending) {
                this.stopRecording();
            }

            await WaveCodeAPI.reset();

            // --- 關鍵修正：停止後重新同步鍵盤選取的樂器 ---
            const currentInst = KeyboardController.getActiveInstrumentId();
            WaveCodeAPI.setCurrentInstrument(currentInst);

            await WaveCodeAPI.closeSerial(); // 停止時徹底釋放序列埠，方便 Arduino 上傳
            this.elements.runBtn.classList.remove('is-running');
            this.elements.runBtn.classList.remove('pulse-animation'); // 手動停止時立即移除
        };

        // --- 1. 即時錄音邏輯 (隨按隨錄) ---
        if (this.elements.recordInstantBtn) {
            this.elements.recordInstantBtn.onclick = () => {
                if (Recorder.isRecording) {
                    this.stopRecording();
                } else {
                    this._isSyncRecording = false; // 強制標記為非連動
                    this.startRecording();
                    this._recordStartTime = Date.now();
                }
            };
        }

        // --- 2. 連動錄音邏輯 (自動 Run) ---
        if (this.elements.recordSyncBtn) {
            this.elements.recordSyncBtn.onclick = () => {
                if (Recorder.isRecording) {
                    this.stopRecording();
                } else if (this._syncRecordPending) {
                    // 若已在 Pending 狀態又點一次，則取消
                    this._syncRecordPending = false;
                    this.stopRecording(); 
                } else {
                    // 標記並觸發 Run，由 Run 負責接手啟動
                    this._syncRecordPending = true;
                    if (!this.isProcessing) {
                        this.elements.runBtn.click();
                    } else {
                        // 若程式已經在跑，點擊連動錄音就直接轉為即時錄音啟動
                        this._syncRecordPending = false;
                        this._isSyncRecording = false;
                        this.startRecording();
                        this._recordStartTime = Date.now();
                    }
                }
            };
        }

        // --- 3. 統一停止錄音按鈕邏輯 (補回被遺漏的功能) ---
        if (this.elements.stopRecordBtn) {
            this.elements.stopRecordBtn.onclick = () => {
                this.stopRecording();
            };
        }

        // --- 4. 更新硬體按鈕邏輯 (補回被遺漏的功能) ---
        if (this.elements.updateBtn) {
            this.elements.updateBtn.onclick = async () => {
                this.elements.updateBtn.classList.add('pulse-animation');
                try {
                    await WaveCodeCompiler.run(this.workspace);
                    if (this.stageUI && this.stageUI.appendLog) {
                        this.stageUI.appendLog('硬體配置已更新', 'success');
                    }
                } catch (err) {
                    console.error('更新硬體失敗:', err);
                } finally {
                    setTimeout(() => {
                        this.elements.updateBtn.classList.remove('pulse-animation');
                    }, 1000);
                }
            };
        }

        this.elements.settingsBtn.onclick = (e) => {
            e.stopPropagation();
            this.updateLangCheck(this.currentLang);
            const rect = this.elements.settingsBtn.getBoundingClientRect();
            this.menus.settings.style.top = `${rect.bottom + 5}px`;
            this.menus.settings.style.left = `${rect.left - 120}px`;
            this.menus.settings.classList.toggle('show');
            this.menus.examples.classList.remove('show');
        };

        this.elements.examplesBtn.onclick = async (e) => {
            e.stopPropagation();
            try {
                const examples = await invoke('list_examples');
                
                // --- 排序範例：將 General 排到最上面 ---
                examples.sort((a, b) => {
                    const nameA = (a.category || a.name || "").toLowerCase();
                    const nameB = (b.category || b.name || "").toLowerCase();
                    if (nameA === 'general') return -1;
                    if (nameB === 'general') return 1;
                    return nameA.localeCompare(nameB);
                });

                let html = '';
                examples.forEach(ex => {
                    if (ex.category) {
                        html += `
                            <div class="dropdown-item has-submenu">
                                <img src="/icons/folder_special_24dp_75FB4C.png" class="nyx-icon-purple" style="width:20px;">
                                <span style="flex:1;">${ex.category}</span>
                                <span class="arrow">▶</span>
                                <div class="submenu">
                                    ${ex.items.map(i => `
                                        <div class="dropdown-item example-item" data-path="${i.path}">
                                            <img src="/icons/lyrics_24dp_75FB4C.png" class="nyx-icon-blue" style="width:20px;">
                                            <span>${i.name}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>`;
                    } else {
                        html += `
                            <div class="dropdown-item example-item" data-path="${ex.path}">
                                <img src="/icons/lyrics_24dp_75FB4C.png" class="nyx-icon-blue" style="width:20px;">
                                <span>${ex.name}</span>
                            </div>`;
                    }
                });
                this.menus.examples.innerHTML = html || '<div class="dropdown-item">無範例</div>';
                
                this.menus.examples.querySelectorAll('.example-item').forEach(item => {
                    item.onclick = async (ev) => {
                        ev.stopPropagation();
                        if (await this.checkUnsavedChanges()) {
                            const path = item.getAttribute('data-path');
                            const filename = path.split(/[\\/]/).pop();
                            const content = await invoke('load_project', { path });
                            
                            if (this.mdiManager) {
                                this.mdiManager.addNewTab(filename, true, content);
                            } else {
                                this.loadXMLToWorkspace(content);
                                this.currentFilename = filename;
                                this.setDirty(false);
                            }
                            this.menus.examples.classList.remove('show');
                        }
                    };
                });

                const rect = this.elements.examplesBtn.getBoundingClientRect();
                this.menus.examples.style.top = `${rect.bottom + 5}px`;
                this.menus.examples.style.left = `${rect.left}px`;
                this.menus.examples.classList.toggle('show');
                this.menus.settings.classList.remove('show');
            } catch (err) {
                console.error('載入範例清單失敗:', err);
            }
        };
    }

    setupSettingsMenu() {
        this.menus.settings.innerHTML = `
            <div class="dropdown-item" id="restart-audio-item"><img src="/icons/rocket_launch_24dp_FE2F89.png" class="nyx-icon-neon"><span data-i18n="WAVECODE_RESTART_AUDIO">重啟音訊</span></div>
            <div class="dropdown-item" id="toggle-scroll-item">
                <span class="scroll-check" style="width:20px; display:inline-block;"></span>
                <span data-i18n="WAVECODE_SCROLL_OPTIONS">進階捲軸功能</span>
            </div>
            <div class="dropdown-item has-submenu"><img src="/icons/language_24dp_FE2F89.png" class="nyx-icon-neon"><span data-i18n="WAVECODE_LANG_SETTING">語言設定</span><span class="arrow">▶</span></div>
            <div class="submenu">
                <div class="dropdown-item lang-item" data-lang="zh-hant"><span class="lang-check" style="width:20px;"></span><span>正體中文</span></div>
                <div class="dropdown-item lang-item" data-lang="en"><span class="lang-check" style="width:20px;"></span><span>English</span></div>
            </div>
        `;

        this.menus.settings.onclick = async (e) => {
            const restartBtn = e.target.closest('#restart-audio-item');
            if (restartBtn) {
                await WaveCodeAPI.restartAudio();
                this.menus.settings.classList.remove('show');
            }

            const scrollBtn = e.target.closest('#toggle-scroll-item');
            if (scrollBtn) {
                const current = localStorage.getItem('wavecode_scroll_options') === 'true';
                localStorage.setItem('wavecode_scroll_options', !current);
                this.updateScrollOptionsCheck(!current);
                if (this.stageUI) this.stageUI.appendLog('捲軸設定已更新，重啟軟體後生效');
                e.stopPropagation();
            }

            const langItem = e.target.closest('.lang-item');
            if (langItem) {
                const lang = langItem.getAttribute('data-lang');
                this.switchLanguage(lang);
                this.menus.settings.classList.remove('show');
                e.stopPropagation();
            }
        };
    }

    setupGlobalClick() {
        document.addEventListener('click', () => {
            this.menus.settings.classList.remove('show');
            this.menus.examples.classList.remove('show');
        });
    }

    updateLangCheck(lang) {
        this.menus.settings.querySelectorAll('.lang-check').forEach(el => el.innerHTML = '');
        const selectedEl = this.menus.settings.querySelector(`.lang-item[data-lang="${lang}"] .lang-check`);
        if (selectedEl) {
            selectedEl.innerHTML = `<img src="/icons/done_24dp_FE2F89.png" class="nyx-icon-neon" style="width: 16px;">`;
        }
        const isScrollEnabled = localStorage.getItem('wavecode_scroll_options') === 'true';
        this.updateScrollOptionsCheck(isScrollEnabled);
    }

    updateScrollOptionsCheck(enabled) {
        const checkEl = this.menus.settings.querySelector('.scroll-check');
        if (checkEl) {
            checkEl.innerHTML = enabled ? `<img src="/icons/done_24dp_FE2F89.png" class="nyx-icon-neon" style="width: 16px;">` : '';
        }
    }

    switchLanguage(lang) {
        if (this.currentLang === lang) return;
        this.currentLang = lang;
        this.updateLangCheck(lang);
        const scriptId = 'lang-script';
        let script = document.getElementById(scriptId);
        if (script) script.remove();
        script = document.createElement('script');
        script.id = scriptId;
        script.src = `/src/lang/${lang}.js`;
        script.onload = () => {
            this.initI18n();
            if (this.mdiManager && this.mdiManager.updateLanguage) this.mdiManager.updateLanguage();
            if (this.workspace.getToolbox()) {
                import('./toolbox.js').then(m => {
                    this.workspace.updateToolbox(m.WaveCodeToolbox);
                });
            }
        };
        document.body.appendChild(script);
    }

    setDirty(dirty) {
        if (this.workspace.isClearing && dirty) return;
        this.isDirty = dirty;
        const displayFilename = this.currentFilename || '未命名專案';
        document.title = `${dirty ? '*' : ''}${displayFilename} - WaveCode`;
        if (this.mdiManager) this.mdiManager.updateActiveTabDirty(dirty);
    }

    async checkUnsavedChanges() {
        if (this.isDirty) {
            const { ask } = window.__TAURI__.dialog;
            return await ask('分頁內容尚未儲存，確定要切換或建立嗎？', { title: '警告', kind: 'warning' });
        }
        return true;
    }

    createDefaultBlocks() {
        if (!this.workspace || this.workspace.isClearing) return;
        try {
            const inst = this.workspace.newBlock('wc_instrument');
            inst.setFieldValue('Piano', 'ID');
            inst.initSvg(); inst.render(); inst.moveBy(50, 50);
            
            const osc = this.workspace.newBlock('wc_component_osc');
            osc.initSvg(); osc.render();
            inst.getInput('CHAIN').connection.connect(osc.previousConnection);

            const adsr = this.workspace.newBlock('wc_component_adsr');
            adsr.initSvg(); adsr.render();
            osc.nextConnection.connect(adsr.previousConnection);

            const vol = this.workspace.newBlock('wc_component_volume');
            vol.initSvg(); vol.render();
            adsr.nextConnection.connect(vol.previousConnection);
        } catch (e) {
            console.warn('建立預設積木失敗:', e);
        }
    }

    loadXMLToWorkspace(xmlText) {
        if (!this.workspace) return;
        if (window.EnvelopeManager) window.EnvelopeManager.clearRegistry();

        this.workspace.isClearing = true;
        this.workspace.clear();

        const dom = Blockly.utils.xml.textToDom(xmlText);
        Blockly.Xml.domToWorkspace(dom, this.workspace);
        
        setTimeout(() => {
            if (!this.workspace) return;

            // 掃描樂器並更新 API
            const configs = WaveCodeCompiler.scanInstruments(this.workspace);
            WaveCodeAPI.setInstruments(configs);

            // 自動選取第一個樂器並顯示
            const keys = Object.keys(configs);
            if (keys.length > 0) {
                WaveCodeAPI.setCurrentInstrument(keys[0]);
            }

            const instruments = this.workspace.getBlocksByType('wc_instrument');
            instruments.forEach(b => {
                if (!b) return;
                const id = b.getFieldValue('ID');
                const visual = b.getField('VISUAL');
                if (id && visual && window.EnvelopeManager) {
                    window.EnvelopeManager.register(id, visual);
                    if (visual.render_) visual.render_();
                }
            });

            // --- 關鍵修正：加入視覺邊距補正 ---
            if (this.workspace.getTopBlocks().length > 0) {
                // 自動捲動到積木群，並加入間距補償
                this.workspace.scrollX += 30;
                this.workspace.scrollY += 30;
                this.workspace.render();
            }

            this.workspace.isClearing = false;
            this.setDirty(false); // 載入後強制標記為非 Dirty
        }, 150);
    }

    startRecording() {
        Recorder.start();
        this.startRecordingUI();
    }

    startRecordingUI() {
        // 先清除舊的輪詢
        if (this.silencePollingInterval) {
            clearInterval(this.silencePollingInterval);
            this.silencePollingInterval = null;
        }

        // --- 關鍵切換：隱藏閒置按鈕，顯示錄音中 UI ---
        if (this.elements.recordIdleWrapper) this.elements.recordIdleWrapper.style.display = 'none';
        if (this.elements.recordActiveWrapper) this.elements.recordActiveWrapper.style.display = 'flex';

        // 更新 UI 狀態：兩個按鈕都進入「正在錄音」模式 (雖然已隱藏)
        if (this.elements.recordInstantBtn) {
            this.elements.recordInstantBtn.classList.add('is-recording');
            this.elements.recordInstantBtn.querySelector('img').src = '/icons/mic_off_24dp_FE2F89.png';
        }
        if (this.elements.recordSyncBtn) {
            this.elements.recordSyncBtn.classList.add('is-recording');
            this.elements.recordSyncBtn.querySelector('img').src = '/icons/mic_off_24dp_FE2F89.png';
        }

        if (this.elements.recordTimer) {
            this.elements.recordTimer.style.display = 'block';
            this.elements.recordTimer.textContent = '00:00';
            const startTime = Date.now();
            if (this.recordTimerInterval) clearInterval(this.recordTimerInterval);
            this.recordTimerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
                const s = String(elapsed % 60).padStart(2, '0');
                this.elements.recordTimer.textContent = `${m}:${s}`;
            }, 1000);
        }
    }

    stopRecording() {
        Recorder.stop();
        this._isSyncRecording = false;
        this._syncRecordPending = false;
        
        if (this.silencePollingInterval) {
            clearInterval(this.silencePollingInterval);
            this.silencePollingInterval = null;
        }

        // --- 關鍵切換：恢復閒置按鈕，隱藏錄音中 UI ---
        if (this.elements.recordIdleWrapper) this.elements.recordIdleWrapper.style.display = 'flex';
        if (this.elements.recordActiveWrapper) this.elements.recordActiveWrapper.style.display = 'none';

        // 還原 UI 狀態：各歸各位
        if (this.elements.recordInstantBtn) {
            this.elements.recordInstantBtn.classList.remove('is-recording');
            this.elements.recordInstantBtn.querySelector('img').src = '/icons/mic_24dp_FE2F89.png';
        }
        if (this.elements.recordSyncBtn) {
            this.elements.recordSyncBtn.classList.remove('is-recording');
            this.elements.recordSyncBtn.querySelector('img').src = '/icons/mic_alert_24dp_FE2F89.png';
        }

        if (this.recordTimerInterval) {
            clearInterval(this.recordTimerInterval);
            this.recordTimerInterval = null;
        }
    }

    /**
     * 啟動靜音偵測輪詢：當所有發聲通道都關閉時自動停止錄音
     */
    startSilencePolling() {
        if (this.silencePollingInterval) clearInterval(this.silencePollingInterval);
        
        let silentCheckCount = 0;
        let hasPlayed = false; // 關鍵：標記是否「曾經有過」聲音
        
        console.log("WaveCode: 啟動靜音自動偵測系統...");

        this.silencePollingInterval = setInterval(() => {
            if (!Recorder.isRecording) {
                clearInterval(this.silencePollingInterval);
                this.silencePollingInterval = null;
                return;
            }

            const activeVoices = WaveCodeAPI.AudioManager.getActiveVoiceCount();
            
            // 如果偵測到聲音，標記為「已開始播放」
            if (activeVoices > 0) {
                hasPlayed = true;
                silentCheckCount = 0;
            } else if (hasPlayed) {
                // 只有在「曾經播過」的前提下，沒聲音才算數
                silentCheckCount++;
                console.log(`WaveCode: 音樂似乎已結束，確認中 (${silentCheckCount}/2)...`);
                
                // 連續兩秒沒聲音，判定播放完畢
                if (silentCheckCount >= 2) {
                    console.log("WaveCode: 偵測到音樂已播放結束，自動結算錄音。");
                    this.stopRecording();
                    clearInterval(this.silencePollingInterval);
                    this.silencePollingInterval = null;
                }
            }
        }, 1000);
    }
}
