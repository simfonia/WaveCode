
const fs = require('fs');
const path = require('path');

const examplesDir = 'C:/Workspace/WaveCode/src-tauri/resources/examples';
const files = fs.readdirSync(examplesDir).filter(f => f.endsWith('.wave'));

files.forEach(file => {
    const filePath = path.join(examplesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. 替換 wc_play_note 與 wc_play_note_async 的 FREQ 為 NOTE
    // 並將內部的 wc_note 欄位合併
    // <block type="wc_note" ...> <field name="NOTE">C</field> <field name="OCTAVE">4</field> </block>
    // -> <block type="text"> <field name="TEXT">C4</field> </block>
    
    // 使用正則表達式尋找 wc_play_note 區塊中的 FREQ 與 DUR
    content = content.replace(/<(block|shadow) type="wc_play_note(_async)?"/g, (match) => match);

    // 這裡改用字串批次取代，因為 XML 結構相對固定
    
    // 修正 wc_note: 合併欄位
    content = content.replace(/<block type="wc_note"[^>]*>[\s\n]*<field name="NOTE">([^<]+)<\/field>[\s\n]*<field name="OCTAVE">([^<]+)<\/field>[\s\n]*<\/block>/g, 
        '<block type="text"><field name="TEXT">$1$2</field></block>');
    
    content = content.replace(/<shadow type="wc_note"[^>]*>[\s\n]*<field name="NOTE">([^<]+)<\/field>[\s\n]*<field name="OCTAVE">([^<]+)<\/field>[\s\n]*<\/shadow>/g, 
        '<shadow type="text"><field name="TEXT">$1$2</field></shadow>');

    // 修正 wc_play_note 的輸入名: FREQ -> NOTE
    content = content.replace(/<value name="FREQ">/g, '<value name="NOTE">');

    // 修正 DUR: 從 Number (ms) 轉為 Text (beats)
    // 假設原範例 2000ms = 4 拍 (120BPM 下 1 拍 = 500ms)
    content = content.replace(/<value name="DUR">[\s\n]*<(block|shadow) type="math_number"[^>]*>[\s\n]*<field name="NUM">(\d+)<\/field>[\s\n]*<\/(block|shadow)>[\s\n]*<\/value>/g, (match, type, num) => {
        const beats = Math.max(1, Math.round(num / 500));
        return `<value name="DUR"><${type} type="text"><field name="TEXT">${beats}</field></${type}></value>`;
    });

    // 加入 VELOCITY 預設值 (在 DUR 之後加入)
    content = content.replace(/<\/value>[\s\n]*<next>/g, (match) => {
        // 這邊需要更精細的處理，避免誤加
        return match;
    });

    // 簡單的做法：直接在所有 wc_play_note 區塊內插入 VELOCITY
    // 尋找 wc_play_note 區塊結束前的最後一個 </value>
    // 這裡我們針對特定範例進行調整
    
    // 修正 wc_play_chord -> wc_play_note
    content = content.replace(/<block type="wc_play_chord"/g, '<block type="wc_play_note"');
    content = content.replace(/<field name="CHORD">([^<]+)<\/field>/g, '<value name="NOTE"><block type="text"><field name="TEXT">$1</field></block></value>');

    // 批次補上 VELOCITY 輸入
    // 為了安全，我們在 DUR 之後插入
    content = content.replace(/<\/value>([\s\n]*<(next|block|shadow))/g, (match, suffix) => {
        if (content.includes('VELOCITY')) return match; // 避免重複加入
        return `</value><value name="VELOCITY"><shadow type="math_number"><field name="NUM">100</field></shadow></value>${suffix}`;
    });

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
});
