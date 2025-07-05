<script setup lang="js">
import { hostUserName } from './store/userStore';

defineProps({
  messages: {
    type: Array,
    default: () => [],
  },
});

function usernameTransform(name) {
  if (name === hostUserName) {
    return 'Host';
  } else {
    return name;
  }
}
</script>

<template>
  <div :class="$style['messages']">
    <li v-for="(msg, index) in messages" :key="index" :class="$style['message']">
      <div v-if="msg.voteId">
        <div :class="$style['username']">System</div>
        Vote started by
        <strong :class="$style['username']">
          {{ usernameTransform(msg.userName) }}
        </strong>:
        <div v-for="item in msg.items">
          {{ item.text }}: {{ Object.values(msg.votes ?? {})?.filter(itemId => itemId === item.itemId).length ?? 0 }}
        </div>
      </div>
      <template v-else>
        <div :class="$style['username']">{{ msg.name }}</div>
        <div>{{ msg.text }}</div>
      </template>
    </li>
  </div>
</template>

<style lang="css" module>
.messages {
  padding: 16px;
  overflow-y: auto;
  overflow-x: hidden;
}
.message {
  margin-bottom: 8px;
  list-style: none;
}
.username {
  font-weight: bold;
}
.message > .username {
  font-size: 0.8em;
}
</style>