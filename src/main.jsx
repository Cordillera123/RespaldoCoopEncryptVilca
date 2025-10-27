// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/App.jsx'
import './index.css'

// ⚠️ IMPORTANTE: Ejecutar tests de encriptación en desarrollo
if (import.meta.env.DEV) {
  import('./utils/test-crypto.js').then(() => {
    console.log('🔐 Tests de encriptación ejecutados. Revisa la consola para ver los resultados.');
  }).catch(error => {
    console.error('❌ Error al cargar tests de encriptación:', error);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)