/**
 * WaveCode API Serial Module
 * 負責序列埠通訊、邊緣偵測與 TTP229 處理。
 */
export const ApiSerial = {
    _serialPort: null,
    _serialRaw: "",
    _serialFields: {},
    _lastFields: {},
    _serialHandlers: [],

    listSerialPorts: async function() { return await this.getInvoke()('list_serial_ports'); },
    
    openSerial: async function(port, baud) {
        try {
            await this.getInvoke()('open_serial', { portName: port, baudRate: parseInt(baud) });
            this._serialPort = port;
        } catch (err) { throw err; }
    },

    closeSerial: async function() { 
        await this.getInvoke()('close_serial'); 
        this._serialPort = null; 
    },

    isTtpTriggered: function(prefix, keyIndex) {
        const current = this._serialFields[prefix] || "0000000000000000";
        const last = this._lastFields[prefix] || "0000000000000000";
        return current[keyIndex-1] === '1' && last[keyIndex-1] === '0';
    },

    getSerialField: function(prefix) { return this._serialFields[prefix] || ""; },
    
    registerSerialHandler: function(h) { this._serialHandlers.push(h); },

    handleSerialData: function(data) {
        if (!data || data === this._serialRaw) return;
        this._serialRaw = data;
        let prefix = "RAW", value = data;
        if (data.includes(":")) { 
            const pts = data.split(":"); 
            prefix = pts[0]; 
            value = pts[1]; 
        } else if (data === "Kick") { 
            prefix = "EVENT"; 
            value = "Kick"; 
        }
        this._lastFields[prefix] = this._serialFields[prefix] || value;
        this._serialFields[prefix] = value;
        this._serialHandlers.forEach(h => { 
            try { h(data, this._execId); } catch (e) {} 
        });
    }
};
