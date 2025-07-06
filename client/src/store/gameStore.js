import { defineStore, storeToRefs } from 'pinia';
import { ref, toRef } from 'vue';

import socket from '../socket.js';
import { useUserStore } from './userStore.js';

export const useGameStore = defineStore('game', () => {
  const hasSync = ref(false);
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

  async function stopGame() {
    const result = await socket.emitWithAck('game stop');
  }

  async function pauseGame() {
    const result = await socket.emitWithAck('game pause');
  }

  async function resumeGame() {
    const result = await socket.emitWithAck('game resume');
  }

  // votes

  async function sendVote(item) {
    voteBusy.value = true;
    const result = await socket.emitWithAck('vote', {
      userId: userId.value,
      voteId: currentVote.value.voteId,
      itemId: item.itemId,
    });
    voteBusy.value = false;
  }

  async function startVote() {
    voteBusy.value = true;
    const result = await socket.emitWithAck('vote start', { timeout: 10 });
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

  async function pauseVoteTimeout() {
    voteBusy.value = true;
    const result = await socket.emitWithAck('vote set timeout', {
      userId: userId.value,
      voteId: currentVote.value.voteId,
      paused: true,
    });
    voteBusy.value = false;
  }

  async function resumeVoteTimeout() {
    voteBusy.value = true;
    const result = await socket.emitWithAck('vote set timeout', {
      userId: userId.value,
      voteId: currentVote.value.voteId,
      paused: false,
    });
    voteBusy.value = false;
  }

  async function stopVoteTimeout() {
    voteBusy.value = true;
    const result = await socket.emitWithAck('vote set timeout', {
      userId: userId.value,
      voteId: currentVote.value.voteId,
      timeout: null,
    });
    voteBusy.value = false;
  }

  async function restartVoteTimeout() {
    voteBusy.value = true;
    const result = await socket.emitWithAck('vote set timeout', {
      userId: userId.value,
      voteId: currentVote.value.voteId,
      timeout: 10,
    });
    voteBusy.value = false;
  }

  // socket

  function startListenSocket(){
    socket.on('chat message', (msg) => {
      messages.value.push(msg);
    });

    socket.on('sync', (data) => {
      if (data.messages) {
        messages.value = data.messages;
      }
      currentVote.value = data.vote;
      gameState.value = data.game;
      hasSync.value = true;
    });

    socket.on('vote start', (info) => {
      currentVote.value = info;
    });

    socket.on('vote update', (info) => {
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
    hasSync,

    gameState,
    startGame,
    stopGame,
    pauseGame,
    resumeGame,

    messages,
    currentVote,
    lastVote,
    voteBusy,
    sendVote,
    startVote,
    endVote,
    pauseVoteTimeout,
    resumeVoteTimeout,
    stopVoteTimeout,
    restartVoteTimeout,
    
    startListenSocket,
  };
});
