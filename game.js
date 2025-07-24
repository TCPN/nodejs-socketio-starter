const { removeFromArray } = require("./array.js");
const { enumFromStrings } = require("./enum.js");
const { gameItems } = require("./gameItems.js");
const { getRoomMap, mapObjects } = require("./getRoomMap.js");
const { createLogger } = require("./logger.js");
const log = createLogger('game');

const Direction = enumFromStrings([
  'U',
  'L',
  'D',
  'R',
]);

function transformState(state, action) {
  if (state === null) {
    return {}
  }
  if (action in Direction) {
    state.messages = [];
    const position = getCurrentPositionState(state);
    const map = getCurrentMap(state);
    const toward = getTowardPosition(position.pos, action);
    if (canGoto(map, toward)) {
      position.pos = toward;
    }
    const trigger = willTrigger(state, toward);
    switch (trigger) {
      case '看日記':
        state.messages.push('沒想到下禮拜天就是 40 歲生日了，真是不得了，去拿蛋糕出來放在茶几上準備慶祝吧');
        break;
      case '拿蛋糕': {
        state.items.push(gameItems.CAKE);
        const fridgeItems = state.maps.room.getFridge().cell.items ??= [];
        removeFromArray(fridgeItems, gameItems.CAKE);
      }
      break;
      case '放蛋糕': {
        removeFromArray(state.items, gameItems.CAKE);
        const itemsOfTable = state.maps.room.getTable().cell.items ??= [];
        itemsOfTable.push(gameItems.CAKE);
      }
      case '撞牆':
        state.life -= 4;
        state.messages.push('撞牆受傷，扣 4 點生命值');
        break;
    }
  }
  const finishGoal = checkGoal(state);
  if (finishGoal) {
    state.end = 'success';
  } else if (state.life <= 0) {
    state.end = 'failed';
  }
  return state;
}

function getActionInfo(state, action) {
  if (!(action in Direction)) {
    return;
  }
  const position = getCurrentPositionState(state);
  if (!position) {
    return;
  }
  const map = state.maps[position.map];
  const [r, c] = position.pos;
  const toward = getTowardPosition(position.pos, action);
  return {
    canGo: canGoto(map, toward),
    willTrigger: willTrigger(state, toward),
  };
}

function getTowardPosition([r, c], direction) {
  switch (direction) {
    case Direction.U:
      return [r - 1, c];
    case Direction.L:
      return [r, c - 1];
    case Direction.D:
      return [r + 1, c];
    case Direction.R:
      return [r, c + 1];
  }
}

function getCurrentPositionState(state) {
  const position = state.position.at(-1);
  if (!position) {
    console.error('game state lacks position info');
    return;
  }
  return position;
}

function getCurrentMap(state) {
  const position = getCurrentPositionState(state);
  if (!position) {
    return;
  }
  const map = state.maps[position.map];
  return map;
}

function canGoto(map, pos) {
  const [r, c] = pos;
  const cell = map.cells[r][c];
  if (mapObjects[cell.t]?.block || cell.block) {
    return false;
  }
  if (r < 0 || r >= map.height || c < 0 || c >= map.width) {
    return false;
  }
  return true;
}

function willTrigger(state, pos) {
  const map = getCurrentMap(state);
  const [r, c] = pos;
  const cell = map.cells[r][c];
  switch (cell.t) {
    case '日記':
      return '看日記';
    case '冰箱':
      if (cell.items?.includes(gameItems.CAKE)) {
        return '拿蛋糕';
      }
      return null;
    case '几':
      if (state.items?.includes(gameItems.CAKE)) {
        return '放蛋糕';
      }
      return null;
    case '牆':
      return '撞牆';
  }
  
  return null;
}

// enum CellType {
//   BLANK,
//   WALL,
// }

function initGameState() {
  return {
    maps: {
      room: getRoomMap(),
    },
    position: [{
      map: 'room',
      pos: [20, 20],
    }],
    score: 0,
    life: 40,
    items: [gameItems.CANDLE],
    paused: false,
    end: false,
  };
}

function checkGoal(state) {
  return state.maps.room.getTable()?.cell.items?.includes(gameItems.CAKE);
}

module.exports = {
  transformState,
  initGameState,
  getActionInfo,
};