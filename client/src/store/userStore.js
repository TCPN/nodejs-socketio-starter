import { defineStore } from 'pinia';
import { computed, ref, toRef } from 'vue';
import { userId } from '../userId.js';

export const hostUserName = 'IMHost';

export const useUserStore = defineStore('user', () => {
  const userName = ref(localStorage.getItem('userName') || '');
  const isHost = computed(() => userName.value === hostUserName);

  function saveUserName() {
    if (userName.value.trim() !== '') {
      localStorage.setItem('userName', userName.value);
    }
  }

  return {
    userId: toRef(() => userId),
    userName,
    isHost,
    saveUserName,
  };
});
