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
    <div :class="$style['section']">
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
    </div>
    <div :class="$style['section']">
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
      <PlayerAction style="height: 320px" />
    </div>
    <div :class="$style['section']">
      <h4>Debug</h4>
      <button @click="() => console.log('gameState:', JSON.parse(JSON.stringify(gameState)))">print gameState</button>
      <button @click="() => console.log('currentVote:', JSON.parse(JSON.stringify(currentVote)))">print currentVote</button>
    </div>
  </div>
</template>

<style lang="css" module>
.container {
  gap: 8px;
}
.section {
  display: grid;
  gap: 8px;
  padding: 16px;
  width: 100%;
  grid-template-columns: minmax(auto, 100%);
  grid-template-rows: repeat(min-content, auto);
}
.section:not(:last-child) {
  border-bottom: 1px solid var(--border-color-tertiary);
}
</style>