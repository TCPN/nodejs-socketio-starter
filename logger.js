const createDebug = require('debug');

let verboseMode = false;
const loggers = {};

function createLogger(name) {
  if (!loggers[name]) {
    loggers[name] = createDebug(name);
    loggers[name].enabled = verboseMode;
  }
  return loggers[name];
}

function setVerbose(enabled) {
  verboseMode = enabled;
  // 開啟或關閉所有 debug instance 的 enabled 狀態
  Object.values(loggers).forEach((logger) => {
    logger.enabled = enabled;
  });
  return verboseMode;
}

function isVerboseMode() {
  return verboseMode;
}

function toggleVerbose() {
  return setVerbose(!verboseMode);
}

// basic logger

const basicLogger = createLogger('log');

module.exports = {
  isVerboseMode,
  toggleVerbose,
  setVerbose,
  createLogger,
  log: basicLogger,
};