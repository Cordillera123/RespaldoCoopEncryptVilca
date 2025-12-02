// vite.config.js - Configuración única para servidor 173.31.30.180
import { defineConfig } from 'vite'
import path from 'path'

// ⚠️ CONFIGURACIÓN ÚNICA: Solo wsVirtualCoopSrvP
// Las rutas wsVirtualCoopSrvL y wsVirtualCoopSrv NO EXISTEN en los servidores de las cooperativas
const API_TARGET = 'http://192.168.200.102'
const API_PATH = '/wsVirtualCoopSrvP/ws_server'

export default defineConfig({
  // Base: Raíz del sitio
  base: '/',
  
  // Servidor de desarrollo (npm run dev)
  server: {
    port: 3000,
    host: '0.0.0.0',
    cors: true,
    
    proxy: {
      '/api-l': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace('/api-l', API_PATH),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('🔄 [PROXY /api-l]', req.method, req.url, '→', API_TARGET + API_PATH + req.url.replace('/api-l', ''))
          })
        }
      },
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace('/api', API_PATH),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('🔄 [PROXY /api]', req.method, req.url, '→', API_TARGET + API_PATH + req.url.replace('/api', ''))
          })
        }
      }
    }
  },
  
  // Build de producción (npm run build)
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          crypto: ['crypto-js'],
        },
      },
    },
  },
  
  // Alias de rutas
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@services': path.resolve(__dirname, './src/services'),
      '@assets': path.resolve(__dirname, './src/assets'),
    }
  },
  
  plugins: [],
  
  css: {
    devSourcemap: true
  }
})