const vm = require('vm');
const readline = require('readline');

const { toggleVerbose } = require("./logger");

let getEvalContextFn = () => {};

// 啟動 stdin 鍵盤監聽功能
function setupKeyboardShortcuts(getEvalContext) {
  getEvalContextFn = getEvalContext;

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', onKey);

  console.log('[🔑] 可按鍵盤啟動功能：v（verbose）、h（help）、e（eval）、Ctrl+C（結束）');
}

function onKey(key) {
  console.log('[keyboard detect] pressed', key);
  if (key === '\u0003') { // ctrl+c
    console.log('\n[!] 偵測 Ctrl+C，伺服器即將關閉...');
    process.exit();
  }
  if (key === 'h') {
    console.log(`[h] 功能鍵：
  - v：切換 verbose mode
  - e：輸入一行程式碼（eval）
  - h：顯示這份說明
  - Ctrl+C：退出伺服器`);
  }
  if (key === 'v') {
    const mode = toggleVerbose();
    console.log('[v] verbose mode', mode ? 'on' : 'off');
  }
  if (key === 'e') {
    promptEval();
  }
}

function promptEval() {
  // 暫時停用 raw mode
  process.stdin.setRawMode(false);
  process.stdin.pause(); // 避免 readline 和 stdin 衝突

  const context = getEvalContextFn();
  const sandbox = vm.createContext(context);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('[e] 請輸入要執行的指令：', (input) => {
    try {
      const result = vm.runInContext(input, sandbox);
      console.log('[e] 執行結果:', result);
    } catch (err) {
      console.error('[e] 錯誤:', err);
    }

    rl.close();
    // 恢復 raw mode 和 keyboard 監聽
    process.stdin.setRawMode(true);
    process.stdin.resume();
  });
}

module.exports = {
  setupKeyboardShortcuts,
};