/**
 * WaveCode Developer Tools - 積木圖示匯出工具 (v10 - 徹底修復停用積木視覺)
 */
import { WaveCodeToolbox } from './toolbox.js';

export const BlockExporter = {
    _jszipLoaded: false,
    _isExporting: false,

    _loadJSZip: async () => {
        if (window.JSZip) return window.JSZip;
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.crossOrigin = "anonymous";
            script.onload = () => {
                BlockExporter._jszipLoaded = true;
                resolve(window.JSZip);
            };
            script.onerror = () => {
                if (window.LogManager) window.LogManager.appendLog("JSZip 載入失敗，將改為個別下載模式。", "error");
                resolve(null);
            };
            document.head.appendChild(script);
        });
    },

    _isMutator: (type) => {
        const patterns = [
            '_mutator', '_item', '_container', '_if', '_elseif', '_else', '_arg',
            'logic_compare_type', 'logic_operation_type', 'math_number_property',
            'text_create_join'
        ];
        return patterns.some(p => type.includes(p));
    },

    _getToolboxBlockDefs: (contents, defs = []) => {
        if (!contents) return defs;
        contents.forEach(item => {
            if (item.kind === 'block' || item.kind === 'shadow') {
                defs.push(item);
                if (item.inputs) {
                    Object.values(item.inputs).forEach(input => {
                        if (input.shadow) BlockExporter._getToolboxBlockDefs([input.shadow], defs);
                        if (input.block) BlockExporter._getToolboxBlockDefs([input.block], defs);
                    });
                }
            } else if (item.contents) {
                BlockExporter._getToolboxBlockDefs(item.contents, defs);
            }
        });
        return defs;
    },

    initUI: () => {
        if (document.getElementById('block-exporter-ui')) return;
        const btn = document.createElement('div');
        btn.id = 'block-exporter-ui';
        btn.innerHTML = `
            <div id="export-btn" title="匯出積木資產" style="
                position: fixed; left: 20px; bottom: 20px; z-index: 9999;
                width: 42px; height: 42px; border-radius: 50%;
                background: var(--nyx-purple); box-shadow: 0 0 15px var(--nyx-purple-glow);
                display: flex; align-items: center; justify-content: center; cursor: pointer;
                transition: all 0.3s; border: 2px solid rgba(255,255,255,0.2);
            ">
                <img src="/icons/download_24dp_FE2F89.png" style="width: 24px; filter: brightness(2) contrast(1.2);">
                <div id="export-progress" style="
                    position: absolute; top: -30px; left: 50%; transform: translateX(-50%);
                    background: rgba(0,0,0,0.8); color: white; padding: 4px 8px;
                    border-radius: 4px; font-size: 11px; display: none; white-space: nowrap;
                ">0%</div>
            </div>
        `;
        document.body.appendChild(btn);

        const mainBtn = btn.querySelector('#export-btn');
        const progressEl = btn.querySelector('#export-progress');

        mainBtn.onclick = async () => {
            if (BlockExporter._isExporting) return;
            BlockExporter._isExporting = true;
            mainBtn.style.opacity = '0.5';
            progressEl.style.display = 'block';
            try {
                await BlockExporter.exportAll((p) => { progressEl.textContent = `${p}%`; });
            } catch (e) {
                if (window.LogManager) window.LogManager.appendLog(`匯出失敗: ${e.message}`, "error");
            } finally {
                BlockExporter._isExporting = false;
                mainBtn.style.opacity = '1';
                progressEl.style.display = 'none';
            }
        };
    },

    // 共享的 CSS 樣式定義，確保兩處匯出邏輯完全一致
    _getExportCSS: () => {
        let cssText = '';
        document.querySelectorAll('style').forEach(el => cssText += el.textContent + '\n');
        
        // 如果沒抓到 Blockly 核心樣式，補一下
        if (!cssText.includes('blocklyText') && Blockly.Css && Blockly.Css.CONTENT) {
            cssText += Blockly.Css.CONTENT.join('\n');
        }

        cssText += `
            :root { --nyx-purple-glow: #e056fd; --nyx-purple: #9b59b6; --nyx-text: #dfe6e9; }
            
            /* 基礎文字與排版 */
            .blocklyText, .blocklyDropdownText { 
                fill: #ffffff !important; 
                font-family: 'Inter', sans-serif !important; 
                font-size: 11pt !important; /* 文字大小 */
            }
            .blocklyEditableText .blocklyText, .blocklyEditableText tspan { fill: #1a1a1a !important; }
            
            /* 欄位背景 */
            .blocklyFieldRect { 
                fill: #ffffff !important; 
                fill-opacity: 0.1 !important; 
                stroke: rgba(255,255,255,0.1) !important; 
            }

            /* --- 關鍵修正：停用積木視覺 --- */
            /* 使用暴力選擇器涵蓋所有可能的停用類別 */
            .blocklyDisabled .blocklyPath,
            .blocklyDisabledPattern .blocklyPath,
            [class*="Disabled"] .blocklyPath {
                fill: #333333 !important;
                fill-opacity: 0.2 !important;
                stroke: #666666 !important;
                stroke-width: 1px !important;
                filter: none !important;
            }
            
            .blocklyDisabled .blocklyText,
            .blocklyDisabledPattern .blocklyText,
            [class*="Disabled"] .blocklyText {
                fill: #888888 !important;
                fill-opacity: 1 !important;
            }

            /* 影子積木修正 */
            .blocklyShadowBlock > .blocklyPath { fill-opacity: 0.6 !important; stroke-opacity: 0.8 !important; }
            .blocklyShadowBlock .blocklyText { fill: #1a1a1a !important; }
            .blocklyPath { stroke-width: 1px !important; }
        `;
        return cssText;
    },

    exportAll: async (onProgress) => {
        const logger = window.LogManager;
        if (logger) logger.appendLog(">>> 開始積木資產匯出任務 <<<");

        const JSZip = await BlockExporter._loadJSZip();
        const zip = JSZip ? new JSZip() : null;
        const folders = zip ? {
            'Toolbox': { svg: zip.folder("Toolbox/svg"), png: zip.folder("Toolbox/png") },
            'Mutators': { svg: zip.folder("Mutators/svg"), png: zip.folder("Mutators/png") },
            'Residuals': { svg: zip.folder("Residuals/svg"), png: zip.folder("Residuals/png") }
        } : null;

        const toolboxDefs = BlockExporter._getToolboxBlockDefs(WaveCodeToolbox.contents);
        const defMap = new Map();
        toolboxDefs.forEach(def => { if (!defMap.has(def.type)) defMap.set(def.type, def); });

        const allTypes = Object.keys(Blockly.Blocks).filter(type => {
            return !type.includes('placeholder') && !type.startsWith('template_');
        });

        const finalTaskQueue = [];
        const stats = { Toolbox: 0, Mutators: 0, Residuals: 0 };

        allTypes.forEach(type => {
            if (defMap.has(type)) {
                finalTaskQueue.push({ type, def: defMap.get(type), category: 'Toolbox' });
                stats.Toolbox++;
            } else if (BlockExporter._isMutator(type)) {
                finalTaskQueue.push({ type, def: { type }, category: 'Mutators' });
                stats.Mutators++;
            } else {
                finalTaskQueue.push({ type, def: { type }, category: 'Residuals' });
                stats.Residuals++;
            }
        });

        if (logger) logger.appendLog(`掃描完成，共有 ${finalTaskQueue.length} 個積木待處理...`);
        
        const container = document.createElement('div');
        container.id = 'block-exporter-temp';
        container.style.width = '2000px'; container.style.height = '2000px';
        container.style.position = 'absolute'; container.style.left = '-5000px';
        document.body.appendChild(container);

        const workspace = Blockly.inject(container, {
            readOnly: false, theme: Blockly.Themes.Classic, renderer: 'geras'
        });

        for (let i = 0; i < finalTaskQueue.length; i++) {
            const task = finalTaskQueue[i];
            try {
                if (task.type.includes('procedures_call')) {
                    const defType = task.type.includes('return') ? 'procedures_defreturn' : 'procedures_defnoreturn';
                    const d = workspace.newBlock(defType);
                    d.setFieldValue('my_function', 'NAME');
                }

                const assets = await BlockExporter.getAssets(workspace, task.def);
                if (assets) {
                    if (zip) {
                        folders[task.category].svg.file(`${task.type}.svg`, assets.svg);
                        folders[task.category].png.file(`${task.type}.png`, assets.png);
                    } else {
                        BlockExporter._download(assets.svg, `[${task.category}]_${task.type}.svg`);
                        BlockExporter._download(assets.png, `[${task.category}]_${task.type}.png`);
                    }
                }
                workspace.clear();
                if (onProgress) onProgress(Math.round(((i + 1) / finalTaskQueue.length) * 100));
            } catch (e) {
                // 僅在發生錯誤時印出 Log
                if (logger) logger.appendLog(`失敗 ${task.type}: ${e.message}`, "error");
            }
        }

        if (zip) {
            if (logger) logger.appendLog("正在生成 ZIP 壓縮檔...");
            const content = await zip.generateAsync({ type: "blob" });
            BlockExporter._download(content, `WaveCode_Assets_Pack_${new Date().getTime()}.zip`);
        }

        workspace.dispose();
        document.body.removeChild(container);
        
        if (logger) {
            logger.appendLog(`------------------------------------`);
            logger.appendLog(`匯出總結報表:`);
            logger.appendLog(`- 正式積木 (Toolbox): ${stats.Toolbox}`);
            logger.appendLog(`- 輔助積木 (Mutators): ${stats.Mutators}`);
            logger.appendLog(`- 殘留積木 (Residuals): ${stats.Residuals}`);
            logger.appendLog(`>>> 全部資產匯出任務已完成 <<<`);
        }
    },

    getAssets: async (workspace, def) => {
        let block;
        try {
            if (def.kind || def.inputs) {
                block = Blockly.serialization.blocks.append(def, workspace);
            } else {
                block = workspace.newBlock(def.type);
            }
            if (def.type.includes('procedures_call')) block.setFieldValue('my_function', 'NAME');
            block.initSvg();
            block.render();
        } catch (e) { return null; }

        const bbox = block.getHeightWidth();
        const padding = 20;
        const width = bbox.width + padding * 2;
        const height = bbox.height + padding * 2;

        const svgElement = block.getSvgRoot().cloneNode(true);
        const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        wrapper.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        wrapper.setAttribute('width', width);
        wrapper.setAttribute('height', height);
        wrapper.setAttribute('viewBox', `-${padding} -${padding} ${width} ${height}`);
        
        const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        style.textContent = BlockExporter._getExportCSS();
        wrapper.appendChild(style);
        wrapper.appendChild(svgElement);

        const svgData = new XMLSerializer().serializeToString(wrapper);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });

        const canvas = document.createElement('canvas');
        canvas.width = width * 2; canvas.height = height * 2;
        const ctx = canvas.getContext('2d'); ctx.scale(2, 2);

        const img = new Image();
        const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        const pngBlob = await new Promise((resolve) => {
            img.onload = () => { ctx.drawImage(img, 0, 0); canvas.toBlob(resolve); };
            img.onerror = () => resolve(null); img.src = url;
        });

        return { svg: svgBlob, png: pngBlob };
    },

    _download: (blob, filename) => {
        if (!blob) return;
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = filename; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },

    /**
     * 將整個工作區匯出為 SVG 或 PNG
     */
    exportWorkspace: async (workspace, format = 'svg') => {
        if (!workspace) return;
        const logger = window.LogManager;
        if (logger) logger.appendLog(`正在準備工作區 ${format.toUpperCase()} 匯出...`);

        const canvas = workspace.getCanvas();
        const svgElement = canvas.cloneNode(true);
        svgElement.removeAttribute('transform');

        const blocks = workspace.getAllBlocks(false);
        if (blocks.length === 0) {
            if (logger) logger.appendLog("工作區是空的，取消匯出。", "error");
            return;
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        blocks.forEach(block => {
            const bbox = block.getRelativeToSurfaceXY();
            const size = block.getHeightWidth();
            minX = Math.min(minX, bbox.x);
            minY = Math.min(minY, bbox.y);
            maxX = Math.max(maxX, bbox.x + size.width);
            maxY = Math.max(maxY, bbox.y + size.height);
        });

        const padding = 40;
        const width = (maxX - minX) + padding * 2;
        const height = (maxY - minY) + padding * 2;

        const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        wrapper.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        wrapper.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        wrapper.setAttribute('width', width);
        wrapper.setAttribute('height', height);
        wrapper.setAttribute('viewBox', `${minX - padding} ${minY - padding} ${width} ${height}`);
        
        const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        style.textContent = BlockExporter._getExportCSS();
        wrapper.appendChild(style);
        wrapper.appendChild(svgElement);

        const svgData = new XMLSerializer().serializeToString(wrapper);

        if (format === 'svg') {
            const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            BlockExporter._download(blob, `WaveCode_Project_${new Date().getTime()}.svg`);
        } else {
            // --- 高品質 PNG 轉換 ---
            const scale = 2; // 2x 高解析度
            const exportCanvas = document.createElement('canvas');
            exportCanvas.width = width * scale;
            exportCanvas.height = height * scale;
            const ctx = exportCanvas.getContext('2d');
            
            // 1. 鋪上背景色
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
            ctx.scale(scale, scale);

            const img = new Image();
            const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
            await new Promise((resolve) => {
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    exportCanvas.toBlob((blob) => {
                        BlockExporter._download(blob, `WaveCode_Project_${new Date().getTime()}.png`);
                        resolve();
                    });
                };
                img.src = url;
            });
        }
        if (logger) logger.appendLog(`工作區 ${format.toUpperCase()} 匯出完成！`);
    }
};
