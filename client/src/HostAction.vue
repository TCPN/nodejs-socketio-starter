<script setup lang="js">
import PlayerAction from './PlayerAction.vue';
import { useGameStore } from './store/gameStore.js';
import { storeToRefs } from 'pinia';

// game state
const gameStore = useGameStore();
const {
  startGame,
  stopGame,
  pauseGame,
  resumeGame,
  startVote,
  endVote,
  pauseVoteTimeout,
  resumeVoteTimeout,
  stopVoteTimeout,
  restartVoteTimeout,
} = gameStore;
const { currentVote, gameState } = storeToRefs(gameStore);
</script>

<template>
  <div :class="$style['container']">
    <div :class="$style['section']">
      <button
        :disabled="gameState"
        @click="startGame"
      >
        開始遊戲
      </button>
      <button
        :disabled="!gameState || gameState.paused || gameState.end"
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
        :disabled="!gameState"
        @click="stopGame"
      >
        結束遊戲
      </button>
    </div>
    <div :class="$style['section']">
      <button
        :disabled="!gameState || gameState.end || currentVote"
        @click="startVote"
      >
        開始投票
      </button>
      <button 
        :disabled="!gameState || !currentVote"
        @click="endVote"
      >
        結束投票
      </button>
      <button 
        :disabled="!gameState || !currentVote || currentVote.paused"
        @click="pauseVoteTimeout"
      >
        暫停倒數
      </button>
      <button 
        :disabled="!gameState || !currentVote || !currentVote.paused"
        @click="resumeVoteTimeout"
      >
        繼續倒數
      </button>
      <button 
        :disabled="!gameState || !currentVote"
        @click="stopVoteTimeout"
      >
        停止倒數
      </button>
      <button 
        :disabled="!gameState || !currentVote"
        @click="restartVoteTimeout"
      >
        重新倒數
      </button>
      <button>
        完全控制
      </button>
      <PlayerAction style="height: 320px" />
    </div>
    <div :class="$style['section']">
      <h4 :class="$style['section-header']">Debug</h4>
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
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px 0;
  width: 100%;
}
.section:not(:last-child) {
  border-bottom: 1px solid var(--border-color-tertiary);
}
.section-header {
  margin: 8px;
  width: 100%;
}
</style>