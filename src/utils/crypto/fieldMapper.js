/**
 * @fileoverview Mapeo de campos sensibles que deben encriptarse según el process code
 * Este módulo define qué campos encriptar para cada API del backend
 * 
 * ⚠️ IMPORTANTE: NO encriptar códigos de catálogo (codifi, codtidr, codtcur)
 * ⚠️ CRÍTICO: Solo encriptar los campos que el backend ESPERA encriptados
 * 
 * ESTRATEGIA DE ACTUALIZACIÓN (2025-11-07):
 * - Los campos en constants.js incluyen TODOS los campos posibles del backend
 * - En fieldMapper.js solo agregamos campos cuando confirmamos que el backend los necesita
 * - NO encriptar campos extras "por si acaso" - esto causa errores "NO EXISTE"
 * 
 * PROCESOS VALIDADOS (funcionando):
 * - 2100 (Login): usr, pwd
 * - 2155 (OTP Request): idecl SOLAMENTE
 * - 2156 (OTP Validate): idecl, codseg
 * 
 * Para agregar más campos:
 * 1. Verificar que el backend los espera encriptados
 * 2. Probar en ambiente de desarrollo
 * 3. Validar que no cause errores "NO EXISTE"
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
    encryptFields: ['usr', 'pwd'],
    decryptFields: ['idecli', 'tlfdom', 'tlftra', 'tlfcel', 'direma'] // SIN sufijo E - vienen con nombres normales pero encriptados
  },

  '2180': {
    description: 'Login',
    encryptFields: ['identificacion', 'idecl', 'clave'],
    decryptFields: ['codcta', 'idecl'] // SIN sufijo E
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
    encryptFields: ['usr', 'pwd', 'identificacion', 'idecl', 'clave', 'password'],
    // El backend devuelve 'idecli' e 'idemsg' en la respuesta; desencriptarlas
    decryptFields: ['idecli', 'idecl', 'idemsg'] // SIN sufijo E
  },

  '2155': {
    description: 'Solicitar código de seguridad OTP',
    encryptFields: [
      // ⚠️ CRÍTICO: SOLO encriptar idecl para este proceso
      // El backend espera SOLO este campo encriptado
      'idecl'
    ],
    decryptFields: ['idemsg'] // SIN sufijo E - El backend devuelve idemsg encriptado
  },

  '2156': {
    description: 'Validar código de seguridad OTP',  
    encryptFields: [
      'idecl',    // ✅ Identificación del cliente (se encripta)
      'codseg'    // ✅ Código OTP ingresado (se encripta)
      // ❌ idemsg - NO encriptar, ya viene encriptado del backend en proceso 2155
    ],
    decryptFields: [] // Solo devuelve estado y mensaje, no campos encriptados
  },

  '2160': {
    description: 'Actualizar/Registrar contraseña y Validar código 2FA',
    encryptFields: [
      // Identificación del cliente (CRÍTICO)
      'idecl', 'idecli', 'identificacion',
      // Usuario y contraseñas (CRÍTICO)
      'usr', 'pwd', 'clave', 'claveNueva', 'claveActual', 'password',
      // Código OTP (CRÍTICO para validación)
      'codseg', 'codigo',
      // ⚠️ NO ENCRIPTAR 'idemsg' - Ya viene desencriptado, backend espera valor original
      // Campos adicionales del contexto
      'detrsp', 'respuesta'
    ],
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
    decryptFields: [
      // ⚠️ NO desencriptar 'codcta' - Se necesita encriptado para otros procesos (2212, 2350, etc.)
      'idecli',  // ID cliente desencriptado
      'saldo',   // Saldos desencriptados
      'salcnt',  // Saldo contable
      'saldis'   // Saldo disponible
    ]
  },

  '2212': {
    description: 'Estado de cuenta / movimientos',
    encryptFields: [
      'idecl',          // Cédula cliente (texto plano)
      'identificacion'  // Identificación (texto plano)
      // ⚠️ NO encriptar 'codcta' - Ya viene encriptado desde 2201
      // El frontend debe enviar 'codcta' tal cual lo recibió (encriptado)
    ],
    decryptFields: [
      'valcre',  // Valor crédito en movimientos
      'valdeb',  // Valor débito en movimientos
      'saldos',  // Saldo en movimientos (CON 's')
      'dettrn'   // Detalle de transacción
      // ⚠️ NO desencriptar campos de 'cuenta' - vienen corruptos del backend
      // Usar los valores de la lista de cuentas (proceso 2201) en su lugar
    ]
  },

  '2213': {
    description: 'Detalle de inversión',
    encryptFields: ['idecl', 'identificacion', 'codinv', 'codigo'],
    decryptFields: ['codinv', 'valor', 'montoinv'] // SIN sufijo E
  },

  '2220': {
    description: 'Tabla de amortización de crédito',
    encryptFields: ['idecl', 'identificacion', 'codcrd', 'codigocredito'],
    decryptFields: ['codcrd', 'valor', 'saldo'] // SIN sufijo E
  },

  // ========================================================================
  // CONSULTAS DE CUENTAS
  // ========================================================================
  '2300': {
    description: 'Listar cuentas del usuario (origen para transferencias/certificados)',
    encryptFields: ['identificacion', 'idecl'],
    decryptFields: ['codcta', 'idecli', 'saldo', 'salcnt', 'saldis'] // SIN sufijo E
  },

  '2301': {
    description: 'Detalle de cuenta específica',
    encryptFields: ['identificacion', 'idecl', 'cuenta', 'codcta'],
    decryptFields: ['codcta', 'salcnt', 'saldis'] // SIN sufijo E
  },

  '2351': {
    description: 'Consultar cuenta (ejemplo proporcionado)',
    encryptFields: ['identificacion', 'idecl', 'cuenta', 'codctad'],
    decryptFields: ['codcta'] // SIN sufijo E
  },

  // ========================================================================
  // TRANSFERENCIAS INTERNAS
  // ========================================================================
  '2350': {
    description: 'Validar fondos disponibles (interna y externa)',
    encryptFields: [
      'identificacion',
      'idecl',        // Cédula
      'cuenta',       // Cuenta genérica
      'codcta',       // Código cuenta
      'codctao',      // Código cuenta origen
      'codctad',      // Código cuenta destino
      'valor',        // Valor genérico
      'monto',        // Monto genérico
      'valtrnf'       // Valor transferencia
    ],
    // NOTA: tiptrnf NO se encripta (código de tipo)
    decryptFields: ['saldo', 'valor'] // SIN sufijo E
  },

  '2355': {
    description: 'Ejecutar transferencia interna/cooperativa',
    encryptFields: [
      'identificacion',
      'idecl',          // Cédula del cliente (SENSIBLE)
      'cuentaOrigen',
      'cuentaDestino',
      'codctao',        // Cuenta origen (SENSIBLE)
      'codctad',        // Cuenta destino/origen (SENSIBLE)
      'codctac',        // Cuenta beneficiario (SENSIBLE)
      'codcta',         // Cuenta genérica
      'cuenta',         // Cuenta genérica
      'valor',          // Valor (SENSIBLE)
      'monto',          // Monto (SENSIBLE)
      'valtrnf',        // Valor transferencia (SENSIBLE)
      'codigoSeguridad',
      'codigo',
      'codseg',         // Código seguridad OTP (SENSIBLE)
      'descripcion',
      'dettrnf',        // Detalle transferencia (SENSIBLE)
      'referencia'
      // ⚠️ NO ENCRIPTAR 'idemsg' - Ya viene desencriptado, backend espera valor original
    ],
    decryptFields: ['codcta', 'valor'] // SIN sufijo E
  },

  // ========================================================================
  // TRANSFERENCIAS EXTERNAS (OTROS BANCOS)
  // ========================================================================
  '2360': {
    description: 'Ejecutar transferencia externa (otros bancos)',
    encryptFields: [
      // ✅ SOLO CAMPOS SENSIBLES - NO CÓDIGOS DE CATÁLOGO
      'identificacion',
      'idecl',          // Cédula del cliente (SENSIBLE)
      'ideclr',         // Cédula receptor (SENSIBLE)
      'cedula',
      'cuenta',
      'codcta',
      'cuentaOrigen',
      'codctao',
      'codctad',        // Cuenta destino (SENSIBLE)
      'codctac',        // Número cuenta beneficiario (SENSIBLE)
      'cuentaBeneficiario',
      'cuentaDestino',
      'valor',
      'monto',
      'valtrnf',        // Valor transferencia (SENSIBLE)
      'descripcion',
      'infopi',         // Información adicional
      'codseg',         // Código de seguridad OTP (SENSIBLE)
      'codigo',
      'codigoSeguridad',
      'bnfema',         // Email beneficiario (SENSIBLE)
      'bnfcel',         // Celular beneficiario (SENSIBLE)
      'referencia'
      // ⚠️ NO ENCRIPTAR 'idemsg' - Ya viene desencriptado, backend espera valor original
    ],
    // ❌ NO ENCRIPTAR: codifi, codtidr, codtcur (códigos de catálogo), nomclr (nombres), idemsg
    decryptFields: ['valor', 'saldo'] // SIN sufijo E
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
    decryptFields: ['valor', 'codcta'] // SIN sufijo E
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
  // CATÁLOGOS Y LISTAS
  // ========================================================================
  '2310': {
    description: 'Obtener lista de instituciones financieras (bancos)',
    encryptFields: [],
    decryptFields: ['codigo', 'cod'] // SIN sufijo E - Backend puede enviar códigos encriptados
  },

  '2320': {
    description: 'Obtener tipos de cuentas de captaciones',
    encryptFields: [],
    decryptFields: ['codigo', 'cod'] // SIN sufijo E - Backend puede enviar códigos encriptados
  },

  // ========================================================================
  // BENEFICIARIOS
  // ========================================================================
  '2325': {
    description: 'Listar beneficiarios cooperativa (internos)',
    encryptFields: ['identificacion', 'idecl'],
    decryptFields: ['codcta', 'cuenta', 'bnfcel', 'bnfema', 'ideclr', 'cedula'] // SIN sufijo E
  },

  '2330': {
    description: 'Listar beneficiarios externos (otros bancos)',
    encryptFields: ['identificacion', 'idecl'],
    decryptFields: [
      'cuenta',              // Cuenta genérica encriptada
      'cuentaBeneficiario',  // Cuenta beneficiario encriptada
      'codcta',              // Código cuenta encriptado (número de cuenta)
      'codctac',             // Código cuenta cooperativa encriptado
      'bnfcel',              // Celular beneficiario encriptado
      'bnfema',              // Email beneficiario encriptado
      'ideclr',              // Cédula/RUC del beneficiario encriptado
      'cedula'               // Cédula beneficiario (alias)
    ] // SIN sufijo E
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
      // ✅ SOLO CAMPOS SENSIBLES - NO CÓDIGOS DE CATÁLOGO
      'identificacion',
      'idecl',        // Cédula del cliente (SENSIBLE)
      'idecli',       // Cédula variante
      'ideclr',       // Cédula/RUC receptor (SENSIBLE) 
      'codctac',      // Número de cuenta beneficiario (SENSIBLE)
      'cuenta',       // Cuenta genérica
      'bnfema',       // Email beneficiario (SENSIBLE)
      'bnfcel',       // Celular beneficiario (SENSIBLE)
      'tlfcel',       // Teléfono celular
      'telefono',     // Teléfono
      'celular',      // Celular
      'email',        // Email
      'correo',       // Correo
      'direma'        // Dirección email
    ],
    // ❌ NO ENCRIPTAR: codifi, codtidr, codtcur (códigos de catálogo), nomclr (nombre)
    decryptFields: ['codcta', 'codctac', 'bnfcel', 'bnfema'] // SIN sufijo E
  },

  '2370': {
    description: 'Eliminar beneficiario',
    encryptFields: [
      // ✅ SOLO CAMPOS SENSIBLES QUE VIENEN EN TEXTO PLANO
      'identificacion',
      'idecl',        // Cédula del cliente (SENSIBLE - texto plano)
      'ideclr'        // Cédula/RUC receptor (SENSIBLE - texto plano)
      // ⚠️ REMOVIDO 'codctac' - Ya viene ENCRIPTADO desde la DB
      // El backend NO debe encriptar ni desencriptar este campo
      // Debe usarlo tal cual para el DELETE en la base de datos
    ],
    // ❌ NO ENCRIPTAR: codifi, codtidr, codtcur (códigos de catálogo)
    // ❌ NO ENCRIPTAR: codctac (ya viene encriptado desde DB)
    decryptFields: []
  },

  // ========================================================================
  // INVERSIONES
  // ========================================================================
  '2369': {
    description: 'Parámetros de inversión',
    encryptFields: ['identificacion', 'idecl'],
    decryptFields: ['montoMinimo', 'montoMaximo', 'monto', 'valor', 'vlr', 'valinver'] // SIN sufijo E
  },

  '2371': {
    description: 'Listar tipos de inversión',
    encryptFields: ['identificacion', 'idecl'],
    decryptFields: []
  },

  '2372': {
    description: 'Tipos de pago de interés',
    encryptFields: ['identificacion', 'idecl', 'valinver', 'valor', 'monto', 'vlr', 'montoinv'],
    decryptFields: ['valor', 'vlr', 'monto', 'montoinv', 'valinver', 'interes'] // SIN sufijo E
  },

  '2373': {
    description: 'Calcular inversión (simulador)',
    encryptFields: ['identificacion', 'idecl', 'valinver', 'monto', 'valor', 'vlr', 'montoinv'],
    decryptFields: ['monto', 'montoinv', 'valor', 'vlr', 'interes', 'valinver'] // SIN sufijo E
  },

  '2374': {
    description: 'Listar cuentas (para inversión o certificados)',
    encryptFields: ['identificacion', 'idecl', 'valinver', 'valor', 'monto', 'vlr'],
    decryptFields: [
      // ⚠️ NO desencriptar 'codcta' - Se necesita encriptado para proceso 2375 (registro inversión)
      'saldo',    // Saldos desencriptados
      'sldcta',   // Saldo cuenta
      'valor',    // Valores monetarios
      'vlr', 
      'monto', 
      'salcnt',   // Saldo contable
      'saldis',   // Saldo disponible
      'salcap',   // Saldo capital
      'valinver'  // Valor inversión
    ]
  },

  '2375': {
    description: 'Registrar inversión',
    encryptFields: [
      'identificacion',
      'idecl',
      // ⚠️ NO encriptar 'codctadp' - Ya viene encriptado desde proceso 2374
      // El frontend debe enviar 'codctadp' tal cual lo recibió (encriptado)
      'valinver',  // Valor de inversión
      'monto',     // Alias de valor (por si acaso)
      'valor',     // Alias alternativo
      'vlr',       // Valor abreviado
      'montoinv'   // Monto inversión
    ],
    decryptFields: ['valinver', 'monto', 'montoinv', 'valor', 'vlr', 'interes'] // SIN sufijo E
  },

  // ========================================================================
  // DETALLE DE INVERSIÓN
  // ========================================================================
  '2213': {
    description: 'Detalle de inversión',
    encryptFields: ['identificacion', 'idecl'],
    decryptFields: ['monto', 'montoinv', 'valor', 'vlr', 'interes', 'valinver', 'codinv'] // SIN sufijo E
  },

  // ========================================================================
  // CERTIFICADOS BANCARIOS
  // ========================================================================
  '2400': {
    description: 'Obtener costo del certificado',
    encryptFields: ['identificacion', 'idecl'],
    decryptFields: ['valcms', 'valor', 'vlr'] // SIN sufijo E
  },

  '2401': {
    description: 'Generar certificado bancario con débito',
    encryptFields: [
      'identificacion',
      'idecl',        // Cédula del cliente (SENSIBLE)
      'codctad',      // Cuenta a debitar el costo (SENSIBLE)
      'codcta',       // Cuenta genérica
      'cuenta',       // Cuenta genérica
      'valtrns',      // ✅ CORRECTO: Valor del certificado (según backend del ingeniero)
      'valor',        // Valor genérico
      'monto',        // Monto genérico
      'valtrnf',      // Valor transferencia
      'vlr'           // Valor abreviado
      // ❌ NO ENCRIPTAR: ctrvalor (código de catálogo - tipo de transacción)
    ],
    decryptFields: ['codcta', 'codctad', 'valor', 'vlr', 'saldo', 'sldcta', 'valtrn', 'valtrnf', 'valtrns'] // SIN sufijo E
  },

  // ========================================================================
  // PRODUCTOS (SERVICIOS LEGACY)
  // ========================================================================
  '2410': {
    description: 'Productos de crédito',
    encryptFields: ['identificacion', 'idecl', 'cuenta', 'monto', 'valor'],
    decryptFields: ['valor', 'monto', 'saldo'] // SIN sufijo E
  },

  '2420': {
    description: 'Productos de seguros',
    encryptFields: ['identificacion', 'idecl', 'cuenta', 'valor'],
    decryptFields: ['valor'] // SIN sufijo E
  },

  '2430': {
    description: 'Productos de tarjetas',
    encryptFields: ['identificacion', 'idecl', 'cuenta'],
    decryptFields: ['codcta'] // SIN sufijo E
  },

  // ========================================================================
  // SERVICIOS FACILITO
  // ========================================================================
  '2500': {
    description: 'Servicios Facilito - Pago de servicios',
    encryptFields: ['identificacion', 'idecl', 'cuenta', 'codcta', 'valor', 'monto', 'codigo', 'referencia'],
    decryptFields: ['valor', 'codcta'] // SIN sufijo E
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
  console.log('📋 Configuración de Field Mapper cargada (v2025-11-07):');
  const stats = getMappingStats();
  console.table(stats.processesByCategory);
  console.log(`✅ ${stats.totalMappedProcesses} procesos mapeados`);
  console.log(`🔒 ${stats.totalUniqueEncryptFields} campos únicos para encriptar`);
  console.log(`🔓 ${stats.totalUniqueDecryptFields} campos únicos para desencriptar`);
  
  // LOG ESPECÍFICO PARA VERIFICACIÓN DE CAMPOS AGREGADOS
  console.log('🔍 [VERIFICACIÓN] Campos agregados en actualización 2025-11-07:');
  console.log('   ✅ idecli, ideclien, tlfdom, tlftra');
  console.log('   ✅ vlr, vlrtrn, valtrns, valcms');
  console.log('   ✅ sldcta, salcap, mntcap, montoinv');
  console.log('   ✅ Sufijos E completos para respuestas del backend');
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
