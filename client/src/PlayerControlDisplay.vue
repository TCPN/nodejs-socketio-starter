<script setup lang="js">
import { watch } from 'vue';
import { useGameStore } from './store/gameStore.js';
import { storeToRefs } from 'pinia';
import { useCountDown } from './useCountDown.js';
import PlayerAction from './PlayerAction.vue';

// game state
const gameStore = useGameStore();
const { currentVote, lastVote } = storeToRefs(gameStore);

const countDown = useCountDown();

watch(() => currentVote.value?.voteId, () => {
  const vote = currentVote.value;
  if (!vote) {
    return;
  }
  if (vote.timeout) {
    if (!vote.paused) {
      countDown.reset(currentVote.value.timeout);
      countDown.start();
    } else {
      countDown.reset(currentVote.value.remainTimeout);
    }
  }
});
</script>

<template>
  <div
    :class="$style['player-control']"
  >
    <div
      :class="$style['vote-info']"
    >
      <span v-if="currentVote">
        #{{ currentVote.index + 1}} 投票中，還有 {{ countDown.currentValue.value }} 秒
      </span>
      <span v-else-if="lastVote">
        #{{ lastVote.index + 1 }} 投票結束
      </span>
    </div>
    <PlayerAction 
      :class="$style['player-action']"
    />
  </div>
</template>

<style lang="css" module>
.player-control {
  padding: 16px;
}
.player-action {
  padding: 16px;
}
.vote-info {
  padding: 16px;
}
</style>