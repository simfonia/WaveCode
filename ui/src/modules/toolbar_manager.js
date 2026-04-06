/**
 * WaveCode Toolbar Manager - 負責工具列的視覺與邏輯 (對齊 #nyx)
 */
import { WaveCodeAPI } from './api.js';
import { WaveCodeCompiler } from './compiler.js';
import '../toolbar.css';

export class ToolbarManager {
    constructor(workspace, stageUI) {
        this.workspace = workspace;
        this.stageUI = stageUI;
        
        this.isDirty = false;
        this.currentFilename = '';
        this.isProcessing = false;
        this.currentLang = 'zh-hant'; // 預設

        // DOM Elements
        this.elements = {
            openBtn: document.getElementById('open-btn'),
            saveBtn: document.getElementById('save-btn'),
            runBtn: document.getElementById('run-btn'),
            stopBtn: document.getElementById('stop-btn'),
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
            await WaveCodeAPI.restartAudio(); // 確保引擎重置並初始化 Context
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
            // 此陷阱會被注入到產生器輸出的每一個循環 (while, for, repeat)
            generator.INFINITE_LOOP_TRAP = `WaveCode.checkLoop(_id);\n`;
            
            const topBlocks = this.workspace.getTopBlocks(true);
            topBlocks.forEach(block => {
                // 樂器定義由 Compiler 處理，演奏積木才產生代碼
                if (block.type === 'wc_instrument') return; 

                // 透過產生器實例進行轉換，自動處理 this.valueToCode 等上下文綁定
                let code = generator.blockToCode(block);
                
                if (code) {
                    // 若是運算積木 (含 ORDER)，取其字串部分
                    if (Array.isArray(code)) code = code[0];
                    rawCode += code + '\n';
                }
            });

            const finalCode = `
                const _id = ${currentId};
                try {
                    ${rawCode}
                } catch (err) {
                    if (err.message !== 'Script cancelled') {
                        throw err;
                    }
                }
            `;

            try {
                const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                const executeLogic = new AsyncFunction('WaveCode', finalCode);
                await executeLogic(WaveCodeAPI);
            } catch (err) {
                if (err.message !== 'Script cancelled') {
                    console.error('腳本執行錯誤:', err);
                    if (this.stageUI && this.stageUI.appendLog) {
                        this.stageUI.appendLog('腳本執行錯誤: ' + err, 'error');
                    }
                }
            } finally {
                if (currentId === WaveCodeAPI._execId) {
                    this.elements.runBtn.classList.remove('is-running');
                    // 程式結束後，縮放動畫持續 2 秒才停止
                    setTimeout(() => {
                        this.elements.runBtn.classList.remove('pulse-animation');
                    }, 2000);
                    this.isProcessing = false;
                }
            }
        };

        this.elements.stopBtn.onclick = async () => {
            this.isProcessing = false;
            await WaveCodeAPI.reset();
            this.elements.runBtn.classList.remove('is-running');
            this.elements.runBtn.classList.remove('pulse-animation'); // 手動停止時立即移除
        };

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
                let html = '';
                examples.forEach(ex => {
                    if (ex.category) {
                        html += `
                            <div class="dropdown-item has-submenu">
                                <img src="/icons/folder_special_24dp_75FB4C.png" class="nyx-icon-purple" style="width:20px;">
                                <span>${ex.category}</span>
                                <span class="arrow">▶</span>
                            </div>
                            <div class="submenu">
                                ${ex.items.map(i => `
                                    <div class="dropdown-item example-item" data-path="${i.path}">
                                        <img src="/icons/lyrics_24dp_75FB4C.png" class="nyx-icon-blue" style="width:20px;">
                                        <span>${i.name}</span>
                                    </div>
                                `).join('')}
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
            inst.setFieldValue('my_piano', 'ID');
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
            this.workspace.isClearing = false;
        }, 100);
    }
}
