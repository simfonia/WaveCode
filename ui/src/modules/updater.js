/**
 * WaveCode Updater - 檢查版本與顯示通知 (對齊 #nyx)
 */
import '../updater.css';

export const Updater = {
    GITHUB_REPO: "https://api.github.com/repos/simfonia/WaveCode/releases/latest",
    status: 'hidden',

    // 檢查更新的主函式
    async check(manual = false) {
        const btn = document.getElementById('update-btn');
        const img = btn?.querySelector('img');
        if (!btn || !img) return;

        // 0. 獲取版本號 (從 Tauri 設定檔動態取得)
        let currentVersion = "Unknown";
        try {
            if (window.__TAURI__ && window.__TAURI__.core) {
                currentVersion = await window.__TAURI__.core.invoke('get_version').catch(() => "0.5.0");
            } else {
                currentVersion = "0.5.0 (Dev)";
            }
        } catch (e) {
            currentVersion = "0.5.0";
        }
        
        // 1. 狀態：檢查中 (旋轉)
        Updater.status = 'checking';
        btn.style.display = 'flex'; // 確保按鈕可見
        img.src = '/icons/sync_24dp_EA3323.png';
        img.classList.add('spin-animation');
        btn.classList.remove('bounce-gradient');
        btn.title = "正在檢查更新...";
        this.log(`檢查更新中... (目前版本: ${currentVersion})`);

        try {
            const res = await fetch(this.GITHUB_REPO);
            if (!res.ok) throw new Error('無法連接到更新伺服器');
            const release = await res.json();
            const latestVersion = release.tag_name.replace('v', '');

            console.log(`[Updater] Current: ${currentVersion}, Latest: ${latestVersion}`);

            const cParts = currentVersion.split(/[.-]/).map(v => parseInt(v) || 0);
            const lParts = latestVersion.split(/[.-]/).map(v => parseInt(v) || 0);
            
            let hasUpdate = false;
            for (let i = 0; i < 3; i++) {
                const l = lParts[i] || 0;
                const c = cParts[i] || 0;
                if (l > c) {
                    hasUpdate = true;
                    break;
                }
                if (l < c) {
                    hasUpdate = false;
                    break;
                }
            }

            img.classList.remove('spin-animation');

            if (!hasUpdate) {
                // 2. 狀態：最新版 (對齊 #nyx: 顯示綠色圖示，不隱藏)
                Updater.status = 'latest';
                img.src = '/icons/published_with_changes_24dp_75FB4C.png';
                btn.title = `已是最新版: ${currentVersion}`;
                
                // 點擊可以手動再次檢查
                btn.onclick = () => this.check(true);
                
                this.log(`WaveCode 已是最新版本 (${currentVersion})`);
                
                // 移除自動隱藏邏輯，讓按鈕常駐
                btn.style.display = 'flex';
            } else {
                // 3. 狀態：有新版 (彈跳漸變)
                Updater.status = 'available';
                btn.style.display = 'flex';
                img.src = '/icons/cloud_download_24dp_FE2F89.png';
                btn.classList.add('bounce-gradient');
                btn.title = `發現新版本: ${latestVersion} (目前版本: ${currentVersion})`;
                
                // 點擊開啟網頁
                btn.onclick = async () => {
                    if (window.__TAURI__ && window.__TAURI__.core) {
                        await window.__TAURI__.core.invoke('open_url', { url: release.html_url });
                    } else {
                        window.open(release.html_url, '_blank');
                    }
                };
                
                this.log(`發現新版本: ${latestVersion} (點擊工具列跳動的更新按鈕前往下載)`);
            }
        } catch (e) {
            img.classList.remove('spin-animation');
            this.log(`更新檢查失敗: ${e.message}`);
            // 失敗時顯示勾號但提示錯誤，讓使用者能點擊重試
            img.src = '/icons/published_with_changes_24dp_75FB4C.png';
            btn.title = `更新檢查失敗: ${e.message} (點擊重試)`;
            btn.onclick = () => this.check(true);
        }
    },
    
    // 將訊息發送到日誌面板
    log(msg) {
        const logContainer = document.getElementById('log-container');
        if (logContainer) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.style.color = '#75FB4C'; 
            logEntry.textContent = `[System] ${msg}`;
            logContainer.appendChild(logEntry);
            logContainer.scrollTop = logContainer.scrollHeight;
        }
        console.log(`[Updater] ${msg}`);
    }
};

window.Updater = Updater;
