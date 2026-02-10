import { defineStore } from 'pinia';
import { computed, ref, toRef } from 'vue';
import { userId, removeUserId, setUserId } from '../userId.js';

export const hostUserName = 'IMHost';
const USER_NAME_STORAGE_KEY = 'userName';

export const useUserStore = defineStore('user', () => {
  const userName = ref(localStorage.getItem(USER_NAME_STORAGE_KEY) || '');
  const allClients = ref({});
  const isHost = computed(() => userName.value === hostUserName);

  function changeUserName(name) {
    if (name.trim() === '') {
      return false;
    }
    userName.value = name;
    saveUserName()
    return true;
  }

  function saveUserName() {
    if (userName.value.trim() !== '') {
      localStorage.setItem(USER_NAME_STORAGE_KEY, userName.value);
    }
  }

  function updateUsers(users) {
    const oldClients = allClients.value;
    for (const id in users) {
      if (id === userId) {
        userName.value = users[id].name;
      }
      oldClients[id] = Object.assign(oldClients[id] ?? {}, users[id]);
    }
    allClients.value = oldClients;
  }

  function logout() {
    localStorage.removeItem(USER_NAME_STORAGE_KEY);
    removeUserId();
  }

  function login(userId) {
    localStorage.removeItem(USER_NAME_STORAGE_KEY);
    setUserId(userId);
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
    changeUserName,
    updateUsers,
    logout,
    login,
  };
});
