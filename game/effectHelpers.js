const { PlayerFaction } = require('./types');
const { EffectTriggerType } = require('./effectTypes');

/**
 * @import { PlayerID, PlayerFaction } from './types';
 * @import { GameState } from './state';
 * @import { EffectDefinition } from './effectTypes';
 */

/** shared with client */

/**
 * @param {EffectDefinition} effect
 * @returns {string}
 */
function getScoreEffectText(effect) {
  return typeof effect === 'string' ? effect : (effect.text || effect.name);
}

function getScoreEffectMarkText(effect) {
  const text = getScoreEffectText(effect);
  return text.replace('分數', '').replace('*', '×').replace('/', '÷').trim();
}

/**
 * @param {EffectDefinition} effect
 * @param {PlayerFaction} faction
 * @returns {boolean}
 */
function isScoreEffectToFaction(effect, faction) {
  return effect.labels.includes('score') && effect.target === faction;
}

/**
 * @param {PlayerFaction} faction
 * @param {EffectDefinition[]} effects
 * @returns {EffectDefinition | null}
 */
function getScoreEffectOfFaction(faction, effects) {
  return effects.find(eff => isScoreEffectToFaction(eff, faction)) ?? null;
}

/**
 * @param {EffectDefinition} effect
 * @param {EffectTriggerType} triggerType
 */
function canTriggerWith(effect, triggerType) {
  if (Array.isArray(effect.trigger)) {
    return effect.trigger.find(t => t.type === triggerType);
  }
  return effect.trigger.type === triggerType;
}

/**
 *
 * @param {GameState} state
 * @param {PlayerID | PlayerFaction | 'all'} target
 * @returns {PlayerID[]}
 */
function getEffectTargetPlayerIds(state, target) {
  const playerIds = Object.keys(state.players);
  if (target === 'all') {
    return playerIds;
  } else if (target in PlayerFaction) {
    return playerIds.filter((id) => state.players[id].faction === target);
  } else {
    return playerIds.filter((id) => id === target);
  }
}

module.exports = {
  getScoreEffectText,
  getScoreEffectMarkText,
  isScoreEffectToFaction,
  getScoreEffectOfFaction,
  canTriggerWith,
  getEffectTargetPlayerIds,
};
