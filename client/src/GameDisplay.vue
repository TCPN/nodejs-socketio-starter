<script setup lang="js">
// import socket from './socket.js';
import { ref, onMounted, watch, computed, nextTick, useTemplateRef } from 'vue';
import { useUserStore } from './store/userStore.js';
import { useGameStore } from './store/gameStore.js';
import { storeToRefs } from 'pinia';
import { useCountDown } from './useCountDown.js';
import CountDown from './components/CountDown.vue';

const userStore = useUserStore();
const { userName, isHost } = storeToRefs(userStore);
const { saveUserName } = userStore;

// game state
const gameStore = useGameStore();
const { gameState, currentVote, lastVote } = storeToRefs(gameStore);

const map = computed(() => {
  const state = gameState.value;
  const position = state.position.at(-1);
  if (!position) {
    return [];
  }
  return state.maps[position.map];
});

const playerPosition = computed(() => {
  const state = gameState.value;
  const position = state?.position.at(-1);
  if (!position) {
    return null;
  }
  return position.pos;
});

const countDown = useCountDown();

watch(() => currentVote.value?.voteId, () => {
  if (currentVote.value?.timeout) {
    countDown.reset(currentVote.value.timeout);
    countDown.start();
  }
});

const mapViewerRef = useTemplateRef('map-viewer');
const playerMarkRef = useTemplateRef('player-mark');

watch(playerPosition, async ([r, c]) => {
  await nextTick();
  if (!playerMarkRef.value) {
    return;
  }
  const viewEl = mapViewerRef.value;
  viewEl?.scrollTo(
    c * 50 - viewEl.offsetWidth / 2 + 25,
    r * 50 - viewEl.offsetHeight / 2 + 25,
    'smooth'
  );
});
</script>

<template>
  <div
    :class="$style['root']"
  >
    <div :class="$style['vote-info-panel']">
      <div
        v-if="lastVote"
        :class="[$style['vote-info'], $style['vote-result']]"
      >
        <div style="margin: 0 24px">
          <label>上次投票結果</label>
        </div>
        <div
          v-for="item in lastVote.items"
          :key="item.itemId"
          :class="$style['vote-result-item']"
        >
          <div :class="$style['vote-result-item-name']">
            {{ item.text }}
          </div>
          <div :class="$style['vote-result-item-count']">
            {{ Object.values(lastVote.votes ?? {})?.filter(itemId => itemId === item.itemId).length ?? 0 }}
          </div>
        </div>
      </div>
      <div
        v-if="currentVote"
        :class="$style['vote-info']"
      >
        <label>投票中</label>
        <div
          v-if="countDown.isRunning.value"
          :class="$style['count-down']"
        >
          <CountDown
            :class="$style['count-down-inner']"
            :currentValue="countDown.currentValue.value"
            :isRunning="countDown.isRunning.value"
          />
        </div>
        <button @click="() => console.log('GameState:', JSON.parse(JSON.stringify(currentVote)))">debug</button>
      </div>
      <div
        v-if="gameState?.paused"
        :class="$style['vote-info']"
      >
        <label>遊戲暫停</label>
      </div>
      <div
        v-if="gameState?.finishGoal"
        :class="$style['vote-info']"
      >
        <label>過關!</label>
      </div>
      <div
        v-if="gameState?.failed"
        :class="$style['vote-info']"
      >
        <label>失敗!</label>
      </div>
    </div>
    <div
      v-if="gameState"
      :class="$style['game-viewer']"
    >
      <div
        :class="$style['map-viewer']"
        ref="map-viewer"
      >
        <div
          :class="$style['map']"
        >
          <div
            v-for="(row, r) in map.cells"
            :class="$style['map-row']"
          >
            <div
              v-for="(cell, c) in row"
              :class="$style['map-cell']"
            >
              {{ cell.t || '' }}
              <div
                v-if="playerPosition[0] === r && playerPosition[1] === c"
                ref="player-mark"
                :class="$style['player-mark']"
                data-player-mark
              >
                我
              </div>
            </div>
          </div>
        </div>
      </div>
      <div :class="$style['player-status-panel']">
        <div :class="$style['player-status-item']">
          <label>生命值</label>
          <span>{{ gameState.life }}</span>
        </div>
        <div :class="$style['player-status-item']">
          <label>訊息: </label>
          <span>{{ gameState.message ?? '' }}</span>
        </div>
        <!-- <div :class="$style['player-status-item']">
          <label>分數</label>
          <span>{{ gameState.score }}</span>
        </div> -->
        <!-- <button
          @click="() => console.log('GameState:', JSON.parse(JSON.stringify(gameState)))"
        >
          debug
        </button> -->
      </div>
      <div :class="$style['items-panel']">
        <label>道具</label>
        <div
          v-for="item in gameState.items"
          :key="item"
          :class="$style['items-panel-item']"
        >
          <img 
            height="72px"
            width="72px"
            :alt="item"
            :src="`/src/assets/items/${item.toLowerCase()}.png`"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="css" module>
.root {
  display: grid;
  height: 100%;
}
.vote-info-panel {
  height: 100px;
  display: grid;
  grid-auto-flow: column;
}
.vote-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: start;
  padding: 0 16px;
}
.vote-info label {
  font-size: 32px;
}
.vote-result {
  gap: 8px;
}
.vote-result-item {
  font-size: 24px;
  display: grid;
  grid-auto-flow: row;
  text-align: center;
}
/* .vote-result-item {
  font-size: 24px;
}
.vote-result-item {
  font-size: 24px;
} */
.count-down {
  font-size: 36px;
  font-weight: bold;
  padding: 8px;
  margin: 8px;
}
.count-down-inner {
  display: inline-block;
  padding: 8px;
  width: 100px;
  text-align: center;
}
.game-viewer {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-rows: 1fr 100px 100px;
}
.map-viewer {
  min-height: 0;
  overflow: hidden;
  /* border: 3px solid #777; */
  box-shadow: inset 2px 2px 10px #000;
}
.player-status-panel {
  height: 100px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  place-items: center;
  align-content: start;
}
.player-status-item {
  height: 100px;
}
.items-panel {
  height: 100px;
  display: grid;
  grid-template-columns: 50px repeat(auto-fit, 100px);
  padding: 0 16px;
  place-items: center;
  gap: 16px;
}
.items-panel-item {
  height: 100px;
}
.map {

}
.map-row {
  height: 50px;
  display: grid;
  grid-auto-flow: column;
}
.map-cell {
  position: relative;
  width: 50px;
  height: 50px;
  border: 1px solid #7772;
  display: grid;
  place-items: center;
}
.player-mark {
  position: absolute;
  height: 100%;
  width: 100%;
  display: grid;
  place-items: center;
}
</style>