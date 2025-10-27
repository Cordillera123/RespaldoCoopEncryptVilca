/**
 * @fileoverview Página de prueba visual para el sistema de encriptación
 * Accesible solo en modo desarrollo
 */

import React, { useState, useEffect } from 'react';
import {
  encrypt,
  decrypt,
  encryptRequest,
  decryptResponse,
  testEncryption,
  getDiagnostics,
  initCryptoSystem
} from '../utils/crypto/index.js';

const CryptoTestPage = () => {
  const [testInput, setTestInput] = useState('0200594729');
  const [encrypted, setEncrypted] = useState('');
  const [decrypted, setDecrypted] = useState('');
  const [diagnostics, setDiagnostics] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [requestTest, setRequestTest] = useState({
    tkn: "0999SolSTIC20220719",
    prccode: "2351",
    idecl: "0200594729",
    codctad: "420101004676"
  });
  const [encryptedRequest, setEncryptedRequest] = useState(null);

  useEffect(() => {
    // Inicializar sistema al cargar
    const init = initCryptoSystem();
    setTestResult(init);
    
    // Obtener diagnóstico
    const diag = getDiagnostics();
    setDiagnostics(diag);
  }, []);

  const handleBackToApp = () => {
    // Recargar la página para volver al flujo normal
    window.location.reload();
  };

  const handleEncrypt = () => {
    try {
      const result = encrypt(testInput);
      setEncrypted(result);
      console.log('✅ Encriptado:', result);
    } catch (error) {
      console.error('❌ Error al encriptar:', error);
      alert('Error al encriptar: ' + error.message);
    }
  };

  const handleDecrypt = () => {
    try {
      const result = decrypt(encrypted);
      setDecrypted(result);
      console.log('✅ Desencriptado:', result);
    } catch (error) {
      console.error('❌ Error al desencriptar:', error);
      alert('Error al desencriptar: ' + error.message);
    }
  };

  const handleRoundtrip = () => {
    try {
      const enc = encrypt(testInput);
      const dec = decrypt(enc);
      const success = testInput === dec;
      
      setEncrypted(enc);
      setDecrypted(dec);
      
      if (success) {
        alert('✅ ROUNDTRIP EXITOSO\n\nOriginal: ' + testInput + '\nDesencriptado: ' + dec);
      } else {
        alert('❌ ROUNDTRIP FALLIDO\n\nOriginal: ' + testInput + '\nDesencriptado: ' + dec);
      }
    } catch (error) {
      console.error('❌ Error en roundtrip:', error);
      alert('Error en roundtrip: ' + error.message);
    }
  };

  const handleEncryptRequest = () => {
    try {
      const result = encryptRequest(requestTest);
      setEncryptedRequest(result);
      console.log('✅ Request encriptada:', result);
    } catch (error) {
      console.error('❌ Error al encriptar request:', error);
      alert('Error al encriptar request: ' + error.message);
    }
  };

  const handleSystemTest = () => {
    const result = testEncryption();
    alert(result ? '✅ Test del sistema EXITOSO' : '❌ Test del sistema FALLIDO');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Botón para volver */}
        <button
          onClick={handleBackToApp}
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition"
        >
          ← Volver a la Aplicación
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔐 Sistema de Encriptación - Pruebas
          </h1>
          <p className="text-gray-600">
            Página de pruebas para validar el sistema de encriptación AES-256-CBC
          </p>
          {testResult && (
            <div className={`mt-4 p-4 rounded ${testResult.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <strong>Estado del sistema:</strong> {testResult.status === 'success' ? '✅ Operativo' : '❌ Error'}
              {testResult.error && <div className="mt-2 text-sm">{testResult.error}</div>}
            </div>
          )}
        </div>

        {/* Diagnóstico del Sistema */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Diagnóstico del Sistema</h2>
          {diagnostics && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded">
                <div className="text-sm text-gray-600">Encriptación</div>
                <div className="text-lg font-semibold">{diagnostics.enabled ? '✅ Habilitada' : '❌ Deshabilitada'}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded">
                <div className="text-sm text-gray-600">Modo</div>
                <div className="text-lg font-semibold">{diagnostics.debugMode ? '🔧 Desarrollo' : '🚀 Producción'}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded">
                <div className="text-sm text-gray-600">KEY Configurada</div>
                <div className="text-lg font-semibold">{diagnostics.keyConfigured ? '✅ Sí' : '❌ No'}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded">
                <div className="text-sm text-gray-600">IV Configurado</div>
                <div className="text-lg font-semibold">{diagnostics.ivConfigured ? '✅ Sí' : '❌ No'}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded col-span-2">
                <div className="text-sm text-gray-600">APIs Mapeadas</div>
                <div className="text-lg font-semibold">{diagnostics.mappedProcesses} procesos</div>
              </div>
            </div>
          )}
          <button
            onClick={handleSystemTest}
            className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition"
          >
            🧪 Ejecutar Test Completo del Sistema
          </button>
        </div>

        {/* Test 1: Encriptación/Desencriptación Básica */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🔒 Test 1: Encriptación/Desencriptación Básica</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto a Encriptar
              </label>
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Ingresa un texto..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleEncrypt}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
              >
                🔒 Encriptar
              </button>
              <button
                onClick={handleDecrypt}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
                disabled={!encrypted}
              >
                🔓 Desencriptar
              </button>
              <button
                onClick={handleRoundtrip}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition"
              >
                🔄 Roundtrip Test
              </button>
            </div>

            {encrypted && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto Encriptado (Base64)
                </label>
                <div className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded break-all font-mono text-sm">
                  {encrypted}
                </div>
              </div>
            )}

            {decrypted && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto Desencriptado
                </label>
                <div className={`w-full px-4 py-2 border rounded ${testInput === decrypted ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'}`}>
                  {decrypted}
                  {testInput === decrypted ? ' ✅' : ' ❌'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test 2: Encriptación de Request (API 2351) */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📤 Test 2: Encriptación de Request (API 2351)</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request Original (JSON)
              </label>
              <pre className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded text-sm overflow-x-auto">
{JSON.stringify(requestTest, null, 2)}
              </pre>
            </div>

            <button
              onClick={handleEncryptRequest}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition"
            >
              🔒 Encriptar Campos Sensibles
            </button>

            {encryptedRequest && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Encriptada
                </label>
                <pre className="w-full px-4 py-2 bg-green-50 border border-green-300 rounded text-sm overflow-x-auto">
{JSON.stringify(encryptedRequest, null, 2)}
                </pre>
                <div className="mt-2 text-sm text-gray-600">
                  ✅ Campos encriptados: <strong>idecl, codctad</strong>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test 3: Ejemplos de Uso */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">💡 Ejemplos de Uso en Código</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">En componentes React:</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`import { encryptRequest, decryptResponse } from '@/utils/crypto';

// Antes de enviar al backend
const encryptedData = encryptRequest({
  prccode: "2351",
  idecl: "0200594729",
  codctad: "420101004676"
});

// Después de recibir del backend
const decryptedResponse = decryptResponse(response, "2351");`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">En la consola del navegador:</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`// Test rápido
window.cryptoTests.quickTest("0200594729")

// Ver diagnóstico
window.cryptoTests.getDiagnostics()

// Encriptar manualmente
window.cryptoTests.encrypt("mi dato sensible")`}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>⚠️ Esta página solo está disponible en modo desarrollo</p>
          <p>Revisa la consola del navegador (F12) para ver logs detallados</p>
        </div>
      </div>
    </div>
  );
};

export default CryptoTestPage;
