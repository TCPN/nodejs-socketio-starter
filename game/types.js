/**
 * @import { EffectDefinition } from './effects';
 * @import { CellType } from '../getRoomMap';
 */

/** @typedef {string} MapId */
/** @typedef {string} GameItem */
/** @typedef {string} PlayerFaction */
/** @typedef {string} PlayerID */

/**
 * @typedef {{
 *  t: CellType,
 *  effects?: EffectDefinition[],
 *  items?: GameItem[],
 *  location?: { row: number, col: number, mapId: MapId },
 *  [k: string]: any,
 * }} Cell
 */

/**
 * @typedef {{
 *  mapId: MapId,
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
