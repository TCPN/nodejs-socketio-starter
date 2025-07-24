import { defineStore } from 'pinia';
import { computed, ref, toRef } from 'vue';
import { userId } from '../userId.js';

export const hostUserName = 'IMHost';

export const useUserStore = defineStore('user', () => {
  const userName = ref(localStorage.getItem('userName') || '');
  const allClients = ref({});
  const isHost = computed(() => userName.value === hostUserName);

  function saveUserName() {
    if (userName.value.trim() !== '') {
      localStorage.setItem('userName', userName.value);
    }
  }

  function updateUsers(users) {
    const oldClients = allClients.value;
    for (const id in users) {
      oldClients[id] = Object.assign(oldClients[id] ?? {}, users[id]);
    }
    allClients.value = oldClients;
  }

  globalThis.addUser = (name) => {
    const id = `${Date.now()} ${Math.random()}`;
    updateUsers({ [id]: { id, name, status: 'online', role: 'player' } });
  };

  globalThis.addUsers = (names) => {
    for (const name of names) {
      addUser(name);
    }
  };

  return {
    userId: toRef(() => userId),
    userName,
    isHost,
    allClients,
    allPlayers: computed(() => Object.fromEntries(Object.entries(allClients.value).filter(([key, client]) => client.role === 'player'))),
    saveUserName,
    updateUsers,
  };
});
