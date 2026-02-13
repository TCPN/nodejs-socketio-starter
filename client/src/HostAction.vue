<script setup lang="js">
import { ref } from 'vue';
import PlayerAction from './PlayerAction.vue';
import { useGameStore } from './store/gameStore.js';
import { useUserStore } from './store/userStore.js';
import { storeToRefs } from 'pinia';
import socket from './socket.js';

const userStore = useUserStore();
const { allClients, allPlayers } = storeToRefs(userStore);
const fullControl = ref(false);

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

async function onClickFullControl() {
  const oldValue = fullControl.value;
  fullControl.value = !oldValue;
  try {
    await socket.emitWithAck('set full control', fullControl.value)
  } catch {
    fullControl.value = oldValue;
  }
}
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
      <button
        :class="{
          [$style['button-active']]: fullControl,
        }"
        @click="onClickFullControl"
      >
        完全控制
      </button>
      <PlayerAction
        style="height: 320px"
        :directly-exec="fullControl"
      />
    </div>
    <div :class="$style['section']">
      <h4 :class="$style['section-header']">Clients ({{ Object.keys(allPlayers).length }})</h4>
      <div>
        <div
          v-for="client in allPlayers"
          :key="client.id"
          :class="$style['client-item']"
        >
          <div
            v-tooltip="client.status"
            :class="$style['client-status']"
            :data-status="client.status"
          ></div>
          <div
            :class="$style['client-name']"
            v-tooltip="`Name: ${client.name}\nID: ${client.id}`"
          >
            {{ client.name }}
          </div>
        </div>
      </div>
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
  height: 100%;
  overflow-y: auto;
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
.client-item {
  display: grid;
  grid-template-columns: 10px 1fr;
  gap: 6px;
  align-items: center;
}
.client-name {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.client-status {
  border-radius: 50%;
  width: 12px;
  height: 12px;
}
.client-status {
  border-radius: 50%;
  width: 10px;
  height: 10px;
  background-color: grey;
}
.client-status[data-status="online"] {
  background-color: lawngreen;
}
.button-active {
  background: darkcyan;
}
</style>
