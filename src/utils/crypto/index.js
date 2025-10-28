/**
 * @fileoverview Punto de entrada principal del módulo de encriptación
 * Exporta todas las funciones y constantes necesarias para el sistema
 * 
 * USO:
 * import { encrypt, decrypt, encryptRequest, decryptResponse } from '@/utils/crypto';
 */

// Importar servicios de encriptación
import {
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
  encryptObject,
  decryptObject,
  autoDecryptResponse,
  autoDecryptArray,
  testEncryption
} from './encryptionService.js';

// Importar field mapper
import {
  FIELD_MAPPING_BY_PROCESS,
  getEncryptFields,
  getDecryptFields,
  getProcessDescription,
  isAlwaysEncrypted,
  isSensitiveField,
  getSensitiveFieldsInObject,
  getProcessMapping,
  hasMapping,
  getMappedProcessCodes,
  getMappingStats
} from './fieldMapper.js';

// Importar constantes
import {
  ENCRYPTION_CONFIG,
  ENCRYPTION_ENABLED,
  DEBUG_MODE,
  ALWAYS_ENCRYPT_FIELDS,
  FINANCIAL_FIELDS,
  PERSONAL_DATA_FIELDS,
  ENCRYPTED_RESPONSE_FIELDS,
  FIELD_MAPPING,
  ENCRYPTION_PROCESS_CODES,
  ALL_ENCRYPTION_CODES,
  requiresEncryption,
  LOG_PREFIX,
  secureLog,
  validateEncryptionConfig
} from './constants.js';

// ============================================================================
// FUNCIONES DE ALTO NIVEL PARA INTEGRACIÓN CON apiService
// ============================================================================

/**
 * Procesa una request encriptando los campos sensibles según el process code
 * Esta es la función principal para usar ANTES de enviar datos al backend
 * 
 * @param {Object} requestData - Datos de la petición
 * @param {string} requestData.prccode - Código del proceso
 * @returns {Object} Request con campos sensibles encriptados
 * 
 * @example
 * const request = {
 *   tkn: "0999SolSTIC20220719",
 *   prccode: "2351",
 *   idecl: "0200594729",
 *   codctad: "420101004676"
 * };
 * const encrypted = encryptRequest(request);
 * // { tkn: "...", prccode: "2351", idecl: "encrypted...", codctad: "encrypted..." }
 */
export const encryptRequest = (requestData) => {
  try {
    console.log('🔐 [ENCRYPT_REQUEST] ===== INICIO =====');
    console.log('🔐 [ENCRYPT_REQUEST] requestData completo:', requestData);
    
    if (!requestData || typeof requestData !== 'object') {
      secureLog('ERROR', 'encryptRequest: requestData inválido');
      return requestData;
    }

    const processCode = requestData.prccode;
    console.log('🔐 [ENCRYPT_REQUEST] Process code:', processCode);

    // Verificar si este proceso requiere encriptación
    if (!processCode) {
      secureLog('WARNING', 'encryptRequest: sin prccode, no se encriptará');
      console.log('⚠️ [ENCRYPT_REQUEST] Sin prccode, retornando sin encriptar');
      return requestData;
    }

    const needsEncryption = requiresEncryption(processCode);
    console.log('🔐 [ENCRYPT_REQUEST] ¿Requiere encriptación?:', needsEncryption);

    if (!needsEncryption) {
      secureLog('INFO', `Process ${processCode} no requiere encriptación`);
      console.log('⚠️ [ENCRYPT_REQUEST] Process no configurado para encriptación');
      return requestData;
    }

    // Obtener campos a encriptar para este proceso
    const fieldsToEncrypt = getEncryptFields(processCode);
    console.log('🔐 [ENCRYPT_REQUEST] Campos a encriptar:', fieldsToEncrypt);

    if (fieldsToEncrypt.length === 0) {
      secureLog('INFO', `Process ${processCode}: sin campos para encriptar`);
      console.log('⚠️ [ENCRYPT_REQUEST] Sin campos configurados para encriptar');
      return requestData;
    }

    console.log('🔐 [ENCRYPT_REQUEST] Valores ANTES de encriptación:');
    fieldsToEncrypt.forEach(field => {
      if (requestData[field]) {
        console.log(`   - ${field}: "${requestData[field]}"`);
      }
    });

    // Encriptar campos
    const encryptedData = encryptFields(requestData, fieldsToEncrypt);

    console.log('🔐 [ENCRYPT_REQUEST] Valores DESPUÉS de encriptación:');
    fieldsToEncrypt.forEach(field => {
      if (encryptedData[field]) {
        console.log(`   - ${field}: "${encryptedData[field]}"`);
      }
    });

    console.log('🔐 [ENCRYPT_REQUEST] ===== COMPARACIÓN CON POSTMAN =====');
    if (processCode === '2100') {
      console.log('🎯 LOGIN: Si usr="Josu1234" → debe ser "qRym2o7g3LG5tHnPWTgYQw=="');
      console.log('🎯 LOGIN: Si pwd="Solstic2025-" → debe ser "z1fKJltbT3aDeHhLgCjQ0A=="');
      console.log('🎯 LOGIN: usr actual:', encryptedData.usr || encryptedData.usuario);
      console.log('🎯 LOGIN: pwd actual:', encryptedData.pwd || encryptedData.password);
      console.log('🎯 LOGIN: ¿usr coincide?:', (encryptedData.usr || encryptedData.usuario) === 'qRym2o7g3LG5tHnPWTgYQw==');
      console.log('🎯 LOGIN: ¿pwd coincide?:', (encryptedData.pwd || encryptedData.password) === 'z1fKJltbT3aDeHhLgCjQ0A==');
    }

    if (processCode === '2155') {
      console.log('📨 [DEBUG-2155] ===== SOLICITAR CÓDIGO OTP =====');
      console.log('📨 [DEBUG-2155] idecl original:', requestData.idecl);
      console.log('📨 [DEBUG-2155] idecl encriptado:', encryptedData.idecl);
      console.log('📨 [DEBUG-2155] Campos configurados para encriptar:', fieldsToEncrypt);
    }

    if (processCode === '2156') {
      console.log('🔐 [DEBUG-2156] ===== VALIDAR CÓDIGO OTP =====');
      console.log('🔐 [DEBUG-2156] VALORES ORIGINALES:');
      console.log('🔐 [DEBUG-2156]   idecl original:', requestData.idecl);
      console.log('🔐 [DEBUG-2156]   idemsg original (YA ENCRIPTADO del proceso 2155):', requestData.idemsg);
      console.log('🔐 [DEBUG-2156]   codseg original:', requestData.codseg);
      console.log('🔐 [DEBUG-2156] VALORES ENCRIPTADOS:');
      console.log('🔐 [DEBUG-2156]   idecl encriptado:', encryptedData.idecl);
      console.log('🔐 [DEBUG-2156]   idemsg SIN CAMBIOS (ya venía encriptado):', encryptedData.idemsg);
      console.log('🔐 [DEBUG-2156]   codseg encriptado:', encryptedData.codseg);
      console.log('🔐 [DEBUG-2156] Campos configurados para encriptar:', fieldsToEncrypt);
      console.log('🔐 [DEBUG-2156] ⚠️ IMPORTANTE: idemsg NO se encripta porque ya viene encriptado del proceso 2155');
      console.log('🔐 [DEBUG-2156] Orden esperado del JSON: tkn, prccode, idecl, idemsg, codseg');
    }

    if (processCode === '2160') {
      console.log('🎯 OTP: PROCESO 2160 - Validación de código OTP');
      console.log('🎯 OTP: ===== VALORES ORIGINALES =====');
      console.log('🎯 OTP: idecl original:', requestData.idecl);
      console.log('🎯 OTP: usr original:', requestData.usr);
      console.log('🎯 OTP: pwd original:', requestData.pwd);
      console.log('🎯 OTP: idemsg original:', requestData.idemsg);
      console.log('🎯 OTP: codseg original:', requestData.codseg);
      console.log('🎯 OTP: ===== VALORES ENCRIPTADOS =====');
      console.log('🎯 OTP: idecl (cédula):', encryptedData.idecl || 'NO ENCRIPTADO');
      console.log('🎯 OTP: usr (usuario):', encryptedData.usr || 'NO ENCRIPTADO');
      console.log('🎯 OTP: pwd (contraseña):', encryptedData.pwd || 'NO ENCRIPTADO');
      console.log('🎯 OTP: idemsg (ID mensaje):', encryptedData.idemsg || 'NO ENCRIPTADO');
      console.log('🎯 OTP: codseg (código OTP):', encryptedData.codseg || 'NO ENCRIPTADO');
      console.log('🎯 OTP: ===== VERIFICACIÓN DE ENCRIPTACIÓN =====');
      console.log('🎯 OTP: ¿idecl se encriptó?:', encryptedData.idecl !== requestData.idecl);
      console.log('🎯 OTP: ¿usr se encriptó?:', encryptedData.usr !== requestData.usr);
      console.log('🎯 OTP: ¿pwd se encriptó?:', encryptedData.pwd !== requestData.pwd);
      console.log('🎯 OTP: ¿idemsg se encriptó?:', encryptedData.idemsg !== requestData.idemsg);
      console.log('🎯 OTP: ¿codseg se encriptó?:', encryptedData.codseg !== requestData.codseg);
      console.log('🎯 OTP: Campos configurados para encriptar:', fieldsToEncrypt);
    }
    console.log('🔐 [ENCRYPT_REQUEST] ===== FIN =====');

    secureLog('ENCRYPT', `✅ Request ${processCode} procesada correctamente`);

    return encryptedData;

  } catch (error) {
    console.error('❌ [ENCRYPT_REQUEST] ERROR:', error);
    secureLog('ERROR', 'Error en encryptRequest:', error.message);
    
    // En producción, lanzar error para evitar enviar datos sin protección
    if (!DEBUG_MODE) {
      throw new Error('Error crítico al encriptar request');
    }
    
    return requestData;
  }
};

/**
 * Procesa una response desencriptando los campos encriptados según el process code
 * Esta es la función principal para usar DESPUÉS de recibir datos del backend
 * 
 * @param {Object} responseData - Datos de la respuesta
 * @param {string} processCode - Código del proceso que generó la respuesta
 * @returns {Object} Response con campos desencriptados
 * 
 * @example
 * const response = {
 *   estado: "000",
 *   msg: "CORRECTO",
 *   cuenta: { codcta: "420101004676", ... },
 *   codctaE: "RWV3SHUwRVV6OVhDa2Q1bEhkbzFNZz09Ojon3ifU70wTe7RdbwF7Pp++"
 * };
 * const decrypted = decryptResponse(response, "2351");
 * // { estado: "000", msg: "CORRECTO", cuenta: {...}, codcta: "420101004676", codctaE: "..." }
 */
export const decryptResponse = (responseData, processCode) => {
  try {
    console.log('🔓 [DECRYPT_RESPONSE] ===== INICIO =====');
    console.log('🔓 [DECRYPT_RESPONSE] processCode:', processCode);
    console.log('🔓 [DECRYPT_RESPONSE] responseData completo:', responseData);
    
    if (!responseData || typeof responseData !== 'object') {
      secureLog('WARNING', 'decryptResponse: responseData inválido');
      return responseData;
    }

    // Verificar si hay error en la respuesta (no desencriptar si hay error)
    if (responseData.estado && responseData.estado !== '000' && responseData.estado !== '1') {
      secureLog('INFO', `Response con error (estado: ${responseData.estado}), no se desencriptará`);
      console.log('⚠️ [DECRYPT_RESPONSE] Response con error, no se desencriptará');
      return responseData;
    }

    // ESTRATEGIA 1: Desencriptación automática (busca campos terminados en 'E')
    let processed = autoDecryptResponse(responseData);

    // ESTRATEGIA 2: Si hay process code, usar mapeo específico
    if (processCode && requiresEncryption(processCode)) {
      const fieldsToDecrypt = getDecryptFields(processCode);
      console.log('🔓 [DECRYPT_RESPONSE] Campos a desencriptar según mapeo:', fieldsToDecrypt);
      
      if (fieldsToDecrypt.length > 0) {
        // Desencriptar campos en el nivel raíz
        processed = decryptFields(processed, fieldsToDecrypt);
        
        // Si es proceso 2100 (login), desencriptar también en el array 'cliente'
        if (processCode === '2100' && processed.cliente && Array.isArray(processed.cliente)) {
          console.log('🔓 [DECRYPT_RESPONSE] Desencriptando array cliente para proceso 2100');
          console.log('🔓 [DECRYPT_RESPONSE] Cliente ANTES:', processed.cliente[0]);
          
          processed.cliente = processed.cliente.map(clienteItem => {
            const decryptedCliente = decryptFields(clienteItem, fieldsToDecrypt);
            console.log('🔓 [DECRYPT_RESPONSE] Cliente item desencriptado:', decryptedCliente);
            return decryptedCliente;
          });
          
          console.log('🔓 [DECRYPT_RESPONSE] Cliente DESPUÉS:', processed.cliente[0]);
        }
      }
    }

    // ESTRATEGIA 3: Procesar objetos anidados (como 'cuenta' en el ejemplo)
    Object.keys(processed).forEach(key => {
      if (processed[key] && typeof processed[key] === 'object' && !Array.isArray(processed[key])) {
        processed[key] = autoDecryptResponse(processed[key]);
      }
    });

    // ESTRATEGIA 4: Procesar arrays genéricamente
    Object.keys(processed).forEach(key => {
      if (Array.isArray(processed[key]) && key !== 'cliente') { // Skip cliente ya procesado
        processed[key] = autoDecryptArray(processed[key]);
      }
    });

    console.log('🔓 [DECRYPT_RESPONSE] ===== COMPARACIÓN CON POSTMAN =====');
    if (processCode === '2100' && processed.cliente && processed.cliente[0]) {
      const cliente = processed.cliente[0];
      console.log('🎯 LOGIN: idecli encriptado:', cliente.idecli);
      console.log('🎯 LOGIN: Si idecli="b63Qn1ZzV/fDPgRvgRyp6A==" → debe ser "0200594729"');
      
      if (cliente.idecli) {
        try {
          const decryptedId = decrypt(cliente.idecli);
          console.log('🎯 LOGIN: idecli desencriptado:', decryptedId);
          console.log('🎯 LOGIN: ¿idecli coincide con cedula esperada?:', decryptedId === '0200594729');
        } catch (e) {
          console.log('❌ LOGIN: Error desencriptando idecli:', e.message);
        }
      }
    }

    if (processCode === '2160') {
      console.log('🎯 OTP: PROCESO 2160 - Respuesta de validación OTP');
      console.log('🎯 OTP: Estado respuesta:', processed.estado);
      console.log('🎯 OTP: Mensaje respuesta:', processed.msg);
      console.log('🎯 OTP: Campos disponibles:', Object.keys(processed));
      
      // Buscar campos encriptados en la respuesta
      Object.keys(processed).forEach(key => {
        if (key.endsWith('E')) {
          console.log(`🎯 OTP: Campo encriptado encontrado: ${key} = ${processed[key]}`);
          try {
            const decrypted = decrypt(processed[key]);
            console.log(`🎯 OTP: ${key} desencriptado: ${decrypted}`);
          } catch (e) {
            console.log(`❌ OTP: Error desencriptando ${key}:`, e.message);
          }
        }
      });
    }
    console.log('🔓 [DECRYPT_RESPONSE] ===== FIN =====');

    secureLog('DECRYPT', `✅ Response ${processCode || 'sin código'} procesada correctamente`);

    return processed;

  } catch (error) {
    console.error('❌ [DECRYPT_RESPONSE] ERROR:', error);
    secureLog('ERROR', 'Error en decryptResponse:', error.message);
    
    // En caso de error, retornar respuesta original
    return responseData;
  }
};

/**
 * Wrapper para encriptar y desencriptar en una sola llamada (útil para testing)
 * 
 * @param {Object} requestData - Datos de la petición
 * @returns {Promise<Object>} Promesa con la respuesta desencriptada
 */
export const secureRequest = async (requestData, fetchFunction) => {
  try {
    // Encriptar request
    const encryptedRequest = encryptRequest(requestData);

    // Ejecutar fetch
    const response = await fetchFunction(encryptedRequest);

    // Desencriptar response
    const decryptedResponse = decryptResponse(response, requestData.prccode);

    return decryptedResponse;

  } catch (error) {
    secureLog('ERROR', 'Error en secureRequest:', error.message);
    throw error;
  }
};

/**
 * Verifica si un objeto contiene campos sensibles sin encriptar
 * Útil para validaciones de seguridad
 * 
 * @param {Object} obj - Objeto a verificar
 * @returns {Object} { hasSensitiveData: boolean, fields: Array<string> }
 */
export const detectUnencryptedSensitiveData = (obj) => {
  const sensitiveFields = getSensitiveFieldsInObject(obj);
  
  if (sensitiveFields.length === 0) {
    return { hasSensitiveData: false, fields: [] };
  }

  // Verificar si los campos sensibles están encriptados
  // (si tienen más de 30 caracteres, probablemente están encriptados)
  const unencryptedFields = sensitiveFields.filter(field => {
    const value = obj[field];
    return typeof value === 'string' && value.length < 30;
  });

  return {
    hasSensitiveData: unencryptedFields.length > 0,
    fields: unencryptedFields
  };
};

// ============================================================================
// FUNCIÓN DE INICIALIZACIÓN Y DIAGNÓSTICO
// ============================================================================

/**
 * Inicializa y valida el sistema de encriptación
 * Debe llamarse al inicio de la aplicación
 * 
 * @returns {Object} Estado del sistema
 */
export const initCryptoSystem = () => {
  try {
    console.log('🔐 Inicializando sistema de encriptación...');

    // Validar configuración
    validateEncryptionConfig();

    // Ejecutar test básico
    const testResult = testEncryption('0200594729');

    if (!testResult) {
      throw new Error('Test de encriptación falló');
    }

    // Obtener estadísticas
    const stats = getMappingStats();

    console.log('✅ Sistema de encriptación inicializado correctamente');
    console.log(`📊 Estadísticas:`, stats);

    return {
      status: 'success',
      enabled: ENCRYPTION_ENABLED,
      debugMode: DEBUG_MODE,
      stats
    };

  } catch (error) {
    console.error('❌ Error al inicializar sistema de encriptación:', error.message);
    
    return {
      status: 'error',
      error: error.message,
      enabled: false
    };
  }
};

/**
 * Obtiene información de diagnóstico del sistema
 * Útil para debugging
 */
export const getDiagnostics = () => {
  return {
    enabled: ENCRYPTION_ENABLED,
    debugMode: DEBUG_MODE,
    keyConfigured: !!ENCRYPTION_CONFIG.KEY,
    ivConfigured: !!ENCRYPTION_CONFIG.IV,
    mappedProcesses: getMappedProcessCodes().length,
    stats: getMappingStats()
  };
};

// ============================================================================
// EXPORTS PRINCIPALES
// ============================================================================

export {
  // Funciones principales de encriptación
  encrypt,
  decrypt,
  encryptFields,
  decryptFields,
  encryptObject,
  decryptObject,
  
  // Funciones automáticas
  autoDecryptResponse,
  autoDecryptArray,
  
  // Field mapping
  getEncryptFields,
  getDecryptFields,
  getProcessDescription,
  getProcessMapping,
  
  // Validaciones
  requiresEncryption,
  isAlwaysEncrypted,
  isSensitiveField,
  getSensitiveFieldsInObject,
  
  // Testing y diagnóstico
  testEncryption,
  validateEncryptionConfig,
  getMappingStats,
  
  // Constantes útiles
  ENCRYPTION_ENABLED,
  DEBUG_MODE,
  ALWAYS_ENCRYPT_FIELDS,
  FINANCIAL_FIELDS,
  PERSONAL_DATA_FIELDS,
  
  // Utilidades de logging
  secureLog,
  LOG_PREFIX
};

// Export por defecto con funciones más usadas
export default {
  // ⭐ Funciones más importantes
  encryptRequest,
  decryptResponse,
  secureRequest,
  
  // Funciones básicas
  encrypt,
  decrypt,
  
  // Helpers
  requiresEncryption,
  detectUnencryptedSensitiveData,
  
  // Inicialización
  initCryptoSystem,
  getDiagnostics,
  
  // Testing
  testEncryption
};
