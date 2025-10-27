/**
 * @fileoverview Servicio de encriptación/desencriptación AES-256-CBC
 * Compatible con backend PHP que usa openssl_encrypt/openssl_decrypt
 * 
 * IMPORTANTE: Este módulo implementa encriptación simétrica que DEBE coincidir
 * exactamente con la implementación del backend PHP.
 */

import CryptoJS from 'crypto-js';
import {
  ENCRYPTION_CONFIG,
  ENCRYPTION_ENABLED,
  DEBUG_MODE,
  secureLog,
  validateEncryptionConfig
} from './constants.js';

// ============================================================================
// FUNCIONES PRINCIPALES DE ENCRIPTACIÓN
// ============================================================================

/**
 * Encripta un string usando AES-256-CBC
 * Compatible con PHP: openssl_encrypt($data, 'AES-256-CBC', $key, 0, $iv)
 * 
 * @param {string} plainText - Texto a encriptar
 * @returns {string} Texto encriptado en formato Base64
 * @throws {Error} Si la encriptación falla
 * 
 * @example
 * const encrypted = encrypt('0200594729');
 * console.log(encrypted); // "RWV3SHUwRVV6OVhDa2Q1bEhkbzFNZz09..."
 */
export const encrypt = (plainText) => {
  try {
    // 🔍 LOG DEBUG INICIAL
    console.log('🔐 [ENCRYPT] ===== INICIO DE ENCRIPTACIÓN =====');
    console.log('🔐 [ENCRYPT] Input:', plainText);
    console.log('🔐 [ENCRYPT] Input type:', typeof plainText);
    console.log('🔐 [ENCRYPT] ENCRYPTION_ENABLED:', ENCRYPTION_ENABLED);
    console.log('🔐 [ENCRYPT] KEY (primeros 10 chars):', ENCRYPTION_CONFIG.KEY.substring(0, 10) + '...');
    console.log('🔐 [ENCRYPT] KEY length:', ENCRYPTION_CONFIG.KEY.length);
    console.log('🔐 [ENCRYPT] IV (primeros 8 chars):', ENCRYPTION_CONFIG.IV.substring(0, 8) + '...');
    console.log('🔐 [ENCRYPT] IV length:', ENCRYPTION_CONFIG.IV.length);
    
    // Validación de entrada
    if (plainText === null || plainText === undefined) {
      secureLog('WARNING', 'Intento de encriptar valor null/undefined');
      return plainText;
    }

    // Convertir a string si no lo es
    const text = String(plainText);

    if (text.length === 0) {
      secureLog('WARNING', 'Intento de encriptar string vacío');
      return text;
    }

    // Si encriptación está deshabilitada, retornar texto plano
    if (!ENCRYPTION_ENABLED) {
      secureLog('INFO', 'Encriptación deshabilitada, retornando texto plano');
      console.log('⚠️ [ENCRYPT] ENCRIPTACIÓN DESHABILITADA - Retornando texto plano');
      return text;
    }

    console.log('🔐 [ENCRYPT] Texto a encriptar:', text);
    console.log('🔐 [ENCRYPT] Longitud del texto:', text.length);

    // Preparar key e IV en formato WordArray (requerido por CryptoJS)
    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_CONFIG.KEY);
    const iv = CryptoJS.enc.Utf8.parse(ENCRYPTION_CONFIG.IV);

    console.log('🔐 [ENCRYPT] Key WordArray generado');
    console.log('🔐 [ENCRYPT] IV WordArray generado');

    // Encriptar usando AES-256-CBC
    const encrypted = CryptoJS.AES.encrypt(text, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // Convertir a Base64 (formato que espera PHP)
    const encryptedBase64 = encrypted.toString();

    console.log('🔐 [ENCRYPT] ✅ Encriptación exitosa');
    console.log('🔐 [ENCRYPT] Output Base64:', encryptedBase64);
    console.log('🔐 [ENCRYPT] Output length:', encryptedBase64.length);
    console.log('🔐 [ENCRYPT] Es Base64 válido:', /^[A-Za-z0-9+/=]+$/.test(encryptedBase64));
    console.log('🔐 [ENCRYPT] ===== FIN DE ENCRIPTACIÓN =====');

    secureLog('ENCRYPT', `✅ Texto encriptado correctamente (${text.length} chars)`, encryptedBase64);

    return encryptedBase64;

  } catch (error) {
    secureLog('ERROR', '❌ Error al encriptar:', error.message);
    
    // En producción, lanzar error para evitar enviar datos sin encriptar
    if (!DEBUG_MODE) {
      throw new Error('Error crítico en encriptación. Operación abortada.');
    }
    
    // En desarrollo, retornar el texto plano con advertencia
    console.error('⚠️ DESARROLLO: Retornando texto plano por error en encriptación');
    return plainText;
  }
};

/**
 * Desencripta un string encriptado con AES-256-CBC
 * Compatible con PHP: openssl_decrypt($encrypted, 'AES-256-CBC', $key, 0, $iv)
 * 
 * @param {string} encryptedText - Texto encriptado en Base64
 * @returns {string} Texto desencriptado
 * @throws {Error} Si la desencriptación falla
 * 
 * @example
 * const decrypted = decrypt('RWV3SHUwRVV6OVhDa2Q1bEhkbzFNZz09...');
 * console.log(decrypted); // "0200594729"
 */
export const decrypt = (encryptedText) => {
  try {
    // Validación de entrada
    if (encryptedText === null || encryptedText === undefined) {
      secureLog('WARNING', 'Intento de desencriptar valor null/undefined');
      return encryptedText;
    }

    const text = String(encryptedText);

    if (text.length === 0) {
      secureLog('WARNING', 'Intento de desencriptar string vacío');
      return text;
    }

    // Si encriptación está deshabilitada, retornar texto tal cual
    if (!ENCRYPTION_ENABLED) {
      secureLog('INFO', 'Encriptación deshabilitada, retornando texto sin modificar');
      return text;
    }

    // Preparar key e IV
    const key = CryptoJS.enc.Utf8.parse(ENCRYPTION_CONFIG.KEY);
    const iv = CryptoJS.enc.Utf8.parse(ENCRYPTION_CONFIG.IV);

    // Desencriptar
    const decrypted = CryptoJS.AES.decrypt(text, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // Convertir WordArray a string UTF-8
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

    if (!decryptedText || decryptedText.length === 0) {
      throw new Error('Desencriptación produjo string vacío. Datos corruptos o KEY/IV incorrectos.');
    }

    secureLog('DECRYPT', `✅ Texto desencriptado correctamente (${decryptedText.length} chars)`, decryptedText);

    return decryptedText;

  } catch (error) {
    secureLog('ERROR', '❌ Error al desencriptar:', error.message);
    
    // En desencriptación, es crítico NO retornar datos corruptos
    throw new Error(`Error al desencriptar datos: ${error.message}`);
  }
};

// ============================================================================
// FUNCIONES DE ENCRIPTACIÓN DE OBJETOS
// ============================================================================

/**
 * Encripta campos específicos de un objeto
 * Útil para encriptar solo datos sensibles antes de enviar al backend
 * 
 * @param {Object} obj - Objeto con datos
 * @param {Array<string>} fields - Lista de campos a encriptar
 * @returns {Object} Nuevo objeto con campos encriptados
 * 
 * @example
 * const data = { identificacion: '0200594729', nombre: 'Juan' };
 * const encrypted = encryptFields(data, ['identificacion']);
 * // { identificacion: 'RWV3SHU...', nombre: 'Juan' }
 */
export const encryptFields = (obj, fields = []) => {
  try {
    if (!obj || typeof obj !== 'object') {
      secureLog('WARNING', 'encryptFields: objeto inválido');
      return obj;
    }

    if (!Array.isArray(fields) || fields.length === 0) {
      secureLog('INFO', 'encryptFields: sin campos para encriptar');
      return obj;
    }

    // Crear copia del objeto para no mutar el original
    const encryptedObj = { ...obj };

    fields.forEach(field => {
      if (encryptedObj.hasOwnProperty(field) && encryptedObj[field] !== null && encryptedObj[field] !== undefined) {
        const originalValue = encryptedObj[field];
        encryptedObj[field] = encrypt(String(originalValue));
        secureLog('INFO', `Campo '${field}' encriptado`, encryptedObj[field]);
      }
    });

    return encryptedObj;

  } catch (error) {
    secureLog('ERROR', 'Error en encryptFields:', error.message);
    throw error;
  }
};

/**
 * Desencripta campos específicos de un objeto
 * Útil para desencriptar respuestas del backend que tienen campos encriptados
 * 
 * @param {Object} obj - Objeto con datos encriptados
 * @param {Array<string>} fields - Lista de campos a desencriptar
 * @returns {Object} Nuevo objeto con campos desencriptados
 * 
 * @example
 * const data = { codctaE: 'RWV3SHU...', nombre: 'Juan' };
 * const decrypted = decryptFields(data, ['codctaE']);
 * // { codctaE: '420101004676', nombre: 'Juan' }
 */
export const decryptFields = (obj, fields = []) => {
  try {
    if (!obj || typeof obj !== 'object') {
      secureLog('WARNING', 'decryptFields: objeto inválido');
      return obj;
    }

    if (!Array.isArray(fields) || fields.length === 0) {
      secureLog('INFO', 'decryptFields: sin campos para desencriptar');
      return obj;
    }

    // Crear copia del objeto
    const decryptedObj = { ...obj };

    fields.forEach(field => {
      if (decryptedObj.hasOwnProperty(field) && decryptedObj[field] !== null && decryptedObj[field] !== undefined) {
        try {
          const encryptedValue = decryptedObj[field];
          decryptedObj[field] = decrypt(String(encryptedValue));
          secureLog('INFO', `Campo '${field}' desencriptado`, decryptedObj[field]);
        } catch (error) {
          secureLog('ERROR', `Error desencriptando campo '${field}':`, error.message);
          // Mantener el valor original si falla la desencriptación
        }
      }
    });

    return decryptedObj;

  } catch (error) {
    secureLog('ERROR', 'Error en decryptFields:', error.message);
    throw error;
  }
};

/**
 * Encripta todo el objeto completo como un JSON string
 * Útil si el backend espera recibir todo el body encriptado
 * 
 * @param {Object} obj - Objeto a encriptar
 * @returns {string} JSON encriptado en Base64
 * 
 * @example
 * const data = { identificacion: '0200594729', cuenta: '420101004676' };
 * const encrypted = encryptObject(data);
 * // "RWV3SHUwRVV6OVhDa2Q1bEhkbzFNZz09..."
 */
export const encryptObject = (obj) => {
  try {
    if (!obj || typeof obj !== 'object') {
      throw new Error('Se requiere un objeto válido para encriptar');
    }

    const jsonString = JSON.stringify(obj);
    return encrypt(jsonString);

  } catch (error) {
    secureLog('ERROR', 'Error en encryptObject:', error.message);
    throw error;
  }
};

/**
 * Desencripta un JSON string encriptado a objeto
 * 
 * @param {string} encryptedString - String encriptado que contiene JSON
 * @returns {Object} Objeto desencriptado
 * 
 * @example
 * const encrypted = "RWV3SHUwRVV6OVhDa2Q1bEhkbzFNZz09...";
 * const obj = decryptObject(encrypted);
 * // { identificacion: '0200594729', cuenta: '420101004676' }
 */
export const decryptObject = (encryptedString) => {
  try {
    if (!encryptedString || typeof encryptedString !== 'string') {
      throw new Error('Se requiere un string válido para desencriptar');
    }

    const decryptedString = decrypt(encryptedString);
    return JSON.parse(decryptedString);

  } catch (error) {
    secureLog('ERROR', 'Error en decryptObject:', error.message);
    throw error;
  }
};

// ============================================================================
// FUNCIONES DE PROCESAMIENTO AUTOMÁTICO
// ============================================================================

/**
 * Procesa un objeto detectando y desencriptando automáticamente campos encriptados
 * Maneja el formato del backend que devuelve campos con sufijo "E"
 * 
 * @param {Object} obj - Objeto de respuesta del backend
 * @returns {Object} Objeto procesado con campos desencriptados
 * 
 * @example
 * // Backend devuelve: { codctaE: "encrypted", codctaD: "420101004676" }
 * const processed = autoDecryptResponse({ codctaE: "RWV3...", codctaD: "420101004676" });
 * // Resultado: { codcta: "420101004676", codctaD: "420101004676", codctaE: "RWV3..." }
 */
export const autoDecryptResponse = (obj) => {
  try {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // Crear copia del objeto
    const processed = { ...obj };

    // Buscar campos que terminen en 'E' (encriptados)
    Object.keys(processed).forEach(key => {
      if (key.endsWith('E') && typeof processed[key] === 'string') {
        try {
          // Intentar desencriptar
          const decrypted = decrypt(processed[key]);
          
          // Obtener el nombre base del campo (sin la 'E')
          const baseKey = key.slice(0, -1);
          
          // Agregar el campo desencriptado
          processed[baseKey] = decrypted;
          
          secureLog('INFO', `Campo '${key}' auto-desencriptado a '${baseKey}'`, decrypted);
        } catch (error) {
          secureLog('WARNING', `No se pudo desencriptar campo '${key}':`, error.message);
          // Mantener el campo encriptado si falla
        }
      }
    });

    // Procesar objetos anidados recursivamente
    Object.keys(processed).forEach(key => {
      if (processed[key] && typeof processed[key] === 'object' && !Array.isArray(processed[key])) {
        processed[key] = autoDecryptResponse(processed[key]);
      }
    });

    return processed;

  } catch (error) {
    secureLog('ERROR', 'Error en autoDecryptResponse:', error.message);
    return obj; // Retornar objeto original si falla
  }
};

/**
 * Procesa un array de objetos desencriptando automáticamente
 * 
 * @param {Array} array - Array de objetos del backend
 * @returns {Array} Array procesado con campos desencriptados
 */
export const autoDecryptArray = (array) => {
  try {
    if (!Array.isArray(array)) {
      return array;
    }

    return array.map(item => autoDecryptResponse(item));

  } catch (error) {
    secureLog('ERROR', 'Error en autoDecryptArray:', error.message);
    return array;
  }
};

// ============================================================================
// FUNCIÓN DE PRUEBA Y VALIDACIÓN
// ============================================================================

/**
 * Prueba el sistema de encriptación con un roundtrip test
 * Útil para verificar que la configuración es correcta
 * 
 * @param {string} testData - Datos de prueba
 * @returns {boolean} true si el test pasa
 */
export const testEncryption = (testData = '0200594729') => {
  try {
    console.log('🧪 Iniciando test de encriptación...');
    
    // Test 1: Encriptar
    console.log('📤 Texto original:', testData);
    const encrypted = encrypt(testData);
    console.log('🔒 Texto encriptado:', encrypted);

    // Test 2: Desencriptar
    const decrypted = decrypt(encrypted);
    console.log('🔓 Texto desencriptado:', decrypted);

    // Test 3: Validar
    const success = testData === decrypted;
    
    if (success) {
      console.log('✅ Test de encriptación EXITOSO');
      console.log('✅ KEY e IV son compatibles con el backend');
    } else {
      console.error('❌ Test de encriptación FALLIDO');
      console.error('❌ El texto original no coincide con el desencriptado');
    }

    return success;

  } catch (error) {
    console.error('❌ Test de encriptación FALLIDO con error:', error.message);
    return false;
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
  encryptObject,
  decryptObject,
  autoDecryptResponse,
  autoDecryptArray,
  testEncryption
};
