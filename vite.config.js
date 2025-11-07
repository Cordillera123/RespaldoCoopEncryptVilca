// vite.config.js - Configuración multi-ambiente (Desarrollo + Producción)
import { defineConfig, loadEnv } from 'vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno según el modo
  const env = loadEnv(mode, process.cwd(), '')
  
  // Determinar el servidor backend según el ambiente
  // DESARROLLO: 192.168.200.102/wsVirtualCoopSrvP/ws_server/prctrans.php
  // PRODUCCIÓN: 192.168.0.59/wsVirtualCoopSrvL/ws_server/prctrans.php
  const API_TARGET = mode === 'production' 
    ? 'http://192.168.0.59'      // PRODUCCIÓN
    : 'http://192.168.200.102'   // DESARROLLO

  const API_PATH = mode === 'production'
    ? '/wsVirtualCoopSrvL/ws_server'  // PRODUCCIÓN (servidor L)
    : '/wsVirtualCoopSrvP/ws_server'  // DESARROLLO (servidor P)

  console.log('🚀 [VITE] Modo:', mode)
  console.log('🌐 [VITE] API Target:', API_TARGET)
  console.log('📁 [VITE] API Path:', API_PATH)

  return {
    // Base: Raíz del sitio (sin subdirectorios)
    base: '/',
    
    // Servidor de desarrollo LOCAL (npm run dev)
    server: {
      port: 3000,
      host: '0.0.0.0',
      cors: true,
      
      // Proxy dinámico según ambiente
      proxy: {
        '/api-l': {
          target: API_TARGET,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace('/api-l', API_PATH),  // /api-l → /wsVirtualCoopSrvP/ws_server
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('🔄 [PROXY /api-l]', req.method, req.url, '→', API_TARGET + API_PATH + req.url.replace('/api-l', ''))
            })
          }
        },
        '/api': {
          target: API_TARGET,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace('/api', API_PATH),  // /api → /wsVirtualCoopSrvP/ws_server
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
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
    sourcemap: false,  // No exponer código fuente
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,   // Eliminar console.log en producción
        drop_debugger: true,  // Eliminar debugger statements
      }
    },
    // Optimización de chunks para mejor performance
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          crypto: ['crypto-js'],  // Encriptación AES-256-CBC
        },
      },
    },
  },
  
  // Alias de rutas (para imports más limpios)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@services': path.resolve(__dirname, './src/services'),
      '@assets': path.resolve(__dirname, './src/assets'),
    }
  },
    
    plugins: [],
    
    css: {
      devSourcemap: true  // Source maps solo en desarrollo
    }
  }
})