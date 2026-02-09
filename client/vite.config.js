import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    allowedHosts: [
      'ws1.csie.ntu.edu.tw',
      'ws2.csie.ntu.edu.tw',
      'ws3.csie.ntu.edu.tw',
      'ws4.csie.ntu.edu.tw',
      'ws5.csie.ntu.edu.tw',
      'ws6.csie.ntu.edu.tw',
      'ws7.csie.ntu.edu.tw',
      'ws8.csie.ntu.edu.tw',
      'ws9.csie.ntu.edu.tw',
      'ws10.csie.ntu.edu.tw',
    ],
  },
})
