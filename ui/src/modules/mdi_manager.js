/**
 * WaveCode MDI Manager - 負責多文件分頁管理 (對齊 #nyx)
 */
import '../mdi.css';
import { UIUtils } from './ui_utils.js';

export class MDIManager {
    constructor(toolbarManager, blocklyOptions) {
        this.toolbarManager = toolbarManager;
        this.blocklyOptions = blocklyOptions; 
        
        this.tabs = [];
        this.activeTabId = null;

        this.elements = {
            tabBar: document.getElementById('mdi-tab-bar'),
            tabsContainer: document.getElementById('tabs-container'),
            addTabBtn: document.getElementById('add-tab-btn'),
            workspaceContainer: document.getElementById('workspace-container')
        };

        this.init();
    }

    init() {
        this.elements.addTabBtn.onclick = () => this.addNewTab();
    }

    /**
     * 新增分頁與獨立工作區
     */
    addNewTab(title = "未命名專案", isActive = true, initialXml = null) {
        const tabId = 'tab-' + Date.now();
        
        // 1. 建立工作區容器
        const wrapper = document.createElement('div');
        wrapper.id = 'wrapper-' + tabId;
        wrapper.className = 'blockly-wrapper';
        this.elements.workspaceContainer.appendChild(wrapper);

        // 2. 注入獨立的工作區
        const workspace = Blockly.inject(wrapper, this.blocklyOptions);
        
        // 3. 初始化輔助工具 (WaveCode 特化)
        UIUtils.initMinimap(workspace);
        if (UIUtils.initSearch) UIUtils.initSearch(workspace);

        const tab = {
            id: tabId,
            title: title,
            isDirty: false,
            workspace: workspace,
            wrapper: wrapper
        };

        this.tabs.push(tab);
        this.renderTab(tab);

        let helpResetTimeout = null;

        // 綁定變動監聽
        workspace.addChangeListener((e) => {
            if (workspace.isClearing) return;

            if (!e.isUiEvent) {
                if ([Blockly.Events.BLOCK_MOVE, Blockly.Events.BLOCK_CREATE, Blockly.Events.BLOCK_CHANGE, Blockly.Events.BLOCK_DELETE, Blockly.Events.VAR_CREATE, Blockly.Events.VAR_RENAME, Blockly.Events.VAR_DELETE].includes(e.type)) {
                    this.updateTabDirty(tabId, true);
                    if (this.activeTabId === tabId && this.toolbarManager.onWorkspaceChanged) {
                        this.toolbarManager.onWorkspaceChanged();
                    }
                }
            }
            
            // 點擊積木更新輔助說明 (對齊 HarmoNyx)
            let targetBlockId = null;
            if (e.type === Blockly.Events.UI && (e.element === 'click' || e.element === 'selected')) {
                targetBlockId = e.blockId || e.newValue;
            }

            if (targetBlockId && this.activeTabId === tabId) {
                if (helpResetTimeout) {
                    clearTimeout(helpResetTimeout);
                    helpResetTimeout = null;
                }
                const block = workspace.getBlockById(targetBlockId);
                if (block && window.updateVisualHelp) {
                    window.updateVisualHelp(block, this.toolbarManager.currentLang);
                }
            } else if (this.activeTabId === tabId && (e.type === 'selected' || e.type === 'click' || (e.type === Blockly.Events.UI && e.element === 'selected'))) {
                if (helpResetTimeout) clearTimeout(helpResetTimeout);
                helpResetTimeout = setTimeout(() => {
                    if (window.updateVisualHelp) window.updateVisualHelp(null);
                    helpResetTimeout = null;
                }, 200);
            }
        });

        if (isActive) {
            this.switchTab(tabId);
            
            setTimeout(() => {
                workspace.isClearing = true;
                workspace.clear();
                
                if (initialXml) {
                    const dom = Blockly.utils.xml.textToDom(initialXml);
                    Blockly.Xml.domToWorkspace(dom, workspace);
                } else if (this.toolbarManager) {
                    this.toolbarManager.createDefaultBlocks();
                }

                setTimeout(() => {
                    workspace.isClearing = false;
                    Blockly.svgResize(workspace);
                    if (this.toolbarManager.onWorkspaceChanged) this.toolbarManager.onWorkspaceChanged();
                }, 100);
            }, 100);
        }
        
        return tab;
    }

    renderTab(tab) {
        const tabEl = document.createElement('div');
        tabEl.className = 'mdi-tab';
        tabEl.id = tab.id;
        tabEl.innerHTML = `
            <img src="/icons/music_note_24dp_FE2F89.png" class="tab-icon nyx-icon-purple">
            <span class="tab-title">${tab.title}</span>
            <div class="dirty-indicator"></div>
            <div class="tab-close" title="關閉分頁">×</div>
        `;

        tabEl.onclick = (e) => {
            if (e.target.classList.contains('tab-close')) {
                this.closeTab(tab.id);
            } else {
                this.switchTab(tab.id);
            }
        };

        this.elements.tabsContainer.insertBefore(tabEl, this.elements.addTabBtn);
    }

    switchTab(tabId) {
        if (this.activeTabId === tabId) return;

        if (this.activeTabId) {
            const oldTab = this.tabs.find(t => t.id === this.activeTabId);
            if (oldTab) {
                oldTab.wrapper.classList.remove('active');
                document.getElementById(this.activeTabId).classList.remove('active');
            }
        }

        this.activeTabId = tabId;
        const newTab = this.tabs.find(t => t.id === tabId);
        const newTabEl = document.getElementById(tabId);
        
        if (newTab && newTabEl) {
            newTab.wrapper.classList.add('active');
            newTabEl.classList.add('active');
            
            this.toolbarManager.workspace = newTab.workspace;
            this.toolbarManager.currentFilename = newTab.title === "未命名專案" ? "" : newTab.title;
            this.toolbarManager.isDirty = newTab.isDirty;
            this.toolbarManager.setDirty(newTab.isDirty);

            setTimeout(() => {
                Blockly.svgResize(newTab.workspace);
                if (Blockly.common && Blockly.common.setMainWorkspace) {
                    Blockly.common.setMainWorkspace(newTab.workspace);
                }
                newTab.workspace.markFocused(); 

                const focusable = newTab.workspace.getParentSvg().parentNode;
                if (focusable) {
                    focusable.setAttribute('tabindex', '0');
                    focusable.focus({ preventScroll: true });
                }

                if (this.toolbarManager.onWorkspaceChanged) this.toolbarManager.onWorkspaceChanged();
            }, 50);
        }
    }

    updateActiveTabTitle(title) {
        const tab = this.tabs.find(t => t.id === this.activeTabId);
        if (tab) {
            tab.title = title;
            const tabEl = document.getElementById(this.activeTabId);
            if (tabEl) tabEl.querySelector('.tab-title').textContent = title;
        }
    }

    updateTabDirty(tabId, isDirty) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (tab) {
            tab.isDirty = isDirty;
            const tabEl = document.getElementById(tabId);
            if (tabEl) {
                isDirty ? tabEl.classList.add('is-dirty') : tabEl.classList.remove('is-dirty');
            }
            if (this.activeTabId === tabId) {
                this.toolbarManager.isDirty = isDirty;
            }
        }
    }

    updateActiveTabDirty(isDirty) {
        this.updateTabDirty(this.activeTabId, isDirty);
    }

    async closeTab(tabId) {
        const tabIndex = this.tabs.findIndex(t => t.id === tabId);
        if (tabIndex === -1) return;

        const tab = this.tabs[tabIndex];
        if (tab.isDirty) {
            const { ask } = window.__TAURI__.dialog;
            const ok = await ask(`分頁 [${tab.title}] 尚未儲存，確定要關閉嗎？`, { title: '警告', kind: 'warning' });
            if (!ok) return;
        }

        this.tabs.splice(tabIndex, 1);
        tab.wrapper.remove();
        const tabEl = document.getElementById(tabId);
        if (tabEl) tabEl.remove();

        if (this.activeTabId === tabId) {
            if (this.tabs.length > 0) {
                const nextTab = this.tabs[Math.max(0, tabIndex - 1)];
                this.activeTabId = null;
                this.switchTab(nextTab.id);
            } else {
                this.activeTabId = null;
                this.addNewTab();
            }
        }
    }
}
