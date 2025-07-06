<script setup lang="js">
import { useGameStore } from './store/gameStore.js';
import { storeToRefs } from 'pinia';

// game state
const gameStore = useGameStore();
const { endVote, sendVote } = gameStore;
const { currentVote } = storeToRefs(gameStore);
</script>

<template>
  <div :class="$style['container']">
    <div v-if="currentVote">
      <!-- Basic vote -->
      <!-- <button 
        @click="endVote">
        結束投票
      </button> -->
      <div
        :class="$style['vote-direction']"
      >
        <button
          v-for="(item, i) in currentVote.items"
          :key="item.itemId"
          :class="[$style['vote-button'], item.itemId]"
          @click="() => sendVote(item)"
        >
          {{ item.text }}
        </button>
        <div
          v-for="(item, i) in currentVote.items"
          :key="item.itemId"
          :class="[$style['option-text'], item.itemId]"
        >
          {{ item.info?.willTrigger }}
      </div>
      </div>
    </div>
    <div
      v-else
      :class="$style['no-action-hint']"
    >
      目前沒有動作要做
    </div>
  </div>
</template>

<style lang="css" module>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  gap: 16px;
}
.no-action-hint {
  color: #7774;
  user-select: none;
}
.vote-direction {
  display: grid;
  grid-template-areas:
  " .   .  u_t  .   . "
  " .   .  u_b  .   . "
  "l_t l_b  .  r_b r_t"
  " .   .  d_b  .   . "
  " .   .  d_t  .   . ";
  grid-template-columns: minmax(60px, 1fr) 60px 60px 60px minmax(60px, 1fr);
  grid-template-rows: minmax(60px, 1fr) 60px 60px 60px minmax(60px, 1fr);
  gap: 4px;
}
.vote-button:global(.U) { grid-area: u_b; }
.vote-button:global(.L) { grid-area: l_b; }
.vote-button:global(.D) { grid-area: d_b; }
.vote-button:global(.R) { grid-area: r_b; }
.option-text:global(.U) { grid-area: u_t; }
.option-text:global(.L) { grid-area: l_t; }
.option-text:global(.D) { grid-area: d_t; }
.option-text:global(.R) { grid-area: r_t; }
.option-text {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>