<script setup lang="js">
import { ref } from 'vue';

const inputName = ref('');

const emit = defineEmits('send');

function onSend() {
  if (inputName.value.trim() !== '') {
    emit('send', inputName.value);
  }
}
</script>

<template>
  <div
    :class="$style['welcome-input']"
  >
    <label
      for="welcome-input-field"
      :class="$style['welcome-input-label']">輸入你的名字</label>
    <input
      id="welcome-input-field"
      v-model="inputName"
      placeholder="輸入名字"
    />
    <button
      :disabled="!inputName"
      style="justify-self: end;"
      @click="onSend"
    >送出</button>
  </div>
</template>

<style lang="css" module>
.welcome-input {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    height: 100%;
    width: 100%;
}
.welcome-input-label {
  font-size: 32px;
  font-weight: bold;
}
</style>