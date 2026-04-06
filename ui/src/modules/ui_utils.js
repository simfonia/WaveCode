/**
 * WaveCode UI Utilities - 面板管理與 UI 輔助函式 (對齊 #nyx)
 */
import { WaveCodeAPI } from './api.js';

export const UIUtils = {
    injectNaNShield: () => {
        const originalSetAttribute = Element.prototype.setAttribute;
        Element.prototype.setAttribute = function(name, value) {
            if (typeof value === 'string' && (value.includes('NaN') || value.includes('undefined'))) {
                return;
            }
            return originalSetAttribute.apply(this, arguments);
        };
    },

    initMinimap: (workspace) => {
        try {
            const MinimapClass = (window.workspaceMinimap && window.workspaceMinimap.PositionedMinimap) || 
                               (window.PositionedMinimap) || 
                               (Blockly.workspaceMinimap && Blockly.workspaceMinimap.PositionedMinimap);
            if (!MinimapClass) return;
            
            // 檢查是否已經有 Minimap 元素在該容器中
            const wrapper = workspace.getInjectionDiv().parentNode;
            if (wrapper.querySelector('.blockly-minimap')) return;

            const minimap = new MinimapClass(workspace);
            minimap.init();

            // 建立切換按鈕
            const mWrapper = wrapper.querySelector('.blockly-minimap');
            if (mWrapper) {
                const toggleBtn = document.createElement('div');
                toggleBtn.id = 'minimap-toggle';
                toggleBtn.className = 'icon-btn';
                toggleBtn.title = "切換 Minimap";
                toggleBtn.innerHTML = `<img src="/icons/cancel_24dp_FE2F89.png" class="nyx-icon-purple">`;
                wrapper.appendChild(toggleBtn);

                toggleBtn.onclick = () => {
                    const isCollapsed = mWrapper.classList.toggle('collapsed');
                    if (isCollapsed) {
                        mWrapper.style.display = 'none';
                        toggleBtn.innerHTML = `<img src="/icons/public_24dp_FE2F89.png" class="nyx-icon-purple">`;
                    } else {
                        mWrapper.style.display = 'block';
                        toggleBtn.innerHTML = `<img src="/icons/cancel_24dp_FE2F89.png" class="nyx-icon-purple">`;
                        Blockly.svgResize(workspace);
                    }
                };
            }
        } catch (e) { console.warn('Minimap 初始化失敗:', e); }
    },

    initStagePanel: () => {
        const resizer = document.getElementById('panel-resizer');
        const panel = document.getElementById('stage-panel');
        const toggle = document.getElementById('stage-toggle');
        const logContainer = document.getElementById('log-container');
        const clearLogBtn = document.getElementById('clear-log-btn');

        let isResizing = false;
        let startX, startWidth;

        // --- 1. 面板縮放 ---
        if (resizer) {
            resizer.onmousedown = (e) => {
                isResizing = true;
                startX = e.clientX;
                startWidth = panel.offsetWidth;
                document.body.classList.add('resizing-panel');
                resizer.classList.add('is-dragging');
            };

            window.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                const width = startWidth - (e.clientX - startX);
                if (width > 150 && width < 800) {
                    panel.style.width = `${width}px`;
                    // 通知當前活動分頁的工作區重繪
                    if (window.Blockly) {
                        const ws = Blockly.getMainWorkspace();
                        if (ws) Blockly.svgResize(ws);
                    }
                }
            });

            window.addEventListener('mouseup', () => {
                isResizing = false;
                document.body.classList.remove('resizing-panel');
                resizer.classList.remove('is-dragging');
            });
        }

        // --- 2. 面板收合 ---
        if (toggle) {
            toggle.onclick = () => {
                const isCollapsed = panel.classList.toggle('collapsed');
                const arrow = toggle.querySelector('.arrow');
                if (arrow) arrow.textContent = isCollapsed ? '◀' : '▶';
                if (window.Blockly) {
                    const ws = Blockly.getMainWorkspace();
                    if (ws) Blockly.svgResize(ws);
                }
                // 延遲重發 resize 事件以確保 canvas 能響應
                setTimeout(() => window.dispatchEvent(new Event('resize')), 310);
            };
        }

        // --- 3. Smart Tabs 切換 ---
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => {
                const tabId = btn.getAttribute('data-tab');
                UIUtils.switchSmartTab(tabId);
            };
        });

        // --- 4. Collapsible Sections (Waveform & Log) ---
        document.querySelectorAll('.toggle-section-btn').forEach(btn => {
            btn.onclick = () => {
                const section = btn.closest('.panel-section');
                if (section) {
                    section.classList.toggle('collapsed');
                    // 摺疊時需要通知 Blockly 重新計算空間
                    if (window.Blockly) {
                        const ws = Blockly.getMainWorkspace();
                        if (ws) {
                            setTimeout(() => Blockly.svgResize(ws), 350);
                        }
                    }
                }
            };
        });

        // --- 5. Log 功能 ---
        window.LogManager = {
            appendLog: (msg, type = 'info') => {
                if (!logContainer) return;
                
                // 限制行數上限為 300
                while (logContainer.children.length >= 300) {
                    logContainer.removeChild(logContainer.firstChild);
                }

                const line = document.createElement('div');
                line.className = `log-line log-${type}`;
                line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
                logContainer.appendChild(line);

                // 改用 scrollIntoView 確保捲動到最後一行
                requestAnimationFrame(() => {
                    line.scrollIntoView({ behavior: 'auto', block: 'end' });
                });
            },
            clearLog: () => { if (logContainer) logContainer.innerHTML = ''; }
        };

        if (clearLogBtn) clearLogBtn.onclick = window.LogManager.clearLog;

        return window.LogManager;
    },

    /**
     * 程式化切換側邊面板分頁
     */
    switchSmartTab: (tabId) => {
        const section = document.getElementById('smart-tabs-section');
        if (!section) return;

        const btn = section.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        const pane = section.querySelector(`#${tabId}`);
        if (!btn || !pane) return;

        section.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        section.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        pane.classList.add('active');
    },

    /**
     * 初始化積木搜尋功能 (對齊 #nyx 邏輯，避免使用 getDiv())
     */
    initSearch: (workspace) => {
        if (!window.BlockSearcher) {
            window.BlockSearcher = {
                _cache: new Map(),
                _searchTimeout: null,
                _isComposing: false, // 是否正在組字 (IME)
                /**
                 * 字串清理輔助：正規化並移除特殊空白/控制字元
                 */
                clean: function(str) {
                    if (!str) return '';
                    return str.normalize('NFC')
                              .replace(/[\u00A0\u1680​\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/g, ' ') // 替換各種特殊空白
                              .replace(/[\u0000-\u001f]/g, '') // 移除控制字元
                              .toLowerCase().trim();
                },
                buildIndex: function() {
                    this._cache.clear();
                    const types = Object.keys(Blockly.Blocks);
                    types.forEach(type => {
                        let blob = type.toLowerCase();
                        const def = Blockly.Blocks[type];
                        if (def) {
                            // 1. 抓取 message
                            for (let i = 0; i < 10; i++) {
                                let m = def['message' + i];
                                if (typeof m === 'string') {
                                    const parsed = Blockly.utils.parsing.replaceMessageReferences(m);
                                    blob += ' ' + this.clean(parsed).replace(/%\d+/g, '');
                                }
                            }
                            // 2. 抓取 tooltip
                            let tooltip = def.tooltip;
                            if (typeof tooltip === 'string') {
                                blob += ' ' + this.clean(Blockly.utils.parsing.replaceMessageReferences(tooltip));
                            }
                        }
                        this._cache.set(type, blob);
                    });
                    console.log(`WaveCode Search: Index built. Example entry [wc_play_note]:`, this._cache.get('wc_play_note'));
                }
            };
        }
        
        const BlockSearcher = window.BlockSearcher;

        const doInject = () => {
            if (BlockSearcher._cache.size === 0) BlockSearcher.buildIndex();
            
            const wrapper = workspace.getInjectionDiv().parentNode;
            const toolboxDiv = wrapper.querySelector('.blocklyToolboxDiv');
            if (!wrapper || !toolboxDiv || wrapper.querySelector('.block-search-container')) return;

            const searchDiv = document.createElement('div');
            searchDiv.className = 'block-search-container';
            const placeholder = Blockly.Msg['CAT_SEARCH'] || '搜尋積木...';
            searchDiv.innerHTML = `
                <input type="text" class="block-search" placeholder="${placeholder}" autocomplete="off">
                <span class="search-clear-btn" style="display:none; position:absolute; right:15px; top:50%; transform:translateY(-50%); cursor:pointer; font-weight:bold; color:#888; font-size:18px;">✕</span>
            `;
            wrapper.appendChild(searchDiv);

            const searchInput = searchDiv.querySelector('.block-search');
            const clearBtn = searchDiv.querySelector('.search-clear-btn');
            
            const updateWidth = () => {
                const rect = toolboxDiv.getBoundingClientRect();
                if (rect.width > 0) searchDiv.style.width = rect.width + 'px';
            };
            new ResizeObserver(updateWidth).observe(toolboxDiv);

            const performSearch = (queryRaw) => {
                const toolbox = workspace.getToolbox();
                const flyout = toolbox ? toolbox.getFlyout() : null;
                if (!flyout) return;

                const query = BlockSearcher.clean(queryRaw);
                if (!query) {
                    flyout.hide();
                    clearBtn.style.display = 'none';
                    return;
                }

                clearBtn.style.display = 'block';
                const matched = [];
                const keywords = query.split(/\s+/).filter(k => k.length > 0);
                
                BlockSearcher._cache.forEach((blob, type) => {
                    const isMatch = keywords.every(k => blob.includes(k));
                    if (isMatch) matched.push(type);
                });

                const xmlList = matched.slice(0, 30).map(t => {
                    const x = Blockly.utils.xml.createElement('block');
                    x.setAttribute('type', t);
                    return x;
                });

                if (xmlList.length > 0) {
                    flyout.show(xmlList);
                } else {
                    flyout.hide();
                }
            };

            clearBtn.onclick = () => {
                searchInput.value = '';
                performSearch('');
                searchInput.focus();
            };

            // --- 中文輸入法 (IME) 優化 ---
            searchInput.addEventListener('compositionstart', () => { BlockSearcher._isComposing = true; });
            searchInput.addEventListener('compositionend', (e) => {
                BlockSearcher._isComposing = false;
                performSearch(e.target.value.toLowerCase().trim());
            });

            searchInput.oninput = (e) => {
                if (BlockSearcher._isComposing) return;

                const query = e.target.value.toLowerCase().trim();
                clearTimeout(BlockSearcher._searchTimeout);
                BlockSearcher._searchTimeout = setTimeout(() => {
                    performSearch(query);
                }, 300);
            };

            searchInput.onkeydown = (e) => {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    performSearch('');
                    searchInput.blur();
                }
            };
        };

        setTimeout(doInject, 500);
    },

    /**
     * --- Orphan Block System (對齊 #nyx) ---
     */
    VALID_ROOTS: ['wc_init', 'wc_instrument', 'wc_perform', 'wc_comment', 'procedures_defnoreturn', 'procedures_defreturn'],

    updateOrphanBlocks: (ws) => {
        if (!ws || ws.isDragging()) return;
        ws.getTopBlocks(false).forEach(topBlock => {
            const isOrphan = !UIUtils.VALID_ROOTS.includes(topBlock.type);
            
            // 遞迴處理該頂層積木的所有後代
            topBlock.getDescendants(false).forEach(block => {
                if (block.setDisabledReason) {
                    const hasOrphanReason = block.hasDisabledReason('orphan');
                    if (hasOrphanReason !== isOrphan) block.setDisabledReason(isOrphan, 'orphan');
                } else if (block.setEnabled) {
                    block.setEnabled(!isOrphan);
                }
            });
        });
    },

    /**
     * 更新側邊面板的視覺輔助說明 (#nyx 對齊版)
     */
    updateVisualHelp: async (block, lang) => {
        const placeholder = document.getElementById('help-placeholder');
        const content = document.getElementById('block-help-content');
        const titleEl = document.getElementById('help-title');
        const descEl = document.getElementById('help-desc');
        const previewEl = document.getElementById('help-preview');
        const invoke = WaveCodeAPI.getInvoke();

        if (!placeholder || !content) return;

        if (!block) {
            placeholder.style.display = 'flex';
            content.style.display = 'none';
            window._currentHelpBlockId = null;
            return;
        }

        if (window._currentHelpBlockId === block.id) return;
        window._currentHelpBlockId = block.id;

        placeholder.style.display = 'none';
        content.style.display = 'block';

        // 1. 顯示積木類型標題
        titleEl.style.display = 'flex';
        titleEl.style.alignItems = 'center';
        titleEl.style.justifyContent = 'space-between';
        titleEl.style.fontFamily = "'Fira Code', monospace";
        titleEl.style.fontSize = '12px';
        titleEl.style.padding = '5px 0';
        titleEl.style.borderBottom = '1px solid var(--nyx-border)';
        titleEl.style.marginBottom = '10px';
        titleEl.innerHTML = `<span style="color: var(--nyx-purple-glow); opacity: 0.8;">ID: &lt;${block.type}&gt;</span>`;

        // 2. 處理說明文件載入 (對齊 #nyx 路徑規範)
        let url = (typeof block.helpUrl === 'function') ? block.helpUrl() : block.helpUrl;
        previewEl.innerHTML = '';
        previewEl.style.display = 'none';

        if (url && url !== '') {
            // 外部網頁後備按鈕
            const linkIcon = document.createElement('img');
            linkIcon.src = '/icons/travel_explore_24dp_FE2F89.png';
            linkIcon.className = 'nyx-icon-neon';
            linkIcon.style.width = '16px';
            linkIcon.style.cursor = 'pointer';
            linkIcon.title = '開啟外部完整說明';
            linkIcon.onclick = () => {
                const targetUrl = url.startsWith('http') ? url : `${url}_${lang}.html`;
                invoke('open_url', { url: targetUrl });
            };
            titleEl.appendChild(linkIcon);

            if (!url.startsWith('http')) {
                try {
                    // 去除可能重複的副檔名
                    url = url.replace(/\.html$/, '');
                    const docFilename = `${url}_${lang}.html`;
                    
                    const docContent = await invoke('get_doc_content', { filename: docFilename });

                    if (docContent) {
                        const iframe = document.createElement('iframe');
                        iframe.style.width = '100%';
                        iframe.style.height = '420px';
                        iframe.style.border = 'none';
                        iframe.style.backgroundColor = '#fff';
                        iframe.style.borderRadius = '8px';
                        iframe.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
                        iframe.srcdoc = docContent;
                        previewEl.appendChild(iframe);
                        previewEl.style.display = 'block';
                        previewEl.style.marginTop = '10px';
                    }
                } catch (err) {
                    console.warn(`[HelpSystem] 無法載入說明文件 (${url}):`, err);
                    previewEl.innerHTML = `<div style="color: var(--nyx-red); font-size: 12px; padding: 10px; border: 1px dashed var(--nyx-border); border-radius: 4px;">說明文件載入失敗: ${url}</div>`;
                    previewEl.style.display = 'block';
                }
            }
        }

        // 3. Tooltip 摘要 (顯示在預覽下方)
        let tooltip = block.getTooltip();
        if (typeof tooltip === 'function') tooltip = tooltip();
        descEl.style.fontSize = '13px';
        descEl.style.lineHeight = '1.6';
        descEl.style.color = 'var(--nyx-text-dim)';
        descEl.style.marginTop = '15px';
        descEl.style.padding = '10px';
        descEl.style.background = 'rgba(255,255,255,0.03)';
        descEl.style.borderRadius = '4px';
        descEl.innerHTML = tooltip ? `<strong>摘要:</strong><br>${tooltip.replace(/\n/g, '<br>')}` : '';
    }
};
