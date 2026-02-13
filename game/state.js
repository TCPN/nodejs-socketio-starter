
/** @import { GameMap } from './types' */

/** @typedef {[row: number, col: number]} Coord */

/**
 * @typedef {{
 *   map: RoomEnum,
 *   pos: Coord,
 * }} Position
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
 *   maps: Record<RoomEnum, GameMap>,
 *   position: Position[],
 *   score: number,
 *   life: number,
 *   items: GameItem[],
 *   players: Record<PlayerID, PlayerState>,
 *   messages: string[],
 *   paused: boolean,
 *   end: boolean,
 * }} GameState
 */
