/**
 * WaveCode Generator: System & Lifecycle
 * Injects interruption checks into loops.
 */

const patchGenerator = (blockType) => {
  const original = Blockly.JavaScript.forBlock[blockType];
  if (!original) return;
  Blockly.JavaScript.forBlock[blockType] = function(block) {
    const code = original.call(this, block);
    // 在第一個左大括號後注入檢查，確保循環可被中斷
    return code.replace('{', '{\n  WaveCode.isAlive(_id);');
  };
};

// 延遲執行，確保基礎產生器已載入
setTimeout(() => {
  ['controls_repeat_ext', 'controls_whileUntil', 'controls_for', 'controls_forEach'].forEach(patchGenerator);
}, 100);
