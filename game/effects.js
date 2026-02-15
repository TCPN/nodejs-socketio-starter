const { getPlayer } = require('./state');
const { CellType } = require('./cell');
const { PlayerFaction } = require('./types');
const { GameItem, getItemObject } = require('./item');
const { transferItem } = require('../array');
const { EffectTriggerType } = require('./effectTypes');
const {
  getScoreEffectText,
  getScoreEffectMarkText,
  isScoreEffectToFaction,
  getScoreEffectOfFaction,
  canTriggerWith,
  getEffectTargetPlayerIds,
} = require('./effectHelpers');

/**
 * @import { PlayerID, PlayerFaction, Cell, Position } from './types';
 * @import { GameState } from './state';
 * @import { EffectDefinition } from './effectTypes';
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
    displayCondition: { t: [cellType] },
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
const WASH_HAND = createPrintMessageEffect('洗手', CellType.SINK, EffectTriggerType.STAND, '內外夾弓大立腕');
const CHAIR = createPrintMessageEffect('坐下', CellType.CHAIR, EffectTriggerType.STAND, '坐一下');
const PHONE_CALL = createPrintMessageEffect('接電話', CellType.PHONE, EffectTriggerType.INTERACT, '「小姐您好，有您的包裹，我已經在你們家大門口，請趕快來拿唷」');
const READ_LETTER = createPrintMessageEffect('收信', CellType.MAN, EffectTriggerType.INTERACT, '信件內容：親愛的孩子，要過年了，跟大家一起圍爐吧。我送你一份頂級小羔羊給你煮火鍋，食譜在圖書室的桌子上，好好享受！');
const RECIPE = createPrintMessageEffect('看食譜', CellType.TABLE, EffectTriggerType.INTERACT, '小羔羊食譜：鍋子裡裝滿水後，加入前院裡的樹上的果子，再放入小羔羊和火鍋料，超好吃，吃了彷彿活過來了一樣！一定要試試看');
/** @type {EffectDefinition} */
const BED_SLEEP = {
  name: '睡覺',
  enabled: true,
  displayCondition: { t: ['床'] },
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
  displayCondition: { t: ['鞋'] },
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

function checkIfPotCooked(state, pot) {
  if (pot.water && pot.fruit && pot.soup && pot.ingredients) {
    pot.cooked = true;
    state.messages.push('煮好了！端上桌準備圍爐吧！');
  }
}

/** @type {EffectDefinition} */
const PUT_POT = {
  name: '放鍋子',
  enabled: true,
  displayCondition: {
    fn: (state, { interactPos }, effect) => {
      const cell = interactPos?.cell;
      return cell && (cell.t === '桌' || cell.t === '几' || cell.t === '台' || cell.t === '爐') && state.items?.includes(GameItem.POT);
    },
  },
  trigger: { type: EffectTriggerType.INTERACT },
  effectFn: (state, { interactPos }, effect) => {
    const cell = interactPos?.cell;
    if (!cell || !state.items?.includes(GameItem.POT)) {
      return;
    }
    if (cell.t !== '爐') {
      transferItem(GameItem.POT, state.items, cell.items ??= []);
      return;
    }
    // to stove
    const pot = getItemObject(GameItem.POT);
    transferItem(GameItem.POT, state.items, cell.items ??= []);
    if (!pot.water) {
      state.messages.push('還沒加水！');
    } else if (!pot.cooked) {
      state.messages.push('放上鍋子，開始煮火鍋了！');
      checkIfPotCooked(state, pot);
    }
  }
};

/** @type {EffectDefinition} */
const TAKE_POT = {
  name: '拿鍋子',
  enabled: true,
  displayCondition: {
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
    }
  }
};

const ADD_POT_INGREDIENTS = {
  name: '放進鍋',
  enabled: true,
  enableCondition: {
    fn: (state, { interactPos }) => {
      const cell = interactPos?.cell;
      return cell && (cell.items?.includes(GameItem.POT)) && (
        state.items?.includes(GameItem.POT_MAT) ||
        state.items?.includes(GameItem.FRUIT) ||
        state.items?.includes(GameItem.LAMB)
      );
    },
  },
  trigger: { type: EffectTriggerType.INTERACT }, // with item
  effectFn: (state, { interactPos }, effect) => {
    const cell = interactPos?.cell;
    if (!cell || !cell.items?.includes(GameItem.POT)) {
      return;
    }
    const pot = getItemObject(GameItem.POT);
    if (state.items?.includes(GameItem.POT_MAT)) {
      transferItem(GameItem.POT_MAT, state.items, []);
      pot.ingredients = true;
      state.messages.push('放入火鍋料');
    } else if (state.items?.includes(GameItem.FRUIT)) {
      transferItem(GameItem.FRUIT, state.items, []);
      pot.fruit = true;
      state.messages.push('放入果子');
    } else if (state.items?.includes(GameItem.LAMB)) {
      transferItem(GameItem.LAMB, state.items, []);
      pot.soup = true;
      state.messages.push('放入頂級小羔羊');
    }
  },
};

/** @type {EffectDefinition} */
const FILL_POT = {
  name: '裝水',
  enabled: true,
  displayCondition: {
    fn: (state, { interactPos }) => {
      const cell = interactPos?.cell;
      return cell && (cell.t === '槽') && state.items?.includes(GameItem.POT);
    },
  },
  trigger: { type: EffectTriggerType.INTERACT },
  effectFn: (state, { interactPos }, effect) => {
    const cell = interactPos?.cell;
    if (!cell) {
      return;
    }
    if (state.items?.includes(GameItem.POT)) {
      const pot = getItemObject(GameItem.POT);
      pot.filled = true;
      pot.name = '裝水的鍋子';
      effect.enabled = false;
    }
  }
};

/** @type {EffectDefinition} */
const HIT_WALL = {
  name: '撞牆',
  enabled: true,
  displayCondition: { t: ['牆', '柵', '柱'] },
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
  displayCondition: { t: ['劍'] },
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
  displayCondition: { fn: (state, context) => {
    return context.standPos.cell.items.includes(GameItem.FIRE);
  } },
  trigger: { type: EffectTriggerType.STAND },
  effectFn: (state, { interactPos }, effect) => {
    state.life = Math.max(state.life - 10 || 0, 0);
    state.messages.push('嚴重燒傷，生命 -10');
  },
};

/** @type {EffectDefinition} */
const GOLD = {
  name: '黃金',
  enabled: true,
  displayCondition: { t: ['金'] },
  trigger: { type: EffectTriggerType.STAND },
  effectFn: (state, { standPos }, effect) => {
    state.score = (state.score || 0) + 100;
    state.messages.push('撿到黃金，分數 +100');
    getEffectTargetPlayerIds(state, 'all').forEach((id) => {
      const player = getPlayer(state, id);
      if (player) {
        player.score = (player.score || 0) + 100;
      }
    });
    effect.enabled = false;
    standPos.cell.t = '';
  },
};

/** @type {EffectDefinition} */
const SILVER = {
  name: '銀幣',
  enabled: true,
  displayCondition: { t: ['銀'] },
  trigger: { type: EffectTriggerType.STAND },
  effectFn: (state, { standPos }, effect) => {
    state.score = (state.score || 0) + 10;
    state.messages.push('撿到銀幣，分數 +10');
    getEffectTargetPlayerIds(state, 'all').forEach((id) => {
      const player = getPlayer(state, id);
      if (player) {
        player.score = (player.score || 0) + 10;
      }
    });
    effect.enabled = false;
    standPos.cell.t = '';
  },
};

/** @type {EffectDefinition} */
const FRIDGE = {
  name: '開冰箱',
  enabled: true,
  displayCondition: { t: ['冰箱'] },
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
  displayCondition: { t: ['桶'] },
  trigger: { type: EffectTriggerType.INTERACT },
  effectFn: (state, { interactPos }, effect) => {
    // TODO: enabled after got a trash
    if (interactPos.row === 23 && interactPos.col === 6 && !effect.cleaned) {
      state.messages.push('垃圾桶滿了，得拿出去回收場倒');
      state.items[state.items.indexOf('垃圾')] = '整包垃圾';
      // TODO
      return;
    }
  },
};

/** @type {EffectDefinition} */
const BUTTON = {
  name: '按鈕',
  enabled: true,
  displayCondition: { t: ['按鈕'] },
  trigger: { type: EffectTriggerType.INTERACT },
  effectFn: (state, { standPos }, effect) => {
    console.log('implementation should be given in other place');
  },
};

/** @typedef {'+'|'-'|'*'|'/'} ScoreChangeOp */
/** @typedef {`${ScoreChangeOp}${number}`} ScoreChangeExpr */

/**
 * @param {ScoreChangeExpr} expr
 * @param {'Character' | PlayerFaction | PlayerID} target
 * @returns {EffectDefinition}
 */
const makePublicScoreEffect = (expr, target) => {
  const effectFn = makeScoreEffect(expr, target).effectFn;
  return {
    name: '分數' + expr,
    labels: ['score'],
    enabled: true,
    target,
    displayCondition: { target },
    trigger: [{ type: 'STAND' }, { type: 'INTERACT' }],
    effectFn,
  };
};

/**
 * @param {ScoreChangeExpr} expr
 * @param {'Character' | PlayerFaction | PlayerID} target
 * @returns {EffectDefinition}
 */
function makeScoreEffect(expr, target) {
  const scoreChangerFn = getScoreChangerFnByExpr(expr);
  return {
    name: '分數' + expr,
    labels: ['score'],
    enabled: true,
    target,
    displayCondition: { target },
    trigger: [], // should be set when put in map
    effectFn: (state, {}, effect) => {
      // find target players
      const playerIds = getEffectTargetPlayerIds(state, target);
      const players = playerIds.map((id) => getPlayer(state, id)).filter(v => v !== null);
      // state.messages.push(`獲得 ${delta} 分`); // TODO: SEND PRIVATE MESSAGES
      for (const player of players) {
        player.score = scoreChangerFn(target.score ?? 0);
      }
      effect.enabled = false;
    },
  };
}

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
  // cells
  DIARY,
  HIT_WALL,
  WEAR_SHOES,
  PUT_POT,
  TAKE_POT,
  FILL_POT,
  READ_CALENDAR,
  CHAIR,
  TOILET,
  BATHTUB,
  WASH_HAND,
  BED_SLEEP,
  PHONE_CALL,
  READ_LETTER,
  RECIPE,
  SWORD,
  FRIDGE,
  TRACH_CAN,
  BUTTON,
  GOLD,
  SILVER,

  // items
  FIRE,

  makePublicScoreEffect,
  makeScoreEffect,
};

module.exports = {
  effects,
};
