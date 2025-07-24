import { createApp } from 'vue'
import { createPinia } from 'pinia';

import './style.css'
import App from './App.vue'
import vAutoScroll from './directives/vAutoScroll';
import vTooltip from './directives/vTooltip';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.directive('auto-scroll', vAutoScroll);
app.directive('tooltip', vTooltip);

app.mount('#app')
