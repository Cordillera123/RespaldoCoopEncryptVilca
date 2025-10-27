// vite.config.js - VERSIÓN ESTABLE SIN PROXY FACILITO + TERSER
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    cors: true,
    proxy: {
      // 🔸 PROXY ÚNICO: Todas las peticiones van al servidor CON L
      '/api-l/prctrans.php': {
        target: 'http://192.168.200.25/wsVirtualCoopSrvL/ws_server',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          const newPath = path.replace(/^\/api-l/, '');
          console.log('🔄 [PROXY-API-L] Rewrite:', path, '→', newPath);
          return newPath;
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🔴 [PROXY ERROR]:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🚀 [PROXY REQ]:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('📡 [PROXY RES]:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    // ✅ NUEVA CONFIGURACIÓN DE TERSER
    terserOptions: {
      compress: {
        drop_console: true,        // Elimina console.log, console.info, console.warn
        drop_debugger: true,       // Elimina debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug'] // Específicamente estos
      }
    }
  },
  
  plugins: [],
  
  resolve: {
    alias: {
      '@': '/src',
      '@services': '/services',
      '@assets': '/src/assets'
    }
  },
  
  define: {
    __API_URL__: JSON.stringify(process.env.API_URL || 'http://192.168.200.25/wsVirtualCoopSrvL/ws_server/prctrans.php'),
    __API_TOKEN__: JSON.stringify(process.env.API_TOKEN || '0999SolSTIC20220719')
  },
  
  css: {
    devSourcemap: true
  }
})