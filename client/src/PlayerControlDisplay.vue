<script setup lang="js">
import { watch } from 'vue';
import { useGameStore } from './store/gameStore.js';
import { storeToRefs } from 'pinia';
import { useCountDown } from './useCountDown.js';
import PlayerAction from './PlayerAction.vue';

// game state
const gameStore = useGameStore();
const { currentVote, lastVote, gameState } = storeToRefs(gameStore);

const countDown = useCountDown();

watch(() => currentVote.value?.voteId, () => {
  countDown.startForVote(currentVote.value);
});
</script>

<template>
  <div
    :class="$style['player-control']"
  >
    <div
      v-if="!gameState"
      :class="$style['centered-message']"
    >
      <span v-if="!hasSync">連線中...</span>
      <span v-else>遊戲尚未開始</span>
    </div>
    <div
      v-if="gameState"
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
      v-if="gameState"
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
.centered-message {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>