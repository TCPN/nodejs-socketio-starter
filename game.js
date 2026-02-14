const { removeFromArray } = require("./array.js");
const { createLogger } = require("./logger.js");
const { randomPick } = require("./random.js");
const log = createLogger('game');

const { GameItem, getItemObject } = require("./game/item.js");
const { getMainMap, isCellBlocking } = require("./getRoomMap.js");
const { Factions } = require('./client/src/const.js');
const { Direction } = require("./game/types.js");
const {
  getTowardPosition,
  getCell,
  getPosition,
  getCurrentCell,
  getCurrentCellWithPosition,
  getCurrentPosition,
  getCurrentMap,
  getMap,
} = require("./game/helpers.js");
const {
  execChooseTriggerEffects,
  execResolveTypeEffects,
  execInteractTriggerEffects,
  execStandTriggerEffects
} = require("./game/execEffects.js");

/**
 * @import { GameState } from './game/state';
 * @import { MapId, PlayerID, PlayerFaction, Position, GameMap } from './game/types';
 * @import { EffectDefinition } from './game/effectTypes';
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
  if (toward && canGoto(state, map, toward)) {
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

  const finishGoal = checkGoal(state);
  if (finishGoal) {
    state.end = 'success';
    state.messages.push(`通關！總分: ${state.score}`);
  } else if (state.life <= 0) {
    state.end = 'failed';
    state.messages.push('你死了！遊戲結束？');
  }

  return state;
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
    canGo: canGoto(state, map, toward),
    willTrigger: willTrigger(state, action, toward),
  };
}


/**
 * @param {GameState} state
 * @param {GameMap} map
 * @param {Coord} coord
 * @returns {boolean}
 */
function canGoto(state, map, coord) {
  const [r, c] = coord;
  const cell = map.cells[r][c];
  if (cell?.blockFn) {
    return !cell.blockFn(state);
  }
  if (isCellBlocking(cell)) {
    return false;
  }
  if (r < 0 || r >= map.height || c < 0 || c >= map.width) {
    return false;
  }
  return true;
}

/**
 * @typedef {{
 *   all: EffectDefinition[],
 *   faction: { [f: PlayerFaction]: EffectDefinition[] },
 *   player: { [playerId: PlayerID]: EffectDefinition[] },
 * }} VisibleEffects
 */

/**
 * @param {GameState} state
 * @param {Direction} dir
 * @param {Coord} coord
 * @returns {VisibleEffects}
 */
function willTrigger(state, dir, coord) {
  const map = getCurrentMap(state);
  const position = getPosition(state, map, coord);
  const cell = position?.cell;
  const globalEffects = (state.effects ?? []).concat(state.temporaryEffects ?? []);
  const cellEffects = cell?.effects ?? [];
  const itemsEffects = cell?.items?.map(item => {
    const itemObj = getItemObject(item);
    return itemObj.effects ?? [];
  }).flat(2) ?? [];
  const enabledEffects = globalEffects.concat(cellEffects, itemsEffects).filter(effect => {
    if (!effect.enabled) {
      return false;
    }
    if (effect.displayCondition?.cellType && effect.displayCondition.cellType !== cell.t) {
      return false;
    }
    if (effect.displayCondition?.fn) {
      return effect.displayCondition?.fn?.(
        state,
        {
          dir,
          cell,
          position,
        },
        effect,
      ) !== false;
    }
    return true;
  });

  /** @type {VisibleEffects} */
  const displayEffects = {
    all: [],
    faction: {},
    player: {},
  };
  for (const effect of enabledEffects) {
    if (effect.target === 'all') {
      displayEffects.all.push(effect);
    } else if (effect.target in Factions) {
      (displayEffects.faction[effect.target] ??= []).push(effect);
    } else if (typeof effect.target === 'string') {
      (displayEffects.player[effect.target] ??= []).push(effect);
    }
  }
  return displayEffects;
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
      coord: [14, 14],
    }],
    score: 0,
    life: 40,
    players: Object.fromEntries(players.map((id) => [id, {
      faction: decideFaction(),
      score: 0,
    }])),
    items: [],
    paused: false,
    end: false,
  };
}

/**
 * @param {GameState} state
 * @returns {boolean}
 */
function checkGoal(state) {
  return state.maps.main.getTable()?.cell.items?.includes(GameItem.POT);
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
