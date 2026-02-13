/**
 * @import { EffectDefinition } from './effects';
 * @import { CellType } from '../getRoomMap';
 */

/** @typedef {string} RoomEnum */
/** @typedef {string} GameItem */
/** @typedef {string} PlayerFaction */
/** @typedef {string} PlayerID */

/**
 * @typedef {{
 *  t: CellType,
 *  effects?: EffectDefinition[],
 *  items?: GameItem[],
 *  location?: { row: number, col: number, map: string },
 *  [k: string]: any,
 * }} Cell
 */

/**
 * @typedef {{
 *  height: number,
 *  width: number,
 *  cells: Cell[][],
 *  [k: string]: any,
 * }} GameMap
 */

/** @enum { 'U' | 'L' | 'D' | 'R' } */
const Direction = {
  U: 'U',
  L: 'L',
  D: 'D',
  R: 'R',
};

module.exports = {
  Direction,
};
