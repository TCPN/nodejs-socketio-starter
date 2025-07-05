const { toggleVerbose } = require("./logger");

// 啟動 stdin 鍵盤監聽功能
function setupKeyboardShortcuts() {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', (key) => {
    console.log('[keyboard detect] pressed', key);
    if (key === '\u0003') { // ctrl+c
      console.log('\n[!] 偵測 Ctrl+C，伺服器即將關閉...');
      process.exit();
    }
    if (key === 'v') {
      const mode = toggleVerbose();
      console.log('[v] verbose mode', mode ? 'on' : 'off')
    }
    if (key === 'h') {
      console.log(`[h] 功能鍵：
    - v：切換 verbose mode
    - h：顯示這份說明
    - Ctrl+C：退出伺服器`);
    }
  });

  console.log('[🔑] 可按鍵盤啟動功能：v（verbose）、h（help）、Ctrl+C（結束）');
}

module.exports = {
  setupKeyboardShortcuts,
};