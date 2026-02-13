const { getPlayer } = require('./state');
const { CellType } = require('./cell');
const { PlayerFaction } = require('./types');
const { GameItem } = require('./item');
const { transferItem } = require('../array');

/**
 * @import { PlayerID, PlayerFaction, Cell, Position } from './types';
 * @import { GameState } from './state';
 */

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
 *  trigger: EffectTrigger | EffectTrigger[],
 *  effectFn: EffectFn<void>,
 *  target?: PlayerID | PlayerFaction,
 * }} EffectDefinition
 */

/**
 * @param {string} effectName
 * @param {CellType} cellType
 * @param {EffectTriggerType} triggerType
 * @param {string} message
 * @returns {EffectDefinition}
 */
function createPrintMessageEffect(effectName, cellType, triggerType, message) {
  return {
    name: effectName,
    enabled: true,
    enableCondition: { t: [cellType] },
    trigger: { type: triggerType },
    effectFn: (state) => {
      state.messages.push(message);
    },
  };
}

/** @type {EffectDefinition} */
const DIARY = createPrintMessageEffect('看日記', '日記', EffectTriggerType.INTERACT, '日記：2026/02/14 哇，馬上就是我 40 歲後迎接的第一個新年，會有什麼不同的感覺嗎？有點期待');
const READ_CALENDAR = createPrintMessageEffect('看月曆', CellType.CALENDAR, EffectTriggerType.INTERACT, '生日是 7/13');
const TOILET = createPrintMessageEffect('上廁所', CellType.TOILET, EffectTriggerType.STAND, '上個廁所');
const BATHTUB = createPrintMessageEffect('洗澡', CellType.BATHTUB, EffectTriggerType.STAND, '洗個澡');
const CHAIR = createPrintMessageEffect('坐下', CellType.CHAIR, EffectTriggerType.STAND, '坐一下');
const PHONE_CALL = createPrintMessageEffect('接電話', CellType.PHONE, EffectTriggerType.INTERACT, '「小姐您好，有您的包裹，我已經在你們家大門口，請趕快來拿唷」');
const READ_LETTER = createPrintMessageEffect('收信', CellType.MAN, EffectTriggerType.INTERACT, '信件內容：親愛的孩子，要過年了，跟大家一起圍爐吧。我送你一份頂級小羔羊給你煮火鍋，食譜在圖書室的桌子上，好好享受！');
const RECIPE = createPrintMessageEffect('看食譜', CellType.TABLE, EffectTriggerType.INTERACT, '小羔羊食譜：鍋子裡裝滿水後，加入前院裡的樹上的果子，再放入小羔羊和火鍋料，超好吃，吃了彷彿活過來了一樣！一定要試試看');
/** @type {EffectDefinition} */
const BED_SLEEP = {
  name: '睡覺',
  enabled: true,
  enableCondtion: { t: ['床'] },
  trigger: { type: EffectTriggerType.STAND },
  effectFn: (state) => {
    state.messages.push('睡一下，恢復生命值 +1');
    state.life = Math.min((state.life + 1) || 1, 40);
  },
};

/** @type {EffectDefinition} */
const WEAR_SHOES = {
  name: '穿鞋',
  enabled: true,
  enableCondition: { t: ['鞋'] },
  trigger: { type: EffectTriggerType.STAND },
  effectFn: (state, { standPos }, effect) => {
    state.items.push('鞋子');
    const cells = state.maps.main.cells;
    standPos.cell.t = '';
    cells[12][13].block = false;
    cells[15][10].block = false;
    cells[15][16].block = false;
    cells[18][13].block = false;
    effect.enabled = false;
  },
};
/** @type {EffectDefinition} */
const PUT_POT = {
  name: '放鍋子',
  enabled: true,
  enableCondition: {
    fn: (state, { interactPos }, effect) => {
      const cell = interactPos?.cell;
      return cell && (cell.t === '冰箱' || cell.t === '桌' || cell.t === '几' || cell.t === '台' || cell.t === '爐') && state.items?.includes(GameItem.POT);
    },
  },
  trigger: { type: EffectTriggerType.INTERACT },
  effectFn: (state, { interactPos }, effect) => {
    const cell = interactPos?.cell;
    if (!cell) {
      return;
    }
    if (cell.items?.includes(GameItem.POT)) {
      effect.text = '放鍋子';
      transferItem(GameItem.POT, state.items, cell.items ??= []);
    }
  }
};

/** @type {EffectDefinition} */
const TAKE_POT = {
  name: '拿鍋子',
  enabled: true,
  enableCondition: {
    fn: (state, { interactPos }) => {
      const cell = interactPos?.cell;
      return cell && (cell.items?.includes(GameItem.POT));
    },
  },
  trigger: { type: EffectTriggerType.INTERACT }, // with item
  effectFn: (state, { interactPos }, effect) => {
    const cell = interactPos?.cell;
    if (!cell) {
      return;
    }
    if (state.items?.includes(GameItem.POT)) {
      transferItem(GameItem.POT, cell.items, state.items ??= []);
      effect.text = '拿鍋子';
    }
  }
};
/** @type {EffectDefinition} */
const HIT_WALL = {
  name: '撞牆',
  enabled: true,
  enableCondition: { t: ['牆', '柵', '柱'] },
  trigger: { type: EffectTriggerType.INTERACT },
  effectFn: (state, cell, dir) => {
    state.life = Math.max(state.life - 4 || 0, 0);
    state.messages.push('撞牆受傷，生命 -4');
  }
};

/** @type {EffectDefinition} */
const SWORD = {
  name: '撲向劍',
  enabled: true,
  enableCondition: { t: ['劍'] },
  trigger: { type: EffectTriggerType.INTERACT },
  effectFn: (state, cell, dir) => {
    state.life = Math.max(state.life - 15 || 0, 0);
    state.messages.push('嚴重刺傷，生命 -15');
  }
};

/** @type {EffectDefinition} */
const FIRE = {
  name: '浴火',
  enabled: true,
  enableCondition: { fn: (state, context) => {
    return context.standPos.cell.items.includes(GameItem.FIRE);
  } },
  trigger: { type: EffectTriggerType.STAND },
  effectFn: (state, cell, dir) => {
    state.life = Math.max(state.life - 10 || 0, 0);
    state.messages.push('嚴重燒傷，生命 -10');
  },
};

/** @type {EffectDefinition} */
const FRIDGE = {
  name: '開冰箱',
  enabled: true,
  enableCondition: { t: ['冰箱'] },
  trigger: { type: EffectTriggerType.INTERACT },
  effectFn: (state, { interactPos }, effect) => {
    if (effect.taken) {
      state.messages.push('空蕩蕩的冰箱');
      return;
    }
    state.messages.push('3 公斤的火鍋料！？');
    const cell = interactPos.cell;
    transferItem(GameItem.POT_MAT, cell.items, state.items ??= []);
    effect.taken = true;
  },
};

/** @type {EffectDefinition} */
const TRACH_CAN = {
  name: '丟垃圾',
  enabled: true,
  enableCondition: { t: ['桶'] },
  trigger: { type: EffectTriggerType.INTERACT },
  effectFn: (state, { interactPos }, effect) => {
    // TODO: enabled after got a trash
    if (interactPos.row === 23 && interactPos.col === 6 && !effect.cleaned) {
      state.messages.push('垃圾桶滿了，得拿出去回收場倒');
      state.items[state.items.indexOf('垃圾')] = '整包垃圾';
      return;
    }
  },
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
    trigger: [{ type: 'STAND' }, { type: 'INTERACT' }],
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
 * @param {EffectDefinition} effect
 * @param {EffectTriggerType} triggerType
 */
function canTriggerWith(effect, triggerType) {
  if (Array.isArray(effect.trigger)) {
    return effect.trigger.find(t => t.type === triggerType);
  }
  return effect.trigger.type === triggerType;
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

const effects = {
  // cells
  DIARY,
  HIT_WALL,
  WEAR_SHOES,
  TAKE_POT,
  READ_CALENDAR,
  CHAIR,
  TOILET,
  BATHTUB,
  BED_SLEEP,
  PHONE_CALL,
  READ_LETTER,
  RECIPE,
  SWORD,

  // items
  FIRE,

  makeScoreEffect,
};

module.exports = {
  effects,
  getScoreEffectText,
  getScoreEffectMarkText,
  isScoreEffectToFaction,
  getScoreEffectOfFaction,
  canTriggerWith,
  getEffectTargetPlayerIds,
};
