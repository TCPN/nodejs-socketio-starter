import { ref, computed } from 'vue';

export function useCountDown({ init = 10, precision = 1000, onEnd, autoStop = true } = {}) {
  const currentValue = ref(0);
  const isDisabled = ref(false);
  const timer = ref(-1);
  const isRunning = computed(() => {
    return timer.value !== -1;
  });
  let startTime = 0;
  let startValue = 0;
  let endHandler = onEnd;
  let triggerd = false;

  precision = precision <= 100 && precision >= 1 ? precision : 1000;
  const digits = 3 - Math.ceil(Math.log10(precision) || 0);
  const round = (value, decimalDigits) => {
    const base = Math.pow(10, decimalDigits);
    return Math.round(value * base) / base;
  }
  const toInnerValue = (value) => value * 1000;
  const toOuterValue = (value) => {
    return round(value / 1000, digits);
  };

  function startForVote(vote) {
    if (!vote || vote.finished) {
      reset(null);
      return;
    }
    reset(vote.endTime ? (vote.endTime - Date.now()) / 1000 : vote.timeout);
    if (!vote.paused) {
      start();
    }
  }

  function start() {
    if (isRunning.value) {
      pause();
    }
    startValue = currentValue.value;
    startTime = Date.now();
    const intv = setInterval(() => {
      currentValue.value = startValue - (Date.now() - startTime);
      if (!triggerd && currentValue.value <= 0) {
        triggerd = true;
        if (autoStop) {
          pause();
        }
        if (endHandler) {
          endHandler();
        }
      }
    }, precision);
    timer.value = intv;
  }

  function pause() {
    clearInterval(timer.value);
    timer.value = -1;
  }

  function reset(newInit) {
    if (isRunning.value) {
      pause();
    }
    startValue = 0;
    startTime = 0;
    triggerd = false;
    isDisabled.value = newInit === null;
    if (newInit !== undefined) {
      init = newInit ?? 0;
    }
    currentValue.value = toInnerValue(init);
  }

  function onEnd(handler) {
    endHandler = handler;
  }

  function setValue(value) {
    currentValue.value = toInnerValue(value);
  }

  function shiftValue(value) {
    currentValue.value += toInnerValue(value);
  }

  reset();

  return {
    currentValue: computed(() => {
      return '' + toOuterValue(currentValue.value);
    }),
    isDisabled,
    isRunning,
    timer,
    onEnd,
    start,
    pause,
    reset,
    setValue,
    shiftValue,
    startForVote,
  };
}
