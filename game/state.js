/**
 * @typedef {{
 *   map: RoomEnum,
 *   pos: [row: number, col: number],
 * }} CharacterMapPosition
 */
/**
 * @typedef {{
 *  id?: PlayerID,
 *  faction: PlayerFaction,
 *  score: number,
 *  items?: PlayerItem[],
 * }} PlayerState
 */

/**
 * @typedef {{
 *   maps: Record<RoomEnum, Cell[][]>,
 *   position: CharacterMapPosition[],
 *   score: number,
 *   life: number,
 *   items: GameItem[],
 *   players: Record<PlayerID, PlayerState>,
 *   messages: string[],
 *   paused: boolean,
 *   end: boolean,
 * }} GameState
 */
