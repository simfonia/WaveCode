/**
 * WaveCode UI Utilities - 包含 NaN 防護與 Minimap 初始化
 */

export const UIUtils = {
    /**
     * 注入 NaN 防護盾，防止 SVG 屬性寫入無效數值導致 Console 報錯
     */
    injectNaNShield: () => {
        const originalSetAttribute = Element.prototype.setAttribute;
        Element.prototype.setAttribute = function(name, value) {
            if (typeof value === 'string' && value.includes('NaN')) {
                return; // 攔截任何包含 NaN 的屬性設定
            }
            return originalSetAttribute.apply(this, arguments);
        };
    },

    /**
     * 初始化 Minimap 插件
     */
    initMinimap: (workspace) => {
        try {
            const MinimapClass = (window.workspaceMinimap && window.workspaceMinimap.PositionedMinimap) || 
                               (window.PositionedMinimap) || 
                               (Blockly.workspaceMinimap && Blockly.workspaceMinimap.PositionedMinimap);
            if (!MinimapClass) return;
            
            // 猴子補丁：強化插件內部的 NaN 防護
            if (MinimapClass.prototype && !MinimapClass.prototype._patched) {
                const originalUpdate = MinimapClass.prototype.update;
                if (originalUpdate) {
                    MinimapClass.prototype.update = function() {
                        if (this.primaryWorkspace && this.primaryWorkspace.isClearing) return;
                        const metrics = this.primaryWorkspace ? this.primaryWorkspace.getMetrics() : null;
                        if (!metrics || isNaN(metrics.viewWidth) || metrics.viewWidth <= 0) return;
                        try {
                            originalUpdate.apply(this, arguments);
                        } catch (e) {}
                    };
                }
                MinimapClass.prototype._patched = true;
            }

            if (document.querySelector('.blockly-minimap')) return;

            // 確保工作區尺寸已就緒
            const metrics = workspace.getMetrics();
            if (!metrics || isNaN(metrics.viewWidth) || metrics.viewWidth <= 0) {
                setTimeout(() => UIUtils.initMinimap(workspace), 100);
                return;
            }

            const minimap = new MinimapClass(workspace);
            minimap.init();
            
            // 建立切換按鈕
            const mWrapper = document.querySelector('.blockly-minimap');
            if (mWrapper) {
                const toggleBtn = document.createElement('div');
                toggleBtn.id = 'minimap-toggle';
                toggleBtn.innerHTML = '✕';
                document.getElementById('blocklyDiv').appendChild(toggleBtn);
                toggleBtn.onclick = () => {
                    const isCollapsed = mWrapper.classList.toggle('collapsed');
                    toggleBtn.innerHTML = isCollapsed ? '&#128506;' : '✕';
                    if (isCollapsed) mWrapper.style.display = 'none';
                    else { mWrapper.style.display = 'block'; Blockly.svgResize(workspace); }
                };
            }
        } catch (e) { console.warn('Minimap 初始化失敗:', e); }
    }
};
