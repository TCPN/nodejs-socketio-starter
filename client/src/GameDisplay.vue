<script setup lang="js">
// import socket from './socket.js';
import { ref, onMounted, watch, computed, nextTick, useTemplateRef } from 'vue';
import { useUserStore } from './store/userStore.js';
import { useGameStore } from './store/gameStore.js';
import { storeToRefs } from 'pinia';
import { useCountDown } from './useCountDown.js';
import CountDown from './components/CountDown.vue';

const userStore = useUserStore();
const { allPlayers } = storeToRefs(userStore);
const onlinePlauers = computed(() => Object.values(allPlayers.value).filter(player => player.status === 'online'));


// game state
const gameStore = useGameStore();
const { hasSync, gameState, currentVote, lastVote } = storeToRefs(gameStore);

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

watch(currentVote, () => {
  countDown.startForVote(currentVote.value);
});

const mapViewerRef = useTemplateRef('map-viewer');
const playerMarkRef = useTemplateRef('player-mark');

watch(playerPosition, async (pos) => {
  if (!pos) {
    return;
  }
  const [r, c] = pos;
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
    v-if="!gameState"
    :class="$style['before-game-panel']"
  >
    <span v-if="!hasSync">連線中...</span>
    <button 
      v-else
      @click="gameStore.startGame"
    >
      開始遊戲
    </button>
    <div
      :class="$style['player-panel']"
    >
      <div
        v-for="client in onlinePlauers"
        v-tooltip="client.name"
        :key="client.id"
        :class="$style['player-name']"
      >
        {{ client.name }}
      </div>
    </div>
  </div>
  <div
    v-else
    :class="$style['root']"
  >
    <div :class="$style['vote-info-panel']">
      <div
        v-if="lastVote"
        :class="[$style['vote-info'], $style['vote-result']]"
      >
        <div style="margin: 0 24px">
          <label>#{{ lastVote.index + 1 }} 投票結果</label>
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
        <label>#{{ currentVote.index + 1 }} 投票中</label>
        <div
          v-if="!countDown.isDisabled.value"
          :class="$style['count-down']"
        >
          <CountDown
            :class="$style['count-down-inner']"
            :currentValue="countDown.currentValue.value"
            :isRunning="countDown.isRunning.value"
          />
        </div>
      </div>
      <div
        v-if="gameState?.paused"
        :class="$style['vote-info']"
      >
        <label>遊戲暫停</label>
      </div>
      <div
        v-if="gameState?.end === 'success'"
        :class="$style['vote-info']"
      >
        <label>過關!</label>
      </div>
      <div
        v-if="gameState?.end === 'failed'"
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
          <label>生命值: </label>
          <span> {{ gameState.life }}</span>
        </div>
        <div :class="$style['player-status-item']">
          <label>{{ gameState.message ? '訊息: ' : ''}}</label>
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
.before-game-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  gap: 16px;
}
.before-game-panel .player-panel {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  width: 100%;
  padding: 0 16px;
}
.before-game-panel .player-name {
  font-size: 12px;
  font-weight: bold;
  user-select: none;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.player-name {
  font-size: 12px;
}
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
  width: 3ex;
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
  grid-template-columns: 1fr 1fr 2fr;
  place-items: center;
  align-content: center;
}
.player-status-item {
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