/**
 * @fileoverview Mapeo de campos sensibles que deben encriptarse según el process code
 * Este módulo define qué campos encriptar para cada API del backend
 */

import {
  ALWAYS_ENCRYPT_FIELDS,
  FINANCIAL_FIELDS,
  PERSONAL_DATA_FIELDS,
  requiresEncryption,
  secureLog
} from './constants.js';

// ============================================================================
// MAPEO DE CAMPOS POR PROCESS CODE
// ============================================================================

/**
 * Define qué campos encriptar para cada API específica
 * Basado en la documentación del sistema y las APIs críticas identificadas
 */
export const FIELD_MAPPING_BY_PROCESS = {
  // ========================================================================
  // AUTENTICACIÓN
  // ========================================================================
  '2100': {
    description: 'Login (validar credenciales)',
    encryptFields: ['usr', 'pwd', 'usuario', 'password'],
    decryptFields: ['codctaE', 'ideclE']
  },

  '2180': {
    description: 'Login',
    encryptFields: ['identificacion', 'idecl', 'clave'],
    decryptFields: ['codctaE', 'ideclE']
  },

  '2181': {
    description: 'Logout',
    encryptFields: ['identificacion', 'idecl'],
    decryptFields: []
  },

  '2186': {
    description: 'Cambiar contraseña',
    encryptFields: ['identificacion', 'claveActual', 'claveNueva'],
    decryptFields: []
  },

  // ========================================================================
  // RECUPERACIÓN DE CONTRASEÑA Y VALIDACIONES
  // ========================================================================
  '2140': {
    description: 'Verificar cédula / Validar identidad (registro)',
    encryptFields: ['idecl', 'identificacion', 'cedula'],
    decryptFields: []
  },

  '2148': {
    description: 'Validar nombre de usuario (registro)',
    encryptFields: ['usr', 'usuario', 'nombreUsuario', 'identificacion'],
    decryptFields: []
  },

  '2151': {
    description: 'Validar fortaleza de contraseña (registro)',
    encryptFields: ['usr', 'pwd', 'identificacion', 'clave', 'password'],
    decryptFields: []
  },

  '2155': {
    description: 'Solicitar código de seguridad OTP',
    encryptFields: ['idecl', 'identificacion', 'cuenta', 'tlfcel', 'telefono', 'celular'],
    decryptFields: []
  },

  '2156': {
    description: 'Validar código de seguridad OTP (registro)',
    encryptFields: ['idecl', 'identificacion', 'idemsg', 'codseg', 'codigo', 'codigoOTP'],
    decryptFields: []
  },

  '2160': {
    description: 'Actualizar/Registrar contraseña y Validar código 2FA',
    encryptFields: ['identificacion', 'idecl', 'usr', 'pwd', 'clave', 'claveNueva', 'password', 'codseg', 'codigo', 'idemsg'],
    decryptFields: []
  },

  '2165': {
    description: 'Guardar pregunta de seguridad (registro)',
    encryptFields: ['idecl', 'identificacion', 'detrsp', 'respuesta'],
    decryptFields: []
  },

  '2170': {
    description: 'Validar respuesta de pregunta de seguridad',
    encryptFields: ['idecl', 'identificacion', 'detrsp', 'respuesta'],
    decryptFields: []
  },

  // ========================================================================
  // REGISTRO
  // ========================================================================
  '2190': {
    description: 'Registro - Paso 1',
    encryptFields: ['identificacion', 'cedula', 'ruc'],
    decryptFields: []
  },

  '2191': {
    description: 'Registro - Paso 2',
    encryptFields: ['identificacion', 'telefono', 'tlfcel', 'email', 'direma'],
    decryptFields: []
  },

  '2192': {
    description: 'Registro - Paso 3',
    encryptFields: ['identificacion', 'clave', 'claveConfirmacion'],
    decryptFields: []
  },

  '2193': {
    description: 'Registro - Paso 4',
    encryptFields: ['identificacion', 'codigo', 'codigoOTP'],
    decryptFields: []
  },

  '2194': {
    description: 'Validar identidad',
    encryptFields: ['identificacion', 'cedula'],
    decryptFields: []
  },

  '2195': {
    description: 'Preguntas de seguridad',
    encryptFields: ['identificacion'],
    decryptFields: []
  },

  // ========================================================================
  // CONSULTAS DE PRODUCTOS FINANCIEROS
  // ========================================================================
  '2201': {
    description: 'Listar productos financieros (Ahorros/Créditos) según prdfi',
    encryptFields: ['idecl', 'identificacion', 'cedula'],
    decryptFields: ['codctaE', 'ideclE', 'saldoE', 'salcntE', 'saldisE']
  },

  '2212': {
    description: 'Estado de cuenta / movimientos',
    encryptFields: ['idecl', 'identificacion', 'codcta', 'cuenta'],
    decryptFields: ['codctaE', 'valorE', 'vlrE', 'saldoE']
  },

  '2213': {
    description: 'Detalle de inversión',
    encryptFields: ['idecl', 'identificacion', 'codinv', 'codigo'],
    decryptFields: ['codinvE', 'valorE', 'montoinvE']
  },

  '2220': {
    description: 'Tabla de amortización de crédito',
    encryptFields: ['idecl', 'identificacion', 'codcrd', 'codigocredito'],
    decryptFields: ['codcrdE', 'valorE', 'saldoE']
  },

  // ========================================================================
  // CONSULTAS DE CUENTAS
  // ========================================================================
  '2300': {
    description: 'Listar cuentas del usuario',
    encryptFields: ['identificacion', 'idecl'],
    decryptFields: ['codctaE', 'ideclE', 'saldoE']
  },

  '2301': {
    description: 'Detalle de cuenta específica',
    encryptFields: ['identificacion', 'idecl', 'cuenta', 'codcta'],
    decryptFields: ['codctaE', 'salcntE', 'saldisE']
  },

  '2351': {
    description: 'Consultar cuenta (ejemplo proporcionado)',
    encryptFields: ['identificacion', 'idecl', 'cuenta', 'codctad'],
    decryptFields: ['codctaE']
  },

  // ========================================================================
  // TRANSFERENCIAS INTERNAS
  // ========================================================================
  '2350': {
    description: 'Validar fondos disponibles',
    encryptFields: ['identificacion', 'idecl', 'cuenta', 'codcta', 'codctao', 'valor', 'monto'],
    decryptFields: ['saldoE', 'valorE']
  },

  '2355': {
    description: 'Ejecutar transferencia interna',
    encryptFields: [
      'identificacion',
      'idecl',
      'cuentaOrigen',
      'cuentaDestino',
      'codctao',
      'codctad',
      'valor',
      'monto',
      'codigoSeguridad',
      'codigo',
      'codseg',
      'descripcion',
      'referencia',
      'idemsg'
    ],
    decryptFields: ['codctaE', 'valorE']
  },

  // ========================================================================
  // TRANSFERENCIAS EXTERNAS (OTROS BANCOS)
  // ========================================================================
  '2360': {
    description: 'Transferencia externa - validar',
    encryptFields: [
      'identificacion',
      'idecl',
      'cedula',
      'cuenta',
      'codcta',
      'cuentaOrigen',
      'codctao',
      'cuentaBeneficiario',
      'cuentaDestino',
      'valor',
      'monto',
      'descripcion'
    ],
    decryptFields: ['valorE', 'saldoE']
  },

  '2361': {
    description: 'Transferencia externa - ejecutar',
    encryptFields: [
      'identificacion',
      'idecl',
      'cedula',
      'cuenta',
      'codcta',
      'cuentaOrigen',
      'codctao',
      'cuentaBeneficiario',
      'cuentaDestino',
      'codctad',
      'valor',
      'monto',
      'codigoSeguridad',
      'codigo',
      'codseg',
      'descripcion',
      'referencia',
      'idemsg'
    ],
    decryptFields: ['valorE', 'codctaE']
  },

  '2362': {
    description: 'Transferencia externa - confirmar',
    encryptFields: [
      'identificacion',
      'idecl',
      'transaccionId',
      'codigoSeguridad',
      'codigo',
      'codseg'
    ],
    decryptFields: []
  },

  // ========================================================================
  // BENEFICIARIOS
  // ========================================================================
  '2325': {
    description: 'Listar beneficiarios cooperativa (internos)',
    encryptFields: ['identificacion', 'idecl'],
    decryptFields: ['codctaE', 'cuentaE']
  },

  '2330': {
    description: 'Listar beneficiarios externos (otros bancos)',
    encryptFields: ['identificacion', 'idecl'],
    decryptFields: ['cuentaE', 'cuentaBeneficiarioE']
  },

  '2335': {
    description: 'Obtener preguntas de seguridad',
    encryptFields: ['identificacion', 'idecl'],
    decryptFields: []
  },

  '2340': {
    description: 'Listar preguntas de seguridad disponibles',
    encryptFields: ['identificacion', 'idecl'],
    decryptFields: []
  },

  '2365': {
    description: 'Crear/agregar beneficiario',
    encryptFields: [
      'identificacion',
      'idecl',
      'cuenta',
      'cuentaBeneficiario',
      'identificacionBeneficiario'
    ],
    decryptFields: ['codctaE']
  },

  // ========================================================================
  // INVERSIONES
  // ========================================================================
  '2371': {
    description: 'Listar tipos de inversión',
    encryptFields: ['identificacion', 'idecl'],
    decryptFields: []
  },

  '2372': {
    description: 'Tipos de interés',
    encryptFields: ['identificacion', 'idecl'],
    decryptFields: []
  },

  '2373': {
    description: 'Calcular inversión (simulador)',
    encryptFields: ['identificacion', 'idecl', 'monto', 'valor'],
    decryptFields: ['montoE', 'valorE', 'interesE']
  },

  '2374': {
    description: 'Listar cuentas para inversión',
    encryptFields: ['identificacion', 'idecl'],
    decryptFields: ['codctaE', 'saldoE']
  },

  '2375': {
    description: 'Registrar inversión',
    encryptFields: [
      'identificacion',
      'idecl',
      'cuenta',
      'codcta',
      'monto',
      'valor',
      'codigoSeguridad',
      'codigo'
    ],
    decryptFields: ['montoE', 'codctaE']
  },

  // ========================================================================
  // DETALLE DE INVERSIÓN
  // ========================================================================
  '2213': {
    description: 'Detalle de inversión',
    encryptFields: ['identificacion', 'idecl'],
    decryptFields: ['montoE', 'valorE', 'interesE']
  },

  // ========================================================================
  // PRODUCTOS
  // ========================================================================
  '2400': {
    description: 'Productos de ahorro',
    encryptFields: ['identificacion', 'idecl', 'cuenta', 'codcta', 'monto', 'valor'],
    decryptFields: ['codctaE', 'saldoE', 'montoE']
  },

  '2410': {
    description: 'Productos de crédito',
    encryptFields: ['identificacion', 'idecl', 'cuenta', 'monto', 'valor'],
    decryptFields: ['valorE', 'montoE', 'saldoE']
  },

  '2420': {
    description: 'Productos de seguros',
    encryptFields: ['identificacion', 'idecl', 'cuenta', 'valor'],
    decryptFields: ['valorE']
  },

  '2430': {
    description: 'Productos de tarjetas',
    encryptFields: ['identificacion', 'idecl', 'cuenta'],
    decryptFields: ['codctaE']
  },

  // ========================================================================
  // SERVICIOS FACILITO
  // ========================================================================
  '2500': {
    description: 'Servicios Facilito - Pago de servicios',
    encryptFields: ['identificacion', 'idecl', 'cuenta', 'codcta', 'valor', 'monto', 'codigo', 'referencia'],
    decryptFields: ['valorE', 'codctaE']
  },

  // ========================================================================
  // CERTIFICADOS
  // ========================================================================
  '2600': {
    description: 'Certificados',
    encryptFields: ['identificacion', 'idecl', 'cuenta', 'codcta'],
    decryptFields: []
  }
};

// ============================================================================
// FUNCIONES HELPER
// ============================================================================

/**
 * Obtiene los campos a encriptar para un process code específico
 * Si no está mapeado, retorna los campos siempre encriptados por defecto
 * 
 * @param {string} processCode - Código del proceso
 * @returns {Array<string>} Lista de campos a encriptar
 */
export const getEncryptFields = (processCode) => {
  const mapping = FIELD_MAPPING_BY_PROCESS[String(processCode)];
  
  if (mapping && Array.isArray(mapping.encryptFields)) {
    secureLog('INFO', `Campos a encriptar para ${processCode} (${mapping.description}):`, mapping.encryptFields.join(', '));
    return mapping.encryptFields;
  }

  // Si no hay mapeo específico, usar campos siempre encriptados
  secureLog('WARNING', `No hay mapeo para ${processCode}, usando campos por defecto`);
  return ALWAYS_ENCRYPT_FIELDS;
};

/**
 * Obtiene los campos a desencriptar en la respuesta para un process code
 * 
 * @param {string} processCode - Código del proceso
 * @returns {Array<string>} Lista de campos a desencriptar
 */
export const getDecryptFields = (processCode) => {
  const mapping = FIELD_MAPPING_BY_PROCESS[String(processCode)];
  
  if (mapping && Array.isArray(mapping.decryptFields)) {
    if (mapping.decryptFields.length > 0) {
      secureLog('INFO', `Campos a desencriptar para ${processCode}:`, mapping.decryptFields.join(', '));
    }
    return mapping.decryptFields;
  }

  return [];
};

/**
 * Obtiene la descripción de un process code
 * 
 * @param {string} processCode - Código del proceso
 * @returns {string} Descripción del proceso
 */
export const getProcessDescription = (processCode) => {
  const mapping = FIELD_MAPPING_BY_PROCESS[String(processCode)];
  return mapping ? mapping.description : 'Proceso no documentado';
};

/**
 * Verifica si un campo debe encriptarse siempre
 * 
 * @param {string} fieldName - Nombre del campo
 * @returns {boolean}
 */
export const isAlwaysEncrypted = (fieldName) => {
  return ALWAYS_ENCRYPT_FIELDS.includes(fieldName);
};

/**
 * Verifica si un campo es sensible (financiero o personal)
 * 
 * @param {string} fieldName - Nombre del campo
 * @returns {boolean}
 */
export const isSensitiveField = (fieldName) => {
  return (
    ALWAYS_ENCRYPT_FIELDS.includes(fieldName) ||
    FINANCIAL_FIELDS.includes(fieldName) ||
    PERSONAL_DATA_FIELDS.includes(fieldName)
  );
};

/**
 * Obtiene todos los campos sensibles que existen en un objeto
 * 
 * @param {Object} obj - Objeto a analizar
 * @returns {Array<string>} Lista de campos sensibles encontrados
 */
export const getSensitiveFieldsInObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return [];
  }

  const allSensitiveFields = [
    ...ALWAYS_ENCRYPT_FIELDS,
    ...FINANCIAL_FIELDS,
    ...PERSONAL_DATA_FIELDS
  ];

  return Object.keys(obj).filter(key => allSensitiveFields.includes(key));
};

/**
 * Obtiene información completa del mapeo para un process code
 * 
 * @param {string} processCode - Código del proceso
 * @returns {Object|null} Objeto con toda la información del mapeo
 */
export const getProcessMapping = (processCode) => {
  return FIELD_MAPPING_BY_PROCESS[String(processCode)] || null;
};

/**
 * Verifica si un process code tiene mapeo definido
 * 
 * @param {string} processCode - Código del proceso
 * @returns {boolean}
 */
export const hasMapping = (processCode) => {
  return !!FIELD_MAPPING_BY_PROCESS[String(processCode)];
};

/**
 * Lista todos los process codes que tienen mapeo definido
 * 
 * @returns {Array<string>} Lista de process codes
 */
export const getMappedProcessCodes = () => {
  return Object.keys(FIELD_MAPPING_BY_PROCESS);
};

/**
 * Obtiene estadísticas del mapeo de campos
 * Útil para debugging y documentación
 * 
 * @returns {Object} Estadísticas del sistema
 */
export const getMappingStats = () => {
  const mappedCodes = getMappedProcessCodes();
  
  const stats = {
    totalMappedProcesses: mappedCodes.length,
    processesByCategory: {},
    totalUniqueEncryptFields: new Set(),
    totalUniqueDecryptFields: new Set()
  };

  // Categorizar por tipo de proceso
  mappedCodes.forEach(code => {
    const mapping = FIELD_MAPPING_BY_PROCESS[code];
    
    // Agregar campos únicos
    mapping.encryptFields.forEach(field => stats.totalUniqueEncryptFields.add(field));
    mapping.decryptFields.forEach(field => stats.totalUniqueDecryptFields.add(field));
    
    // Categorizar
    const category = code.startsWith('218') ? 'Auth' :
                     code.startsWith('219') ? 'Register' :
                     code.startsWith('230') ? 'Accounts' :
                     code.startsWith('235') || code.startsWith('236') ? 'Transfers' :
                     code.startsWith('237') ? 'Investments' :
                     code.startsWith('24') ? 'Products' :
                     'Others';
    
    if (!stats.processesByCategory[category]) {
      stats.processesByCategory[category] = [];
    }
    stats.processesByCategory[category].push(code);
  });

  stats.totalUniqueEncryptFields = stats.totalUniqueEncryptFields.size;
  stats.totalUniqueDecryptFields = stats.totalUniqueDecryptFields.size;

  return stats;
};

// ============================================================================
// LOG DE CONFIGURACIÓN (SOLO EN DESARROLLO)
// ============================================================================

if (import.meta.env.DEV) {
  console.log('📋 Configuración de Field Mapper cargada:');
  const stats = getMappingStats();
  console.table(stats.processesByCategory);
  console.log(`✅ ${stats.totalMappedProcesses} procesos mapeados`);
  console.log(`🔒 ${stats.totalUniqueEncryptFields} campos únicos para encriptar`);
  console.log(`🔓 ${stats.totalUniqueDecryptFields} campos únicos para desencriptar`);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
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
};
