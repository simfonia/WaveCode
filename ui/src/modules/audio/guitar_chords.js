/**
 * Guitar Chords Engine for WaveCode
 * Maps chord symbols to 6-string MIDI notes.
 */

export const GuitarChords = {
    // Standard Tuning: E2, A2, D3, G3, B3, E4
    TUNING: [40, 45, 50, 55, 59, 64],

    // Basic Open & Barre Chords (6th to 1st string)
    // null means the string is not played (X)
    CHORD_DATA: {
        "C": [null, 3, 2, 0, 1, 0],
        "CM7": [null, 3, 2, 0, 0, 0],
        "C7": [null, 3, 2, 3, 1, 0],
        "Cm": [null, 3, 5, 5, 4, 3],
        "D": [null, null, 0, 2, 3, 2],
        "DM7": [null, null, 0, 2, 2, 2],
        "D7": [null, null, 0, 2, 1, 2],
        "Dm": [null, null, 0, 2, 3, 1],
        "Dm7": [null, null, 0, 2, 1, 1],
        "E": [0, 2, 2, 1, 0, 0],
        "EM7": [0, 2, 1, 1, 0, 0],
        "E7": [0, 2, 0, 1, 0, 0],
        "Em": [0, 2, 2, 0, 0, 0],
        "Em7": [0, 2, 0, 0, 0, 0],
        "F": [1, 3, 3, 2, 1, 1],
        "FM7": [null, null, 3, 2, 1, 0],
        "F7": [1, 3, 1, 2, 1, 1],
        "Fm": [1, 3, 3, 1, 1, 1],
        "G": [3, 2, 0, 0, 0, 3],
        "GM7": [3, 2, 0, 0, 0, 2],
        "G7": [3, 2, 0, 0, 0, 1],
        "Gm": [3, 5, 5, 3, 3, 3],
        "A": [null, 0, 2, 2, 2, 0],
        "AM7": [null, 0, 2, 1, 2, 0],
        "A7": [null, 0, 2, 0, 2, 0],
        "Am": [null, 0, 2, 2, 1, 0],
        "Am7": [null, 0, 2, 0, 1, 0],
        "B": [null, 2, 4, 4, 4, 2],
        "B7": [null, 2, 1, 2, 0, 2],
        "Bm": [null, 2, 4, 4, 3, 2],
        "Bm7": [null, 2, 0, 2, 0, 2]
    },

    /**
     * Get 6-string MIDI notes for a chord symbol
     * @param {string} symbol - E.g. "C", "Am", "F#7"
     * @returns {number[]} Array of 6 MIDI numbers (or null for muted strings)
     */
    getNotes: function(symbol) {
        if (!symbol) return null;
        
        // 1. 聰明規範化：根音(第一字)轉大寫，其餘保留
        let root = symbol[0].toUpperCase();
        let rest = symbol.slice(1);
        
        // 處理升降號轉義 (s/S -> #, B -> b)
        rest = rest.replace(/[sS]/g, '#').replace(/[B]/g, 'b');
        
        let name = root + rest;
        
        // 2. 直接匹配
        if (this.CHORD_DATA[name]) {
            return this._calculateMidi(this.CHORD_DATA[name]);
        }
        
        // 3. 處理升降號自動移調 (例如輸入 C# 會找 C 並 +1)
        if (name.length > 1 && (name[1] === '#' || name[1] === 'b')) {
            const r = name.slice(0, 1);
            const accidental = name[1];
            const type = name.slice(2);
            const offset = (accidental === '#') ? 1 : -1;
            const baseChord = r + type;
            if (this.CHORD_DATA[baseChord]) {
                return this._calculateMidi(this.CHORD_DATA[baseChord], offset);
            }
        }
        
        // 4. 回退機制
        return this._calculateMidi(this.CHORD_DATA["C"]);
    },

    _calculateMidi: function(frets, offset = 0) {
        return frets.map((fret, i) => {
            if (fret === null) return null;
            return this.TUNING[i] + fret + offset;
        });
    }
};
