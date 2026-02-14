/**
 * @import { PlayerID, PlayerFaction, Cell, Position } from './types';
 * @import { CellType } from './cell';
 * @import { GameState } from './state';
 */

/** @enum {'CHOOSE' | 'RESOLVE' | 'INTERACT' | 'STAND'} */
const EffectTriggerType = {
  CHOOSE: 'CHOOSE',
  RESOLVE: 'RESOLVE',
  INTERACT: 'INTERACT',
  STAND: 'STAND',
};

/**
 * @typedef {{
 *  dir: Direction,
 *  cell?: Cell | null,
 *  position?: Position | null,
 * }} EffectDisplayFnContext
 * */

/**
 * @typedef {{
 *  chooseDir?: Direction,
 *  voteResult?: Direction,
 *  target?: PlayerID,
 *  interactPos?: Position | null,
 *  standPos: Position | null,
 * }} EffectFnContext
 * */

/**
 * @template TReturn
 * @template TContext
 * @typedef {(
 *  state: GameState,
 *  context: TContext,
 *  effect: EffectDefinition,
 * ) => TReturn} EffectFn
 */

/**
 * @typedef {{
 *  target?: PlayerID | PlayerFaction | 'all',
 *  cellType?: [CellType],
 *  fn?: EffectFn<boolean, EffectDisplayFnContext>,
 * }} EffectDisplayCondition
 */

/**
 * @typedef {{
 *  type: EffectTriggerType,
 *  direction?: Direction,
 *  target?: PlayerID | PlayerFaction,
 * }} EffectTrigger
 */

/**
 * @typedef {{
 *  name: string,
 *  labels?: string[],
 *  visible?: PlayerID | PlayerFaction | 'all',
 *  enabled?: boolean,
 *  displayCondition?: EffectDisplayCondition,
 *  trigger: EffectTrigger | EffectTrigger[],
 *  effectFn: EffectFn<void, EffectFnContext>,
 *  lifetime?: 'ONE_VOTE' | 'ONE_TRIGGER' | 'PERMANENT',
 *  target?: PlayerID | PlayerFaction,
 * }} EffectDefinition
 */

module.exports = {
  EffectTriggerType,
};
