import socket from './socket.js';
import { userId } from './userId.js';

const { createApp } = Vue;

createApp({
  data() {
    return {
      userId,
      messages: [],
      newMessage: '',
      userName: localStorage.getItem('userName') || '',

      currentVote: null,
      voteBusy: false,
    };
  },
  mounted() {
    socket.on('chat message', (msg) => {
      this.messages.push(msg);
    });

    socket.on('sync', ({ messages, vote }) => {
      this.messages = messages;
      this.currentVote = vote;
    });

    socket.on('vote start', (info) => {
      this.currentVote = info;
    });

    socket.on('vote end', (info) => {
      this.messages.push(info);
      this.currentVote = null;
    });
  },
  methods: {
    sendMessage() {
      if (this.newMessage.trim() !== '') {
        socket.emit('chat message', {
            userId: this.userId,
            name: this.userName,
            text: this.newMessage,
        });
        this.newMessage = '';
      }
    },
    saveUserName() {
      if (this.userName.trim() !== '') {
        localStorage.setItem('userName', this.userName);
      }
    },
    async startVote() {
      this.voteBusy = true;
      const result = await socket.emitWithAck('vote start', {
        userId: this.userId,
        userName: this.userName,
        items: [
          { text: 'A', itemId: 'A' },
          { text: 'B', itemId: 'B' },
          { text: 'C', itemId: 'C' },
          { text: 'D', itemId: 'D' },
        ],
        timeout: 10,
      });
      if (result === false) {
        console.log('other vote is still running');
      }
      this.voteBusy = false;
    },
    async endVote() {
      this.voteBusy = true;
      const result = await socket.emitWithAck('vote end', this.currentVote);
      if (result === false) {
        console.log('the vote is not running');
      }
      this.voteBusy = false;
    },
    async sendVote(item) {
      this.voteBusy = true;
      const result = await socket.emitWithAck('vote', {
        userId: this.userId,
        voteId: this.currentVote.voteId,
        itemId: item.itemId,
      });
      this.voteBusy = false;
    },
  }
}).mount('#app');
