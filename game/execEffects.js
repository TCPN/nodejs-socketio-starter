const { makeArray } = require('../array.js');
const { getEffectTargetPlayerIds, canTriggerWith } = require('./effectHelpers.js');
const { getItemObject } = require('./item.js');

/**
 * @import { EffectDefinition, EffectFnContext } from './effectTypes';
 * @import { GameState } from './state';
 */

/**
 * @param {EffectDefinition[]} effects
 * @param {GameState} state
 * @param {EffectFnContext & { vote: Vote }} baseContext
 */
function execChooseTriggerEffects(effects, state, {
  interactPos,
  standPos,
  vote,
  action,
}) {
  // TODO: consider effects stored at other places
  // const effects = willTrigger(state, toward);
  for (const effect of effects) {
    if (!effect.enabled || !canTriggerWith(effect, 'CHOOSE')) {
      continue;
    }
    const targetPlayerIds = getEffectTargetPlayerIds(state, effect.target);
    for (const playerId of targetPlayerIds) {
      // const player = getPlayer(state, playerId);
      // if (!player) { continue; }
      const playerChoose = vote.votes?.[playerId] ?? null;
      if (!makeArray(effect.trigger).map(trigger => trigger.direction).includes(playerChoose)) {
        continue;
      }
      effect.effectFn?.(state, {
        target: playerId,
        chooseDir: playerChoose,
        voteResult: action,
        interactPos,
        standPos,
      }, effect);
    }
  }
}

/**
 * @param {EffectDefinition[]} effects
 * @param {GameState} state
 * @param {EffectFnContext & { vote: Vote }} baseContext
 */
function execResolveTypeEffects(effects, state, {
  interactPos,
  standPos,
  vote,
  action,
}) {
  // TODO: consider effects stored at other places
  for (const effect of effects) {
    if (!effect.enabled || !canTriggerWith(effect, 'RESOLVE')) {
      continue;
    }
    if (!makeArray(effect.trigger).map(trigger => trigger.direction).includes(action)) {
      continue;
    }
    const targetPlayerIds = getEffectTargetPlayerIds(state, effect.target);
    for (const playerId of targetPlayerIds) {
      // const player = getPlayer(state, playerId);
      // if (!player) { continue; }
      effect.effectFn?.(state, {
        target: playerId,
        voteResult: action,
        interactPos,
        standPos,
      }, effect);
    }
  }
}

/**
 *
 * @param {GameState} state
 * @param {EffectFnContext & { vote: Vote }} baseContext
 */
function execInteractTriggerEffects(state, {
  interactPos,
  standPos,
  vote,
  action,
}) {
  if (!interactPos?.cell) {
    return;
  }
  const globalEffects = state.globalEffects ?? [];
  const cellEffects = interactPos.cell.effects ?? [];
  const itemsEffects = interactPos.cell.items?.map(item => {
    const itemObj = getItemObject(item);
    return itemObj.effects ?? [];
  }).flat(2) ?? [];
  const effects = globalEffects.concat(cellEffects, itemsEffects);
  // TODO: consider effects stored at other places
  for (const effect of effects) {
    if (
      !effect.enabled
      || effect.displayCondition?.fn?.(state, { vote, voteResult: action, interactPos, standPos }, effect) === false
      || !canTriggerWith(effect, 'INTERACT')
    ) {
      continue;
    }
    effect.effectFn?.(state, {
      vote: vote,
      voteResult: action,
      interactPos,
      standPos,
    }, effect);
  }
}

/**
 *
 * @param {GameState} state
 * @param {EffectFnContext & { vote: Vote }} baseContext
 */
function execStandTriggerEffects(state, {
  interactPos,
  standPos,
  vote,
  action,
}) {
  if (!standPos?.cell) {
    return;
  }
  const globalEffects = state.globalEffects ?? [];
  const cellEffects = standPos.cell.effects ?? [];
  const itemsEffects = standPos.cell.items?.map(item => {
    const itemObj = getItemObject(item);
    return itemObj.effects ?? [];
  }).flat(2) ?? [];
  const effects = globalEffects.concat(cellEffects, itemsEffects);
  // TODO: consider effects stored at other places
  for (const effect of effects) {
    if (
      !effect.enabled
      || effect.displayCondition?.fn?.(state, { vote, voteResult: action, interactPos, standPos }, effect) === false
      || !canTriggerWith(effect, 'STAND')
    ) {
      continue;
    }
    effect.effectFn?.(state, {
      vote: vote,
      voteResult: action,
      interactPos,
      standPos,
    }, effect);
  }
}

module.exports = {
  execChooseTriggerEffects,
  execResolveTypeEffects,
  execInteractTriggerEffects,
  execStandTriggerEffects,
};
