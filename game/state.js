
/** @import { GameMap } from './types' */

/** @typedef {[row: number, col: number]} Coord */

/**
 * @typedef {{
 *   mapId: MapId,
 *   coord: Coord,
 * }} PlayerPosition
 */

/**
 * @typedef {{
 *  id?: PlayerID,
 *  faction: PlayerFaction,
 *  score: number,
 *  items?: GameItem[],
 * }} PlayerState
 */

/**
 * @typedef {{
 *   maps: Record<MapId, GameMap>,
 *   position: PlayerPosition[],
 *   score: number,
 *   life: number,
 *   items: GameItem[],
 *   players: Record<PlayerID, PlayerState>,
 *   messages: string[],
 *   paused: boolean,
 *   end: boolean,
 * }} GameState
 */
