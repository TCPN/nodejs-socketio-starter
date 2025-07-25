const { removeFromArray } = require("./array.js");
const { enumFromStrings } = require("./enum.js");
const { gameItems } = require("./gameItems.js");
const { getRoomMap, mapObjects } = require("./getRoomMap.js");
const { createLogger } = require("./logger.js");
const { randomPick } = require("./random.js");
const log = createLogger('game');

const { Factions } = require('./client/src/const.js');

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
    const triggers = willTrigger(state, toward);
    for (const trigger of triggers.global ?? []) {
      const name = trigger.text ?? trigger;
      if (name === '看日記') {
        state.messages.push('日記：沒想到下禮拜天就是 40 歲生日了，真是不得了，去拿蛋糕出來放在茶几上準備慶祝吧');
      } else if (name === '拿蛋糕') {
        state.items.push(gameItems.CAKE);
        const fridgeItems = state.maps.room.getFridge().cell.items ??= [];
        removeFromArray(fridgeItems, gameItems.CAKE);
      } else if (name === '放蛋糕') {
        removeFromArray(state.items, gameItems.CAKE);
        const itemsOfTable = state.maps.room.getTable().cell.items ??= [];
        itemsOfTable.push(gameItems.CAKE);
      } else if (name === '撞牆') {
        state.life -= 4;
        state.messages.push('撞牆受傷，扣 4 點生命值');
      } else if (name.startsWith('分數')) {
        const delta = parseInt(name.slice(2));
        state.score += delta;
        state.messages.push(`獲得 ${delta} 分`);
      }
    }
    for (const [target, trigger] of Object.entries(triggers.private ?? {})) {
      const name = trigger.text ?? trigger;
      const targetPlayerIds = getTriggerTargetPlayerIds(state, target);
      if (name.startsWith('分數')) {
        const delta = parseInt(name.slice(2));
        for (const targetPlayerId of targetPlayerIds) {
          state.players[targetPlayerId].score += delta;
          state.players[targetPlayerId].messages ??= [];
          state.players[targetPlayerId].messages.push(`你自己獲得 ${delta} 分`);
        }
      } else if (name === '道具') {
        console.warn('「道具」還沒實作');
      }
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

function getTriggerTargetPlayerIds(state, target) {
  const playerIds = Object.keys(state.players);
  if (target === 'all') {
    return playerIds;
  } else if (Object.keys(Factions).includes(target)) {
    return playerIds.filter((id) => state.players[id].faction === target);
  } else {
    return playerIds.filter((id) => id === target);
  }
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
  const triggers = {};
  switch (cell.t) {
    case '日記':
      triggers.global = ['看日記'];
      break;
    case '冰箱':
      if (cell.items?.includes(gameItems.CAKE)) {
        triggers.global = ['拿蛋糕'];
      }
      break;
    case '几':
      if (state.items?.includes(gameItems.CAKE)) {
        triggers.global = ['放蛋糕'];
      }
      break;
    case '牆':
      triggers.global = ['撞牆'];
      break;
  }
  
  for (let target in cell.triggers ?? {}) {
    triggers.private ??= {};
    triggers.private[target] = cell.triggers[target];
  }
  return triggers;
}

// enum CellType {
//   BLANK,
//   WALL,
// }

function initGameState(players) {
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
    players: Object.fromEntries(players.map((id) => [id, {
      faction: decideFaction(),
      score: 0,
    }])),
    items: [gameItems.CANDLE],
    paused: false,
    end: false,
  };
}

function checkGoal(state) {
  return state.maps.room.getTable()?.cell.items?.includes(gameItems.CAKE);
}

// players

function decideFaction() {
  return randomPick(Object.keys(Factions));
}

module.exports = {
  transformState,
  initGameState,
  getActionInfo,
};