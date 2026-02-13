
/**
 * @import { EffectDefinition } from './effects';
 */

/**
 * @enum { '鞋子' |
 *  '鍋子' |
 *  '裝水的鍋子' |
 *  '禮物' |
 *  '垃圾' |
 *  '整包垃圾' |
 *  '火' |
 *  '火鍋料'
 * }
 */
const GameItem = {
  'SHOES' : '鞋子',
  'POT' : '鍋子',
  'FILLED_POT' : '裝水的鍋子',
  'GIFT' : '禮物',
  'TRASH' : '垃圾',
  'TRASH_BAG' : '整包垃圾',
  'FIRE' : '火',
  'POT_MAT' : '火鍋料',
};

/**
 * @typedef {{
 *  name: string,
 *  [k: string]: any,
 * }} GameItemObject
 */

/** @type {Record<GameItem, GameItemObject} */
const gameItems = Object.fromEntries(Object.entries(GameItem).map(([k, v]) => {
  return [k, {
    name: v,
  }];
}));

/**
 * @param {GameItem} item
 * @returns {{
 *  name: string,
 *  effects?: EffectDefinition,
 * }}
 */
function getItemObject(item) {
  if (typeof item === 'string') {
    item = gameItems[item];
  }
  if (!item) {
    throw new Error(`Unknown game item: ${item}`);
  }
  return item;
}

module.exports = {
  GameItem,
  getItemObject,
};
