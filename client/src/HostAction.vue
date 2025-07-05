<script setup lang="js">
import PlayerAction from './PlayerAction.vue';
import { useGameStore } from './store/gameStore.js';
import { storeToRefs } from 'pinia';

// game state
const gameStore = useGameStore();
const {
  startVote,
  endVote,
  startGame,
  pauseGame,
  resumeGame,
} = gameStore;
const { currentVote, gameState } = storeToRefs(gameStore);
</script>

<template>
  <div :class="$style['container']">
    <button
      @click="startGame"
    >
      開始遊戲
    </button>
    <button
      :disabled="!gameState || gameState.paused"
      @click="pauseGame"
    >
      暫停遊戲
    </button>
    <button
      :disabled="!gameState || !gameState.paused"
      @click="resumeGame"
    >
      繼續遊戲
    </button>
    <button
      :disabled="currentVote"
      @click="startVote"
    >
      發起投票
    </button>
    <button 
      :disabled="!currentVote"
      @click="endVote"
    >
      結束投票
    </button>
    <PlayerAction />
  </div>
</template>

<style lang="css" module>
.container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
}
</style>