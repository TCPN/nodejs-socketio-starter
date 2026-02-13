/**
 * @import { PlayerID, PlayerFaction } from './types';
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

/** @enum {'CHOOSE' | 'RESOLVE' | 'CONTACT'} */
const EffectTriggerType = {
  CHOOSE: 'CHOOSE',
  RESOLVE: 'RESOLVE',
  CONTACT: 'CONTACT',
};

/**
 * @template TReturn
 * @typedef {(
 *  state: GameState,
 *  cell: Cell | undefined,
 *  dir: Direction,
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
 *  visible?: PlayerID | PlayerFaction | 'all',
 *  enabled?: boolean,
 *  enableCondition?: EffectEnableCondition,
 *  trigger: EffectTrigger,
 *  effectFn: EffectFn<void>,
 * }} EffectDefinition
 */

/** @type {EffectDefinition} */
const DIARY = {
  name: '看日記',
  enableCondition: { t: ['日記'] },
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
  effectFn: (state, cell, dir) => {
    transferItem(gameItems.CAKE, state.items, cell.items ??= []);
  }
};
/** @type {EffectDefinition} */
const HIT_WALL = {
  name: '撞牆',
  enableCondition: { t: ['牆'] },
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
    enableCondition: { target },
    effectFn: (state, cell, dir) => {
      // find target players
      let target = {}; // TODO
      const change = parseInt(name.slice(2));
      state.score += delta;
      state.messages.push(`獲得 ${delta} 分`);
      // update target players scores
      target.score = scoreChangerFn(target.score ?? 0);
    },
  }
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

module.exports = {
  getCellEffects,
  mapObjects,
  effects,
};
