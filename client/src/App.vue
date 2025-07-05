<script setup lang="js">
import socket from './socket.js';
import { userId } from './userId.js';
import { ref, onMounted } from 'vue';
import WelcomeView from './WelcomeView.vue';
import MessageInput from './MessageInput.vue';
import MessageDisplay from './MessageDisplay.vue';
import { useUserStore } from './store/userStore.js';
import { useGameStore } from './store/gameStore.js';
import { storeToRefs } from 'pinia';
import HostAction from './HostAction.vue';
import PlayerAction from './PlayerAction.vue';
import Countdown from './components/CountDown.vue';
import GameDisplay from './GameDisplay.vue';

const userStore = useUserStore();
const { userName, isHost } = storeToRefs(userStore);
const { saveUserName } = userStore;

// UI state
const welcomeInput = ref(userName.value === '');
const showMessageDisplay = ref(false);
const showHostActionPanel = ref(false);

// game state
const gameStore = useGameStore();
const { startListenSocket } = gameStore;
const { messages } = storeToRefs(gameStore);

onMounted(() => {
  startListenSocket();
})
</script>

<template>
  <WelcomeView
    v-if="welcomeInput"
    @send="(name) => {
      userName = name;
      welcomeInput = false;
      saveUserName();
    }"
  />
  <div
    v-else
    :class="$style['app-container']"
  >
    <div
      :class="$style['app-header']"
    >
      <div
        v-if="isHost"
        :class="$style['second-label']"
      >遊戲主畫面</div>
      <div v-else>
        <label
          :class="$style['input-label']"
        >你的名字</label>
        <input
          v-model="userName"
          placeholder="輸入名字"
          @change="saveUserName"
        />
      </div>
      <div
        :class="$style['app-header-right']"
      >
        <button
          v-if="isHost"
          :class="$style['app-header-button']"
          @click="showHostActionPanel = !showHostActionPanel"
          style="background-image: url(/src/assets/lightning.png); background-repeat: no-repeat; background-position: center; background-size: 24px;"
        />
        <button
          :class="$style['app-header-button']"
          @click="showMessageDisplay = !showMessageDisplay"
          style="background-image: url(/src/assets/chat.png); background-repeat: no-repeat; background-position: center; background-size: 24px;"
        />
      </div>
    </div>
    <MessageDisplay
      v-if="showMessageDisplay"
      :messages="messages"
      :class="{
        [$style['right-panel']]: true,
        [$style['message-panel']]: true,
      }"
    />
    <MessageInput
      v-if="false"
      :is-disabled="!userName"
      @send="(data) => {
        socket.emit('chat message', {
          userId: userId,
          name: userName,
          text: data,
        });
      }"
    />
    <div
      v-if="showHostActionPanel"
      :class="{
        [$style['right-panel']]: true,
      }"
    >
      <HostAction
        v-if="isHost"
        :class="$style['action-panel']"
      />
    </div>
    <div
      :class="{
        [$style['center-panel']]: true,
      }"
    >
      <GameDisplay
        v-if="isHost"
      />
      <PlayerAction
        v-if="!isHost"
        :class="$style['action-panel']"
      />
      <Countdown />
    </div>
  </div>
</template>

<style lang="css" module>
.app-container {
  height: 100%;
}
.app-header {
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  padding: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 0 5px black;
}
.app-header-right {
}
.app-header-button {
  border: none;
  background: transparent;
  height: 32px;
  width: 32px;
  padding: 0;
  border-radius: 2px;
}
.app-header-button:hover {
  background: #7774;
}
.right-panel {
  background: var(--bg-color-primary);
  position: fixed;
  top: 48px;
  bottom: 0;
  width: 360px;
  max-width: 100vw;
  border: 1px solid var(--border-color-tertiary);
  border-right: none;
  transition: right;
  right: 0;
  z-index: 1;
}
.message-panel {
}
.message-panel.open {
}
.center-panel {
  height: calc(100% - 48px);
}
.input-label {
  margin-right: 8px;
}
.second-label {
  color: var(--color-secondary);
}
.action-panel {
  margin: 16px;
}
</style>