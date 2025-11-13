// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/App.jsx'
import './index.css'

// ⚠️ IMPORTANTE: Tests de encriptación DESACTIVADOS (ejecutar manualmente con window.cryptoTests)
// Los tests automáticos están comentados para evitar bloquear el renderizado
/*
if (import.meta.env.DEV) {
  import('./utils/test-crypto.js').then(() => {
    console.log('🔐 Tests de encriptación ejecutados. Revisa la consola para ver los resultados.');
  }).catch(error => {
    console.error('❌ Error al cargar tests de encriptación:', error);
  });
}
*/

console.log('🚀 [MAIN] Iniciando aplicación...');

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('✅ [MAIN] Aplicación renderizada correctamente');
} catch (error) {
  console.error('❌ [MAIN] Error crítico al renderizar:', error);
  // Mostrar error en pantalla
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: monospace;">
      <h1 style="color: red;">❌ Error al cargar la aplicación</h1>
      <pre style="background: #f5f5f5; padding: 15px; border-radius: 8px; overflow: auto;">
${error.toString()}

Stack trace:
${error.stack}
      </pre>
      <p><strong>Revisa la consola del navegador para más detalles.</strong></p>
    </div>
  `;
}