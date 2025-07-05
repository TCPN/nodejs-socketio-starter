<script setup lang="js">
defineProps({
  isRunning: {
    type: Boolean,
    default: false,
  },
  currentValue: {
    type: [Number, String],
    default: 0,
  },
});

// const countDown = useCountDown();
// const initDuration = ref(10);

// watch(initDuration, (value) => {
//   if (!countDown.isRunning.value) {
//     countDown.reset(value);
//   }
// });
</script>

<template>
  <span
    :class="{
      [$style['counting']]: isRunning,
    }"
  >
    {{ currentValue }}
  </span>
  <!-- <div
    :class="{
      [$style['counting']]: countDown.isRunning.value,
    }"
  >
    {{ countDown.currentValue.value }}
  </div> -->
  <!-- <button @click="() => countDown.start()" :disabled="countDown.isRunning.value">Start</button>
  <button @click="() => countDown.pause()" :disabled="!countDown.isRunning.value">Stop</button>
  <button @click="() => countDown.reset()">Reset</button>
  <input type="number" v-model="initDuration" /> -->
</template>

<style lang="css" module>
.counting {
  animation: counting 0.5s infinite;
}

@keyframes counting {
  0%, 100% {
    outline: 1px solid #777;
  }
  50% {
    outline: 1px solid transparent;
  }
}

</style>