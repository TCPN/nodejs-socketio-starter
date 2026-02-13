const { removeFromArray } = require("./array.js");
const { createLogger } = require("./logger.js");
const { randomPick } = require("./random.js");
const log = createLogger('game');

const { gameItems, getItemObject } = require("./gameItems.js");
const { getMainMap, isCellBlocking } = require("./getRoomMap.js");
const { Factions } = require('./client/src/const.js');
const { Direction } = require("./game/types.js");
const { getEffectTargetPlayerIds } = require("./game/effects.js");

/**
 * @import { GameState } from './game/state';
 * @import { MapId, PlayerID, PlayerFaction, Position } from './game/types';
 * @import { EffectDefinition, EffectFnContext } from './game/effects';
 *
 * @import { Vote } from './server';
 */

/** @typedef {Direction} GameAction */

/**
 * @param {GameState} state
 * @param {GameAction} action
 * @param {Vote} vote
 * @returns {GameState}
 */
function transformState(state, action, vote) {
  if (!(action in Direction) && action !== null) {
    console.error('Invalid action:', action);
    return state;
  }
  state.messages = [];
  const position = getCurrentPosition(state);
  const map = getCurrentMap(state);
  const toward = getTowardPosition(position.coord, action);
  if (!position || !map) {
    console.error('Invalid character position:', position, { ...map, cells: 'skipped' }, toward )
    return state;
  }
  let interactPos = null;
  let standPos = null;
  if (toward && canGoto(map, toward)) {
    position.coord = toward;
  } else if (toward) {
    interactPos = getPosition(state, map, toward);
  }
  standPos = getPosition(state, map, position.coord);

  const baseEffectContext = { interactPos, standPos, vote, action };

  execChooseTriggerEffects(state, baseEffectContext);
  // skills
  execResolveTypeEffects(state, baseEffectContext);
  execInteractTriggerEffects(state, baseEffectContext);
  execStandTriggerEffects(state, baseEffectContext);

  // for (const [target, effect] of Object.entries(effects.private ?? {})) {
  //   const name = effect.text ?? effect;
  //   const targetPlayerIds = getEffectTargetPlayerIds(state, target);
  //   if (name.startsWith('分數')) {
  //     const delta = parseInt(name.slice(2));
  //     for (const targetPlayerId of targetPlayerIds) {
  //       state.players[targetPlayerId].score += delta;
  //       state.players[targetPlayerId].messages ??= [];
  //       state.players[targetPlayerId].messages.push(`你自己獲得 ${delta} 分`);
  //     }
  //   } else if (name === '道具') {
  //     console.warn('「道具」還沒實作');
  //   }
  // }
  state.timelyEffects = [];

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
 * @param {EffectFnContext & { vote: Vote }} baseContext
 */
function execChooseTriggerEffects(state, {
  interactPos,
  standPos,
  vote,
  action,
}) {
  // TODO: consider effects stored at other places
  // const effects = willTrigger(state, toward);
  for (const effect of state.timelyEffects ?? []) {
    if (!effect.enabled || effect.trigger.type !== 'CHOOSE') {
      continue;
    }
    const targetPlayerIds = getEffectTargetPlayerIds(state, effect.target);
    for (const playerId of targetPlayerIds) {
      // const player = getPlayer(state, playerId);
      // if (!player) { continue; }
      const playerChoose = vote.votes[playerId] ?? null;
      if (effect.trigger.direction !== playerChoose) {
        continue;
      }
      effect.effectFn?.(state, {
        target: playerId,
        chooseDir: playerChoose,
        voteResult: action,
        interactPos,
        standPos,
      }, effect);
    }
  }
}

/**
 *
 * @param {GameState} state
 * @param {EffectFnContext & { vote: Vote }} baseContext
 */
function execResolveTypeEffects(state, {
  interactPos,
  standPos,
  vote,
  action,
}) {
  // TODO: consider effects stored at other places
  for (const effect of state.timelyEffects ?? []) {
    if (!effect.enabled || effect.trigger.type !== 'RESOLVE') {
      continue;
    }
    if (effect.trigger.direction !== action) {
      continue;
    }
    const targetPlayerIds = getEffectTargetPlayerIds(state, effect.target);
    for (const playerId of targetPlayerIds) {
      // const player = getPlayer(state, playerId);
      // if (!player) { continue; }
      effect.effectFn?.(state, {
        target: playerId,
        voteResult: action,
        interactPos,
        standPos,
      }, effect);
    }
  }
}

/**
 *
 * @param {GameState} state
 * @param {EffectFnContext & { vote: Vote }} baseContext
 */
function execInteractTriggerEffects(state, {
  interactPos,
  standPos,
  vote,
  action,
}) {
  if (!interactPos?.cell) {
    return;
  }
  /** @type {EffectDefinition[]} */
  const cellEffects = interactPos.cell.effects ?? [];
  /** @type {EffectDefinition[]} */
  const itemsEffects = interactPos.cell.items?.map(item => {
    const itemObj = getItemObject(item);
    return itemObj.effects ?? [];
  }).flat(2) ?? [];
  // TODO: consider effects stored at other places
  for (const effect of cellEffects.concat(itemsEffects)) {
    if (!effect.enabled || effect.trigger.type !== 'INTERACT') {
      continue;
    }
    effect.effectFn?.(state, {
      vote: vote,
      voteResult: action,
      interactPos,
      standPos,
    }, effect);
  }
}

/**
 *
 * @param {GameState} state
 * @param {EffectFnContext & { vote: Vote }} baseContext
 */
function execStandTriggerEffects(state, {
  interactPos,
  standPos,
  vote,
  action,
}) {
  if (!standPos?.cell) {
    return;
  }
  const cellEffects = standPos.cell.effects ?? [];
  const itemsEffects = standPos.cell.items?.map(item => {
    const itemObj = getItemObject(item);
    return itemObj.effects ?? [];
  }).flat(2) ?? [];
  // TODO: consider effects stored at other places
  for (const effect of cellEffects.concat(itemsEffects)) {
    if (!effect.enabled || effect.trigger.type !== 'STAND') {
      continue;
    }
    effect.effectFn?.(state, {
      vote: vote,
      voteResult: action,
      interactPos,
      standPos,
    }, effect);
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
  const map = getMap(state, position.mapId);
  const toward = getTowardPosition(position.coord, action);
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
 * @param {MapId | GameMap | undefined} map
 * @param {Coord} coord
 * @returns {Cell | null}
 */
function getCell(state, map, coord) {
  return getPosition(state, map, coord)?.cell ?? null;
}

/**
 * @param {GameState} state
 * @param {MapId | GameMap | undefined} map
 * @param {Coord} coord
 * @returns {Position | null}
 */
function getPosition(state, map, coord) {
  if (typeof map === 'string') {
    const mapObj = getMap(state, map);
    if (!mapObj) {
      return null;
    }
    map = mapObj;
  }
  if (!map) {
    return null;
  }
  const cell = (map.cells?.at(coord[0])?.at([coord[1]])) ?? null;
  if (!cell) {
    console.error(`Cell not found:`, coord, 'in', map);
  }
  return {
    mapId: map.mapId,
    row: coord[0],
    col: coord[1],
    cell: cell,
  };
}

/**
 * @param {GameState} state
 * @returns {Cell | null}
 */
function getCurrentCell(state) {
  return getCurrentCellWithPosition(state)?.cell ?? null;
}

/**
 * @param {GameState} state
 * @returns {Position}
 */
function getCurrentCellWithPosition(state) {
  const position = getCurrentPosition(state);
  if (!position) {
    console.error('game state lacks character position info');
  }
  const mapId = position?.mapId ?? 'main';
  const map = getMap(state, mapId);
  const coord = position?.coord ?? map?.getDefaultCoord();
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
 * @returns {PlayerPosition | undefined}
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
  const map = getMap(state, position.mapId);
  return map;
}

/**
 * @param {GameState} state
 * @param {MapId} mapId
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
      main: getMainMap(),
    },
    position: [{
      mapId: 'main',
      coord: [15, 13],
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
  return state.maps.main.getTable()?.cell.items?.includes(gameItems.CAKE);
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
