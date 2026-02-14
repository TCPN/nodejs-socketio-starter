<script setup lang="js">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useGameStore } from './store/gameStore.js';
import { useUserStore } from './store/userStore.js';

/**
 * @import { EffectDefinition } from '../../game/effectTypes.js';
 */

const props = defineProps({
  direction: {
    type: String,
  },
  effects: {
    type: Object,
    default: () => {},
  },
});

const userStore = useUserStore();
const { userId } = storeToRefs(userStore);

const gameStore = useGameStore();
const { myFaction } = storeToRefs(gameStore);

function normalizeEffectItem(item) {
  if (typeof item === 'string') {
    return { text: item };
  } else {
    return {
      text: item.text || item.name,
      ...item,
    };
  }
}

/**
 * @param {EffectDefinition} effect
 * @returns {string[]}
 */
function getEffectTargetText(effect) {
  if (effect.displayCondition.target && effect.displayCondition.target !== 'all') {
    return ['* 專屬 (只有你能看到這個機會)'];
  } else {
    return [];
  }
}

/**
 * @param {EffectDefinition} effect
 * @returns {string[]}
 */
function getEffectTriggerText(effect) {
  if (effect.trigger === 'CHOOSE') {
    return ['* 選就送 (選擇就可獲得，不論投票結果)'];
  } else if (effect.trigger === 'RESOLVE') {
    return ['* 投票結果是此方向，就可獲得'];
  } else {
    return [];
  }
}

/**
 * @param {EffectDefinition} effect
 * @returns {string[]}
 */
function getEffectLifetimeText(effect) {
  if (effect.lifetime === 'ONE_VOTE') {
    return ['* 只有這次投票有效'];
  } else if (effect.lifetime === 'ONE_TRIGGER') {
    return ['* 只能觸發一次'];
  } else {
    return [];
  }
}

function getItemTooltip(item) {
  return [
    item.text,
    ...(item.desc ? [item.desc] : []),
    '',
    ...getEffectTargetText(item),
    ...getEffectTriggerText(item),
    ...getEffectLifetimeText(item),
  ].join('\n');
}

function makeArray(value) {
  if (Array.isArray(value)) {
    return value;
  } else {
    return [value];
  }
}

function getEffectsToDisplay(effects) {
  return effects
    .filter(e => e.enabled)
    .filter((/** @type {EffectDefinition} */ e) => {
      if (Array.isArray(e.trigger)) {
        return e.trigger.some(eff => !eff.direction || eff.direction === props.direction);
      }
      return !e.trigger.direction || e.trigger.direction === props.direction;
    })
    .map(normalizeEffectItem);
}

const allEffects = computed(() => {
  return getEffectsToDisplay(props.effects?.all ?? []);
});

const privateItems = computed(() => {
  return getEffectsToDisplay([
    ...makeArray(props.effects?.faction?.[myFaction.value] ?? []),
    ...makeArray(props.effects?.player?.[userId.value] ?? []),
  ]);
});
</script>

<template>
  <div :class="$style['effect-info-container']">
    <div
      v-for="item in allEffects"
      :key="item.text"
    >
      {{ item.text }}
    </div>
    <div
      v-for="item in privateItems"
      :key="item.text"
      :class="$style['effect-item']"
      v-tooltip="getItemTooltip(item)"
    >
      <div
        :class="[$style['item-mark'], $style['item-private']]"
      ></div>
      <div
        v-if="item.trigger.some(t => t.type === 'CHOOSE')"
        :class="[$style['item-mark'], $style['cond-select']]"
      >⚡</div>
      <span :class="$style['effect-item-text']">
        {{ item.text }}
      </span>
    </div>
  </div>
</template>

<style lang="css" module>
.effect-info-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  gap: 16px;
  user-select: none;
}
.effect-item {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
}
.effect-item-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item-mark {
  /* background-color: #777; */
  /* border-radius: 50%; */
  /* width: 10px; */
  /* height: 10px; */
  font-size: 10px;
}
.item-mark.item-private {
  /* background-color: orange; */
  /* color: #999;
  border: 1px solid; */
  /* content: "🤫"; */
}
.item-mark.cond-select {
  /* background-color: orange; */
  /* color: orange;
  border: 1px solid; */
}
</style>
