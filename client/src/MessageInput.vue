<script setup lang="js">
import { ref } from 'vue';

const props = defineProps({
  isDisabled: {
    type: Boolean,
    default: false,
  },
});

const newMessage = ref('');

const emit = defineEmits('send');

function sendMessage() {
  if (newMessage.value.trim() !== '') {
    emit('send', newMessage.value);
    newMessage.value = '';
  }
}
</script>

<template>
  <div>
    <input
      v-model="newMessage"
      placeholder="輸入訊息..."
      :disabled="isDisabled"
      @keydown.enter="sendMessage"
    />
    <button 
      :disabled="!newMessage"
      @click="sendMessage"
    >送出</button>
  </div>
</template>

<style lang="css" module>
</style>