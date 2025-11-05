// vite.config.js - Configuración para servidor Debian 13 (192.168.0.59)
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  // Base: Raíz del sitio (sin subdirectorios)
  base: '/',
  
  // Servidor de desarrollo LOCAL (npm run dev)
  server: {
    port: 3000,
    host: '0.0.0.0',
    cors: true,
    
    // Proxy para desarrollo: React local (3000) → Servidor Debian (192.168.0.59)
    // En producción esto NO se usa, Nginx hace el proxy directamente
    proxy: {
      '/api-l': {
        target: 'http://192.168.0.59',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path  // Mantener /api-l/prctrans.php
      },
      '/api': {
        target: 'http://192.168.0.59',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path  // Mantener /api/prctrans.php
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
})