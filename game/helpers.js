const { removeFromArray } = require("../array.js");
const { createLogger } = require("../logger.js");
const { randomPick } = require("../random.js");
const log = createLogger('game-helpers');

const { Direction } = require("./types.js");

/**
 * @import { GameState, Coord, PlayerPosition } from './state';
 * @import { MapId, PlayerID, PlayerFaction, Position, GameMap } from './types';
 *
 * @import { Vote } from './server';
 */

/**
 * @param {Coord} coord
 * @param {Direction} direction
 * @returns {Coord}
 */
function getTowardPosition([r, c], direction) {
  switch (direction) {
    case Direction.U:
      return [r - 1, c];
    case Direction.L:
      return [r, c - 1];
    case Direction.D:
      return [r + 1, c];
    case Direction.R:
      return [r, c + 1];
  }
}

/**
 * @param {GameState} state
 * @param {MapId | GameMap | undefined} map
 * @param {Coord} coord
 * @returns {Cell | null}
 */
function getCell(state, map, coord) {
  return getPosition(state, map, coord)?.cell ?? null;
}

/**
 * @param {GameState} state
 * @param {MapId | GameMap | undefined} map
 * @param {Coord} coord
 * @returns {Position | null}
 */
function getPosition(state, map, coord) {
  if (typeof map === 'string') {
    const mapObj = getMap(state, map);
    if (!mapObj) {
      return null;
    }
    map = mapObj;
  }
  if (!map) {
    return null;
  }
  const cell = (map.cells?.at(coord[0])?.at([coord[1]])) ?? null;
  if (!cell) {
    console.error(`Cell not found:`, coord, 'in', map);
  }
  return {
    mapId: map.mapId,
    row: coord[0],
    col: coord[1],
    cell: cell,
  };
}

/**
 * @param {GameState} state
 * @returns {Cell | null}
 */
function getCurrentCell(state) {
  return getCurrentCellWithPosition(state)?.cell ?? null;
}

/**
 * @param {GameState} state
 * @returns {Position}
 */
function getCurrentCellWithPosition(state) {
  const position = getCurrentPosition(state);
  if (!position) {
    console.error('game state lacks character position info');
  }
  const mapId = position?.mapId ?? 'main';
  const map = getMap(state, mapId);
  const coord = position?.coord ?? map?.getDefaultCoord();
  const cell = (map.cells?.at(coord[0])?.at([coord[1]])) ?? null;
  if (!cell) {
    console.error('character not in a cell');
  }
  return {
    mapId: mapId,
    row: coord[0],
    col: coord[1],
    cell: cell,
  };
}

/**
 * @param {GameState} state
 * @returns {PlayerPosition | undefined}
 */
function getCurrentPosition(state) {
  const position = state.position.at(-1);
  if (!position) {
    console.error('game state lacks character position info');
    return;
  }
  return position;
}

/**
 * @param {GameState} state
 * @returns {GameMap | undefined}
 */
function getCurrentMap(state) {
  const position = getCurrentPosition(state);
  if (!position) {
    return;
  }
  const map = getMap(state, position.mapId);
  return map;
}

/**
 * @param {GameState} state
 * @param {MapId} mapId
 * @returns {GameMap | undefined}
 */
function getMap(state, mapId) {
  return state.maps[mapId];
}

module.exports = {
  getTowardPosition,
  getCell,
  getPosition,
  getCurrentCell,
  getCurrentCellWithPosition,
  getCurrentPosition,
  getCurrentMap,
  getMap,
};
