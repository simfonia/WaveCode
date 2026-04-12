/**
 * WaveCode Recorder - 終極穩定版
 * 確保 destNode 在 IDE 啟動期間永久存續，防止重置引擎時斷開。
 */

export const Recorder = {
    ctx: null,
    destNode: null,
    mediaRecorder: null,
    audioChunks: [],
    isRecording: false,
    startTime: 0,
    onStatusChange: null,

    init(context) {
        // 如果 context 沒變且 destNode 已存在，則跳過
        if (this.destNode && this.ctx === context) return;
        
        this.ctx = context;
        try {
            this.destNode = this.ctx.createMediaStreamDestination();
            console.log("WaveCode Recorder: DestNode Created Successfully");
        } catch (e) {
            console.error("WaveCode Recorder: Failed to create DestNode", e);
        }
    },

    getInputNode() {
        return this.destNode;
    },

    start() {
        if (this.isRecording) return;
        if (!this.destNode) {
            console.error("WaveCode Recorder: Cannot start, destNode is missing!");
            return;
        }
        
        this.audioChunks = [];
        const stream = this.destNode.stream;
        
        let mimeType = 'audio/ogg;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/webm;codecs=opus';
        }

        try {
            this.mediaRecorder = new MediaRecorder(stream, { mimeType });
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                const duration = Date.now() - this.startTime;
                if (duration < 500) {
                    console.warn("WaveCode Recorder: Recording too short (<500ms), skipping save.");
                    return;
                }
                this.exportFile(mimeType);
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.startTime = Date.now();
            console.log(`WaveCode Recorder: Recording session started (${mimeType})`);
            
            if (this.onStatusChange) this.onStatusChange('recording');
        } catch (e) {
            console.error("WaveCode Recorder: MediaRecorder Start Error", e);
        }
    },

    stop() {
        if (!this.isRecording || !this.mediaRecorder) return;
        
        this.mediaRecorder.stop();
        this.isRecording = false;
        console.log("WaveCode Recorder: Recording session stopped.");
        
        if (this.onStatusChange) this.onStatusChange('idle');
    },

    exportFile(mimeType) {
        if (this.audioChunks.length === 0) return;
        const blob = new Blob(this.audioChunks, { type: mimeType });
        this.download(blob);
    },

    async download(blob) {
        const now = new Date();
        const timestamp = now.getFullYear() + 
                         String(now.getMonth() + 1).padStart(2, '0') + 
                         String(now.getDate()).padStart(2, '0') + "_" +
                         String(now.getHours()).padStart(2, '0') +
                         String(now.getMinutes()).padStart(2, '0') +
                         String(now.getSeconds()).padStart(2, '0');
        
        const fileName = `WaveCode_Record_${timestamp}.ogg`;

        if (window.__TAURI__ && window.__TAURI__.dialog) {
            try {
                const { save } = window.__TAURI__.dialog;
                const { writeFile } = window.__TAURI__.fs;
                
                const filePath = await save({
                    defaultPath: fileName,
                    filters: [{ name: 'Audio', extensions: ['ogg'] }]
                });

                if (filePath) {
                    const arrayBuffer = await blob.arrayBuffer();
                    await writeFile(filePath, new Uint8Array(arrayBuffer));
                    console.log("WaveCode Recorder: Saved successfully to", filePath);
                }
            } catch (e) {
                console.error("WaveCode Recorder: Tauri save failed", e);
                this.browserDownload(blob, fileName);
            }
        } else {
            this.browserDownload(blob, fileName);
        }
    },

    browserDownload(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(url);
    }
};
