/**
 * @import { EffectDefinition } from './effects';
 * @import { CellType } from '../getRoomMap';
 */

/** @typedef {string} MapId */
/** @typedef {string} GameItem */
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
 *  row: number,
 *  col: number,
 *  cell: Cell | null,
 * }} Position
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

/** @enum {'BLUE' | 'RED' | 'YELLOW' | 'GREEN'} */
const PlayerFaction = {
  BLUE: 'BLUE', // UP
  RED: 'RED', // LEFT
  YELLOW: 'YELLOW', // DOWN
  GREEN: 'GREEN', // RIGHT
}

/** @enum { 'U' | 'L' | 'D' | 'R' } */
const Direction = {
  U: 'U',
  L: 'L',
  D: 'D',
  R: 'R',
};

module.exports = {
  Direction,
  PlayerFaction,
};
