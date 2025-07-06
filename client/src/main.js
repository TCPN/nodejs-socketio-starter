import { createApp } from 'vue'
import { createPinia } from 'pinia';

import './style.css'
import App from './App.vue'
import vAutoScroll from './directives/vAutoScroll';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.directive('auto-scroll', vAutoScroll);

app.mount('#app')
