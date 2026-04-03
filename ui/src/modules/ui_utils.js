/**
 * WaveCode UI Utilities - 面板管理與 UI 輔助函式 (對齊 #nyx)
 */

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
                const header = btn.closest('.smart-tabs-header');
                const body = btn.closest('#smart-tabs-section').querySelector('.smart-tabs-body');
                
                header.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                body.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                const targetPane = body.querySelector(`#${tabId}`);
                if (targetPane) targetPane.classList.add('active');
            };
        });

        // --- 4. Log 功能 ---
        const appendLog = (msg, type = 'info') => {
            if (!logContainer) return;
            const line = document.createElement('div');
            line.className = `log-line log-${type}`;
            line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
            logContainer.appendChild(line);
            logContainer.scrollTop = logContainer.scrollHeight;
        };

        const clearLog = () => { if (logContainer) logContainer.innerHTML = ''; };
        if (clearLogBtn) clearLogBtn.onclick = clearLog;

        return { appendLog, clearLog };
    },

    /**
     * 初始化積木搜尋功能 (對齊 #nyx 邏輯，避免使用 getDiv())
     */
    initSearch: (workspace) => {
        if (!window.BlockSearcher) {
            window.BlockSearcher = {
                _cache: new Map(),
                _searchTimeout: null,
                buildIndex: function() {
                    this._cache.clear();
                    const types = Object.keys(Blockly.Blocks);
                    types.forEach(type => {
                        let blob = type.toLowerCase();
                        const def = Blockly.Blocks[type];
                        if (def) { 
                            for(let i=0; i<10; i++) { 
                                const m = def['message'+i]; 
                                if(typeof m === 'string') blob += ' ' + m.replace(/%\d+/g,'').toLowerCase(); 
                            } 
                        }
                        this._cache.set(type, blob);
                    });
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
                <img src="/icons/cancel_24dp_FE2F89.png" class="search-clear-btn nyx-icon-neon" style="display:none; position: absolute; right: 15px; top: 50%; transform: translateY(-50%); width: 14px; cursor: pointer;">
            `;
            wrapper.appendChild(searchDiv);

            const searchInput = searchDiv.querySelector('.block-search');
            const clearBtn = searchDiv.querySelector('.search-clear-btn');
            
            // 監聽 Toolbox 寬度變動
            const updateWidth = () => { 
                const rect = toolboxDiv.getBoundingClientRect(); 
                if (rect.width > 0) searchDiv.style.width = rect.width + 'px'; 
            };
            new ResizeObserver(updateWidth).observe(toolboxDiv);

            clearBtn.onclick = () => {
                searchInput.value = '';
                clearBtn.style.display = 'none';
                const toolbox = workspace.getToolbox();
                const flyout = toolbox ? toolbox.getFlyout() : null;
                if (flyout) flyout.hide();
                searchInput.focus();
            };

            searchInput.oninput = (e) => {
                const query = e.target.value.toLowerCase().trim();
                clearBtn.style.display = query ? 'block' : 'none';
                clearTimeout(BlockSearcher._searchTimeout);
                BlockSearcher._searchTimeout = setTimeout(() => {
                    const toolbox = workspace.getToolbox();
                    const flyout = toolbox ? toolbox.getFlyout() : null;
                    if (!flyout) return;
                    if (!query) { flyout.hide(); return; }
                    const matched = []; 
                    BlockSearcher._cache.forEach((b, t) => { if(b.includes(query)) matched.push(t); });
                    const xmlList = matched.slice(0, 20).map(t => { 
                        const x = Blockly.utils.xml.createElement('block'); 
                        x.setAttribute('type', t); 
                        return x; 
                    });
                    flyout.show(xmlList);
                }, 200);
            };
        };

        setTimeout(doInject, 500);
    },

    updateOrphanBlocks: (ws) => {
        if (!ws || ws.isDragging()) return;
        ws.getTopBlocks().forEach(block => {
            const isOrphan = block.type !== 'audio_instrument' && 
                             !block.outputConnection && 
                             !block.previousConnection;
            
            if (block.setDisabledReason) {
                // v11+ 建議做法
                block.setDisabledReason(isOrphan, 'orphan');
            } else if (block.setEnabled) {
                block.setEnabled(!isOrphan);
            }
        });
    }
};
