const { removeFromArray } = require("./array.js");
const { createLogger } = require("./logger.js");
const { randomPick } = require("./random.js");
const log = createLogger('game');

const { gameItems } = require("./gameItems.js");
const { getRoomMap, isCellBlocking } = require("./getRoomMap.js");
const { Factions } = require('./client/src/const.js');
const { Direction } = require("./game/types.js");

/**
 * @import { PlayerID, PlayerFaction } from './types';
 */

/** @typedef {Direction} GameAction */

/**
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameState}
 */
function transformState(state, action) {
  if (!(action in Direction)) {
    console.error('Invalid action:', action);
    return state;
  }
  state.messages = [];
  const position = getCurrentPosition(state);
  const map = getCurrentMap(state);
  const toward = getTowardPosition(position.pos, action);
  if (canGoto(map, toward)) {
    position.pos = toward;
  }
  const effects = willTrigger(state, toward);
  for (const effect of effects.global ?? []) {
    const name = effect.text ?? effect;
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

  for (const [target, effect] of Object.entries(effects.private ?? {})) {
    const name = effect.text ?? effect;
    const targetPlayerIds = getEffectTargetPlayerIds(state, target);
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

  const finishGoal = checkGoal(state);
  if (finishGoal) {
    state.end = 'success';
  } else if (state.life <= 0) {
    state.end = 'failed';
  }

  return state;
}

/**
 *
 * @param {GameState} state
 * @param {PlayerID | PlayerFaction | 'all'} target
 * @returns
 */
function getEffectTargetPlayerIds(state, target) {
  const playerIds = Object.keys(state.players);
  if (target === 'all') {
    return playerIds;
  } else if (Object.keys(Factions).includes(target)) {
    return playerIds.filter((id) => state.players[id].faction === target);
  } else {
    return playerIds.filter((id) => id === target);
  }
}

/** @typedef {{ canGo: boolean, willTrigger: ReturnType<typeof willTrigger> }} GameActionInfo */

/**
 * @param {GameState} state
 * @param {GameAction} action
 * @returns {GameActionInfo | undefined}
 */
function getActionInfo(state, action) {
  if (!(action in Direction)) {
    return;
  }
  const position = getCurrentPosition(state);
  if (!position) {
    return;
  }
  const map = getMap(state, position.map);
  const toward = getTowardPosition(position.pos, action);
  return {
    canGo: canGoto(map, toward),
    willTrigger: willTrigger(state, toward),
  };
}

/**
 * @param {Coord} coord
 * @param {Direction} direction
 * @returns {Coord}
 */
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


/**
 * @param {GameState} state
 * @returns {Cell | null}
 */
function getCurrentCell(state) {
  return getCurrentCellWithPosition(state)?.cell ?? null;
}

/** @typedef {{ mapId: RoomEnum, row: number, col: number, cell: Cell | null }} CellWithPosition */

/**
 * @param {GameState} state
 * @returns {CellWithPosition}
 */
function getCurrentCellWithPosition(state) {
  const position = getCurrentPosition(state);
  if (!position) {
    console.error('game state lacks character position info');
  }
  const mapId = position?.map ?? 'main';
  const map = getMap(state, mapId);
  const coord = position?.pos ?? map?.getDefaultCoord();
  const cell = (map.cells?.at(coord[0])?.at([coord[1]])) ?? null;
  if (!cell) {
    console.error('character not in a cell');
  }
  return {
    mapId: mapId,
    row: coord[0],
    col: coord[1],
    cell: cell,
  };
}

/**
 * @param {GameState} state
 * @returns {Position | undefined}
 */
function getCurrentPosition(state) {
  const position = state.position.at(-1);
  if (!position) {
    console.error('game state lacks character position info');
    return;
  }
  return position;
}

/**
 * @param {GameState} state
 * @returns {GameMap | undefined}
 */
function getCurrentMap(state) {
  const position = getCurrentPosition(state);
  if (!position) {
    return;
  }
  const map = getMap(state, position.map);
  return map;
}

/**
 * @param {GameState} state
 * @param {RoomEnum} mapId
 * @returns {GameMap | undefined}
 */
function getMap(state, mapId) {
  return state.maps[mapId];
}

/**
 *
 * @param {GameMap} map
 * @param {Coord} coord
 * @returns {boolean}
 */
function canGoto(map, coord) {
  const [r, c] = coord;
  const cell = map.cells[r][c];
  if (isCellBlocking(cell)) {
    return false;
  }
  if (r < 0 || r >= map.height || c < 0 || c >= map.width) {
    return false;
  }
  return true;
}

/**
 *
 * @param {GameState} state
 * @param {Coord} coord
 * @returns {{ global: EffectDefinition[], private: { [f: PlayerFaction]: EffectDefinition[] }}}
 */
function willTrigger(state, coord) {
  const map = getCurrentMap(state);
  const [r, c] = coord;
  const cell = map.cells[r][c];
  const effects = {
    global: cell?.effects ?? [],
  };

  for (let target in cell.effects ?? {}) {
    effects.private ??= {};
    effects.private[target] = cell.effects[target];
  }
  return effects;
}

/**
 * @param {PlayerID[]} players
 * @returns {GameState}
 */
function initGameState(players) {
  return {
    maps: {
      room: getRoomMap(),
    },
    position: [{
      map: 'room',
      pos: [15, 13],
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

/**
 * @param {GameState} state
 * @returns {boolean}
 */
function checkGoal(state) {
  return state.maps.room.getTable()?.cell.items?.includes(gameItems.CAKE);
}

// players

/**
 * @returns {PlayerFaction}
 */
function decideFaction() {
  return randomPick(Object.keys(Factions));
}

module.exports = {
  transformState,
  initGameState,
  getActionInfo,
};
