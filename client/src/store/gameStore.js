import { defineStore, storeToRefs } from 'pinia';
import { ref, toRef } from 'vue';

import socket from '../socket.js';
import { useUserStore } from './userStore.js';

export const useGameStore = defineStore('game', () => {
  const messages = ref([]);
  const currentVote = ref(null);
  const lastVote = ref(null);
  const voteBusy = ref(false);
  const gameState = ref(null);

  const {
    userId,
    userName,
  } = storeToRefs(useUserStore());

  // game control

  async function startGame() {
    const result = await socket.emitWithAck('game start');
  }

  async function pauseGame() {
    const result = await socket.emitWithAck('game pause');
  }

  async function resumeGame() {
    const result = await socket.emitWithAck('game resume');
  }

  // votes

  async function startVote() {
    voteBusy.value = true;
    const result = await socket.emitWithAck('vote start', {
      userId: userId.value,
      userName: userName.value,
      items: [
        { text: '上', itemId: 'U' },
        { text: '左', itemId: 'L' },
        { text: '下', itemId: 'D' },
        { text: '右', itemId: 'R' },
      ],
      timeout: 10,
    });
    if (result === false) {
      console.log('other vote is still running');
    }
    voteBusy.value = false;
  }

  async function endVote() {
    voteBusy.value = true;
    const result = await socket.emitWithAck('vote end', currentVote.value);
    if (result === false) {
      console.log('the vote is not running');
    }
    voteBusy.value = false;
  }

  async function sendVote(item) {
    voteBusy.value = true;
    const result = await socket.emitWithAck('vote', {
      userId: userId.value,
      voteId: currentVote.value.voteId,
      itemId: item.itemId,
    });
    voteBusy.value = false;
  }

  function startListenSocket(){
    socket.on('chat message', (msg) => {
      messages.value.push(msg);
    });

    socket.on('sync', (data) => {
      if (data.messages) {
        messages.value = data.messages;
      }
      currentVote.value = data.vote;
    });

    socket.on('vote start', (info) => {
      currentVote.value = info;
    });

    socket.on('vote end', (info) => {
      messages.value.push(info);
      currentVote.value = null;
      lastVote.value = info;
    });

    socket.on('game state', (state) => {
      gameState.value = state;
    });
  }

  return {
    gameState,
    startGame,
    pauseGame,
    resumeGame,

    messages,
    currentVote,
    lastVote,
    voteBusy,
    startVote,
    endVote,
    sendVote,
    
    startListenSocket,
  };
});
