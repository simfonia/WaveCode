/**
 * WaveCode Updater - 檢查版本與顯示通知 (對齊 #nyx)
 */
import '../updater.css';

export const Updater = {
    GITHUB_REPO: "https://github.com/simfonia/WaveCode",
    CURRENT_VERSION: "0.1.0",
    status: 'hidden',

    check: async (currentAppVersion, manual = false) => {
        const btn = document.getElementById('update-btn');
        const img = btn?.querySelector('img');
        const badge = btn?.querySelector('.update-badge');
        if (!btn || !img) return;

        Updater.status = 'checking';
        btn.classList.remove('update-hidden', 'bounce-gradient', 'has-update');
        img.classList.add('spin-animation');
        img.src = "/icons/published_with_changes_24dp_75FB4C.png"; 
        btn.title = "正在檢查更新...";

        try {
            // 模擬檢查延遲
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // 這裡未來可以對接 GitHub API
            const hasUpdate = manual; 

            img.classList.remove('spin-animation');

            if (hasUpdate) {
                Updater.status = 'available';
                btn.classList.add('bounce-gradient', 'has-update');
                img.src = "/icons/published_with_changes_24dp_75FB4C.png"; 
                btn.title = `發現新版本！點擊前往下載 (目前: ${currentAppVersion || Updater.CURRENT_VERSION})`;
            } else {
                Updater.status = 'latest';
                btn.title = `WaveCode 已是最新版本 (${currentAppVersion || Updater.CURRENT_VERSION})`;
                if (!manual) {
                    setTimeout(() => { if(Updater.status === 'latest') btn.classList.add('update-hidden'); }, 3000);
                }
            }
        } catch (e) {
            btn.classList.add('update-hidden');
        }
    }
};

window.Updater = Updater;
