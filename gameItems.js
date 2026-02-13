const { enumFromStrings } = require("./enum");

const gameItems = enumFromStrings([
  'CANDLE',
  'CAKE',
]);

/**
 * @import { GameItem } from './game/types';
 * @import { EffectDefinition } from './game/effects';
 */

/**
 * @param {GameItem} item
 * @returns {{
 *  name: string,
 *  effects?: EffectDefinition,
 * }}
 */
function getItemObject(item) {
  if (typeof item === 'string') {
    item = itemList[item];
  }
  return item ?? {
    name: `${item}`,
  };
}

const itemList = {

};

module.exports = {
  gameItems,
  getItemObject,
};
