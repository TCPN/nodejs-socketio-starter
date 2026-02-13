
/**
 * @import { EffectDefinition } from './effects';
 */

/** @enum {'鞋子' | '鍋子' | '禮物'} */
const GameItem = {
  'SHOES' : '鞋子',
  'POT' : '鍋子',
  'GIFT' : '禮物',
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
