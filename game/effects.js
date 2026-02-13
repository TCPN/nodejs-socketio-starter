const { getPlayer } = require('./state');
const { PlayerFaction } = require('./types');

/**
 * @import { PlayerID, PlayerFaction, Cell, Position } from './types';
 */

/**
 * @param {Cell} cell
 * @returns {EffectDefinition}
 */
function getCellEffects(cell) {
  const effects = {};
  switch (cell.t) {
    case '日記':
      effects.global = ['看日記'];
      break;
    case '冰箱':
      if (cell.items?.includes(gameItems.CAKE)) {
        effects.global = ['拿蛋糕'];
      }
      break;
    case '几':
      if (state.items?.includes(gameItems.CAKE)) {
        effects.global = ['放蛋糕'];
      }
      break;
    case '牆':
      effects.global = ['撞牆'];
      break;
  }
  return effects;
}

/** @enum {'CHOOSE' | 'RESOLVE' | 'INTERACT' | 'STAND'} */
const EffectTriggerType = {
  CHOOSE: 'CHOOSE',
  RESOLVE: 'RESOLVE',
  INTERACT: 'INTERACT',
  STAND: 'STAND',
};

/**
 * @typedef {{
 *  chooseDir?: Direction,
 *  voteResult?: Direction,
 *  target?: PlayerID,
 *  interactPos?: Position | null,
 *  standPos: Position | null,
 * }} EffectFnContext
 * */

/**
 * @template TReturn
 * @typedef {(
 *  state: GameState,
 *  context: EffectFnContext,
 *  effect: EffectDefinition,
 * ) => TReturn} EffectFn
 */

/**
 * @typedef {{
 *  cellType?: [CellType],
 *  fn?: EffectFn<boolean>,
 * }} EffectEnableCondition
 */

/**
 * @typedef {{
 *  type: EffectTriggerType,
 *  direction?: Direction,
 *  target?: PlayerID | PlayerFaction,
 * }} EffectTrigger
 */

/**
 * @typedef {{
 *  name: string,
 *  labels?: string[],
 *  visible?: PlayerID | PlayerFaction | 'all',
 *  enabled?: boolean,
 *  enableCondition?: EffectEnableCondition,
 *  trigger: EffectTrigger,
 *  effectFn: EffectFn<void>,
 *  target?: PlayerID | PlayerFaction,
 * }} EffectDefinition
 */

/** @type {EffectDefinition} */
const DIARY = {
  name: '看日記',
  enableCondition: { t: ['日記'] },
  trigger: { type: EffectTriggerType.INTERACT },
  effectFn: (state) => {
    state.messages.push('日記：沒想到下禮拜天就是 40 歲生日了，真是不得了，去拿蛋糕出來放在茶几上準備慶祝吧');
  },
};
/** @type {EffectDefinition} */
const TAKE_CAKE = {
  name: '拿蛋糕',
  enableCondition: {
    fn: (state, cell, dir) => {
      return cell && (cell.t === '冰箱' || cell.t === '桌' || cell.t === '几') && cell.items?.includes(gameItems.CAKE)
    },
  },
  trigger: { type: EffectTriggerType.INTERACT },
  effectFn: (state, cell, dir) => {
    transferItem(gameItems.CAKE, cell.items ??= [], state.items);
  }
};
/** @type {EffectDefinition} */
const PUT_CAKE = {
  name: '放蛋糕',
  enableCondition: {
    fn: (state, cell, dir) => {
      return cell && (cell.t === '冰箱' || cell.t === '桌' || cell.t === '几') && state.items?.includes(gameItems.CAKE)
    },
  },
  trigger: { type: EffectTriggerType.INTERACT },
  effectFn: (state, cell, dir) => {
    transferItem(gameItems.CAKE, state.items, cell.items ??= []);
  }
};
/** @type {EffectDefinition} */
const HIT_WALL = {
  name: '撞牆',
  enableCondition: { t: ['牆'] },
  trigger: { type: EffectTriggerType.INTERACT },
  effectFn: (state, cell, dir) => {
    state.life -= 4;
    state.messages.push('撞牆受傷，扣 4 點生命值');
  }
};

/** @typedef {'+'|'-'|'*'|'/'} ScoreChangeOp */
/** @typedef {`${ScoreChangeOp}${number}`} ScoreChangeExpr */

/**
 * @param {ScoreChangeExpr} expr
 * @param {'Character' | PlayerFaction | PlayerID} target
 * @returns {EffectDefinition}
 */
const makeScoreEffect = (expr, target) => {
  const scoreChangerFn = getScoreChangerFnByExpr(expr);
  return {
    name: '分數' + expr,
    labels: 'score',
    enabled: true,
    enableCondition: { target },
    trigger: { type: 'STAND' },
    effectFn: (state, {}, effect) => {
      // find target players
      const playerIds = getEffectTargetPlayerIds(state, target);
      const players = playerIds.map((id) => getPlayer(state, id)).filter(v => v !== null);
      // state.score = scoreChangerFn(state);
      // state.messages.push(`獲得 ${delta} 分`);
      // update target players scores
      for (const player of players) {
        player.score = scoreChangerFn(target.score ?? 0);
      }
      effect.enabled = false;
    },
    target,
  };
};

/** @type {Record<ScoreChangeOp, (oprand: number) => ((score: number) => number)>} */
const scoreChangerFnMaker = {
  '+': (oprand) => ((score) => score + oprand),
  '-': (oprand) => ((score) => score - oprand),
  '*': (oprand) => ((score) => score * oprand),
  '/': (oprand) => ((score) => score / oprand),
};

/** @type {(expr: ScoreChangeExpr) => ((score: number) => number)} */
const getScoreChangerFnByExpr = (expr) => {
  /** @type {ScoreChangeOp} */
  const op = expr[0];
  const oprand = Number(expr.substr(1));
  return scoreChangerFnMaker[op](oprand);
};

const effects = {
  DIARY,
  TAKE_CAKE,
  PUT_CAKE,
  HIT_WALL,

  makeScoreEffect,
};


/** shared with client */

/**
 * @param {EffectDefinition} effect
 * @returns {string}
 */
function getScoreEffectText(effect) {
  return typeof effect === 'string' ? effect : (effect.text || effect.name);
}

function getScoreEffectMarkText(effect) {
  const text = getScoreEffectText(effect);
  return text.replace('分數', '').replace('*', '×').replace('/', '÷').trim();
}

/**
 * @param {EffectDefinition} effect
 * @param {PlayerFaction} faction
 * @returns {boolean}
 */
function isScoreEffectToFaction(effect, faction) {
  return effect.labels.includes('score') && effect.target === faction;
}

/**
 * @param {PlayerFaction} faction
 * @param {EffectDefinition[]} effects
 * @returns {EffectDefinition | null}
 */
function getScoreEffectOfFaction(faction, effects) {
  return effects.find(eff => isScoreEffectToFaction(eff, faction)) ?? null;
}


/**
 *
 * @param {GameState} state
 * @param {PlayerID | PlayerFaction | 'all'} target
 * @returns {PlayerID[]}
 */
function getEffectTargetPlayerIds(state, target) {
  const playerIds = Object.keys(state.players);
  if (target === 'all') {
    return playerIds;
  } else if (target in PlayerFaction) {
    return playerIds.filter((id) => state.players[id].faction === target);
  } else {
    return playerIds.filter((id) => id === target);
  }
}

module.exports = {
  getCellEffects,
  effects,
  getScoreEffectText,
  getScoreEffectMarkText,
  isScoreEffectToFaction,
  getScoreEffectOfFaction,
  getEffectTargetPlayerIds,
};
