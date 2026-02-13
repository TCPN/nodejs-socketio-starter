
/**
 * @import { GameMap } from './types';
 * @import { EffectDefintion } from './effects';
 */


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
 *   timelyEffects: EffectDefinition[],
 *   players: Record<PlayerID, PlayerState>,
 *   messages: string[],
 *   paused: boolean,
 *   end: boolean,
 * }} GameState
 */

/**
 * @param {GameState} state
 * @param {PlayerID} playerId
 * @returns {PlayerState | null}
 */
function getPlayer(state, playerId) {
  return state.players[playerId] ?? null;
}

module.exports = {
  getPlayer,
};
