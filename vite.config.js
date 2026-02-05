import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
    open: true,
    // 允许局域网访问 - 监听所有网络接口
    host: '0.0.0.0',
    // 或者使用 true，效果相同
    // host: true,
    https: false,
    // 允许跨域
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
    open: true
  }
})
