import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// 计算 ESM 环境下的 __dirname
const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    host: 'localhost',
    open: false, // 关闭自动打开，使用 Laragon 的域名
    cors: true,
    strictPort: true, // 如果 3001 被占用则报错，不自动改端口
    hmr: {
      overlay: true,
      host: 'localhost',
      port: 3001,
      protocol: 'ws'
    },
    proxy: {
      // 将前端 /api 请求代理到后端 3003，避免开发期 CORS/404
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // 确保资源路径正确
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // 手工稳定分包：提升浏览器缓存命中，不改变业务逻辑
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          i18n: ['react-i18next', 'i18next'],
        }
      }
    },
    chunkSizeWarningLimit: 900
  },
  // 开发环境优化
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  },
  // 基础路径配置（生产环境可能需要）
  base: process.env.NODE_ENV === 'production' ? '/' : '/'
})