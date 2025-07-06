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
  <div
    v-auto-scroll
    data-scroll-id="messages"
    :class="$style['messages']"
  >
    <li v-for="(msg, index) in messages" :key="index" :class="$style['message']">
      <template v-if="msg.voteId">
        <div :class="$style['header']">#{{ msg.index + 1 }} 投票結果</div>
        <!-- Vote started by
        <strong :class="$style['username']">
          {{ usernameTransform(msg.userName) }}
        </strong>: -->
        <div :class="$style['vote-result']">
          <div v-for="item in msg.items">
            {{ item.text }}　{{ Object.values(msg.votes ?? {})?.filter(itemId => itemId === item.itemId).length ?? 0 }}
          </div>
        </div>
      </template>
      <template v-else>
        <div :class="$style['username']">{{ msg.name }}</div>
        <div>{{ msg.text }}</div>
      </template>
    </li>
  </div>
</template>

<style lang="css" module>
.messages {
  padding: 0 24px;
  overflow-y: auto;
  overflow-x: hidden;
}
.message {
  margin: 32px 0;
  list-style: none;
}
.username {
  font-weight: bold;
}
.message > .username {
  font-size: 0.8em;
}
.message .header {
  margin: 8px 0;
}
.vote-result {
  display: grid;
  grid-auto-flow: column;
  gap: 16px;
  margin: 8px 0;
}
</style>