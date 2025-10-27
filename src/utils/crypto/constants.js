/**
 * @fileoverview Configuración y constantes para el sistema de encriptación AES-256-CBC
 * Compatible con backend PHP (AES-256-CBC)
 */

// ============================================================================
// CONFIGURACIÓN DE ENCRIPTACIÓN
// ============================================================================

/**
 * Credenciales de encriptación desde variables de entorno
 * IMPORTANTE: Estas deben coincidir exactamente con las del backend PHP
 */
export const ENCRYPTION_CONFIG = {
  KEY: import.meta.env.VITE_AES_KEY || 'C4b2ZRywjo8oTBvkE18YSvoHAA8lbAca',
  IV: import.meta.env.VITE_AES_IV || 'PTk6KaVZxN04SXz0',
  ALGORITHM: 'AES-256-CBC',
  OUTPUT_FORMAT: 'base64', // PHP devuelve base64
  INPUT_ENCODING: 'utf8'
};

/**
 * Feature flag para habilitar/deshabilitar encriptación
 * Útil para debugging y rollback de emergencia
 */
export const ENCRYPTION_ENABLED = 
  import.meta.env.VITE_ENCRYPTION_ENABLED !== 'false'; // Habilitado por defecto

/**
 * Modo de desarrollo - habilita logs adicionales
 */
export const DEBUG_MODE = import.meta.env.DEV;

// ============================================================================
// CAMPOS SENSIBLES POR CATEGORÍA
// ============================================================================

/**
 * Campos que SIEMPRE deben encriptarse sin importar el proceso
 */
export const ALWAYS_ENCRYPT_FIELDS = [
  'identificacion',
  'idecl',           // Identificación cliente (usado en algunas APIs)
  'usr',             // Usuario (formato backend login)
  'pwd',             // Password (formato backend login)
  'usuario',
  'clave',
  'claveActual',
  'claveNueva',
  'claveConfirmacion',
  'password',
  'codigoSeguridad',
  'codigoOTP',
  'codigo',          // Códigos de verificación genéricos
  'codseg',          // Código de seguridad (formato backend)
  'pin',
  'respuesta',       // Respuesta a pregunta de seguridad
  'nombreUsuario'
];

/**
 * Campos financieros sensibles
 */
export const FINANCIAL_FIELDS = [
  'cuenta',
  'codcta',          // Código de cuenta (formato backend)
  'codctad',         // Código cuenta destino
  'codctao',         // Código cuenta origen
  'codctab',         // Código cuenta beneficiario
  'cuentaOrigen',
  'cuentaDestino',
  'cuentaBeneficiario',
  'numeroCuenta',
  'valor',
  'vlr',             // Valor (formato backend)
  'vlrtrn',          // Valor transacción
  'monto',
  'montoinv',        // Monto inversión
  'saldo',
  'salcnt',          // Saldo contable
  'saldis',          // Saldo disponible
  'valorTransferencia',
  'descripcion',     // Descripción de transacción (puede contener info sensible)
  'referencia'       // Referencia de transacción
];

/**
 * Campos de datos personales
 */
export const PERSONAL_DATA_FIELDS = [
  'telefono',
  'tlfcel',          // Teléfono celular (formato backend)
  'celular',
  'email',
  'direma',          // Dirección email (formato backend)
  'correo',
  'direccion',
  'cedula',
  'ruc',
  'nombres',
  'apellidos',
  'nombre',
  'apellido',
  'fechaNacimiento',
  'identificacionBeneficiario',
  'nombreBeneficiario'
];

// ============================================================================
// CAMPOS ENCRIPTADOS EN RESPUESTAS DEL BACKEND
// ============================================================================

/**
 * Campos que el backend devuelve encriptados y deben desencriptarse
 * Basado en el ejemplo: { "codctaE": "RWV3SHUwRVV6OVhDa2Q1bEhkbzFNZz09Ojon3ifU70wTe7RdbwF7Pp++" }
 */
export const ENCRYPTED_RESPONSE_FIELDS = [
  'codctaE',         // Código de cuenta encriptado
  'ideclE',          // Identificación encriptada
  'valorE',          // Valor encriptado
  'montoE',          // Monto encriptado
  'saldoE',          // Saldo encriptado
  'dataEncrypted',   // Campo genérico de datos encriptados
  'encrypted'        // Otro campo genérico
];

/**
 * Mapeo de campos encriptados a sus equivalentes desencriptados
 * Ejemplo: codctaE (encriptado) → codcta (desencriptado)
 */
export const FIELD_MAPPING = {
  'codctaE': 'codcta',
  'ideclE': 'idecl',
  'valorE': 'valor',
  'montoE': 'monto',
  'saldoE': 'saldo'
};

// ============================================================================
// PROCESS CODES QUE REQUIEREN ENCRIPTACIÓN
// ============================================================================

/**
 * APIs que requieren encriptación de datos sensibles
 * Agrupados por categoría para mejor mantenimiento
 */
export const ENCRYPTION_PROCESS_CODES = {
  // AUTENTICACIÓN
  AUTH: [
    '2100',  // Login (validar credenciales) - usr, pwd
    '2180',  // Login - identificacion, clave
    '2181',  // Logout
    '2182',  // Refresh token
    '2185',  // Validar sesión
    '2186'   // Cambiar contraseña
  ],

  // RECUPERACIÓN DE CONTRASEÑA Y VALIDACIONES
  PASSWORD_RECOVERY: [
    '2140',  // Verificar cédula / Validar identidad
    '2148',  // Validar nombre de usuario
    '2151',  // Validar contraseña
    '2155',  // Solicitar código de seguridad OTP
    '2156',  // Validar código de seguridad OTP
    '2160',  // Actualizar/Registrar contraseña
    '2165',  // Guardar pregunta de seguridad
    '2170'   // Validar respuesta de pregunta de seguridad
  ],

  // REGISTRO
  REGISTER: [
    '2190',  // Registro paso 1
    '2191',  // Registro paso 2
    '2192',  // Registro paso 3
    '2193',  // Registro paso 4
    '2194',  // Validar identidad
    '2195'   // Preguntas de seguridad
  ],

  // CONSULTAS DE CUENTAS
  ACCOUNTS: [
    '2300',  // Listar cuentas
    '2301',  // Detalle de cuenta
    '2351'   // Consultar cuenta específica (ejemplo proporcionado)
  ],

  // BENEFICIARIOS
  BENEFICIARIES: [
    '2325',  // Listar beneficiarios cooperativa (internos)
    '2330',  // Listar beneficiarios externos (otros bancos)
    '2335',  // Obtener preguntas de seguridad
    '2340',  // Listar preguntas de seguridad disponibles
    '2365'   // Crear/agregar beneficiario
  ],

  // TRANSFERENCIAS
  TRANSFERS: [
    '2350',  // Validar fondos disponibles
    '2355',  // Ejecutar transferencia interna
    '2360',  // Transferencia externa - validar
    '2361',  // Transferencia externa - ejecutar
    '2362',  // Transferencia externa - confirmar
  ],

  // INVERSIONES
  INVESTMENTS: [
    '2213',  // Detalle de inversión
    '2371',  // Listar tipos de inversión
    '2372',  // Tipos de interés
    '2373',  // Calcular inversión (simulador)
    '2374',  // Listar cuentas para inversión
    '2375'   // Registrar inversión
  ],

  // PRODUCTOS
  PRODUCTS: [
    '2400',  // Productos de ahorro
    '2410',  // Productos de crédito
    '2420',  // Productos de seguros
    '2430'   // Productos de tarjetas
  ],

  // SERVICIOS
  SERVICES: [
    '2500',  // Servicios Facilito
    '2600'   // Certificados
  ],

  // OTROS
  OTHERS: [
    '2213',  // Detalle de inversión
    '2500',  // Servicios Facilito
    '2600'   // Certificados
  ]
};

/**
 * Lista plana de todos los process codes que requieren encriptación
 */
export const ALL_ENCRYPTION_CODES = Object.values(ENCRYPTION_PROCESS_CODES).flat();

/**
 * Verifica si un process code requiere encriptación
 * @param {string} processCode - Código del proceso
 * @returns {boolean}
 */
export const requiresEncryption = (processCode) => {
  return ALL_ENCRYPTION_CODES.includes(String(processCode));
};

// ============================================================================
// CONFIGURACIÓN DE LOGS
// ============================================================================

/**
 * Prefijos para logs del sistema de encriptación
 */
export const LOG_PREFIX = {
  ENCRYPT: '[CRYPTO-ENCRYPT]',
  DECRYPT: '[CRYPTO-DECRYPT]',
  ERROR: '[CRYPTO-ERROR]',
  WARNING: '[CRYPTO-WARNING]',
  INFO: '[CRYPTO-INFO]'
};

/**
 * Máscara para mostrar datos sensibles en logs (solo en desarrollo)
 */
export const MASK_PATTERN = '****';
export const SHOW_LAST_CHARS = 4; // Mostrar últimos 4 caracteres en logs

/**
 * Función helper para loguear de forma segura
 * @param {string} type - Tipo de log (ENCRYPT, DECRYPT, etc.)
 * @param {string} message - Mensaje
 * @param {*} data - Datos adicionales (se enmascaran automáticamente)
 */
export const secureLog = (type, message, data = null) => {
  if (!DEBUG_MODE) return;

  const prefix = LOG_PREFIX[type] || LOG_PREFIX.INFO;
  
  if (data) {
    // Enmascarar datos sensibles en desarrollo
    const maskedData = typeof data === 'string' && data.length > SHOW_LAST_CHARS
      ? `${MASK_PATTERN}${data.slice(-SHOW_LAST_CHARS)}`
      : MASK_PATTERN;
    console.log(prefix, message, maskedData);
  } else {
    console.log(prefix, message);
  }
};

// ============================================================================
// VALIDACIONES
// ============================================================================

/**
 * Valida que las credenciales de encriptación estén configuradas
 * @throws {Error} Si faltan credenciales
 */
export const validateEncryptionConfig = () => {
  if (!ENCRYPTION_CONFIG.KEY || ENCRYPTION_CONFIG.KEY.length !== 32) {
    throw new Error(
      'VITE_AES_KEY no configurada o longitud inválida. Debe ser 32 caracteres para AES-256.'
    );
  }

  if (!ENCRYPTION_CONFIG.IV || ENCRYPTION_CONFIG.IV.length !== 16) {
    throw new Error(
      'VITE_AES_IV no configurado o longitud inválida. Debe ser 16 caracteres.'
    );
  }

  secureLog('INFO', '✅ Configuración de encriptación validada correctamente');
};

// Validar al importar el módulo
if (ENCRYPTION_ENABLED) {
  validateEncryptionConfig();
}

export default {
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
};
