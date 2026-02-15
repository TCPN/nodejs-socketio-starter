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
const { effects } = require("./game/effects.js");

/**
 * @import { GameState, PlayerState } from './game/state';
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
  state.temporaryEffects = [];
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

  generateRandomEffects(state);

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

function makeRandomScoreEffect(effectExpr, playerId, direction, namePrefix = '') {
  const effect = effects.makeScoreEffect(effectExpr, playerId);
  effect.name = `${namePrefix} ${effectExpr}分`;
  effect.desc = '隨機事件';
  effect.trigger = [{ type: 'CHOOSE', direction }];
  effect.lifetime = 'ONE_VOTE';
  return effect;
}

/**
 * @param {GameState} state
 */
function generateRandomEffects(state) {
  const RANDOM_GIFT_PROB = 1/4;
  for (const playerId in state.players) {
    if (Math.random() < RANDOM_GIFT_PROB) {
      // Generate random effect for the player
      const effectExpr = randomPick([
        '+5', '+10', '+15', '+20',
        '-5', '-10', '-15', '-20',
      ]);
      const direction = randomPick(Object.values(Direction));
      const effect = makeRandomScoreEffect(effectExpr, playerId, direction);
      (state.temporaryEffects ??= []).push(effect);
      log(`Generated random effect for player ${playerId}: ${effect.name}`);
    }
  }
  // big gift
  const pickedPlayer = randomPick(Object.values(state.players));
  if (pickedPlayer) {
    const effectExpr = randomPick(['+89', '+50', '*2', '*3']);
        const direction = randomPick(Object.values(Direction));
    const effect = makeRandomScoreEffect(effectExpr, pickedPlayer.id, direction);
    (state.temporaryEffects ??= []).push(effect);
    log(`Generated big random effect for player ${pickedPlayer.id}: ${effect.name}`);
  }
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
    players: Object.fromEntries(players.map((id) => [id, initPlayerState(null, id)])),
    items: [],
    paused: false,
    end: false,
  };
}

/**
 * @param {GameState} state
 * @param {PlayerID} playerId
 * @returns {PlayerState}
 */
function initPlayerState(state, playerId) {
  return {
    id: playerId,
    faction: decideFaction(state),
    score: 0,
  }
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

/**
 * @param {GameState} state
 * @param {PlayerID} playerId
 * @returns {void}
 */
function addNewPlayer(state, playerId) {
  if (playerId in state.players) {
    return;
  }
  if (playerId in (state.removedPlayers ?? {})) {
    state.players[playerId] = state.removedPlayers[playerId];
    delete state.removedPlayers[playerId];
    return;
  }
  state.players[playerId] = initPlayerState(state, playerId);
}

/**
 * @param {GameState} state
 * @param {PlayerID} playerId
 */
function removePlayer(state, playerId) {
  const player = state.players[playerId];
  delete state.players[playerId];
  (state.removedPlayers ??= {})[playerId] = player;
}

module.exports = {
  transformState,
  initGameState,
  getActionInfo,
  addNewPlayer,
  removePlayer,
};
