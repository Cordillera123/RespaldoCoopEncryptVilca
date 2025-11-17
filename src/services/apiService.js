// 🔐 IMPORTACIÓN: Sistema de encriptación
import { encryptRequest, decryptResponse } from '../utils/crypto/index.js';
import { decrypt } from '../utils/crypto/encryptionService.js';

// ============================================
// CONFIGURACIÓN DE API CON RUTAS RELATIVAS
// ============================================
const API_CONFIG = {
  // ⭐ RUTAS RELATIVAS (Nginx hace el proxy)
  baseUrl: '/api/prctrans.php',         // API principal
  baseUrlWithL: '/api-l/prctrans.php',  // API con 'L' (ciertos procesos)
  
  token: '0999SolSTIC20220719',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

/**
 * Códigos de proceso que requieren la URL con 'L' (/api-l/)
 * Todos los demás usan /api/
 */
const CODES_REQUIRING_L_URL = [
  '2180', // Financial summary
  '2148', // Validate username
  '2151', // Validate password
  '2371', // Investment types/terms
  '2213', // Investment detail
  '2374', // Accounts for investment
  '2369', // Investment parameters
  '2372', // Interest payment types
  '2373', // Investment calculation
  '2310', // Financial institutions
  '2375', // Register investment
  '2358'  // 🔔 Notifications list (transferencias recibidas)
];

/**
 * Determinar qué URL usar según el código de proceso
 * @param {string|number} processCode - Código del proceso
 * @returns {string} URL a usar (/api/ o /api-l/)
 */
function getUrlForProcess(processCode) {
  const codeStr = String(processCode);
  const useApiL = CODES_REQUIRING_L_URL.includes(codeStr);
  
  if (import.meta.env.DEV) {
    console.log(`🔗 [URL-SELECTOR] Proceso ${codeStr} → ${useApiL ? '/api-l/' : '/api/'}`);
  }
  
  return useApiL ? API_CONFIG.baseUrlWithL : API_CONFIG.baseUrl;
}

/**
 * Códigos de proceso para diferentes operaciones
 */
const PROCESS_CODES = {
  LOGIN: '2100',
  BALANCE: '2101',
  TRANSACTIONS: '2102',
  INVESTMENT_DETAIL: '2213',
  TRANSFER: '2103',
  // CÓDIGOS PARA AHORROS
  SAVINGS_ACCOUNTS: '2201',
  ACCOUNT_STATEMENT: '2212',
  // CÓDIGOS PARA CRÉDITOS
  CREDITS_LIST: '2201',
  AMORTIZATION_TABLE: '2220',
  // CÓDIGOS PARA RECUPERACIÓN DE CONTRASEÑA
  VERIFY_CEDULA: '2140',
  SECURITY_QUESTION: '2340',
  INVESTMENT_TYPES: '2371', // Tipos de inversión disponibles
  VALIDATE_ANSWER: '2170',
  REQUEST_CODE: '2155',
  UPDATE_PASSWORD: '2160',
  VALIDATE_USERNAME: '2148',
  VALIDATE_PASSWORD: '2151',
  BENEFICIARIES_LIST: '2330',
  CREATE_BENEFICIARY: '2365',
  DELETE_BENEFICIARY: '2370',
  FORGOT_PASSWORD: '2335',
  FINANCIAL_SUMMARY: '2180',
  INVESTMENT_ACCOUNTS: '2374', // Obtener cuentas para inversión
  INVESTMENT_PARAMETERS: '2369',
INVESTMENT_TERMS: '2371', 
INTEREST_PAYMENT_TYPES: '2372',
INVESTMENT_CALCULATION: '2373',
 REGISTER_INVESTMENT: '2375',  // ✅ AGREGAR ESTA LÍNEA

  // NUEVOS CÓDIGOS PARA REGISTRO DE PREGUNTAS DE SEGURIDAD
  VALIDATE_IDENTITY_REGISTRATION: '2140',  // Validar identidad para registro
  GET_SECURITY_QUESTIONS: '2335',          // Obtener preguntas disponibles
  REQUEST_SECURITY_CODE_REGISTRATION: '2155', // Solicitar código para registro
  VALIDATE_SECURITY_CODE_REGISTRATION: '2156', // Validar código para registro
  SAVE_SECURITY_QUESTION: '2165',          // Guardar pregunta de seguridad

  // Agregar estos códigos al objeto PROCESS_CODES existente
  INTERNAL_TRANSFER_ACCOUNTS: '2300',     // Obtener cuentas para transferencias
  VALIDATE_TRANSFER_FUNDS: '2350',       // Validar disponibilidad de fondos
  EXECUTE_INTERNAL_TRANSFER: '2355',     // Ejecutar transferencia interna
  SET_ACCOUNT_TRANSFER_LIMIT: '2303',    // Configurar cupo máximo de transferencia por cuenta
  NOTIFICATIONS_LIST: '2358',            // Obtener lista de notificaciones de transferencias/pagos del día
};

/**
 * Mapeo de códigos de estado de la API a errores de la aplicación
 */
const ERROR_CODES_MAP = {
  // Estados exitosos
  '000': { success: true, code: 'SUCCESS' },

  // Errores de autenticación
  '001': { success: false, code: 'INVALID_CREDENTIALS', message: 'Usuario o contraseña incorrectos' },
  '002': { success: false, code: 'USER_NOT_FOUND', message: 'El usuario no existe en el sistema' },
  '003': { success: false, code: 'ACCOUNT_LOCKED', message: 'La cuenta está bloqueada. Contacte al administrador' },
  '004': { success: false, code: 'NOT_IMPLEMENTED', message: 'Servicio no implementado o no disponible' },
  '005': { success: false, code: 'PASSWORD_EXPIRED', message: 'La contraseña ha expirado. Debe cambiarla' },

  // Errores de sistema
  '999': { success: false, code: 'SYSTEM_ERROR', message: 'Error interno del sistema' },

  // Error genérico para códigos no mapeados
  'default': { success: false, code: 'UNKNOWN_ERROR', message: 'Error desconocido' }
};

/**
 * Clase principal para manejar las comunicaciones con la API
 */
class ApiService {
  constructor() {
    this.config = API_CONFIG;
    this.processCodes = PROCESS_CODES;
  }

  /**
   * 🔓 HELPER: Desencriptar idemsg si viene encriptado desde el backend
   * @param {string} idemsg - El idemsg potencialmente encriptado
   * @param {string} context - Contexto para logging (ej: 'COOP-TRANSFER')
   * @returns {string} idemsg en texto plano
   */
  decryptIdemsgIfNeeded(idemsg, context = 'API') {
    if (!idemsg) return idemsg;
    
    // Detectar si está encriptado (Base64 largo)
    const isEncrypted = /^[A-Za-z0-9+/]*={0,2}$/.test(String(idemsg)) && String(idemsg).length > 20;
    
    if (isEncrypted) {
      try {
        const { decrypt } = require('@/utils/crypto/encryptionService');
        const decryptedIdemsg = decrypt(idemsg);
        console.log(`🔓 [${context}] idemsg desencriptado`);
        return decryptedIdemsg;
      } catch (err) {
        console.error(`❌ [${context}] Error desencriptando idemsg:`, err);
        // Si falla la desencriptación, devolver el valor original
        return idemsg;
      }
    }
    
    return idemsg;
  }

  /**
   * Construye un body JSON respetando el orden de campos esperado por el backend
   * para procesos que son sensibles al orden (ej. OTP: 2155/2156, login 2100, etc.)
   * @param {Object} processedData - Objeto con los campos (ya encriptados si aplica)
   * @returns {Object} body ordenado
   */
  buildOrderedBody(processedData = {}) {
    // Mapas de orden por proceso (usar los nombres de claves ya encriptadas)
    const orderedFieldsByProcess = {
      // Solicitar código OTP: tkn, prccode, idecl
      '2155': ['tkn', 'prccode', 'idecl'],
      // Validar código OTP: tkn, prccode, idecl, idemsg, codseg (ORDEN EXACTO DEL POSTMAN)
      '2156': ['tkn', 'prccode', 'idecl', 'idemsg', 'codseg'],
      // Login clásico: tkn, prccode, usr, pwd
      '2100': ['tkn', 'prccode', 'usr', 'pwd']
    };

    const prc = String(processedData.prccode || '');
    const orderedKeys = orderedFieldsByProcess[prc];

    // Si no hay orden específico, devolver body con orden por defecto (tkn, prccode, usr, pwd, ...otros)
    if (!orderedKeys) {
      const body = {
        tkn: this.config.token,
        prccode: processedData.prccode,
        usr: processedData.usr,
        pwd: processedData.pwd
      };

      // Añadir el resto manteniendo la inserción en orden de las keys encontradas
      Object.keys(processedData).forEach(key => {
        if (!['prccode', 'usr', 'pwd'].includes(key)) {
          body[key] = processedData[key];
        }
      });

      return body;
    }

    // Construir body siguiendo el orden definido
    const body = {};
    orderedKeys.forEach(key => {
      // tkn viene de this.config.token siempre
      if (key === 'tkn') {
        body.tkn = this.config.token;
      } else if (key === 'prccode') {
        body.prccode = processedData.prccode;
      } else if (Object.prototype.hasOwnProperty.call(processedData, key)) {
        body[key] = processedData[key];
      }
    });

    // Añadir restantes campos que no estaban en la lista ordenada, para compatibilidad
    Object.keys(processedData).forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(body, key)) {
        body[key] = processedData[key];
      }
    });

    // Log especial para proceso 2156 (validar OTP login)
    if (prc === '2156') {
      console.log('🎯 [BUILD-ORDER-2156] ===== CONSTRUCCIÓN BODY PROCESO 2156 =====');
      console.log('🎯 [BUILD-ORDER-2156] Orden definido:', orderedKeys);
      console.log('🎯 [BUILD-ORDER-2156] Orden real del body:', Object.keys(body));
      console.log('🎯 [BUILD-ORDER-2156] Valores del body:', {
        tkn: body.tkn?.substring(0, 10) + '...',
        prccode: body.prccode,
        idecl: body.idecl?.substring(0, 10) + '...',
        idemsg: body.idemsg?.substring(0, 10) + '...',
        codseg: body.codseg?.substring(0, 5) + '***'
      });
      console.log('🎯 [BUILD-ORDER-2156] ===== FIN CONSTRUCCIÓN =====');
    }

    return body;
  }

  /**
   * Método genérico para realizar peticiones HTTP
   */
  async makeRequest(data, options = {}) {
    // ⭐ DETERMINAR URL SEGÚN EL CÓDIGO DE PROCESO
    const targetUrl = getUrlForProcess(data.prccode);

    console.log('🔧 [API] Configurando petición...');
    console.log('🌐 [API] URL objetivo:', targetUrl);
    console.log('📋 [API] Código de proceso:', data.prccode);
    
    // 🔐 ENCRIPTAR DATOS SENSIBLES ANTES DE ENVIAR
    let processedData = { ...data };
    try {
      processedData = encryptRequest(data);
      console.log('🔐 [API] Datos encriptados aplicados');
    } catch (encryptError) {
      console.warn('⚠️ [API] Error al encriptar, enviando datos sin encriptar:', encryptError.message);
    }
    
    console.log('📦 [API] Datos a enviar:', {
      ...processedData,
      pwd: processedData.pwd ? '***' + processedData.pwd.slice(-2) : undefined, // Ocultar contraseña completa
      tkn: '***' + this.config.token.slice(-4)
    });

    // 🎯 IMPORTANTE: Construir body en el MISMO orden que el backend PHP espera
    // Backend PHP es sensible al orden de los campos JSON
    const bodyToSend = this.buildOrderedBody(processedData);

    console.log('🌐 [API] Body COMPLETO a enviar (JSON):');
    console.log(JSON.stringify(bodyToSend, null, 2));
    
    // 🔍 LOG ESPECIAL PARA PROCESO 2156 - COMPARACIÓN CON POSTMAN
    if (data.prccode === '2156') {
      console.log('🔍 [DEBUG-2156] ===== COMPARACIÓN CON POSTMAN =====');
      console.log('🔍 [DEBUG-2156] Body completo que se enviará:');
      console.log('🔍 [DEBUG-2156]', JSON.stringify(bodyToSend, null, 2));
      console.log('🔍 [DEBUG-2156] Valores EXACTOS (para copiar a Postman):');
      console.log('🔍 [DEBUG-2156] tkn:', bodyToSend.tkn);
      console.log('🔍 [DEBUG-2156] prccode:', bodyToSend.prccode);
      console.log('🔍 [DEBUG-2156] idecl:', bodyToSend.idecl);
      console.log('🔍 [DEBUG-2156] idemsg:', bodyToSend.idemsg);
      console.log('🔍 [DEBUG-2156] codseg:', bodyToSend.codseg);
      console.log('🔍 [DEBUG-2156] =====================================');
      
      // Log del código OTP SIN encriptar (antes de encriptar)
      console.log('🔍 [DEBUG-2156] Código OTP ORIGINAL (sin encriptar):', data.codseg || 'NO DISPONIBLE');
    }

    const requestOptions = {
      method: 'POST',
      headers: {
        ...this.config.headers,
        ...options.headers
      },
      body: JSON.stringify(bodyToSend)
    };

    console.log('📋 [API] Headers de la petición:', requestOptions.headers);
    console.log('🚀 [API] Enviando petición...');

    try {
      // Crear AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ [API] Timeout alcanzado, abortando petición...');
        controller.abort();
      }, options.timeout || this.config.timeout);

      requestOptions.signal = controller.signal;

      // Usar la URL determinada
      const response = await fetch(targetUrl, requestOptions);

      // Limpiar timeout si la petición se completó
      clearTimeout(timeoutId);

      console.log('📊 [API] Respuesta recibida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
      }

      // 🛠️ FIX: Backend puede devolver texto antes del JSON (logs de debug PHP con <BR>, print_r, etc.)
      const responseText = await response.text();
      console.log('📄 [API] Texto de respuesta recibido (primeros 500 chars):', responseText.substring(0, 500));
      
      let result;
      try {
        // Intentar parsear directamente
        result = JSON.parse(responseText);
        console.log('✅ [API] JSON parseado directamente');
      } catch (jsonError) {
        console.warn('⚠️ [API] Respuesta no es JSON puro, extrayendo JSON...');
        
        // ESTRATEGIA MEJORADA: Buscar la ÚLTIMA ocurrencia de JSON válido
        // Esto ignora los print_r(), var_dump(), <BR> del debug PHP
        
        // 1. Buscar todas las posibles líneas que empiecen con {
        const lines = responseText.split('\n');
        let jsonString = null;
        
        // 2. Buscar de atrás hacia adelante la primera línea que sea JSON válido
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (line.startsWith('{') && line.endsWith('}')) {
            try {
              const testParse = JSON.parse(line);
              jsonString = line;
              console.log('✅ [API] JSON encontrado en línea', i + 1);
              break;
            } catch (e) {
              // No es JSON válido, continuar buscando
              continue;
            }
          }
        }
        
        // 3. Si no encontramos línea completa, buscar con regex (fallback)
        if (!jsonString) {
          const jsonMatch = responseText.match(/\{[^{}]*"estado"[^{}]*\}/);
          if (jsonMatch) {
            jsonString = jsonMatch[0];
            console.log('✅ [API] JSON encontrado con regex fallback');
          }
        }
        
        if (jsonString) {
          try {
            result = JSON.parse(jsonString);
            console.log('✅ [API] JSON extraído exitosamente de la respuesta');
          } catch (extractError) {
            console.error('❌ [API] No se pudo extraer JSON válido:', extractError);
            throw new Error(`Respuesta del servidor no contiene JSON válido: ${responseText.substring(0, 200)}`);
          }
        } else {
          throw new Error(`No se encontró JSON en la respuesta: ${responseText.substring(0, 200)}`);
        }
      }
      
      console.log('✅ [API] Datos parseados correctamente:', result);
      
      // � LOG RAW PARA PROCESO 2213 (INVESTMENT_DETAIL) - ANTES DE DESENCRIPTAR
      if (data.prccode === '2213') {
        console.log('🔍 [INVESTMENT-RAW] ===== DATOS RAW DEL SERVIDOR (ANTES DE AUTO-DECRYPT) =====');
        console.log('🔍 [INVESTMENT-RAW] cliente.inversion:', result.cliente?.inversion);
        console.log('🔍 [INVESTMENT-RAW] - codinv:', result.cliente?.inversion?.codinv);
        console.log('🔍 [INVESTMENT-RAW] - fecini:', result.cliente?.inversion?.fecini);
        console.log('🔍 [INVESTMENT-RAW] - fecven:', result.cliente?.inversion?.fecven);
        console.log('🔍 [INVESTMENT-RAW] - salcnt:', result.cliente?.inversion?.salcnt);
        console.log('🔍 [INVESTMENT-RAW] - saldis:', result.cliente?.inversion?.saldis);
        console.log('🔍 [INVESTMENT-RAW] - tasinv:', result.cliente?.inversion?.tasinv);
        console.log('🔍 [INVESTMENT-RAW] ========================================');
      }
      
      // �🔓 DESENCRIPTAR RESPUESTA DEL BACKEND
      let decryptedResult = result;
      try {
        decryptedResult = decryptResponse(result, data.prccode);
        console.log('🔓 [API] Datos desencriptados aplicados');
        
        // 🔍 LOG DESPUÉS DE AUTO-DECRYPT PARA 2213
        if (data.prccode === '2213') {
          console.log('🔍 [INVESTMENT-DECRYPTED] ===== DATOS DESPUÉS DE AUTO-DECRYPT =====');
          console.log('🔍 [INVESTMENT-DECRYPTED] cliente.inversion:', decryptedResult.cliente?.inversion);
          console.log('🔍 [INVESTMENT-DECRYPTED] - codinv:', decryptedResult.cliente?.inversion?.codinv);
          console.log('🔍 [INVESTMENT-DECRYPTED] - fecini:', decryptedResult.cliente?.inversion?.fecini);
          console.log('🔍 [INVESTMENT-DECRYPTED] - fecven:', decryptedResult.cliente?.inversion?.fecven);
          console.log('🔍 [INVESTMENT-DECRYPTED] - salcnt:', decryptedResult.cliente?.inversion?.salcnt);
          console.log('🔍 [INVESTMENT-DECRYPTED] - saldis:', decryptedResult.cliente?.inversion?.saldis);
          console.log('🔍 [INVESTMENT-DECRYPTED] - tasinv:', decryptedResult.cliente?.inversion?.tasinv);
          console.log('🔍 [INVESTMENT-DECRYPTED] ========================================');
        }
      } catch (decryptError) {
        console.warn('⚠️ [API] Error al desencriptar, usando datos sin desencriptar:', decryptError.message);
      }
      
      return this.handleResponse(decryptedResult);

    } catch (error) {
      console.error('❌ [API] Error en la petición:', error);

      // Agregar más información sobre el error
      if (error.name === 'AbortError') {
        console.error('🔍 [API] Detalles del timeout: La petición tardó más de', (options.timeout || this.config.timeout) / 1000, 'segundos');
      }

      return this.handleError(error);
    }
  }

  /**
   * Manejo estandarizado de respuestas
   */
  handleResponse(result) {
    return {
      success: true,
      data: result,
      message: 'Operación exitosa',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Manejo estandarizado de errores
   */
  handleError(error) {
    let errorMessage = 'Error desconocido';
    let errorCode = 'UNKNOWN_ERROR';

    if (error.name === 'AbortError') {
      errorMessage = 'La petición ha excedido el tiempo límite';
      errorCode = 'TIMEOUT_ERROR';
    } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      errorMessage = 'Error de conexión. Verifique su conexión a internet';
      errorCode = 'CONNECTION_ERROR';
    } else if (error.message.includes('HTTP Error')) {
      errorMessage = 'Error del servidor. Intente más tarde';
      errorCode = 'SERVER_ERROR';
    } else {
      errorMessage = error.message;
    }

    console.error('ApiService Error:', {
      message: errorMessage,
      code: errorCode,
      originalError: error,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      error: {
        message: errorMessage,
        code: errorCode,
        details: error
      },
      data: null,
      timestamp: new Date().toISOString()
    };
  }
  /**
   * Interpretar respuesta específica del servidor según su estado
   */
  interpretServerResponse(serverResponse, operationType = 'general') {
    console.log('🔍 [API] Interpretando respuesta del servidor:', serverResponse);
    console.log('📋 [API] Tipo de operación:', operationType);

    // Verificar si hay respuesta
    if (!serverResponse) {
      return {
        success: false,
        error: {
          message: 'No se recibió respuesta del servidor',
          code: 'NO_RESPONSE'
        }
      };
    }

    // Obtener estado de la respuesta
    const estado = serverResponse.estado || serverResponse.status || 'unknown';
    const mensaje = serverResponse.msg || serverResponse.message || '';

    console.log('📊 [API] Estado recibido:', estado);
    console.log('💬 [API] Mensaje recibido:', mensaje);

    // Mapear el estado a un error conocido
    const errorInfo = ERROR_CODES_MAP[estado] || ERROR_CODES_MAP['default'];

    if (errorInfo.success) {
      return {
        success: true,
        data: serverResponse,
        message: mensaje || 'Operación exitosa'
      };
    } else {
      // Manejo especial para error 004 (NO IMPLEMENTADO)
      if (estado === '004') {
        return {
          success: false,
          error: {
            message: 'El servicio no está disponible en este momento. Verifique la configuración del servidor.',
            code: 'SERVICE_NOT_AVAILABLE',
            serverState: estado,
            originalMessage: mensaje
          }
        };
      }

      return {
        success: false,
        error: {
          message: mensaje || errorInfo.message,
          code: errorInfo.code,
          serverState: estado
        }
      };
    }
  }


  // Agregar después de los métodos existentes, antes de los métodos de sesión

  /**
   * ==========================================
   * MÉTODOS PARA CUENTAS DE AHORRO
   * ==========================================
   */

  /**
   * Obtener todas las cuentas de ahorro del cliente
   */
  async getSavingsAccounts(cedula) {
    console.log('💰 [SAVINGS] Obteniendo cuentas de ahorro para cédula:', cedula);

    // Validación básica
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    const accountsData = {
      prccode: this.processCodes.SAVINGS_ACCOUNTS,
      idecl: cedula.trim(),
      prdfi: "2" // Filtro de producto para ahorros
    };

    console.log('📤 [SAVINGS] Solicitando cuentas:', accountsData);

    const result = await this.makeRequest(accountsData);

    if (result.success) {
      const accountsResult = this.interpretServerResponse(result.data, 'savings_accounts');

      if (accountsResult.success && result.data.cliente?.cuentas && Array.isArray(result.data.cliente.cuentas)) {
        console.log('✅ [SAVINGS] Cuentas obtenidas exitosamente:', result.data.cliente.cuentas.length, 'cuentas');
        
        // 🔍 DEBUG: Ver primera cuenta COMPLETA
        if (result.data.cliente.cuentas.length > 0) {
          const firstAccount = result.data.cliente.cuentas[0];
          console.log('🔍 [SAVINGS-API] Primera cuenta COMPLETA:', JSON.stringify(firstAccount, null, 2));
          console.log('🔍 [SAVINGS-API] Campo salcnt:', firstAccount.salcnt, 'Type:', typeof firstAccount.salcnt);
          console.log('🔍 [SAVINGS-API] Campo saldis:', firstAccount.saldis, 'Type:', typeof firstAccount.saldis);
          console.log('🔍 [SAVINGS-API] Campo saldo:', firstAccount.saldo, 'Type:', typeof firstAccount.saldo);
          console.log('🔍 [SAVINGS-API] Todos los campos disponibles:', Object.keys(firstAccount).join(', '));
        }

        return {
          success: true,
          data: {
            cliente: result.data.cliente,
            cuentas: result.data.cliente.cuentas
          },
          message: `Se encontraron ${result.data.cliente.cuentas.length} cuentas de ahorro`
        };
      } else {
        return {
          success: false,
          error: {
            message: accountsResult.error?.message || 'No se encontraron cuentas de ahorro para este cliente',
            code: 'NO_SAVINGS_ACCOUNTS'
          }
        };
      }
    }

    return result;
  }

  /**
   * Obtener estado de cuenta de una cuenta específica
   */
  async getAccountStatement(cedula, codigoCuenta, fechaDesde, fechaHasta) {
    console.log('📊 [STATEMENT] Obteniendo estado de cuenta');
    console.log('👤 [STATEMENT] Cédula:', cedula);
    console.log('🏦 [STATEMENT] Cuenta (RAW):', codigoCuenta);
    console.log('🏦 [STATEMENT] Cuenta length:', codigoCuenta?.length);
    console.log('🏦 [STATEMENT] Cuenta type:', typeof codigoCuenta);
    console.log('🏦 [STATEMENT] Cuenta parece encriptada?', codigoCuenta?.length > 20); // Base64 encriptado es largo
    console.log('📅 [STATEMENT] Desde:', fechaDesde, 'Hasta:', fechaHasta);

    // Validaciones básicas
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    if (!codigoCuenta || !codigoCuenta.trim()) {
      return {
        success: false,
        error: {
          message: 'El código de cuenta es requerido',
          code: 'ACCOUNT_CODE_REQUIRED'
        }
      };
    }

    // Validar formato de fechas (MM/DD/YYYY)
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(fechaDesde) || !dateRegex.test(fechaHasta)) {
      return {
        success: false,
        error: {
          message: 'Las fechas deben estar en formato MM/DD/YYYY',
          code: 'INVALID_DATE_FORMAT'
        }
      };
    }

    const statementData = {
      prccode: this.processCodes.ACCOUNT_STATEMENT,
      idecl: cedula.trim(),
      codcta: codigoCuenta.trim(),
      fecdes: fechaDesde,
      fechas: fechaHasta
    };

    console.log('📤 [STATEMENT] Solicitando estado de cuenta:', {
      ...statementData,
      idecl: '***' + statementData.idecl.slice(-4)
    });

    const result = await this.makeRequest(statementData);

    if (result.success) {
      const statementResult = this.interpretServerResponse(result.data, 'account_statement');

      if (statementResult.success && result.data.cliente) {
        const movements = result.data.cliente.detalle || [];
        console.log('✅ [STATEMENT] Estado de cuenta obtenido:', movements.length, 'movimientos');
        
        // 🔍 DEBUG: Ver primer movimiento completo
        if (movements.length > 0) {
          console.log('🔍 [STATEMENT] Primer movimiento COMPLETO:', JSON.stringify(movements[0], null, 2));
          console.log('🔍 [STATEMENT] Campo saldo:', movements[0].saldo, 'Type:', typeof movements[0].saldo);
          console.log('🔍 [STATEMENT] Campo valor:', movements[0].valor, 'Type:', typeof movements[0].valor);
        }
        
        // 🔍 DEBUG: Ver datos de cuenta
        console.log('🔍 [STATEMENT] Datos cuenta completos:', JSON.stringify(result.data.cliente.cuenta, null, 2));

        return {
          success: true,
          data: {
            cliente: result.data.cliente,
            cuenta: result.data.cliente.cuenta,
            movimientos: movements,
            periodo: {
              desde: fechaDesde,
              hasta: fechaHasta
            }
          },
          message: `Estado de cuenta obtenido: ${movements.length} movimientos encontrados`
        };
      } else {
        return {
          success: false,
          error: {
            message: statementResult.error?.message || 'No se pudo obtener el estado de cuenta',
            code: 'STATEMENT_ERROR'
          }
        };
      }
    }

    return result;
  }

  /**
   * Método de utilidad para generar fechas por defecto
   */
  getDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

    console.log('📅 [DEFAULT-RANGE] ===== GENERANDO RANGO POR DEFECTO =====');
    console.log('📅 [DEFAULT-RANGE] Fecha actual:', today);
    console.log('📅 [DEFAULT-RANGE] Hace 30 días:', thirtyDaysAgo);

    const formatDate = (date) => {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      const result = `${month}/${day}/${year}`;

      console.log(`📅 [DEFAULT-RANGE] Formateando ${date.toLocaleDateString()} -> ${result}`);
      return result;
    };

    const result = {
      fechaDesde: formatDate(thirtyDaysAgo),
      fechaHasta: formatDate(today)
    };

    console.log('📅 [DEFAULT-RANGE] Resultado final:', result);
    console.log('📅 [DEFAULT-RANGE] ===== FIN GENERACIÓN =====');

    return result;
  };

  /**
   * Método para formatear fecha de DD/MM/YYYY a MM/DD/YYYY (formato API)
   */
  convertDateToApiFormat(dateString) {
    if (!dateString || !dateString.includes('/')) {
      return null;
    }

    const parts = dateString.split('/');
    if (parts.length !== 3) {
      return null;
    }

    // Si viene en formato DD/MM/YYYY, convertir a MM/DD/YYYY
    if (parts[0].length === 2 && parts[1].length === 2) {
      return `${parts[1]}/${parts[0]}/${parts[2]}`;
    }

    // Si ya está en formato MM/DD/YYYY, devolver tal como está
    return dateString;
  }

  // Agregar después de los métodos de ahorros

  /**
   * Obtener cédula del usuario logueado desde la sesión
   */
  /**
   * Obtener cédula del usuario logueado desde la sesión (actualizado)
   */


  /**
   * Método de conveniencia para obtener cuentas del usuario actual
   */
  async getCurrentUserSavingsAccounts() {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: {
          message: 'No hay sesión activa o no se pudo obtener la cédula del usuario',
          code: 'NO_USER_SESSION'
        }
      };
    }

    return await this.getSavingsAccounts(cedula);
  }



  /**
   * Obtener todos los créditos del cliente
   */
  async getCredits(cedula) {
    console.log('💳 [CREDITS] Obteniendo créditos para cédula:', cedula);

    // Validación básica
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    const creditsData = {
      prccode: this.processCodes.CREDITS_LIST,
      idecl: cedula.trim(),
      prdfi: "4" // Filtro de producto para créditos
    };

    console.log('📤 [CREDITS] Solicitando créditos:', creditsData);

    const result = await this.makeRequest(creditsData);

    if (result.success) {
      const creditsResult = this.interpretServerResponse(result.data, 'credits_list');

      if (creditsResult.success && result.data.cliente?.creditos && Array.isArray(result.data.cliente.creditos)) {
        console.log('✅ [CREDITS] Créditos obtenidos exitosamente:', result.data.cliente.creditos.length, 'créditos');
        
        // 🔍 DEBUG: Ver primer crédito COMPLETO
        if (result.data.cliente.creditos.length > 0) {
          const firstCredit = result.data.cliente.creditos[0];
          console.log('🔍 [CREDITS-API] Primer crédito COMPLETO:', JSON.stringify(firstCredit, null, 2));
          console.log('🔍 [CREDITS-API] Campo codcrd:', firstCredit.codcrd, 'Type:', typeof firstCredit.codcrd);
          console.log('🔍 [CREDITS-API] Campo mntcap:', firstCredit.mntcap, 'Type:', typeof firstCredit.mntcap);
          console.log('🔍 [CREDITS-API] Campo salcap:', firstCredit.salcap, 'Type:', typeof firstCredit.salcap);
          console.log('🔍 [CREDITS-API] Todos los campos disponibles:', Object.keys(firstCredit).join(', '));
        }

        return {
          success: true,
          data: {
            cliente: result.data.cliente,
            creditos: result.data.cliente.creditos
          },
          message: `Se encontraron ${result.data.cliente.creditos.length} créditos`
        };
      } else {
        return {
          success: false,
          error: {
            message: creditsResult.error?.message || 'No se encontraron créditos para este cliente',
            code: 'NO_CREDITS_FOUND'
          }
        };
      }
    }

    return result;
  }

  /**
   * Obtener tabla de amortización de un crédito específico
   */
  async getAmortizationTable(cedula, codigoCredito) {
    console.log('📊 [AMORTIZATION] Obteniendo tabla de amortización');
    console.log('👤 [AMORTIZATION] Cédula:', cedula);
    console.log('💳 [AMORTIZATION] Código crédito:', codigoCredito);

    // Validaciones básicas
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    if (!codigoCredito || !codigoCredito.trim()) {
      return {
        success: false,
        error: {
          message: 'El código de crédito es requerido',
          code: 'CREDIT_CODE_REQUIRED'
        }
      };
    }

    const amortizationData = {
      prccode: this.processCodes.AMORTIZATION_TABLE,
      idecl: cedula.trim(),
      codcrd: codigoCredito.trim()
    };

    console.log('📤 [AMORTIZATION] Solicitando tabla de amortización:', {
      ...amortizationData,
      idecl: '***' + amortizationData.idecl.slice(-4)
    });

    const result = await this.makeRequest(amortizationData);

    if (result.success) {
      const amortizationResult = this.interpretServerResponse(result.data, 'amortization_table');

      if (amortizationResult.success && result.data.cliente) {
        const cuotas = result.data.cliente.cuotas || [];
        console.log('✅ [AMORTIZATION] Tabla de amortización obtenida:', cuotas.length, 'cuotas');

        return {
          success: true,
          data: {
            cliente: result.data.cliente,
            credito: result.data.cliente.credito,
            cuotas: cuotas
          },
          message: `Tabla de amortización obtenida: ${cuotas.length} cuotas encontradas`
        };
      } else {
        return {
          success: false,
          error: {
            message: amortizationResult.error?.message || 'No se pudo obtener la tabla de amortización',
            code: 'AMORTIZATION_ERROR'
          }
        };
      }
    }

    return result;
  }

  /**
   * Método de conveniencia para obtener créditos del usuario actual
   */
  async getCurrentUserCredits() {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: {
          message: 'No hay sesión activa o no se pudo obtener la cédula del usuario',
          code: 'NO_USER_SESSION'
        }
      };
    }

    return await this.getCredits(cedula);
  }

  getUserCedula() {
    console.log('🔍 [SESSION] Obteniendo cédula del usuario...');

    const session = this.getUserSession();
    console.log('📊 [SESSION] Datos de sesión completos:', session);

    if (!session) {
      console.log('❌ [SESSION] No hay sesión activa');
      return null;
    }

    // Intentar múltiples rutas para obtener la cédula
    let cedula = null;

    // Opción 1: Desde userData.cliente[0].idecli (estructura nueva del login)
    if (session.userData?.cliente && Array.isArray(session.userData.cliente) && session.userData.cliente[0]?.idecli) {
      cedula = session.userData.cliente[0].idecli;
      console.log('✅ [SESSION] Cédula encontrada en userData.cliente[0].idecli:', cedula);
    }
    // Opción 2: Desde userData.cliente.idecli (por si no es array)
    else if (session.userData?.cliente?.idecli) {
      cedula = session.userData.cliente.idecli;
      console.log('✅ [SESSION] Cédula encontrada en userData.cliente.idecli:', cedula);
    }
    // Opción 3: Desde userData.cliente.idecl (alternativo)
    else if (session.userData?.cliente?.idecl) {
      cedula = session.userData.cliente.idecl;
      console.log('✅ [SESSION] Cédula encontrada en userData.cliente.idecl:', cedula);
    }
    // Opción 4: Directamente en userData
    else if (session.userData?.idecli) {
      cedula = session.userData.idecli;
      console.log('✅ [SESSION] Cédula encontrada en userData.idecli:', cedula);
    }
    else if (session.userData?.idecl) {
      cedula = session.userData.idecl;
      console.log('✅ [SESSION] Cédula encontrada en userData.idecl:', cedula);
    }

    if (!cedula) {
      console.log('❌ [SESSION] No se pudo encontrar la cédula en ninguna ubicación');
      console.log('🔍 [SESSION] Estructura disponible:', Object.keys(session));
      if (session.userData) {
        console.log('🔍 [SESSION] Estructura userData:', Object.keys(session.userData));
        if (session.userData.cliente) {
          console.log('🔍 [SESSION] Estructura cliente:', session.userData.cliente);
        }
      }
    }

    return cedula;
  }

  /**
   * Obtener tipo de usuario de la sesión actual
   */
  getUserType() {
    try {
      const session = this.getUserSession();
      
      // Si ya está almacenado en la sesión
      if (session?.tipoUsuario) {
        console.log('👥 [USER] Tipo obtenido de sesión:', session.tipoUsuario);
        return session.tipoUsuario;
      }
      
      // Si no está almacenado, detectarlo desde la identificación
      const identificacion = this.getUserCedula();
      if (identificacion) {
        const tipo = this.detectUserType(identificacion);
        console.log('👥 [USER] Tipo detectado desde identificación:', tipo);
        return tipo;
      }
      
      console.log('❌ [USER] No se pudo determinar el tipo de usuario');
      return 'unknown';
    } catch (error) {
      console.error('💥 [USER] Error obteniendo tipo de usuario:', error);
      return 'unknown';
    }
  }

  /**
   * Servicio de autenticación mejorado
   */
  /**
   * Detectar tipo de usuario basado en su identificación
   */
  detectUserType(identificacion) {
    if (!identificacion) return 'unknown';
    
    const id = identificacion.toString().trim();
    
    // RUC ecuatoriano: 13 dígitos y termina en 001
    if (id.length === 13 && id.endsWith('001')) {
      return 'empresa';
    }
    
    // Cédula ecuatoriana: 10 dígitos
    if (id.length === 10) {
      return 'persona_natural';
    }
    
    return 'unknown';
  }

  async login(username, password) {
    console.log('🔐 [AUTH] ========== INICIO LOGIN DEBUG ==========');
    console.log('👤 [AUTH] Usuario:', username);
    console.log('🔑 [AUTH] Contraseña recibida (longitud):', password.length);
    console.log('🔑 [AUTH] Contraseña:', password); // Solo para debug

    // Validaciones básicas antes de enviar
    if (!username || !password) {
      return {
        success: false,
        error: {
          message: 'Usuario y contraseña son requeridos',
          code: 'MISSING_CREDENTIALS'
        }
      };
    }

    if (username.trim().length < 3) {
      return {
        success: false,
        error: {
          message: 'El usuario debe tener al menos 3 caracteres',
          code: 'INVALID_USERNAME_LENGTH'
        }
      };
    }

    if (password.trim().length < 4) {
      return {
        success: false,
        error: {
          message: 'La contraseña debe tener al menos 4 caracteres',
          code: 'INVALID_PASSWORD_LENGTH'
        }
      };
    }

    const loginData = {
      prccode: this.processCodes.LOGIN,
      usr: username.trim(),
      pwd: password.trim()
    };

    console.log('📝 [AUTH] Datos ANTES de encriptación:', {
      prccode: loginData.prccode,
      usr: loginData.usr,
      pwd: loginData.pwd
    });

    console.log('🎯 [AUTH] ===== COMPARACIÓN CON POSTMAN =====');
    console.log('🎯 [AUTH] Postman usr esperado: "qRym2o7g3LG5tHnPWTgYQw==" para "Josu1234"');
    console.log('🎯 [AUTH] Postman pwd esperado: "z1fKJltbT3aDeHhLgCjQ0A==" para "Solstic2025-"');
    console.log('🎯 [AUTH] ==========================================');

    const result = await this.makeRequest(loginData);

    console.log('🔍 [AUTH] Analizando respuesta del login...');

    if (result.success) {
      // Interpretar la respuesta específica del servidor
      const loginResult = this.interpretServerResponse(result.data, 'login');

      console.log('📊 [AUTH] Resultado interpretado:', loginResult);

      if (loginResult.success) {
        console.log('✅ [AUTH] Login validado como exitoso');

        // Detectar tipo de usuario basado en la identificación
        const identificacion = result.data?.cliente?.[0]?.idecli || '';
        const tipoUsuario = this.detectUserType(identificacion);
        
        console.log('🏢 [AUTH] Identificación detectada:', identificacion);
        console.log('👥 [AUTH] Tipo de usuario detectado:', tipoUsuario);

        // Guardar datos de sesión con tipo de usuario
        const sessionData = {
          username: username.trim(),
          loginTime: new Date().toISOString(),
          token: this.config.token,
          userData: result.data,
          tipoUsuario: tipoUsuario,
          identificacion: identificacion
        };

        this.saveUserSession(sessionData);
        console.log('💾 [AUTH] Sesión guardada correctamente con tipo:', tipoUsuario);

        return {
          success: true,
          data: result.data,
          tipoUsuario: tipoUsuario,
          message: loginResult.message || 'Inicio de sesión exitoso'
        };
      } else {
        console.log('❌ [AUTH] Login validado como fallido');
        console.log('💡 [AUTH] Razón del fallo:', loginResult.error.message);

        return loginResult;
      }
    }

    console.log('🔄 [AUTH] Retornando resultado de error de red');
    return result;
  }

  /**
   * Verificar si el login fue exitoso (método mantenido por compatibilidad)
   */
  isLoginSuccessful(response) {
    console.log('🔍 [AUTH] Verificando respuesta del servidor (método legacy):', response);

    const isSuccess = response.estado === "000" ||
      response.msg === "CORRECTO" ||
      response.success ||
      response.status === 'success' ||
      response.authenticated ||
      response.code === '200' ||
      !response.error;

    console.log('✅ [AUTH] Login exitoso (legacy):', isSuccess);
    return isSuccess;
  }

  // ==========================================
  // MÉTODOS PARA RECUPERACIÓN DE CONTRASEÑA
  // (mantenidos sin cambios)
  // ==========================================

  async verifyCedula(cedula) {
    console.log('🔍 [FORGOT] Verificando cédula:', cedula);

    const verifyData = {
      prccode: this.processCodes.VERIFY_CEDULA,
      idecl: cedula.trim()
    };

    const result = await this.makeRequest(verifyData);

    if (result.success) {
      const verifyResult = this.interpretServerResponse(result.data, 'verify_cedula');

      if (verifyResult.success && result.data.webusu && result.data.cliente) {
        console.log('✅ [FORGOT] Cédula verificada exitosamente');
        return {
          success: true,
          data: result.data,
          message: 'Usuario encontrado correctamente'
        };
      } else {
        return {
          success: false,
          error: {
            message: verifyResult.error?.message || 'No se encontró un usuario registrado con esta cédula',
            code: 'USER_NOT_FOUND'
          }
        };
      }
    }

    return result;
  }

async getSecurityQuestion(cedula) {
  console.log('🔒 [FORGOT] Obteniendo pregunta de seguridad para:', cedula);

  const questionData = {
    prccode: this.processCodes.SECURITY_QUESTION, // '2340'
    idecl: cedula.trim()
  };

  const result = await this.makeRequest(questionData);

  if (result.success) {
    const questionResult = this.interpretServerResponse(result.data, 'security_question');

    // ✅ CORRECCIÓN: Cambiar result.data.listado por result.data.listado
    if (questionResult.success && result.data.listado && Array.isArray(result.data.listado)) {
      console.log('✅ [FORGOT] Preguntas obtenidas exitosamente');
      return {
        success: true,
        questions: result.data.listado,  // ✅ Usar result.data.listado directamente
        message: 'Preguntas de seguridad obtenidas correctamente'
      };
    } else {
      return {
        success: false,
        error: {
          message: questionResult.error?.message || 'No se pudieron obtener las preguntas de seguridad',
          code: 'SECURITY_QUESTIONS_ERROR'
        }
      };
    }
  }

  return result;
}

async validateSecurityAnswer(cedula, codigoPregunta, respuesta) {
  console.log('🔐 [FORGOT] Validando respuesta de seguridad');

  const answerData = {
    prccode: this.processCodes.VALIDATE_ANSWER, // '2170'
    idecl: cedula.trim(),
    codprg: codigoPregunta.toString(), // ✅ Usar codprg como en el JSON
    detrsp: respuesta.trim()
  };

  const result = await this.makeRequest(answerData);

  if (result.success) {
    const answerResult = this.interpretServerResponse(result.data, 'validate_answer');

    // ✅ CORRECCIÓN: Verificar estado === '000'
    if (answerResult.success && result.data.estado === '000') {
      console.log('✅ [FORGOT] Respuesta validada correctamente');
      return {
        success: true,
        message: result.data.msg || 'Respuesta de seguridad correcta'
      };
    } else {
      return {
        success: false,
        error: {
          message: result.data.msg || 'La respuesta de seguridad es incorrecta',
          code: 'INVALID_SECURITY_ANSWER'
        }
      };
    }
  }

  return result;
}
  async requestSecurityCode(cedula) {
    console.log('📨 [FORGOT] Solicitando código de seguridad para:', cedula);

    const codeData = {
      prccode: this.processCodes.REQUEST_CODE,
      idecl: cedula.trim()
    };

    const result = await this.makeRequest(codeData);

    if (result.success) {
      const codeResult = this.interpretServerResponse(result.data, 'request_code');

      if (codeResult.success && result.data.cliente?.[0]?.idemsg) {
        console.log('✅ [FORGOT] Código solicitado exitosamente');
        return {
          success: true,
          data: result.data,
          message: 'Código de seguridad enviado correctamente'
        };
      } else {
        return {
          success: false,
          error: {
            message: codeResult.error?.message || 'No se pudo enviar el código de seguridad',
            code: 'CODE_REQUEST_ERROR'
          }
        };
      }
    }

    return result;
  }
  async validateUsername(username) {
    console.log('🔧 [DEBUG] ===== DIAGNÓSTICO COMPLETO =====');
    console.log('🔧 [DEBUG] import.meta.env.DEV:', import.meta.env.DEV);
    console.log('🔧 [DEBUG] import.meta.env.MODE:', import.meta.env.MODE);
    console.log('🔧 [DEBUG] window.location.origin:', window.location.origin);

    const targetUrl = this.config.baseUrl; // SIEMPRE usar la URL con L
    console.log('🔧 [DEBUG] URL completa que se usará:', targetUrl);
    console.log('🔧 [DEBUG] Código de proceso:', this.processCodes.VALIDATE_USERNAME);

    // Verificar configuración de URLs
    console.log('🔧 [DEBUG] API_CONFIG.baseUrl:', this.config.baseUrl);

    if (!username || !username.trim()) {
      return {
        success: false,
        error: {
          message: 'El nombre de usuario es requerido',
          code: 'USERNAME_REQUIRED'
        }
      };
    }

    const validateData = {
      prccode: this.processCodes.VALIDATE_USERNAME,
      usr: username.trim()
    };

    const fullPayload = {
      tkn: this.config.token,
      ...validateData
    };

    console.log('📤 [DEBUG] Payload completo:', fullPayload);
    console.log('📤 [DEBUG] JSON string:', JSON.stringify(fullPayload));

    // PRUEBA 1: Petición directa sin proxy (para comparar)
    console.log('🧪 [DEBUG] === PRUEBA 1: Petición directa (sin proxy) ===');
    try {
      const directUrl = 'http://192.168.200.102/wsVirtualCoopSrvP/ws_server/prctrans.php';
      console.log('🌐 [DEBUG] URL directa:', directUrl);

      const directResponse = await fetch(directUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(fullPayload)
      });

      console.log('📊 [DEBUG] Respuesta directa - Status:', directResponse.status);

      if (directResponse.ok) {
        const directData = await directResponse.json();
        console.log('✅ [DEBUG] Respuesta directa exitosa:', directData);

        if (directData.estado === '000') {
          console.log('🎉 [DEBUG] ¡ÉXITO! La petición directa funciona');
          return {
            success: true,
            data: directData,
            message: 'Usuario encontrado correctamente (petición directa)'
          };
        }
      }
    } catch (directError) {
      console.log('❌ [DEBUG] Error en petición directa (CORS esperado):', directError.message);
    }

    // PRUEBA 2: Petición a través del proxy
    console.log('🧪 [DEBUG] === PRUEBA 2: Petición a través del proxy ===');
    console.log('🌐 [DEBUG] URL del proxy:', targetUrl);

    try {
      const proxyResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(fullPayload)
      });

      console.log('📊 [DEBUG] Respuesta del proxy - Status:', proxyResponse.status);
      console.log('📊 [DEBUG] Respuesta del proxy - URL final:', proxyResponse.url);
      console.log('📊 [DEBUG] Respuesta del proxy - Headers:', Object.fromEntries(proxyResponse.headers.entries()));

      if (proxyResponse.ok) {
        const proxyData = await proxyResponse.json();
        console.log('✅ [DEBUG] Respuesta del proxy exitosa:', proxyData);

        if (proxyData.estado === '000') {
          console.log('🎉 [DEBUG] ¡ÉXITO! El proxy funciona');
          return {
            success: true,
            data: proxyData,
            message: 'Usuario encontrado correctamente (a través del proxy)'
          };
        }
      } else {
        console.log('❌ [DEBUG] El proxy devolvió error:', proxyResponse.status, proxyResponse.statusText);

        // Intentar leer el cuerpo del error
        try {
          const errorText = await proxyResponse.text();
          console.log('📄 [DEBUG] Contenido del error:', errorText);
        } catch (e) {
          console.log('📄 [DEBUG] No se pudo leer el contenido del error');
        }
      }
    } catch (proxyError) {
      console.log('❌ [DEBUG] Error en petición del proxy:', proxyError);
    }

    // PRUEBA 3: Usar el método makeRequest original
    console.log('🧪 [DEBUG] === PRUEBA 3: Método makeRequest original ===');
    const result = await this.makeRequest(validateData);

    console.log('📊 [DEBUG] Resultado final de makeRequest:', result);

    return {
      success: false,
      error: {
        message: 'Todas las pruebas fallaron. Revisa los logs de debug.',
        code: 'DEBUG_FAILURE'
      }
    };
  }
  /**
   * MÉTODO ESPECÍFICO PARA VALIDAR FORMATO DE CONTRASEÑA (solo cambio de contraseña)
   */
  async validatePasswordFormat(username, password) {
    console.log('🔐 [CHANGE-PWD] Validando formato de contraseña');
    console.log('🔧 [CHANGE-PWD] URL que se usará:', this.config.baseUrl);

    const passwordData = {
      prccode: this.processCodes.VALIDATE_PASSWORD, // '2151'
      usr: username.trim(),
      pwd: password.trim()
    };

    const result = await this.makeRequest(passwordData);

    if (result.success) {
      const passwordResult = this.interpretServerResponse(result.data, 'validate_password');

      if (passwordResult.success) {
        console.log('✅ [CHANGE-PWD] Formato de contraseña validado');
        return {
          success: true,
          message: 'La contraseña cumple con los requisitos de seguridad'
        };
      } else {
        // Usar el mensaje del servidor directamente
        let errorMessage = result.data?.msg || 'La contraseña no cumple con los requisitos';

        return {
          success: false,
          error: {
            message: errorMessage,
            code: 'INVALID_PASSWORD_FORMAT'
          }
        };
      }
    }

    return result;
  }

  /**
   * MÉTODO PARA CAMBIO DE CONTRASEÑA - USANDO EL FLUJO NUEVO
   */
  async updatePasswordWithNewPassword({ cedula, usuario, newPassword, idemsg, codigo }) {
    console.log('🔄 [CHANGE-PWD] Actualizando con nueva contraseña');

    // USAR EXACTAMENTE LA MISMA ESTRUCTURA QUE EL BLOQUEO
    const updateData = {
      prccode: this.processCodes.UPDATE_PASSWORD, // '2160' - MISMO CÓDIGO
      idecl: cedula.trim(),
      usr: usuario.trim(),
      pwd: newPassword.trim(), // NUEVA CONTRASEÑA EN LUGAR DE FIJA
      idemsg: idemsg.trim(),
      codseg: codigo.trim()
    };

    console.log('📤 [CHANGE-PWD] Datos enviados (misma estructura que bloqueo):', {
      ...updateData,
      pwd: '***' + updateData.pwd.slice(-2)
    });

    // MISMO PROCESO QUE EL BLOQUEO
    const result = await this.makeRequest(updateData);

    if (result.success) {
      const updateResult = this.interpretServerResponse(result.data, 'update_password');

      if (updateResult.success) {
        console.log('✅ [CHANGE-PWD] Contraseña actualizada exitosamente');
        return {
          success: true,
          data: result.data,
          message: 'Contraseña actualizada correctamente'
        };
      } else {
        return {
          success: false,
          error: {
            message: updateResult.error?.message || 'Error al actualizar la contraseña',
            code: this.getPasswordUpdateErrorCode(result.data)
          }
        };
      }
    }

    return result;
  }

  /**
   * MÉTODO PARA SOLICITAR CÓDIGO EN CAMBIO DE CONTRASEÑA
   * (Debe usar la cédula del usuario validado)
   */
  async requestSecurityCodeForPasswordChange(cedula) {
    console.log('📨 [CHANGE-PWD] Solicitando código para cambio de contraseña:', cedula);

    // USAR EXACTAMENTE EL MISMO MÉTODO QUE FUNCIONA PARA BLOQUEO
    const codeData = {
      prccode: this.processCodes.REQUEST_CODE, // '2155' - MISMO CÓDIGO
      idecl: cedula.trim()
    };

    console.log('📤 [CHANGE-PWD] Solicitando código:', codeData);

    const result = await this.makeRequest(codeData);

    if (result.success) {
      const codeResult = this.interpretServerResponse(result.data, 'request_code');

      if (codeResult.success && result.data.cliente?.[0]?.idemsg) {
        console.log('✅ [CHANGE-PWD] Código solicitado exitosamente');
        
        // 🔓 DESENCRIPTAR idemsg usando helper
        const idemsg = this.decryptIdemsgIfNeeded(
          result.data.cliente[0].idemsg, 
          'CHANGE-PWD-OTP'
        );
        
        console.log('🆔 [CHANGE-PWD] idemsg procesado');

        return {
          success: true,
          data: {
            ...result.data,
            cliente: [{
              ...result.data.cliente[0],
              idemsg: idemsg
            }]
          },
          message: 'Código de seguridad enviado correctamente'
        };
      } else {
        return {
          success: false,
          error: {
            message: codeResult.error?.message || 'No se pudo enviar el código de seguridad',
            code: 'CODE_REQUEST_ERROR'
          }
        };
      }
    }

    return result;
  }

  async updatePasswordWithCode({ cedula, usuario, idemsg, codigo }) {
    console.log('🔐 [FORGOT] Actualizando contraseña con código');

    const updateData = {
      prccode: this.processCodes.UPDATE_PASSWORD,
      idecl: cedula.trim(),
      usr: usuario.trim(),
      pwd: "AAAAA012345", // Contraseña temporal fija SOLO para recuperación
      idemsg: idemsg.trim(),
      codseg: codigo.trim()
    };

    const result = await this.makeRequest(updateData);

    if (result.success) {
      const updateResult = this.interpretServerResponse(result.data, 'update_password');

      if (updateResult.success) {
        console.log('✅ [FORGOT] Contraseña actualizada exitosamente');
        return {
          success: true,
          data: {
            ...result.data,
            temporaryPassword: "AAAAA012345"
          },
          message: 'Contraseña temporal generada correctamente'
        };
      } else {
        return {
          success: false,
          error: {
            message: updateResult.error?.message || 'Error al generar contraseña temporal',
            code: this.getPasswordUpdateErrorCode(result.data)
          }
        };
      }
    }

    return result;
  }

  /**
   * MÉTODO ESPECÍFICO PARA VALIDAR CÓDIGO OTP EN LOGIN (PROCESO 2156)
   * Este método se usa cuando el usuario ingresa el código OTP para autenticarse
   */
  async validateOTPForLogin({ cedula, idemsg, codigo }) {
    console.log('🔐 [LOGIN-OTP] Validando código OTP para login');
    console.log('👤 [LOGIN-OTP] Cédula:', cedula);
    console.log('🆔 [LOGIN-OTP] idemsg:', idemsg);
    console.log('🔢 [LOGIN-OTP] Código (longitud):', codigo?.length);

    // Validaciones básicas
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    if (!idemsg || !idemsg.trim()) {
      return {
        success: false,
        error: {
          message: 'El identificador del mensaje es requerido',
          code: 'IDEMSG_REQUIRED'
        }
      };
    }

    if (!codigo || !codigo.trim() || codigo.trim().length !== 6) {
      return {
        success: false,
        error: {
          message: 'El código debe tener 6 dígitos',
          code: 'INVALID_CODE_LENGTH'
        }
      };
    }

    // Construir datos para proceso 2156 (validar OTP)
    const validateData = {
      prccode: this.processCodes.VALIDATE_SECURITY_CODE_REGISTRATION, // '2156'
      idecl: cedula.trim(),
      idemsg: idemsg.trim(),
      codseg: codigo.trim()
    };

    console.log('📤 [LOGIN-OTP] Enviando validación de OTP:', {
      ...validateData,
      codseg: '***' + validateData.codseg.slice(-2)
    });

    const result = await this.makeRequest(validateData);

    if (result.success) {
      const validateResult = this.interpretServerResponse(result.data, 'validate_otp_login');

      if (validateResult.success) {
        console.log('✅ [LOGIN-OTP] Código OTP validado correctamente');
        return {
          success: true,
          data: result.data,
          message: 'Código OTP validado correctamente'
        };
      } else {
        console.log('❌ [LOGIN-OTP] Código OTP incorrecto o expirado');
        return {
          success: false,
          error: {
            message: validateResult.error?.message || 'El código OTP es incorrecto o ha expirado',
            code: 'INVALID_OTP'
          }
        };
      }
    }

    return result;
  }

  getPasswordUpdateErrorCode(response) {
    switch (response?.estado) {
      case "006":
        return "INVALID_SECURITY_CODE";
      case "007":
        return "EXPIRED_CODE";
      case "008":
        return "USER_NOT_FOUND";
      default:
        return "PASSWORD_UPDATE_ERROR";
    }
  }

  // ==========================================
  // MÉTODOS ANTERIORES (mantenidos)
  // ==========================================

  async getBalance(accountNumber) {
    const balanceData = {
      prccode: this.processCodes.BALANCE,
      account: accountNumber
    };

    return await this.makeRequest(balanceData);
  }

  async getTransactions(accountNumber, startDate, endDate) {
    const transactionData = {
      prccode: this.processCodes.TRANSACTIONS,
      account: accountNumber,
      startDate,
      endDate
    };

    return await this.makeRequest(transactionData);
  }

  async getSecurityQuestions() {
    console.log('🔐 [SECURITY] Obteniendo preguntas de seguridad (método anterior)');

    const securityData = {
      prccode: this.processCodes.FORGOT_PASSWORD
    };

    const result = await this.makeRequest(securityData);

    if (result.success) {
      const securityResult = this.interpretServerResponse(result.data, 'security_questions');

      if (securityResult.success && result.data.listado) {
        return {
          success: true,
          questions: result.data.listado,
          message: 'Preguntas de seguridad obtenidas correctamente'
        };
      } else {
        return {
          success: false,
          error: {
            message: securityResult.error?.message || 'No se pudieron obtener las preguntas de seguridad',
            code: 'SECURITY_QUESTIONS_ERROR'
          }
        };
      }
    }

    return result;
  }

  async makeTransfer(fromAccount, toAccount, amount, description) {
    const transferData = {
      prccode: this.processCodes.TRANSFER,
      fromAccount,
      toAccount,
      amount: parseFloat(amount),
      description: description || ''
    };

    return await this.makeRequest(transferData);
  }

  /**
   * Guardar sesión de usuario
   */
  saveUserSession(userData) {
    try {
      sessionStorage.setItem('userSession', JSON.stringify(userData));
      sessionStorage.setItem('loginTime', userData.loginTime);
      console.log('💾 [SESSION] Sesión guardada exitosamente');
    } catch (error) {
      console.warn('⚠️ [SESSION] No se pudo guardar la sesión:', error);
    }
  }

  /**
   * Obtener datos de sesión
   */
  getUserSession() {
    try {
      const session = sessionStorage.getItem('userSession');
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.warn('⚠️ [SESSION] Error al obtener sesión:', error);
      return null;
    }
  }

  /**
   * Cerrar sesión
   */
  logout() {
    try {
      sessionStorage.removeItem('userSession');
      sessionStorage.removeItem('loginTime');
      localStorage.removeItem('rememberedUser'); // También limpiar usuario recordado
      console.log('🚪 [SESSION] Sesión cerrada correctamente');
    } catch (error) {
      console.warn('⚠️ [SESSION] Error al cerrar sesión:', error);
    }
  }

  /**
   * 🚨 NUEVO: Logout específico por inactividad
   * Registra el motivo del logout y realiza limpieza adicional
   */
  logoutByInactivity(sessionData = null) {
    try {
      console.log('🚨 [SESSION] Iniciando logout por inactividad...');
      
      // Obtener datos de sesión antes de limpiar
      const currentSession = sessionData || this.getUserSession();
      
      if (currentSession) {
        // Calcular duración de la sesión
        const loginTime = new Date(currentSession.loginTime);
        const now = new Date();
        const sessionDuration = Math.round((now - loginTime) / 1000 / 60); // en minutos
        
        console.log('📊 [SESSION] Información de la sesión cerrada por inactividad:', {
          usuario: currentSession.username || 'Usuario',
          duracionSesion: `${sessionDuration} minutos`,
          tiempoInicio: loginTime.toLocaleString(),
          tiempoFin: now.toLocaleString(),
          motivo: 'Inactividad del usuario'
        });

        // Opcional: Enviar log al servidor si hay endpoint disponible
        this.logInactivityEvent(currentSession, sessionDuration);
      }
      
      // Realizar limpieza estándar
      this.logout();
      
      // Limpieza adicional para logout por inactividad
      sessionStorage.removeItem('lastActivity');
      sessionStorage.removeItem('inactivityWarningShown');
      
      console.log('✅ [SESSION] Logout por inactividad completado');
      
      return {
        success: true,
        reason: 'inactivity',
        sessionDuration: currentSession ? Math.round((new Date() - new Date(currentSession.loginTime)) / 1000 / 60) : 0
      };
      
    } catch (error) {
      console.error('💥 [SESSION] Error durante logout por inactividad:', error);
      
      // Asegurar limpieza mínima aunque haya error
      try {
        this.logout();
      } catch (cleanupError) {
        console.error('💥 [SESSION] Error crítico en limpieza de emergencia:', cleanupError);
      }
      
      return {
        success: false,
        reason: 'inactivity',
        error: error.message
      };
    }
  }

  /**
   * 📝 Registrar evento de inactividad (opcional)
   * Este método puede ser extendido para enviar logs al servidor
   */
  logInactivityEvent(sessionData, sessionDuration) {
    try {
      // Crear registro local del evento
      const inactivityLog = {
        timestamp: new Date().toISOString(),
        username: sessionData.username || 'Usuario',
        sessionDuration: sessionDuration,
        userAgent: navigator.userAgent,
        eventType: 'INACTIVITY_LOGOUT'
      };

      // Guardar en localStorage para debugging (opcional)
      const existingLogs = JSON.parse(localStorage.getItem('inactivityLogs') || '[]');
      existingLogs.push(inactivityLog);
      
      // Mantener solo los últimos 10 logs
      const recentLogs = existingLogs.slice(-10);
      localStorage.setItem('inactivityLogs', JSON.stringify(recentLogs));

      console.log('📝 [SESSION] Evento de inactividad registrado:', inactivityLog);

      // TODO: Aquí se podría enviar al servidor si hay un endpoint disponible
      // await this.sendInactivityLogToServer(inactivityLog);
      
    } catch (error) {
      console.warn('⚠️ [SESSION] Error registrando evento de inactividad:', error);
    }
  }
  /**
   * Verificar si hay una sesión activa
   */
  isAuthenticated() {
    const session = this.getUserSession();
    if (!session || !session.loginTime) {
      return false;
    }

    // Verificar que el 2FA esté completo
    if (!session.twoFactorVerified) {
      console.log('🔐 [SESSION] Sesión incompleta: falta verificación 2FA');
      return false;
    }

    // Verificar si la sesión no ha expirado (8 horas por defecto)
    const loginTime = new Date(session.loginTime);
    const now = new Date();
    const hoursDiff = (now - loginTime) / (1000 * 60 * 60);

    const isValid = hoursDiff < 8; // Sesión válida por 8 horas

    if (!isValid) {
      console.log('⏰ [SESSION] Sesión expirada, limpiando...');
      this.logout();
    }

    return isValid;
  }

  /**
   * Limpiar sesión incompleta (sin 2FA completo)
   */
  clearIncompleteSession() {
    console.log('🧹 [SESSION] Limpiando sesión incompleta (2FA no completado)');
    this.logout();
  }

  async validateIdentityForUserRegistration(cedula) {
    console.log('🆔 [USER-REG] Validando identidad para registro de usuario:', cedula);

    // Validación básica
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    const identityData = {
      prccode: '2140', // Código para validación de identidad
      idecl: cedula.trim()
    };

    console.log('📤 [USER-REG] Validando identidad:', identityData);

    const result = await this.makeRequest(identityData);

    if (result.success) {
      console.log('🔍 [USER-REG] Estado de la respuesta:', result.data.estado);
      console.log('📝 [USER-REG] Mensaje:', result.data.msg);
      console.log('👤 [USER-REG] Usuario existente:', result.data.webusu);

      // LÓGICA PARA REGISTRO: Cliente no debe tener usuario
      if (result.data.estado === '000' && result.data.webusu && result.data.webusu.trim() !== '') {
        // Cliente ya tiene usuario registrado - NO puede registrarse
        console.log('⚠️ [USER-REG] Cliente ya tiene usuario registrado');
        return {
          success: false,
          error: {
            message: `El cliente ya tiene un usuario registrado: ${result.data.webusu}`,
            code: 'USER_ALREADY_EXISTS',
            existingUser: result.data.webusu
          },
          data: {
            cliente: result.data.cliente ? result.data.cliente[0] : null,
            existingUser: result.data.webusu
          }
        };
      } else if (result.data.estado === '001' && result.data.cliente && result.data.cliente.length > 0) {
        // Estado 001 = "Cliente no tiene asignado nombre de usuario" - PUEDE registrarse
        console.log('✅ [USER-REG] Cliente válido sin usuario, puede proceder con registro');
        return {
          success: true,
          data: {
            cliente: result.data.cliente[0],
            canRegister: true,
            message: result.data.msg || 'Cliente encontrado, puede proceder con el registro'
          },
          message: 'Cliente encontrado, puede proceder con el registro'
        };
      } else if (result.data.estado === '000' && (!result.data.webusu || result.data.webusu.trim() === '')) {
        // Estado 000 pero sin webusu - también puede registrarse
        console.log('✅ [USER-REG] Cliente válido sin usuario (estado 000), puede proceder');
        return {
          success: true,
          data: {
            cliente: result.data.cliente ? result.data.cliente[0] : null,
            canRegister: true,
            message: result.data.msg || 'Cliente encontrado, puede proceder con el registro'
          },
          message: 'Cliente encontrado, puede proceder con el registro'
        };
      } else {
        // Cliente no encontrado o error
        console.log('❌ [USER-REG] Cliente no encontrado o error:', result.data.estado);
        return {
          success: false,
          error: {
            message: result.data.msg || 'No se encontró un cliente registrado con esta cédula',
            code: 'CLIENT_NOT_FOUND',
            serverState: result.data.estado
          }
        };
      }
    }

    return result;
  }
  /**
   * Obtener preguntas de seguridad disponibles para registro
   */
  async getAvailableSecurityQuestions() {
    console.log('❓ [SECURITY-REG] Obteniendo preguntas de seguridad disponibles');

    const questionsData = {
      prccode: '2335' // Código para obtener preguntas de seguridad
    };

    console.log('📤 [SECURITY-REG] Solicitando preguntas:', questionsData);

    const result = await this.makeRequest(questionsData);

    if (result.success) {
      const questionsResult = this.interpretServerResponse(result.data, 'security_questions');

      if (questionsResult.success && result.data.listado && Array.isArray(result.data.listado)) {
        console.log('✅ [SECURITY-REG] Preguntas obtenidas exitosamente:', result.data.listado.length, 'preguntas');

        return {
          success: true,
          data: {
            questions: result.data.listado,
            message: result.data.msg
          },
          message: `Se obtuvieron ${result.data.listado.length} preguntas de seguridad`
        };
      } else {
        return {
          success: false,
          error: {
            message: questionsResult.error?.message || 'No se pudieron obtener las preguntas de seguridad',
            code: 'QUESTIONS_ERROR'
          }
        };
      }
    }

    return result;
  }

  /**
   * Solicitar código de seguridad para registro de preguntas
   */
  async requestSecurityCodeForRegistration(cedula) {
    console.log('📨 [SECURITY-REG] Solicitando código de seguridad para registro:', cedula);

    // Validación básica
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    const codeData = {
      prccode: '2155', // Código para solicitar código de seguridad
      idecl: cedula.trim()
    };

    console.log('📤 [SECURITY-REG] Solicitando código:', codeData);

    const result = await this.makeRequest(codeData);

    if (result.success) {
      const codeResult = this.interpretServerResponse(result.data, 'request_security_code');

      if (codeResult.success && result.data.cliente?.[0]?.idemsg) {
        console.log('✅ [SECURITY-REG] Código solicitado exitosamente');
        
        // 🔓 DESENCRIPTAR idemsg usando helper
        const idemsg = this.decryptIdemsgIfNeeded(
          result.data.cliente[0].idemsg, 
          'SECURITY-REG-OTP'
        );
        
        console.log('🆔 [SECURITY-REG] idemsg procesado');

        return {
          success: true,
          data: {
            idemsg: idemsg,
            idecli: result.data.cliente[0].idecli,
            message: result.data.msg
          },
          message: 'Código de seguridad enviado correctamente'
        };
      } else {
        return {
          success: false,
          error: {
            message: codeResult.error?.message || 'No se pudo enviar el código de seguridad',
            code: 'CODE_REQUEST_ERROR'
          }
        };
      }
    }

    return result;
  }

  /**
   * Validar código de seguridad para registro
   */
  async validateSecurityCodeForRegistration(cedula, idemsg, codigo) {
    console.log('🔐 [SECURITY-REG] Validando código de seguridad para registro');

    // Validaciones básicas
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    if (!idemsg || !idemsg.trim()) {
      return {
        success: false,
        error: {
          message: 'El identificador del mensaje es requerido',
          code: 'IDEMSG_REQUIRED'
        }
      };
    }

    if (!codigo || !codigo.trim()) {
      return {
        success: false,
        error: {
          message: 'El código de seguridad es requerido',
          code: 'CODE_REQUIRED'
        }
      };
    }

    // ✅ SEGÚN DOCUMENTACIÓN: Proceso 2156 solo necesita idecl, idemsg, codseg
    const validateData = {
      prccode: '2156',
      idecl: cedula.trim(),
      idemsg: idemsg.trim(),
      codseg: codigo.trim()
    };

    console.log('📤 [SECURITY-REG] Validando código:', {
      ...validateData,
      codseg: '***' + validateData.codseg.slice(-2)
    });

    const result = await this.makeRequest(validateData);

    if (result.success) {
      const validateResult = this.interpretServerResponse(result.data, 'validate_security_code');

      if (validateResult.success) {
        console.log('✅ [SECURITY-REG] Código validado correctamente');

        return {
          success: true,
          data: {
            message: result.data.msg
          },
          message: 'Código de seguridad validado correctamente'
        };
      } else {
        return {
          success: false,
          error: {
            message: validateResult.error?.message || 'El código de seguridad es incorrecto',
            code: 'INVALID_SECURITY_CODE'
          }
        };
      }
    }

    return result;
  }

  /**
   * Guardar una pregunta de seguridad con su respuesta
   */
  async saveSecurityQuestion(cedula, codigoPregunta, respuesta) {
    console.log('💾 [SECURITY-REG] Guardando pregunta de seguridad');
    console.log('👤 [SECURITY-REG] Cédula:', cedula);
    console.log('❓ [SECURITY-REG] Código pregunta:', codigoPregunta);
    console.log('💬 [SECURITY-REG] Respuesta (longitud):', respuesta?.length);

    // Validaciones básicas
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    if (!codigoPregunta) {
      return {
        success: false,
        error: {
          message: 'El código de la pregunta es requerido',
          code: 'QUESTION_CODE_REQUIRED'
        }
      };
    }

    if (!respuesta || !respuesta.trim() || respuesta.trim().length < 2) {
      return {
        success: false,
        error: {
          message: 'La respuesta debe tener al menos 2 caracteres',
          code: 'INVALID_ANSWER_LENGTH'
        }
      };
    }

    const saveData = {
      prccode: '2165', // Código para guardar pregunta de seguridad
      idecl: cedula.trim(),
      codprg: codigoPregunta.toString(),
      detrsp: respuesta.trim()
    };

    console.log('📤 [SECURITY-REG] Guardando pregunta:', {
      ...saveData,
      detrsp: '***' + saveData.detrsp.slice(-2)
    });

    const result = await this.makeRequest(saveData);

    if (result.success) {
      const saveResult = this.interpretServerResponse(result.data, 'save_security_question');

      if (saveResult.success) {
        console.log('✅ [SECURITY-REG] Pregunta guardada exitosamente');

        return {
          success: true,
          data: {
            message: result.data.msg
          },
          message: 'Pregunta de seguridad guardada correctamente'
        };
      } else {
        return {
          success: false,
          error: {
            message: saveResult.error?.message || 'No se pudo guardar la pregunta de seguridad',
            code: 'SAVE_QUESTION_ERROR'
          }
        };
      }
    }

    return result;
  }


  /**
   * Guardar múltiples preguntas de seguridad
   */
  async saveMultipleSecurityQuestions(cedula, preguntas) {
    console.log('💾 [SECURITY-REG] Guardando múltiples preguntas de seguridad');
    console.log('👤 [SECURITY-REG] Cédula:', cedula);
    console.log('📊 [SECURITY-REG] Cantidad de preguntas:', preguntas?.length);

    // Validaciones básicas
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    if (!Array.isArray(preguntas) || preguntas.length === 0) {
      return {
        success: false,
        error: {
          message: 'Se requiere al menos una pregunta de seguridad',
          code: 'NO_QUESTIONS_PROVIDED'
        }
      };
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Guardar cada pregunta secuencialmente
    for (let i = 0; i < preguntas.length; i++) {
      const pregunta = preguntas[i];

      console.log(`📝 [SECURITY-REG] Guardando pregunta ${i + 1}/${preguntas.length}`);

      try {
        const result = await this.saveSecurityQuestion(
          cedula,
          pregunta.codigo,
          pregunta.respuesta
        );

        results.push({
          index: i,
          codigo: pregunta.codigo,
          success: result.success,
          result: result
        });

        if (result.success) {
          successCount++;
          console.log(`✅ [SECURITY-REG] Pregunta ${i + 1} guardada exitosamente`);
        } else {
          errorCount++;
          console.log(`❌ [SECURITY-REG] Error al guardar pregunta ${i + 1}:`, result.error?.message);
        }

        // Pequeña pausa entre requests para evitar sobrecarga
        if (i < preguntas.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (error) {
        console.error(`💥 [SECURITY-REG] Error inesperado al guardar pregunta ${i + 1}:`, error);

        results.push({
          index: i,
          codigo: pregunta.codigo,
          success: false,
          result: {
            success: false,
            error: {
              message: 'Error inesperado al guardar la pregunta',
              code: 'UNEXPECTED_ERROR'
            }
          }
        });

        errorCount++;
      }
    }

    console.log(`📊 [SECURITY-REG] Resumen final: ${successCount} exitosas, ${errorCount} fallidas`);

    // Determinar el resultado general
    if (successCount === preguntas.length) {
      return {
        success: true,
        data: {
          results: results,
          successCount: successCount,
          errorCount: errorCount
        },
        message: `Todas las preguntas de seguridad se guardaron correctamente (${successCount}/${preguntas.length})`
      };
    } else if (successCount > 0) {
      return {
        success: false,
        error: {
          message: `Solo se guardaron ${successCount} de ${preguntas.length} preguntas. Revise los errores e intente nuevamente.`,
          code: 'PARTIAL_SUCCESS',
          details: {
            results: results,
            successCount: successCount,
            errorCount: errorCount
          }
        }
      };
    } else {
      return {
        success: false,
        error: {
          message: 'No se pudo guardar ninguna pregunta de seguridad',
          code: 'COMPLETE_FAILURE',
          details: {
            results: results,
            successCount: successCount,
            errorCount: errorCount
          }
        }
      };
    }
  }

  async validateIdentityForSecurityQuestions(cedula) {
    console.log('🔒 [SECURITY-CHANGE] Validando identidad para cambio de preguntas:', cedula);

    // Validación básica
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    const identityData = {
      prccode: '2140', // Mismo código de validación
      idecl: cedula.trim()
    };

    console.log('📤 [SECURITY-CHANGE] Validando identidad:', identityData);

    const result = await this.makeRequest(identityData);

    // 🔍 VALIDACIÓN: Verificar que la respuesta no sea null
    if (!result.success) {
      console.error('❌ [SECURITY-CHANGE] Error en la petición:', result.error);
      return {
        success: false,
        error: {
          message: result.error?.message || 'Error al validar la identidad',
          code: 'VALIDATION_ERROR'
        }
      };
    }

    // 🔍 VALIDACIÓN: Verificar que result.data no sea null
    if (!result.data) {
      console.error('❌ [SECURITY-CHANGE] El servidor devolvió una respuesta vacía (null)');
      return {
        success: false,
        error: {
          message: 'El servidor no devolvió información. Verifique que la cédula o RUC sea correcta.',
          code: 'EMPTY_RESPONSE'
        }
      };
    }

    if (result.success) {
      console.log('🔍 [SECURITY-CHANGE] Estado de la respuesta:', result.data.estado);
      console.log('📝 [SECURITY-CHANGE] Mensaje:', result.data.msg);
      console.log('👤 [SECURITY-CHANGE] Usuario existente:', result.data.webusu);

      // LÓGICA PARA CAMBIO DE PREGUNTAS: Cliente DEBE tener usuario
      if (result.data.estado === '000' && result.data.webusu && result.data.webusu.trim() !== '') {
        // Cliente tiene usuario registrado - PUEDE cambiar preguntas
        console.log('✅ [SECURITY-CHANGE] Cliente con usuario válido, puede cambiar preguntas');
        return {
          success: true,
          data: {
            cliente: result.data.cliente ? result.data.cliente[0] : null,
            usuario: result.data.webusu,
            canChangeQuestions: true,
            message: result.data.msg || 'Cliente encontrado, puede proceder con el cambio de preguntas'
          },
          message: 'Cliente encontrado, puede proceder con el cambio de preguntas de seguridad'
        };
      } else if (result.data.estado === '001') {
        // Cliente no tiene usuario - NO puede cambiar preguntas
        console.log('❌ [SECURITY-CHANGE] Cliente no tiene usuario registrado');
        return {
          success: false,
          error: {
            message: 'El cliente no tiene un usuario registrado. Debe registrarse primero.',
            code: 'NO_USER_REGISTERED'
          },
          data: {
            cliente: result.data.cliente ? result.data.cliente[0] : null,
            needsRegistration: true
          }
        };
      } else {
        // Cliente no encontrado o error
        console.log('❌ [SECURITY-CHANGE] Cliente no encontrado o error:', result.data.estado);
        return {
          success: false,
          error: {
            message: result.data.msg || 'No se encontró un cliente registrado con esta cédula',
            code: 'CLIENT_NOT_FOUND',
            serverState: result.data.estado
          }
        };
      }
    }

    return result;
  }

  async validateIdentityForRegistration(cedula, context = 'user_registration') {
    console.log('🔄 [IDENTITY] Método de compatibilidad llamado con contexto:', context);

    if (context === 'security_questions' || context === 'change_questions') {
      return await this.validateIdentityForSecurityQuestions(cedula);
    } else {
      return await this.validateIdentityForUserRegistration(cedula);
    }
  }
  /**
   * Validar disponibilidad de nombre de usuario
   */
  async validateUsernameAvailability(username) {
    console.log('👤 [USER-REG] Validando disponibilidad de usuario:', username);

    // Validación básica
    if (!username || !username.trim()) {
      return {
        success: false,
        error: {
          message: 'El nombre de usuario es requerido',
          code: 'USERNAME_REQUIRED'
        }
      };
    }

    if (username.trim().length < 6) {
      return {
        success: false,
        error: {
          message: 'El nombre de usuario debe tener al menos 6 caracteres',
          code: 'USERNAME_TOO_SHORT'
        }
      };
    }

    const usernameData = {
      prccode: '2148', // Código para validar usuario
      usr: username.trim()
    };

    console.log('📤 [USER-REG] Validando usuario:', usernameData);

    const result = await this.makeRequest(usernameData);

    if (result.success) {
      const usernameResult = this.interpretServerResponse(result.data, 'validate_username');

      console.log('🔍 [USER-REG] Estado validación usuario:', result.data.estado);
      console.log('📝 [USER-REG] Mensaje:', result.data.msg);

      // Estado 001 = "No existe usuario con ese nombre" = DISPONIBLE
      if (result.data.estado === '001') {
        console.log('✅ [USER-REG] Usuario disponible para registro');
        return {
          success: true,
          data: {
            username: username.trim(),
            available: true,
            message: result.data.msg
          },
          message: 'Nombre de usuario disponible'
        };
      } else if (result.data.estado === '000') {
        // Usuario ya existe
        console.log('❌ [USER-REG] Usuario ya existe');
        return {
          success: false,
          error: {
            message: 'Este nombre de usuario ya está en uso. Elija otro.',
            code: 'USERNAME_EXISTS'
          }
        };
      } else {
        return {
          success: false,
          error: {
            message: usernameResult.error?.message || 'Error validando nombre de usuario',
            code: 'USERNAME_VALIDATION_ERROR'
          }
        };
      }
    }

    return result;
  }

  /**
   * Validar formato y fortaleza de contraseña
   */
  async validatePasswordStrength(username, password) {
    console.log('🔒 [USER-REG] Validando fortaleza de contraseña para usuario:', username);

    // Validaciones básicas locales
    if (!password || !password.trim()) {
      return {
        success: false,
        error: {
          message: 'La contraseña es requerida',
          code: 'PASSWORD_REQUIRED'
        }
      };
    }

    if (password.length < 8) {
      return {
        success: false,
        error: {
          message: 'La contraseña debe tener al menos 8 caracteres',
          code: 'PASSWORD_TOO_SHORT'
        }
      };
    }

    // Validar con el servicio
    const passwordData = {
      prccode: '2151', // Código para validar contraseña
      usr: username.trim(),
      pwd: password.trim()
    };

    console.log('📤 [USER-REG] Validando contraseña:', {
      ...passwordData,
      pwd: '***' + passwordData.pwd.slice(-2)
    });

    const result = await this.makeRequest(passwordData);

    if (result.success) {
      const passwordResult = this.interpretServerResponse(result.data, 'validate_password');

      console.log('🔍 [USER-REG] Estado validación contraseña:', result.data.estado);
      console.log('📝 [USER-REG] Mensaje:', result.data.msg);

      if (result.data.estado === '000') {
        console.log('✅ [USER-REG] Contraseña válida');
        return {
          success: true,
          data: {
            password: password.trim(),
            valid: true,
            message: result.data.msg
          },
          message: 'Contraseña válida y cumple con los requisitos'
        };
      } else {
        // Usar el mensaje del servidor directamente
        let errorMessage = result.data?.msg || 'La contraseña no cumple con los requisitos de seguridad';

        console.log('❌ [USER-REG] Contraseña no válida:', errorMessage);
        return {
          success: false,
          error: {
            message: errorMessage,
            code: 'INVALID_PASSWORD_FORMAT'
          }
        };
      }
    }

    return result;
  }

  /**
   * Solicitar código de seguridad para registro completo
   */
  async requestSecurityCodeForUserRegistration(cedula) {
    console.log('📨 [USER-REG] Solicitando código de seguridad para registro completo:', cedula);

    // Validación básica
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    const codeData = {
      prccode: '2155', // Código para solicitar código de seguridad
      idecl: cedula.trim()
    };

    console.log('📤 [USER-REG] Solicitando código:', codeData);

    const result = await this.makeRequest(codeData);

    if (result.success) {
      const codeResult = this.interpretServerResponse(result.data, 'request_security_code');

      if (codeResult.success && result.data.cliente?.[0]?.idemsg) {
        console.log('✅ [USER-REG] Código solicitado exitosamente');
        
        // 🔓 DESENCRIPTAR idemsg usando helper
        const idemsg = this.decryptIdemsgIfNeeded(
          result.data.cliente[0].idemsg, 
          'USER-REG-OTP'
        );
        
        console.log('🆔 [USER-REG] idemsg procesado');

        return {
          success: true,
          data: {
            idemsg: idemsg,
            idecli: result.data.cliente[0].idecli,
            message: result.data.msg
          },
          message: 'Código de seguridad enviado correctamente'
        };
      } else {
        return {
          success: false,
          error: {
            message: codeResult.error?.message || 'No se pudo enviar el código de seguridad',
            code: 'CODE_REQUEST_ERROR'
          }
        };
      }
    }

    return result;
  }

  /**
   * Validar código de seguridad para registro
   */
  async validateSecurityCodeForUserRegistration(cedula, idemsg, codigo) {
    console.log('🔐 [USER-REG] Validando código de seguridad para registro');

    // Validaciones básicas
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    if (!idemsg || !idemsg.trim()) {
      return {
        success: false,
        error: {
          message: 'El identificador del mensaje es requerido',
          code: 'IDEMSG_REQUIRED'
        }
      };
    }

    if (!codigo || !codigo.trim()) {
      return {
        success: false,
        error: {
          message: 'El código de seguridad es requerido',
          code: 'CODE_REQUIRED'
        }
      };
    }

    const validateData = {
      prccode: '2156', // Código para validar código de seguridad
      idecl: cedula.trim(),
      idemsg: idemsg.trim(),
      codseg: codigo.trim()
    };

    console.log('📤 [USER-REG] Validando código:', {
      ...validateData,
      codseg: '***' + validateData.codseg.slice(-2)
    });

    const result = await this.makeRequest(validateData);

    if (result.success) {
      const validateResult = this.interpretServerResponse(result.data, 'validate_security_code');

      if (validateResult.success) {
        console.log('✅ [USER-REG] Código validado correctamente');

        return {
          success: true,
          data: {
            message: result.data.msg
          },
          message: 'Código de seguridad validado correctamente'
        };
      } else {
        return {
          success: false,
          error: {
            message: validateResult.error?.message || 'El código de seguridad es incorrecto',
            code: 'INVALID_SECURITY_CODE'
          }
        };
      }
    }

    return result;
  }

  /**
   * Registrar usuario y contraseña (paso final)
   */
  async registerUserAccount(cedula, username, password, idemsg, codigo) {
    console.log('👤 [USER-REG] Registrando cuenta de usuario final');
    console.log('📋 [USER-REG] Usuario:', username);
    console.log('🆔 [USER-REG] Cédula:', cedula);

    // Validaciones básicas
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    if (!username || !username.trim()) {
      return {
        success: false,
        error: {
          message: 'El nombre de usuario es requerido',
          code: 'USERNAME_REQUIRED'
        }
      };
    }

    if (!password || !password.trim()) {
      return {
        success: false,
        error: {
          message: 'La contraseña es requerida',
          code: 'PASSWORD_REQUIRED'
        }
      };
    }

    const registerData = {
      prccode: '2160', // Código para registrar usuario
      idecl: cedula.trim(),
      usr: username.trim(),
      pwd: password.trim(), // Usar la contraseña del usuario, NO la temporal
      idemsg: idemsg.trim(),
      codseg: codigo.trim()
    };

    console.log('📤 [USER-REG] Registrando usuario:', {
      ...registerData,
      pwd: '***' + registerData.pwd.slice(-2),
      codseg: '***' + registerData.codseg.slice(-2)
    });

    const result = await this.makeRequest(registerData);

    if (result.success) {
      const registerResult = this.interpretServerResponse(result.data, 'register_user');

      if (registerResult.success) {
        console.log('✅ [USER-REG] Usuario registrado exitosamente');

        return {
          success: true,
          data: {
            username: username.trim(),
            message: result.data.msg
          },
          message: 'Usuario registrado correctamente'
        };
      } else {
        console.error('❌ [USER-REG] Error registrando usuario:', registerResult.error);

        // Manejar errores específicos del servidor
        let errorMessage = result.data?.msg || 'Error al registrar el usuario';
        let errorCode = 'USER_REGISTRATION_ERROR';

        switch (result.data?.estado) {
          case '006':
            errorMessage = 'Error de identificación del cliente en la transacción';
            errorCode = 'CLIENT_ID_MISMATCH';
            break;
          case '007':
            errorMessage = 'El código de seguridad ha expirado';
            errorCode = 'EXPIRED_CODE';
            break;
          case '008':
            errorMessage = 'El código de seguridad es incorrecto';
            errorCode = 'INVALID_CODE';
            break;
        }

        return {
          success: false,
          error: {
            message: errorMessage,
            code: errorCode,
            serverState: result.data?.estado
          }
        };
      }
    }

    return result;
  }

  /**
   * Proceso completo de registro de usuario con preguntas de seguridad
   */
  async completeUserRegistration(registrationData) {
    console.log('🎯 [USER-REG] Iniciando proceso completo de registro');
    console.log('📊 [USER-REG] Datos recibidos:', {
      cedula: registrationData.cedula,
      username: registrationData.username,
      questionsCount: registrationData.selectedQuestions?.length,
      hasCode: !!registrationData.securityCode
    });

    const results = {
      questionsResult: null,
      userResult: null,
      overallSuccess: false
    };

    try {
      // Paso 1: Guardar preguntas de seguridad
      console.log('📝 [USER-REG] Paso 1: Guardando preguntas de seguridad');

      const questionsResult = await this.saveMultipleSecurityQuestions(
        registrationData.cedula,
        registrationData.selectedQuestions
      );

      results.questionsResult = questionsResult;

      if (questionsResult.success) {
        console.log('✅ [USER-REG] Preguntas guardadas exitosamente');

        // Paso 2: Registrar usuario
        console.log('👤 [USER-REG] Paso 2: Registrando usuario');

        const userResult = await this.registerUserAccount(
          registrationData.cedula,
          registrationData.username,
          registrationData.password,
          registrationData.idemsg,
          registrationData.securityCode
        );

        results.userResult = userResult;

        if (userResult.success) {
          console.log('🎉 [USER-REG] ¡Registro completo exitoso!');
          results.overallSuccess = true;

          return {
            success: true,
            data: {
              username: registrationData.username,
              questionsCount: registrationData.selectedQuestions.length,
              results: results
            },
            message: '¡Registro completado exitosamente! Ya puede iniciar sesión con sus credenciales.'
          };
        } else {
          console.error('❌ [USER-REG] Error registrando usuario, pero preguntas ya guardadas');

          return {
            success: false,
            error: {
              message: 'Las preguntas se guardaron correctamente, pero hubo un error al crear el usuario. Contacte al administrador.',
              code: 'PARTIAL_SUCCESS_USER_ERROR',
              details: results
            }
          };
        }
      } else {
        console.error('❌ [USER-REG] Error guardando preguntas de seguridad');

        return {
          success: false,
          error: {
            message: 'Error al guardar las preguntas de seguridad. Intente nuevamente.',
            code: 'QUESTIONS_SAVE_ERROR',
            details: results
          }
        };
      }

    } catch (error) {
      console.error('💥 [USER-REG] Error inesperado en registro completo:', error);

      return {
        success: false,
        error: {
          message: 'Error inesperado durante el registro. Intente nuevamente.',
          code: 'UNEXPECTED_ERROR',
          details: { error: error.message, results }
        }
      };
    }
  }

  // Reemplaza el método getServiciosFacilito en tu ApiService con esta versión simple:

  async getServiciosFacilito(cedula) {
    console.log('🏪 [FACILITO] Obteniendo servicios Facilito para cédula:', cedula);

    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    const serviciosData = {
      prccode: '2000',
      idecl: cedula.trim()
    };

    console.log('📤 [FACILITO] Solicitando información de servicios:', serviciosData);

    const result = await this.makeRequest(serviciosData);

    if (result.success) {
      console.log('🔍 [DEBUG] Estructura completa de la respuesta:', result.data);
      console.log('🔍 [DEBUG] Todas las propiedades:', Object.keys(result.data));

      // Simplificado: Si la API responde correctamente, asumimos que tiene acceso
      if (result.data && Object.keys(result.data).length > 0) {
        console.log('✅ [FACILITO] API responde correctamente, servicios disponibles');

        return {
          success: true,
          data: {
            cliente: result.data.cliente || result.data,
            urlFacilito: 'https://pagos.facilito.com.ec/aplicacion/coac_las_naves', // URL fija
            serviciosInfo: result.data,
            message: result.data.msg || 'Servicios disponibles'
          },
          message: 'Información de servicios obtenida correctamente'
        };
      } else {
        console.log('❌ [FACILITO] Respuesta vacía de la API');
        return {
          success: false,
          error: {
            message: 'No se recibieron datos del servidor',
            code: 'EMPTY_RESPONSE'
          }
        };
      }
    }

    return result;
  }
  /**
   * Método de conveniencia para obtener servicios del usuario actual
   */
  async getCurrentUserServiciosFacilito() {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: {
          message: 'No hay sesión activa o no se pudo obtener la cédula del usuario',
          code: 'NO_USER_SESSION'
        }
      };
    }

    return await this.getServiciosFacilito(cedula);
  }

  /**
   * Validar acceso a servicios Facilito para el usuario actual
   */
  async validateFacilitoAccess() {
    console.log('🔐 [FACILITO] Validando acceso a servicios Facilito');

    const session = this.getUserSession();
    if (!session) {
      console.log('❌ [FACILITO] No hay sesión activa');
      return {
        success: false,
        error: {
          message: 'No hay sesión activa',
          code: 'NO_SESSION'
        }
      };
    }

    try {
      const serviciosResult = await this.getCurrentUserServiciosFacilito();

      console.log('🔍 [FACILITO] Resultado de servicios:', serviciosResult);

      // ⭐ LÓGICA SIMPLIFICADA: Solo verificamos si la llamada fue exitosa
      if (serviciosResult.success) {
        console.log('✅ [FACILITO] Acceso validado exitosamente');
        return {
          success: true,
          data: {
            hasAccess: true,
            urlFacilito: serviciosResult.data.urlFacilito,
            clienteInfo: serviciosResult.data.cliente
          },
          message: 'Acceso a servicios Facilito confirmado'
        };
      } else {
        console.log('❌ [FACILITO] Acceso denegado:', serviciosResult.error?.message);
        return {
          success: false,
          error: {
            message: serviciosResult.error?.message || 'No tiene acceso a los servicios de Facilito',
            code: 'FACILITO_ACCESS_DENIED'
          }
        };
      }
    } catch (error) {
      console.error('💥 [FACILITO] Error validando acceso:', error);
      return {
        success: false,
        error: {
          message: 'Error inesperado al validar acceso',
          code: 'VALIDATION_ERROR'
        }
      };
    }
  }
  getFacilitoProxyUrl(originalUrl) {
    if (!originalUrl) return null;

    console.log('🔄 [FACILITO] URL original:', originalUrl);

    // En desarrollo, usar el proxy local
    if (import.meta.env.DEV) {
      // Extraer la parte de la URL después del dominio
      try {
        const url = new URL(originalUrl);
        const pathAndQuery = url.pathname + url.search;
        const proxyUrl = `/facilito-proxy${pathAndQuery}`;

        console.log('🔧 [FACILITO] URL con proxy:', proxyUrl);
        return proxyUrl;
      } catch (error) {
        console.error('❌ [FACILITO] Error procesando URL:', error);
        // Fallback: usar proxy básico
        return '/facilito-proxy/aplicacion/coac_las_naves';
      }
    }

    // En producción, usar URL original
    console.log('🌐 [FACILITO] URL de producción:', originalUrl);
    return originalUrl;
  }

  /**
   * Actualizar el método getServiciosFacilito para usar proxy
   */
  async getServiciosFacilito(cedula) {
    console.log('🏪 [FACILITO] Obteniendo servicios Facilito para cédula:', cedula);

    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    const serviciosData = {
      prccode: '2000',
      idecl: cedula.trim()
    };

    console.log('📤 [FACILITO] Solicitando información de servicios:', serviciosData);

    const result = await this.makeRequest(serviciosData);

    if (result.success) {
      console.log('🔍 [DEBUG] Estructura completa de la respuesta:', result.data);
      console.log('🔍 [DEBUG] Todas las propiedades:', Object.keys(result.data));

      // Buscar URL de Facilito
      let urlFacilito = null;

      if (result.data.urlpgfcl && result.data.urlpgfcl.trim()) {
        urlFacilito = result.data.urlpgfcl;
        console.log('✅ [FACILITO] URL encontrada en urlpgfcl:', urlFacilito);
      } else if (result.data.nommatri && result.data.nommatri.includes('Matriz')) {
        urlFacilito = 'https://pagos.facilito.com.ec/aplicacion/coac_las_naves';
        console.log('🔄 [FACILITO] Usando URL fija como fallback:', urlFacilito);
      }

      if (urlFacilito) {
        // 🔧 CONVERTIR URL PARA USAR CON PROXY
        const proxyUrl = this.getFacilitoProxyUrl(urlFacilito);
        console.log('🎯 [FACILITO] URL final con proxy:', proxyUrl);

        return {
          success: true,
          data: {
            cliente: result.data.cliente || result.data,
            urlFacilito: proxyUrl, // Usar URL con proxy
            urlOriginal: urlFacilito, // Guardar URL original por si acaso
            serviciosInfo: result.data,
            message: result.data.msg || 'Servicios disponibles'
          },
          message: 'Información de servicios obtenida correctamente'
        };
      } else {
        console.log('❌ [FACILITO] No se encontró URL de servicios');
        return {
          success: false,
          error: {
            message: 'No se encontró URL de servicios Facilito en la respuesta',
            code: 'NO_FACILITO_URL'
          }
        };
      }
    }

    return result;
  }

  async getFinancialSummary(cedula) {
    console.log('💰 [FINANCIAL] Obteniendo resumen financiero para cédula:', cedula);

    // Validación básica
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    const financialData = {
      prccode: this.processCodes.FINANCIAL_SUMMARY, // "2180"
      idecl: cedula.trim()
    };

    console.log('📤 [FINANCIAL] Solicitando resumen financiero:', {
      ...financialData,
      idecl: '***' + financialData.idecl.slice(-4) // Ocultar cédula en logs
    });

    const result = await this.makeRequest(financialData);

    if (result.success) {
      const financialResult = this.interpretServerResponse(result.data, 'financial_summary');

      console.log('🔍 [FINANCIAL] Estado de la respuesta:', result.data.estado);

      // 🆕 MAPEO ACTUALIZADO PARA LOS NUEVOS CAMPOS
      console.log('📊 [FINANCIAL] Datos financieros recibidos (NUEVOS CAMPOS):', {
        // Campos nuevos
        balancet: result.data.balancet,     // Balance total
        balanced: result.data.balanced,     // Balance disponible
        ahorrost: result.data.ahorrost,     // Ahorros total
        ahorrosd: result.data.ahorrosd,     // Ahorros disponible

        // Campos existentes
        inversiones: result.data.inversiones,
        inversionesd: result.data.inversionesd,
        gastosmes: result.data.gastosmes,
        porDGasto: result.data.porDGasto
      });

      if (financialResult.success && result.data.estado === '000') {
        console.log('✅ [FINANCIAL] Resumen financiero obtenido exitosamente');

        // 🆕 PROCESAMIENTO ACTUALIZADO CON LOS NUEVOS CAMPOS
        const financialSummary = {
          // === CAMPOS PRINCIPALES (NUEVOS) ===
          balanceTotal: parseFloat(result.data.balancet) || 0,        // Total de balance
          balanceDisponible: parseFloat(result.data.balanced) || 0,   // Balance disponible

          ahorrosTotal: parseFloat(result.data.ahorrost) || 0,        // Total de ahorros
          ahorrosDisponible: parseFloat(result.data.ahorrosd) || 0,   // Ahorros disponible

          // === CAMPOS SECUNDARIOS ===
          inversionesTotal: parseFloat(result.data.inversiones) || 0,
          inversionesDisponible: parseFloat(result.data.inversionesd) || 0,

          gastosmes: parseFloat(result.data.gastosmes) || 0,
          porDGasto: parseInt(result.data.porDGasto) || 0,

          // === CAMPOS CALCULADOS ===
          activosLiquidos: (parseFloat(result.data.ahorrost) || 0) + (parseFloat(result.data.inversiones) || 0),

          // === COMPATIBILIDAD CON CÓDIGO ANTERIOR ===
          balance: parseFloat(result.data.balancet) || 0,      // Mapear a balancet
          ahorros: parseFloat(result.data.ahorrost) || 0,      // Mapear a ahorrost
          inversiones: parseFloat(result.data.inversiones) || 0,

          // === METADATOS ===
          fechaConsulta: new Date().toISOString(),
          moneda: 'USD',

          // === DATOS ORIGINALES (para debugging) ===
          _datosOriginales: {
            balancet: result.data.balancet,
            balanced: result.data.balanced,
            ahorrost: result.data.ahorrost,
            ahorrosd: result.data.ahorrosd,
            inversiones: result.data.inversiones,
            inversionesd: result.data.inversionesd,
            gastosmes: result.data.gastosmes,
            porDGasto: result.data.porDGasto
          }
        };

        console.log('📋 [FINANCIAL] Resumen procesado:', {
          balanceTotal: financialSummary.balanceTotal,
          balanceDisponible: financialSummary.balanceDisponible,
          ahorrosTotal: financialSummary.ahorrosTotal,
          ahorrosDisponible: financialSummary.ahorrosDisponible
        });

        return {
          success: true,
          data: {
            resumenFinanciero: financialSummary,
            datosOriginales: result.data,
            cedula: cedula
          },
          message: 'Resumen financiero obtenido correctamente'
        };
      } else {
        console.log('❌ [FINANCIAL] Error en la respuesta del servidor:', result.data.msg);
        console.log('🔍 [FINANCIAL] Estado del servidor:', result.data.estado);

        return {
          success: false,
          error: {
            message: result.data.msg || 'No se pudo obtener el resumen financiero',
            code: 'FINANCIAL_SUMMARY_ERROR',
            serverState: result.data.estado
          }
        };
      }
    }

    console.log('❌ [FINANCIAL] Error en la petición HTTP');
    return result;
  }

  /**
   * Método de conveniencia para obtener resumen financiero del usuario actual
   */
  async getCurrentUserFinancialSummary() {
    console.log('👤 [FINANCIAL] Obteniendo resumen financiero del usuario actual');

    const cedula = this.getUserCedula();
    if (!cedula) {
      console.log('❌ [FINANCIAL] No se pudo obtener la cédula del usuario');
      return {
        success: false,
        error: {
          message: 'No hay sesión activa o no se pudo obtener la cédula del usuario',
          code: 'NO_USER_SESSION'
        }
      };
    }

    console.log('🔍 [FINANCIAL] Cédula obtenida de la sesión:', '***' + cedula.slice(-4));
    return await this.getFinancialSummary(cedula);
  }

  /**
   * Formatear montos para visualización
   */
  formatCurrency(amount, currency = 'USD') {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '$0.00';
    }

    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Calcular variación porcentual (para uso futuro)
   */
  calculatePercentageChange(current, previous) {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Obtener resumen financiero con formateo para UI
   */
  async getFormattedFinancialSummary() {
    console.log('🎨 [FINANCIAL] Obteniendo resumen financiero formateado para UI');

    const result = await this.getCurrentUserFinancialSummary();

    if (result.success) {
      const summary = result.data.resumenFinanciero;

      const formattedSummary = {
        // Datos numéricos originales
        raw: summary,

        // 🆕 DATOS FORMATEADOS CON NUEVOS CAMPOS
        formatted: {
          // === BALANCE ===
          balanceTotal: this.formatCurrency(summary.balanceTotal),
          balanceDisponible: this.formatCurrency(summary.balanceDisponible),

          // === AHORROS ===
          ahorrosTotal: this.formatCurrency(summary.ahorrosTotal),
          ahorrosDisponible: this.formatCurrency(summary.ahorrosDisponible),

          // === INVERSIONES ===
          inversionesTotal: this.formatCurrency(summary.inversionesTotal),
          inversionesDisponible: this.formatCurrency(summary.inversionesDisponible),

          // === GASTOS ===
          gastosDelMes: this.formatCurrency(summary.gastosmes),
          porcentajeGastos: `${summary.porDGasto}%`,

          // === ACTIVOS ===
          activosLiquidos: this.formatCurrency(summary.activosLiquidos),

          // === COMPATIBILIDAD ===
          balanceTotal_legacy: this.formatCurrency(summary.balance), // Para código anterior
          ahorros_legacy: this.formatCurrency(summary.ahorros),      // Para código anterior
          inversiones_legacy: this.formatCurrency(summary.inversiones),

          // === INFORMACIÓN ADICIONAL ===
          fechaConsulta: new Date().toLocaleDateString('es-EC'),
          moneda: summary.moneda
        },

        // 🆕 DATOS PARA GRÁFICOS ACTUALIZADOS
        chartData: {
          ahorrosTotal: summary.ahorrosTotal,
          ahorrosDisponible: summary.ahorrosDisponible,
          inversionesTotal: summary.inversionesTotal,
          inversionesDisponible: summary.inversionesDisponible,
          gastosmes: summary.gastosmes,
          balanceTotal: summary.balanceTotal,
          balanceDisponible: summary.balanceDisponible
        }
      };

      console.log('🎨 [FINANCIAL] Datos formateados:', {
        ahorrosTotal: formattedSummary.formatted.ahorrosTotal,
        ahorrosDisponible: formattedSummary.formatted.ahorrosDisponible,
        balanceTotal: formattedSummary.formatted.balanceTotal,
        balanceDisponible: formattedSummary.formatted.balanceDisponible
      });

      return {
        success: true,
        data: formattedSummary,
        message: 'Resumen financiero formateado correctamente'
      };
    }

    return result;
  }

  /**
 * Registrar nueva inversión usando API 2375
 */
async registerInvestment(investmentData) {
  console.log('💰 [INVESTMENT-REGISTER] Registrando nueva inversión (API 2375)');
  console.log('📋 [INVESTMENT-REGISTER] Datos recibidos:', investmentData);

  // ✅ VALIDACIONES MEJORADAS - Primero validar campos requeridos
  const requiredFields = ['cedula', 'codtpgin', 'valinver', 'plzinver', 'tasinver', 'codctadp'];
  for (const field of requiredFields) {
    if (!investmentData[field] || !investmentData[field].toString().trim()) {
      return {
        success: false,
        error: {
          message: `El campo ${field} es requerido para registrar la inversión`,
          code: 'MISSING_REQUIRED_FIELD'
        }
      };
    }
  }

  // ✅ LOGS SEGUROS - Solo después de validar que existen
  console.log('📋 [INVESTMENT-REGISTER] Datos validados:', {
    ...investmentData,
    cedula: investmentData.cedula ? '***' + investmentData.cedula.slice(-4) : 'UNDEFINED',
    codctadp: investmentData.codctadp ? '***' + investmentData.codctadp.slice(-4) : 'UNDEFINED'
  });

  // ✅ MAPEAR cedula a idecl para la API
  const registerData = {
    prccode: '2375', // Código para registrar inversión
    idecl: investmentData.cedula.trim(), // ✅ Usar cedula y mapearlo a idecl
    codtpgin: investmentData.codtpgin.toString(),
    valinver: parseFloat(investmentData.valinver).toFixed(2),
    plzinver: investmentData.plzinver.toString(),
    tasinver: parseFloat(investmentData.tasinver).toFixed(2),
    codctadp: investmentData.codctadp.trim()
  };

  console.log('📤 [INVESTMENT-REGISTER] Payload final:', {
    ...registerData,
    idecl: registerData.idecl ? '***' + registerData.idecl.slice(-4) : 'UNDEFINED',
    codctadp: registerData.codctadp ? '***' + registerData.codctadp.slice(-4) : 'UNDEFINED'
  });

  const result = await this.makeRequest(registerData);

  if (result.success) {
    const registerResult = this.interpretServerResponse(result.data, 'register_investment');

    if (registerResult.success && result.data.estado === '000' && result.data.inversion) {
      console.log('✅ [INVESTMENT-REGISTER] Inversión registrada exitosamente');

      // Procesar datos de la inversión registrada
      const inversionRegistrada = result.data.inversion[0];
      
      const processedInvestment = {
        // Datos de la cooperativa
        nombreCooperativa: inversionRegistrada.nomcoope,
        
        // Datos de la inversión
        codigo: inversionRegistrada.codigo,
        clienteId: inversionRegistrada.ideclien,
        nombreCliente: inversionRegistrada.nomclien,
        
        // Fechas
        fechaInicio: inversionRegistrada.finici,
        plazoEnDias: inversionRegistrada.plazod,
        fechaVencimiento: inversionRegistrada.fvence,
        
        // Montos
        capital: parseFloat(inversionRegistrada.capital) || 0,
        interes: parseFloat(inversionRegistrada.interes) || 0,
        retencion: parseFloat(inversionRegistrada.retencion) || 0,
        montoRecibir: parseFloat(inversionRegistrada.recibe) || 0,
        
        // Metadatos
        fechaRegistro: new Date().toISOString(),
        
        // Datos originales
        _datosOriginales: inversionRegistrada
      };

      return {
        success: true,
        data: {
          inversion: processedInvestment,
          mensaje: result.data.msg,
          respuestaCompleta: result.data
        },
        message: 'Inversión registrada exitosamente'
      };
    } else {
      console.error('❌ [INVESTMENT-REGISTER] Error en respuesta del servidor:', result.data);
      
      let errorMessage = result.data.msg || 'Error al registrar la inversión';
      let errorCode = 'INVESTMENT_REGISTRATION_ERROR';

      // Manejo de errores específicos según estado
      switch (result.data.estado) {
        case '001':
          errorMessage = 'Fondos insuficientes en la cuenta seleccionada';
          errorCode = 'INSUFFICIENT_FUNDS';
          break;
        case '002':
          errorMessage = 'La cuenta origen no está disponible para inversiones';
          errorCode = 'INVALID_ACCOUNT';
          break;
        case '003':
          errorMessage = 'Los parámetros de inversión no son válidos';
          errorCode = 'INVALID_PARAMETERS';
          break;
        case '004':
          errorMessage = 'El servicio de inversión no está disponible temporalmente';
          errorCode = 'SERVICE_UNAVAILABLE';
          break;
      }

      return {
        success: false,
        error: {
          message: errorMessage,
          code: errorCode,
          serverState: result.data.estado,
          originalMessage: result.data.msg
        }
      };
    }
  }

  return result;
}

  async getInvestments(cedula) {
    console.log('📈 [INVESTMENTS] Obteniendo inversiones para cédula:', cedula);

    // Validación básica
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    const investmentsData = {
      prccode: this.processCodes.SAVINGS_ACCOUNTS, // Usar el mismo código 2201
      idecl: cedula.trim(),
      prdfi: "3" // Filtro de producto para inversiones
    };

    console.log('📤 [INVESTMENTS] Solicitando inversiones:', investmentsData);

    const result = await this.makeRequest(investmentsData);

    if (result.success) {
      const investmentsResult = this.interpretServerResponse(result.data, 'investments');

      if (investmentsResult.success && result.data.cliente?.inversiones && Array.isArray(result.data.cliente.inversiones)) {
        console.log('✅ [INVESTMENTS] Inversiones obtenidas exitosamente:', result.data.cliente.inversiones.length, 'inversiones');

        // Procesar y enriquecer los datos de inversiones
        const processedInvestments = result.data.cliente.inversiones.map((inversion, index) => {
          // 🔓 Desencriptar campos monetarios si vienen encriptados
          let salcntDecrypted = inversion.salcnt;
          let saldisDecrypted = inversion.saldis;
          let codinvDecrypted = inversion.codinv;

          // Detectar y desencriptar salcnt (saldo contable)
          if (typeof inversion.salcnt === 'string' && inversion.salcnt.length > 10 && inversion.salcnt.includes('=')) {
            try {
              salcntDecrypted = decrypt(inversion.salcnt);
              if (index === 0) {
                console.log(`🔓 [INVESTMENTS] Desencriptando salcnt: ${inversion.salcnt.substring(0, 20)}... -> ${salcntDecrypted}`);
              }
            } catch (error) {
              console.error('❌ [INVESTMENTS] Error al desencriptar salcnt:', error);
            }
          }

          // Detectar y desencriptar saldis (saldo disponible)
          if (typeof inversion.saldis === 'string' && inversion.saldis.length > 10 && inversion.saldis.includes('=')) {
            try {
              saldisDecrypted = decrypt(inversion.saldis);
              if (index === 0) {
                console.log(`🔓 [INVESTMENTS] Desencriptando saldis: ${inversion.saldis.substring(0, 20)}... -> ${saldisDecrypted}`);
              }
            } catch (error) {
              console.error('❌ [INVESTMENTS] Error al desencriptar saldis:', error);
            }
          }

          // Detectar y desencriptar codinv (código de inversión)
          if (typeof inversion.codinv === 'string' && inversion.codinv.length > 10 && inversion.codinv.includes('=')) {
            try {
              codinvDecrypted = decrypt(inversion.codinv);
              if (index === 0) {
                console.log(`🔓 [INVESTMENTS] Desencriptando codinv: ${inversion.codinv.substring(0, 20)}... -> ${codinvDecrypted}`);
              }
            } catch (error) {
              console.error('❌ [INVESTMENTS] Error al desencriptar codinv:', error);
            }
          }

          const amount = parseFloat(salcntDecrypted) || 0;
          const availableBalance = parseFloat(saldisDecrypted) || 0;

          if (index === 0) {
            console.log('💰 [INVESTMENTS] Montos procesados:', {
              salcntOriginal: inversion.salcnt,
              salcntDecrypted,
              saldisOriginal: inversion.saldis,
              saldisDecrypted,
              amount,
              availableBalance
            });
          }

          return {
            // Datos originales de la API
            id: inversion.codinv,
            code: inversion.codinv,
            maturityDate: inversion.fecvnc,
            status: inversion.desein,
            type: inversion.destin,
            amount,
            availableBalance,

            // USAR TASA REAL DE LA API (no estimada)
            interestRate: parseFloat(inversion.tasinv) || 8.5, // Campo real: tasinv

            // Campos calculados (usar versión desencriptada)
            currency: 'USD',
            investmentNumber: this.formatInvestmentNumber(codinvDecrypted),
            startDate: inversion.fecini, // Usar fecha real de inicio
            term: this.calculateTermFromDates(inversion.fecini, inversion.fecvnc), // Calcular término real
            paymentType: this.getPaymentType(inversion.destin),

            // Datos originales completos para referencia
            _original: inversion,
            _codinvDecrypted: codinvDecrypted // Para debug
          };
        });

        return {
          success: true,
          data: {
            cliente: result.data.cliente,
            inversiones: processedInvestments,
            totalInversiones: processedInvestments.length,
            montoTotalInvertido: processedInvestments.reduce((sum, inv) => sum + inv.amount, 0)
          },
          message: `Se encontraron ${processedInvestments.length} inversiones`
        };
      } else {
        return {
          success: false,
          error: {
            message: investmentsResult.error?.message || 'No se encontraron inversiones para este cliente',
            code: 'NO_INVESTMENTS_FOUND'
          }
        };
      }
    }

    return result;
  }
  /**
 * Calcular inversión real usando API 2373 (método específico para el hook)
 */
async calculateRealInvestmentSimulation(tipoDeInt, valorInversion, plazoInversion, tasaInversion) {
  const cedula = this.getUserCedula();
  if (!cedula) {
    return {
      success: false,
      error: { message: 'No hay sesión activa', code: 'NO_USER_SESSION' }
    };
  }

  const calculationData = {
    prccode: '2373',
    idecl: cedula.trim(),
    codtpgin: tipoDeInt.toString(),
    valinver: parseFloat(valorInversion).toFixed(2),
    plzinver: plazoInversion.toString(),
    tasinver: parseFloat(tasaInversion).toFixed(2)
  };

  console.log('🧮 [CALC-2373] Datos para cálculo real:', {
    ...calculationData,
    idecl: '***' + calculationData.idecl.slice(-4)
  });

  const result = await this.makeRequest(calculationData);

  if (result.success) {
    console.log('📊 [CALC-2373] Respuesta recibida:', result.data);
    
    // Interpretar respuesta del servidor
    if (result.data.estado === '000' && result.data.calculo && result.data.calculo.length > 0) {
      return {
        success: true,
        data: {
          calculo: result.data.calculo,
          estado: result.data.estado,
          msg: result.data.msg
        }
      };
    } else {
      return {
        success: false,
        error: {
          message: result.data.msg || 'Error en el cálculo de inversión',
          code: 'CALCULATION_ERROR',
          serverState: result.data.estado
        }
      };
    }
  }

  return result;
}

  calculateTermFromDates(fechaInicio, fechaVencimiento) {
    if (!fechaInicio || !fechaVencimiento) return '12 meses';

    try {
      const inicio = new Date(fechaInicio);
      const vencimiento = new Date(fechaVencimiento);
      const diferenciaDias = Math.ceil((vencimiento - inicio) / (1000 * 60 * 60 * 24));

      if (diferenciaDias <= 0) return 'Vencida';
      if (diferenciaDias <= 90) return `${diferenciaDias} días`;
      if (diferenciaDias <= 365) return `${Math.round(diferenciaDias / 30)} meses`;

      const años = Math.floor(diferenciaDias / 365);
      const mesesRestantes = Math.round((diferenciaDias % 365) / 30);

      if (mesesRestantes === 0) return `${años} año${años > 1 ? 's' : ''}`;
      return `${años} año${años > 1 ? 's' : ''} ${mesesRestantes} mes${mesesRestantes > 1 ? 'es' : ''}`;
    } catch (error) {
      console.warn('Error calculando término real:', error);
      return '12 meses';
    }
  }
  async getCurrentInvestmentRate(cedula) {
    console.log('📊 [RATE] Obteniendo tasa actual del sistema');

    try {
      // Primero intentar obtener de una inversión existente
      const investments = await this.getCurrentUserInvestments();

      if (investments.success && investments.data.inversiones.length > 0) {
        const primeraInversion = investments.data.inversiones[0];
        console.log('✅ [RATE] Usando tasa de inversión existente:', primeraInversion.interestRate);

        return {
          success: true,
          data: {
            tasaAnual: parseFloat(primeraInversion.interestRate) || 8.5,
            fuente: 'inversion_existente',
            codigoInversion: primeraInversion.code
          }
        };
      }

      // Si no hay inversiones, usar endpoint 2213 con datos dummy para obtener tasa
      const dummyResult = await this.makeRequest({
        prccode: this.processCodes.INVESTMENT_DETAIL,
        idecl: cedula,
        codinv: "000000000000", // Código dummy
        fecdes: "01/01/2024",
        fechas: "12/31/2024"
      });

      // Extraer tasa del mensaje de error o respuesta
      if (dummyResult.success && dummyResult.data?.msg?.includes('%')) {
        const tasaMatch = dummyResult.data.msg.match(/(\d+\.?\d*)%/);
        if (tasaMatch) {
          return {
            success: true,
            data: {
              tasaAnual: parseFloat(tasaMatch[1]),
              fuente: 'sistema_actual'
            }
          };
        }
      }

      // Fallback con tasa por defecto
      return {
        success: true,
        data: {
          tasaAnual: 8.5,
          fuente: 'por_defecto'
        }
      };

    } catch (error) {
      console.error('❌ [RATE] Error obteniendo tasa:', error);
      return {
        success: true,
        data: {
          tasaAnual: 8.5,
          fuente: 'error_fallback'
        }
      };
    }
  }

  /**
   * Calcular simulación de inversión con datos reales
   */
  async calculateInvestmentSimulation(amount, selectedDays, cedula = null) {
    console.log('🧮 [CALC] Calculando simulación con datos reales');

    const userCedula = cedula || this.getUserCedula();

    // Obtener tasa real del sistema
    const rateResult = await this.getCurrentInvestmentRate(userCedula);
    const tasaAnual = rateResult.data.tasaAnual;

    console.log('📊 [CALC] Tasa obtenida:', tasaAnual, 'Fuente:', rateResult.data.fuente);

    // Usar la misma fórmula que muestra tu imagen 3: interés simple
    const capital = parseFloat(amount);
    const dias = parseInt(selectedDays);
    const interes = (capital * tasaAnual * dias) / (100 * 365);
    const total = capital + interes;

    // Calcular tasas efectivas
    const tasaEfectivaPeriodo = (interes / capital) * 100;
    const tasaEfectivaAnual = Math.pow(total / capital, 365 / dias) - 1;
    const rendimientoMensual = interes / (dias / 30);

    return {
      success: true,
      data: {
        // ✅ Campos con nombres esperados por la vista
        principal: capital,
        interest: interes,
        total: total,
        days: dias,          // ✅ Agregado para compatibilidad
        dias: dias,
        rate: tasaAnual,     // ✅ Agregado para compatibilidad  
        tasaAnual: tasaAnual,
        effectiveRate: tasaEfectivaPeriodo,
        effectiveAnnualRate: tasaEfectivaAnual * 100,
        monthlyReturn: rendimientoMensual,
        // Campos adicionales para compatibilidad
        capital: capital,
        interes: interes,
        tasaEfectivaPeriodo: tasaEfectivaPeriodo,
        tasaEfectivaAnual: tasaEfectivaAnual * 100,
        rendimientoMensual: rendimientoMensual,
        fuente: rateResult.data.fuente
      }
    };
  }
  // Nuevo método para obtener tipos de inversión disponibles
  async getInvestmentTypes(cedula) {
    console.log('📋 [INVESTMENT-TYPES] Obteniendo tipos de inversión para cédula:', cedula);

    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    const investmentTypesData = {
      prccode: this.processCodes.INVESTMENT_TYPES, // ✅ USAR LA CONSTANTE
      idecl: cedula.trim()
    };

    const result = await this.makeRequest(investmentTypesData);

    if (result.success) {
      // Procesar los tipos de inversión del campo "producto_tipos"
      const tipos = result.data.producto_tipos || [];

      return {
        success: true,
        data: {
          tiposInversion: tipos,
          totalTipos: tipos.length
        },
        message: `Se encontraron ${tipos.length} tipos de inversión disponibles`
      };
    }

    return result;
  }

  // Método de conveniencia
  async getCurrentUserInvestmentTypes() {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: {
          message: 'No hay sesión activa',
          code: 'NO_USER_SESSION'
        }
      };
    }
    return await this.getInvestmentTypes(cedula);
  }

  /**
   * Obtener plazos de inversión disponibles
   */
  async getInvestmentTerms(cedula) {
    console.log('📅 [INVESTMENT-TERMS] Obteniendo plazos de inversión para cédula:', cedula);

    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    const investmentTermsData = {
      prccode: this.processCodes.INVESTMENT_TYPES, // ✅ USAR EL MISMO CÓDIGO 2371
      idecl: cedula.trim()
    };

    console.log('📤 [INVESTMENT-TERMS] Solicitando plazos:', investmentTermsData);

    const result = await this.makeRequest(investmentTermsData);

    if (result.success) {
      // Procesar los plazos del campo "plazos"
      const plazos = result.data.plazos || [];

      console.log('✅ [INVESTMENT-TERMS] Plazos recibidos:', plazos);

      return {
        success: true,
        data: {
          plazos: plazos,
          totalPlazos: plazos.length
        },
        message: `Se encontraron ${plazos.length} plazos de inversión disponibles`
      };
    }

    return result;
  }

  /**
   * Método de conveniencia para obtener plazos del usuario actual
   */
  async getCurrentUserInvestmentTerms() {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: {
          message: 'No hay sesión activa',
          code: 'NO_USER_SESSION'
        }
      };
    }
    return await this.getInvestmentTerms(cedula);
  }

  /**
   * Método de conveniencia para obtener inversiones del usuario actual
   */
  async getCurrentUserInvestments() {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: {
          message: 'No hay sesión activa o no se pudo obtener la cédula del usuario',
          code: 'NO_USER_SESSION'
        }
      };
    }

    return await this.getInvestments(cedula);
  }

  // 1. Obtener parámetros de inversión (2369)
async getInvestmentParameters(cedula) {
  const parametersData = {
    prccode: '2369',
    idecl: cedula.trim()
  };
  return await this.makeRequest(parametersData);
}

// 2. Obtener tipos de pago de interés (2372)
async getInterestPaymentTypes(valorInversion, plazoInversion) {
  const paymentTypesData = {
    prccode: '2372',
    valinver: parseFloat(valorInversion).toFixed(2),
    plzinver: plazoInversion.toString()
  };
  return await this.makeRequest(paymentTypesData);
}

// 3. Calcular inversión real (2373)
async calculateInvestmentSimulation(cedula, tipoDeInt, valorInversion, plazoInversion, tasaInversion) {
  const calculationData = {
    prccode: '2373',
    idecl: cedula.trim(),
    codtpgin: tipoDeInt.toString(),
    valinver: parseFloat(valorInversion).toFixed(2),
    plzinver: plazoInversion.toString(),
    tasinver: parseFloat(tasaInversion).toFixed(2)
  };
  return await this.makeRequest(calculationData);
}

// Métodos de conveniencia
async getCurrentUserInvestmentParameters() {
  const cedula = this.getUserCedula();
  if (!cedula) return { success: false, error: { code: 'NO_USER_SESSION' } };
  return await this.getInvestmentParameters(cedula);
}

  /**
   * Métodos auxiliares para procesar datos de inversiones
   */

  // Formatear número de inversión para mostrar parcialmente
  formatInvestmentNumber(codinv) {
    if (!codinv) return '****';
    const str = codinv.toString();
    if (str.length >= 4) {
      return `**** **** **** ${str.slice(-4)}`;
    }
    return str;
  }

  // Estimar tasa de interés basada en el tipo de inversión
  estimateInterestRate(destin) {
    if (!destin) return 8.0;

    const tipo = destin.toLowerCase();

    if (tipo.includes('plazo fijo')) return 8.5;
    if (tipo.includes('deposito')) return 8.0;
    if (tipo.includes('fondo')) return 12.0;
    if (tipo.includes('mutuo')) return 15.0;
    if (tipo.includes('bono')) return 11.0;
    if (tipo.includes('pension')) return 13.0;

    return 9.0; // Tasa por defecto
  }

  // Estimar fecha de inicio basada en vencimiento (asumiendo 12 meses)
  estimateStartDate(fecvnc) {
    if (!fecvnc) return null;

    try {
      const vencimiento = new Date(fecvnc);
      const inicio = new Date(vencimiento);
      inicio.setFullYear(inicio.getFullYear() - 1);
      return inicio.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Error calculando fecha de inicio:', error);
      return null;
    }
  }

  // Calcular término de la inversión
  calculateTerm(fecvnc) {
    if (!fecvnc) return '12 meses';

    try {
      const vencimiento = new Date(fecvnc);
      const hoy = new Date();
      const diferenciaMeses = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24 * 30));

      if (diferenciaMeses <= 0) return 'Vencida';
      if (diferenciaMeses <= 12) return `${diferenciaMeses} meses`;

      const años = Math.floor(diferenciaMeses / 12);
      const mesesRestantes = diferenciaMeses % 12;

      if (mesesRestantes === 0) return `${años} año${años > 1 ? 's' : ''}`;
      return `${años} año${años > 1 ? 's' : ''} ${mesesRestantes} mes${mesesRestantes > 1 ? 'es' : ''}`;
    } catch (error) {
      console.warn('Error calculando término:', error);
      return '12 meses';
    }
  }

  // Determinar tipo de pago basado en la descripción
  getPaymentType(destin) {
    if (!destin) return 'PAGO AL VENCIMIENTO';

    const tipo = destin.toLowerCase();

    if (tipo.includes('plazo fijo')) return 'PAGO AL VENCIMIENTO';
    if (tipo.includes('deposito')) return 'PAGO ANTICIPADO VT. NOMINAL';
    if (tipo.includes('fondo')) return 'CAPITALIZACIÓN';
    if (tipo.includes('mutuo')) return 'REINVERSIÓN AUTOMÁTICA';
    if (tipo.includes('bono')) return 'PAGO SEMESTRAL';
    if (tipo.includes('pension')) return 'REINVERSIÓN AUTOMÁTICA';

    return 'PAGO AL VENCIMIENTO';
  }

  /**
   * Obtener detalle específico de una inversión usando el servicio real
   * Código de proceso: 2213
   */
  async getInvestmentDetail(cedula, codigoInversion, fechaDesde, fechaHasta) {
    console.log('📊 [INVESTMENT-DETAIL] Obteniendo detalle de inversión');
    console.log('👤 [INVESTMENT-DETAIL] Cédula:', cedula);
    console.log('💰 [INVESTMENT-DETAIL] Código inversión:', codigoInversion);
    console.log('📅 [INVESTMENT-DETAIL] Desde:', fechaDesde, 'Hasta:', fechaHasta);

    // Validaciones básicas
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    if (!codigoInversion || !codigoInversion.trim()) {
      return {
        success: false,
        error: {
          message: 'El código de inversión es requerido',
          code: 'INVESTMENT_CODE_REQUIRED'
        }
      };
    }

    // Validar formato de fechas (MM/DD/YYYY)
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!dateRegex.test(fechaDesde) || !dateRegex.test(fechaHasta)) {
      return {
        success: false,
        error: {
          message: 'Las fechas deben estar en formato MM/DD/YYYY',
          code: 'INVALID_DATE_FORMAT'
        }
      };
    }

    const detailData = {
      prccode: this.processCodes.INVESTMENT_DETAIL, // '2213'
      idecl: cedula.trim(),
      codinv: codigoInversion.trim(),
      fecdes: fechaDesde,
      fechas: fechaHasta
    };

    console.log('📤 [INVESTMENT-DETAIL] Solicitando detalle:', {
      ...detailData,
      idecl: '***' + detailData.idecl.slice(-4)
    });

    const result = await this.makeRequest(detailData);

    if (result.success) {
      const detailResult = this.interpretServerResponse(result.data, 'investment_detail');

      if (detailResult.success && result.data.cliente) {
        const cliente = result.data.cliente;
        
        // ✅ CRÍTICO: Backend devuelve inversion como ARRAY, no como objeto
        const inversionArray = cliente.inversion || [];
        const inversion = Array.isArray(inversionArray) ? inversionArray[0] : inversionArray;
        const movimientos = cliente.detalle || [];

        console.log('✅ [INVESTMENT-DETAIL] Detalle obtenido exitosamente');
        console.log('🏢 [INVESTMENT-DETAIL] Empresa:', cliente.nomemp);
        console.log('🏦 [INVESTMENT-DETAIL] Oficina:', cliente.nomofi);
        console.log('👤 [INVESTMENT-DETAIL] Cliente:', cliente.nomcli, cliente.apecli);
        console.log('💰 [INVESTMENT-DETAIL] Inversión:', inversion?.destin);
        console.log('📊 [INVESTMENT-DETAIL] Movimientos:', movimientos.length);
        console.log('🔍 [INVESTMENT-DETAIL] Objeto inversión COMPLETO:', JSON.stringify(inversion, null, 2));
        
        // 📅 LOG ESPECÍFICO PARA FECHAS
        console.log('📅 [INVESTMENT-DETAIL] ANÁLISIS DE FECHAS:');
        console.log('  - fecini RAW:', inversion?.fecini);
        console.log('  - fecini TIPO:', typeof inversion?.fecini);
        console.log('  - fecini LENGTH:', inversion?.fecini?.length);
        console.log('  - fecini CHAR CODES:', inversion?.fecini?.split('').map((c, i) => `[${i}]='${c}'(${c.charCodeAt(0)})`).join(' '));
        console.log('  - fecven RAW:', inversion?.fecven);
        console.log('  - fecven TIPO:', typeof inversion?.fecven);
        console.log('  - fecven LENGTH:', inversion?.fecven?.length);
        console.log('  - fecven CHAR CODES:', inversion?.fecven?.split('').map((c, i) => `[${i}]='${c}'(${c.charCodeAt(0)})`).join(' '));

        // 🔓 Desencriptar campos monetarios de inversión si vienen encriptados
        let salcntDecrypted = inversion?.salcnt;
        let saldisDecrypted = inversion?.saldis;
        let codinvDecrypted = inversion?.codinv;
        let tasinvDecrypted = inversion?.tasinv;

        console.log('🔍 [INVESTMENT-DETAIL] Valores ANTES de desencriptar:', {
          salcnt: inversion?.salcnt,
          salcntType: typeof inversion?.salcnt,
          salcntLength: inversion?.salcnt?.length,
          saldis: inversion?.saldis,
          saldisType: typeof inversion?.saldis,
          saldisLength: inversion?.saldis?.length,
          codinv: inversion?.codinv,
          codinvType: typeof inversion?.codinv,
          tasinv: inversion?.tasinv,
          tasinvType: typeof inversion?.tasinv
        });
        
        // 💰 LOG ESPECÍFICO PARA VALORES NUMÉRICOS (DETECTAR "O" vs "0")
        console.log('💰 [INVESTMENT-DETAIL] ANÁLISIS DE VALORES NUMÉRICOS:');
        console.log('  - salcnt CHAR CODES:', inversion?.salcnt?.split('').map((c, i) => `[${i}]='${c}'(${c.charCodeAt(0)})`).join(' '));
        console.log('  - saldis CHAR CODES:', inversion?.saldis?.split('').map((c, i) => `[${i}]='${c}'(${c.charCodeAt(0)})`).join(' '));
        console.log('  - tasinv CHAR CODES:', inversion?.tasinv?.split('').map((c, i) => `[${i}]='${c}'(${c.charCodeAt(0)})`).join(' '));
        console.log('  - ¿Es Base64?:', {
          salcnt: inversion?.salcnt?.includes('='),
          saldis: inversion?.saldis?.includes('='),
          tasinv: inversion?.tasinv?.includes('=')
        });

        // Detectar y desencriptar salcnt (saldo contable)
        if (typeof inversion?.salcnt === 'string' && inversion.salcnt.length > 10 && inversion.salcnt.includes('=')) {
          try {
            salcntDecrypted = decrypt(inversion.salcnt);
            console.log(`🔓 [INVESTMENT-DETAIL] Desencriptando salcnt: ${inversion.salcnt.substring(0, 20)}... -> ${salcntDecrypted}`);
          } catch (error) {
            console.error('❌ [INVESTMENT-DETAIL] Error al desencriptar salcnt:', error);
          }
        }

        // Detectar y desencriptar saldis (saldo disponible)
        if (typeof inversion?.saldis === 'string' && inversion.saldis.length > 10 && inversion.saldis.includes('=')) {
          try {
            saldisDecrypted = decrypt(inversion.saldis);
            console.log(`🔓 [INVESTMENT-DETAIL] Desencriptando saldis: ${inversion.saldis.substring(0, 20)}... -> ${saldisDecrypted}`);
          } catch (error) {
            console.error('❌ [INVESTMENT-DETAIL] Error al desencriptar saldis:', error);
          }
        }

        // Detectar y desencriptar codinv (código inversión)
        if (typeof inversion?.codinv === 'string' && inversion.codinv.length > 10 && inversion.codinv.includes('=')) {
          try {
            codinvDecrypted = decrypt(inversion.codinv);
            console.log(`🔓 [INVESTMENT-DETAIL] Desencriptando codinv: ${inversion.codinv.substring(0, 20)}... -> ${codinvDecrypted}`);
          } catch (error) {
            console.error('❌ [INVESTMENT-DETAIL] Error al desencriptar codinv:', error);
          }
        }

        // Detectar y desencriptar tasinv (tasa de inversión)
        if (typeof inversion?.tasinv === 'string' && inversion.tasinv.length > 10 && inversion.tasinv.includes('=')) {
          try {
            tasinvDecrypted = decrypt(inversion.tasinv);
            console.log(`🔓 [INVESTMENT-DETAIL] Desencriptando tasinv: ${inversion.tasinv.substring(0, 20)}... -> ${tasinvDecrypted}`);
          } catch (error) {
            console.error('❌ [INVESTMENT-DETAIL] Error al desencriptar tasinv:', error);
          }
        }

        console.log('💰 [INVESTMENT-DETAIL] Valores desencriptados:', {
          salcntOriginal: inversion?.salcnt,
          salcntDecrypted,
          saldisOriginal: inversion?.saldis,
          saldisDecrypted,
          codinvOriginal: inversion?.codinv,
          codinvDecrypted,
          tasinvOriginal: inversion?.tasinv,
          tasinvDecrypted
        });

        // Procesar los movimientos del detalle según la respuesta real del API
        const processedMovements = movimientos.map((mov, index) => {
          // 🔓 Desencriptar valores monetarios de movimientos
          let valcreDecrypted = mov.valcre;
          let valdebDecrypted = mov.valdeb;
          let saldosDecrypted = mov.saldos;

          // Desencriptar valcre (valor crédito)
          if (typeof mov.valcre === 'string' && mov.valcre.length > 10 && mov.valcre.includes('=')) {
            try {
              valcreDecrypted = decrypt(mov.valcre);
            } catch (error) {
              console.error('❌ [MOVEMENT] Error al desencriptar valcre:', error);
            }
          }

          // Desencriptar valdeb (valor débito)
          if (typeof mov.valdeb === 'string' && mov.valdeb.length > 10 && mov.valdeb.includes('=')) {
            try {
              valdebDecrypted = decrypt(mov.valdeb);
            } catch (error) {
              console.error('❌ [MOVEMENT] Error al desencriptar valdeb:', error);
            }
          }

          // Desencriptar saldos
          if (typeof mov.saldos === 'string' && mov.saldos.length > 10 && mov.saldos.includes('=')) {
            try {
              saldosDecrypted = decrypt(mov.saldos);
            } catch (error) {
              console.error('❌ [MOVEMENT] Error al desencriptar saldos:', error);
            }
          }

          return {
            id: index + 1,
            fecha: mov.fectrn,
            fechaFormateada: mov.fecstr || this.formatDateForDisplay(mov.fectrn),
            descripcion: mov.dettrn || 'Movimiento de inversión',
            numeroDocumento: mov.docnum,
            codigoCaja: mov.codcaj,
            tipoTransaccion: mov.tiptrn || 'N/A',
            valorCredito: parseFloat(valcreDecrypted) || 0,
            valorDebito: parseFloat(valdebDecrypted) || 0,
            saldo: parseFloat(saldosDecrypted) || 0,
            monto: parseFloat(valcreDecrypted) - parseFloat(valdebDecrypted),
            tipo: parseFloat(valcreDecrypted) > 0 ? 'credito' : 'debito',
            esGanancia: parseFloat(valcreDecrypted) > 0,
            // Datos originales para referencia
            _original: mov
          };
        });

        // Calcular estadísticas del periodo
        const estadisticas = {
          totalCreditos: processedMovements.reduce((sum, m) => sum + m.valorCredito, 0),
          totalDebitos: processedMovements.reduce((sum, m) => sum + m.valorDebito, 0),
          saldoActual: processedMovements.length > 0 ? processedMovements[0].saldo : 0,
          numeroMovimientos: processedMovements.length,
          gananciasGeneradas: processedMovements
            .filter(m => m.esGanancia)
            .reduce((sum, m) => sum + m.valorCredito, 0)
        };

        // Formatear información de la inversión (usando valores desencriptados)
        const inversionInfo = {
          codigo: codinvDecrypted,
          estado: inversion.desein,
          tipoInversion: inversion.destin,
          saldoContable: parseFloat(salcntDecrypted) || 0,
          saldoDisponible: parseFloat(saldisDecrypted) || 0,
          tasaInteres: parseFloat(tasinvDecrypted) || 0,
          fechaInicio: inversion.fecini,
          diasPlazo: parseInt(inversion.diaplz) || 0,
          fechaVencimiento: inversion.fecven,
          // Campos adicionales calculados
          montoInicial: parseFloat(salcntDecrypted) || 0,
          rendimientoEsperado: this.calcularRendimientoEsperado(
            parseFloat(salcntDecrypted) || 0,
            parseFloat(tasinvDecrypted) || 0,
            parseInt(inversion.diaplz) || 0
          )
        };

        // Información del cliente
        const clienteInfo = {
          nombreEmpresa: cliente.nomemp,
          nombreOficina: cliente.nomofi,
          codigoCliente: cliente.codcli,
          identificacion: cliente.idecli,
          apellidos: cliente.apecli,
          nombres: cliente.nomcli,
          nombreCompleto: `${cliente.nomcli} ${cliente.apecli}`.trim()
        };

        return {
          success: true,
          data: {
            cliente: clienteInfo,
            inversion: inversionInfo,
            movimientos: processedMovements.reverse(), // Más recientes primero
            estadisticas: estadisticas,
            periodo: {
              fechaDesde: fechaDesde,
              fechaHasta: fechaHasta,
              fechaDesdeFormateada: this.formatDateForDisplay(fechaDesde),
              fechaHastaFormateada: this.formatDateForDisplay(fechaHasta)
            },
            // Datos originales completos para referencia
            _datosOriginales: result.data
          },
          message: `Detalle de inversión ${inversion.codinv} obtenido exitosamente. ${processedMovements.length} movimientos encontrados.`
        };
      } else {
        return {
          success: false,
          error: {
            message: detailResult.error?.message || 'No se pudo obtener el detalle de la inversión',
            code: 'INVESTMENT_DETAIL_ERROR',
            serverResponse: result.data
          }
        };
      }
    }

    return result;
  }

  /**
   * Calcular rendimiento esperado de una inversión
   */
  calcularRendimientoEsperado(monto, tasa, diasPlazo) {
    if (!monto || !tasa || !diasPlazo) return 0;

    // Calcular interés simple: (monto * tasa * días) / (100 * 365)
    const interesAnual = (monto * tasa) / 100;
    const interesPorDia = interesAnual / 365;
    const interesTotal = interesPorDia * diasPlazo;

    return parseFloat(interesTotal.toFixed(2));
  }

  /**
   * Formatear fecha para mostrar al usuario (MM/DD/YYYY -> DD/MM/YYYY)
   */
  formatDateForDisplay(dateString) {
    if (!dateString || !dateString.includes('/')) return dateString;

    const parts = dateString.split('/');
    if (parts.length === 3) {
      // Si viene en formato MM/DD/YYYY, convertir a DD/MM/YYYY
      return `${parts[1]}/${parts[0]}/${parts[2]}`;
    }

    return dateString;
  }
  async getCurrentUserInvestmentDetail(codigoInversion, fechaDesde = null, fechaHasta = null) {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: { message: 'No hay sesión activa', code: 'NO_USER_SESSION' }
      };
    }

    // Si no se proporcionan fechas, usar rango por defecto
    if (!fechaDesde || !fechaHasta) {
      const defaultRange = this.getDefaultDateRange();
      fechaDesde = fechaDesde || defaultRange.fechaDesde;
      fechaHasta = fechaHasta || defaultRange.fechaHasta;

      console.log('📅 [DETAIL] Usando fechas por defecto:', defaultRange);
    }

    return await this.getInvestmentDetail(cedula, codigoInversion, fechaDesde, fechaHasta);
  }

  /**
* Obtener cuentas disponibles para inversión (débito)
* Código de proceso: 2374
*/
async getAccountsForInvestment(cedula, valorInversion) {
 console.log('🏦 [INVESTMENT-ACCOUNTS] Obteniendo cuentas para inversión');
 console.log('👤 [INVESTMENT-ACCOUNTS] Cédula:', '***' + cedula.slice(-4));
 console.log('💰 [INVESTMENT-ACCOUNTS] Valor inversión:', valorInversion);

 // Validaciones básicas
 if (!cedula || !cedula.trim()) {
   return {
     success: false,
     error: {
       message: 'La cédula es requerida',
       code: 'CEDULA_REQUIRED'
     }
   };
 }

 if (!valorInversion || parseFloat(valorInversion) <= 0) {
   return {
     success: false,
     error: {
       message: 'El valor de inversión debe ser mayor a cero',
       code: 'INVALID_INVESTMENT_AMOUNT'
     }
   };
 }

 const accountsData = {
   prccode: this.processCodes.INVESTMENT_ACCOUNTS,
   idecl: cedula.trim(),
   valinver: parseFloat(valorInversion).toFixed(2)
 };

 console.log('📤 [INVESTMENT-ACCOUNTS] Solicitando cuentas:', {
   ...accountsData,
   idecl: '***' + accountsData.idecl.slice(-4)
 });

 const result = await this.makeRequest(accountsData);

 if (result.success) {
   const accountsResult = this.interpretServerResponse(result.data, 'investment_accounts');

   if (accountsResult.success && result.data.listado && Array.isArray(result.data.listado)) {
     console.log('✅ [INVESTMENT-ACCOUNTS] Cuentas obtenidas exitosamente:', result.data.listado.length, 'cuentas');

     // Procesar y enriquecer los datos de las cuentas
     const processedAccounts = result.data.listado.map((cuenta, index) => {
       // 🔓 Desencriptar codcta para mostrar en UI (pero mantener versión encriptada para APIs)
       let codctaDecrypted = cuenta.codcta;
       try {
         codctaDecrypted = decrypt(cuenta.codcta);
         if (index === 0) {
           console.log(`🔓 [INVESTMENT-ACCOUNTS] Desencriptando codcta: ${cuenta.codcta.substring(0, 20)}... -> ${codctaDecrypted}`);
         }
       } catch (error) {
         console.error('❌ [INVESTMENT-ACCOUNTS] Error al desencriptar codcta:', error);
         // Si falla la desencriptación, usar el valor original
       }

       return {
         // Datos originales de la API (ENCRIPTADO - para enviar a otras APIs)
         id: cuenta.codcta,
         codigo: cuenta.codcta, // ⚠️ MANTENER ENCRIPTADO para proceso 2375
         descripcion: cuenta.descri,
         estado: cuenta.desect,

         // Campos para mostrar en la UI (DESENCRIPTADO)
         numeroFormateado: this.formatAccountNumberForDisplay(codctaDecrypted),
         tipoProducto: cuenta.descri || 'Cuenta de Ahorros',
         isActive: cuenta.desect === 'ACTIVA',

         // Datos originales para referencia
         _original: cuenta,
         _codctaDecrypted: codctaDecrypted // Para debug
       };
     });

     // Filtrar solo cuentas activas
     const activeCuentas = processedAccounts.filter(cuenta => cuenta.isActive);

     return {
       success: true,
       data: {
         cuentas: activeCuentas,
         todasLasCuentas: processedAccounts,
         totalCuentas: activeCuentas.length,
         valorInversion: parseFloat(valorInversion)
       },
       message: `Se encontraron ${activeCuentas.length} cuentas disponibles para inversión`
     };
   } else {
     return {
       success: false,
       error: {
         message: accountsResult.error?.message || 'No se encontraron cuentas disponibles para inversión',
         code: 'NO_INVESTMENT_ACCOUNTS'
       }
     };
   }
 }

 return result;
}

/**
* Método de conveniencia para obtener cuentas de inversión del usuario actual
*/
async getCurrentUserAccountsForInvestment(valorInversion) {
 const cedula = this.getUserCedula();
 if (!cedula) {
   return {
     success: false,
     error: {
       message: 'No hay sesión activa o no se pudo obtener la cédula del usuario',
       code: 'NO_USER_SESSION'
     }
   };
 }

 return await this.getAccountsForInvestment(cedula, valorInversion);
}

/**
* Formatear número de cuenta para mostrar en UI
*/
formatAccountNumberForDisplay(accountNumber) {
 if (!accountNumber) return '';

 const str = accountNumber.toString();
 if (str.length >= 4) {
   // Mostrar los primeros 4 y últimos 4 dígitos
   const start = str.substring(0, 4);
   const end = str.slice(-4);
   const middle = '*'.repeat(Math.max(0, str.length - 8));
   return `${start}${middle}${end}`;
 }
 return str;
}

  // Generar movimientos simulados para el detalle
  generateSimulatedMovements(codinv) {
    const today = new Date();
    const movements = [];

    // Movimiento inicial de inversión
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 12);

    movements.push({
      id: 1,
      date: startDate.toISOString().split('T')[0],
      description: 'Inversión inicial',
      reference: `INV-${codinv.slice(-6)}`,
      amount: 3200.00,
      type: 'investment',
      balance: 3200.00
    });

    // Generar rendimientos mensuales
    for (let i = 1; i <= 12; i++) {
      const movementDate = new Date(startDate);
      movementDate.setMonth(movementDate.getMonth() + i);

      if (movementDate <= today) {
        const earnings = 26.67; // Rendimiento mensual simulado
        const previousBalance = movements[movements.length - 1].balance;

        movements.push({
          id: i + 1,
          date: movementDate.toISOString().split('T')[0],
          description: 'Rendimiento mensual',
          reference: `RND-${movementDate.getFullYear()}-${String(movementDate.getMonth() + 1).padStart(2, '0')}`,
          amount: earnings,
          type: 'earning',
          balance: previousBalance + earnings
        });
      }
    }

    return movements.reverse(); // Mostrar más recientes primero
  }

  /**
   * Helper: Desencriptar número de cuenta si viene encriptado
   */
  decryptAccountNumber(accountNumber) {
    if (!accountNumber) return '';
    
    // Si la cuenta tiene el patrón de encriptación (contiene = o es muy larga)
    if (accountNumber.includes('=') || accountNumber.length > 20) {
      try {
        const decrypted = decrypt(accountNumber);
        console.log(`🔓 [DECRYPT-ACCOUNT] ${accountNumber} → ${decrypted}`);
        return decrypted;
      } catch (error) {
        console.error(`❌ [DECRYPT-ACCOUNT] Error desencriptando: ${accountNumber}`, error);
        return accountNumber; // Devolver original si falla
      }
    }
    return accountNumber; // Ya está en texto plano
  }

  /**
   * Desencripta una cédula/RUC si está encriptada
   * @param {string} cedula - Cédula potencialmente encriptada
   * @returns {string} Cédula en texto plano
   */
  decryptCedula(cedula) {
    if (!cedula) return '';
    
    // Si la cédula tiene el patrón de encriptación (contiene = o es muy larga)
    // Las cédulas normales son de 10 dígitos, si tiene más de 15 caracteres probablemente esté encriptada
    if (cedula.includes('=') || cedula.length > 15) {
      try {
        const decrypted = decrypt(cedula);
        console.log(`🔓 [DECRYPT-CEDULA] ${cedula.substring(0, 10)}... → ${decrypted}`);
        return decrypted;
      } catch (error) {
        console.error(`❌ [DECRYPT-CEDULA] Error desencriptando cédula`, error);
        return cedula; // Devolver original si falla
      }
    }
    return cedula; // Ya está en texto plano
  }

  async getBeneficiaries(cedula) {
    console.log('👥 [BENEFICIARIES] Obteniendo beneficiarios para cédula:', cedula);

    // Validación básica
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    const beneficiariesData = {
      prccode: this.processCodes.BENEFICIARIES_LIST, // '2330'
      idecl: cedula.trim()
    };

    console.log('📤 [BENEFICIARIES] Solicitando beneficiarios:', {
      ...beneficiariesData,
      idecl: '***' + beneficiariesData.idecl.slice(-4)
    });

    const result = await this.makeRequest(beneficiariesData);

    if (result.success) {
      const beneficiariesResult = this.interpretServerResponse(result.data, 'beneficiaries_list');

      if (beneficiariesResult.success && result.data.beneficiario && Array.isArray(result.data.beneficiario)) {
        console.log('✅ [BENEFICIARIES] Beneficiarios obtenidos exitosamente:', result.data.beneficiario.length, 'beneficiarios');

        // Procesar y normalizar los datos de beneficiarios
        const processedBeneficiaries = result.data.beneficiario.map((beneficiario, index) => {
          // Generar avatar con las iniciales del nombre
          const nombres = beneficiario.nombnf?.split(' ') || ['?', '?'];
          const avatar = nombres.length >= 2
            ? (nombres[0][0] + nombres[1][0]).toUpperCase()
            : (nombres[0]?.substring(0, 2) || '??').toUpperCase();

          return {
            // ID único para React keys
            id: beneficiario.codcta || `beneficiario-${index}`,

            // Información personal
            name: beneficiario.nombnf || 'Nombre no disponible',
            cedula: this.decryptCedula(beneficiario.idebnf), // Desencriptar c�dula
            cedulaEncrypted: beneficiario.idebnf, // Preservar original encriptado
            email: beneficiario.bnfema,
            phone: beneficiario.bnfcel?.trim() || '',

            // Información bancaria
            bank: beneficiario.nomifi || 'Banco no especificado',
            bankCode: beneficiario.codifi,
            accountNumber: this.decryptAccountNumber(beneficiario.codcta), // Desencriptar para mostrar
            accountNumberEncrypted: beneficiario.codcta, // Preservar original para eliminación
            accountType: beneficiario.destcu || 'Cuenta de Ahorros',
            accountTypeCode: beneficiario.codtcu,

            // Información adicional
            documentType: beneficiario.codtid,

            // Para compatibilidad con la vista existente
            avatar: avatar,
            lastTransfer: null, // No viene en la API

            // Datos originales para referencia
            _original: beneficiario
          };
        });

        return {
          success: true,
          data: {
            beneficiarios: processedBeneficiaries,
            totalBeneficiarios: processedBeneficiaries.length,
            rawData: result.data
          },
          message: `Se encontraron ${processedBeneficiaries.length} beneficiarios`
        };
      } else {
        return {
          success: false,
          error: {
            message: beneficiariesResult.error?.message || 'No se encontraron beneficiarios para este cliente',
            code: 'NO_BENEFICIARIES_FOUND'
          }
        };
      }
    }

    return result;
  }

  /**
   * Método de conveniencia para obtener beneficiarios del usuario actual
   */
  async getCurrentUserBeneficiaries() {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: {
          message: 'No hay sesión activa o no se pudo obtener la cédula del usuario',
          code: 'NO_USER_SESSION'
        }
      };
    }

    return await this.getBeneficiaries(cedula);
  }

  /**
   * Buscar beneficiarios por término de búsqueda
   */
  searchBeneficiaries(beneficiaries, searchTerm) {
    if (!searchTerm || !searchTerm.trim()) {
      return beneficiaries;
    }

    const term = searchTerm.toLowerCase().trim();

    return beneficiaries.filter(beneficiario =>
      beneficiario.name.toLowerCase().includes(term) ||
      beneficiario.bank.toLowerCase().includes(term) ||
      beneficiario.cedula?.includes(term) ||
      beneficiario.accountNumber?.includes(term) ||
      beneficiario.email?.toLowerCase().includes(term) ||
      beneficiario.phone?.includes(term)
    );
  }

  /**
   * Paginar array de beneficiarios
   */
  paginateBeneficiaries(beneficiaries, page = 1, itemsPerPage = 3) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return {
      items: beneficiaries.slice(startIndex, endIndex),
      pagination: {
        currentPage: page,
        itemsPerPage: itemsPerPage,
        totalItems: beneficiaries.length,
        totalPages: Math.ceil(beneficiaries.length / itemsPerPage),
        hasNextPage: endIndex < beneficiaries.length,
        hasPreviousPage: page > 1,
        startIndex: startIndex + 1,
        endIndex: Math.min(endIndex, beneficiaries.length)
      }
    };
  }

  async getBeneficiaries(cedula) {
    console.log('👥 [BENEFICIARIES] Obteniendo beneficiarios para cédula:', cedula);

    // Validación básica
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    const beneficiariesData = {
      prccode: this.processCodes.BENEFICIARIES_LIST, // '2330'
      idecl: cedula.trim()
    };

    console.log('📤 [BENEFICIARIES] Solicitando beneficiarios:', {
      ...beneficiariesData,
      idecl: '***' + beneficiariesData.idecl.slice(-4)
    });

    const result = await this.makeRequest(beneficiariesData);

    if (result.success) {
      const beneficiariesResult = this.interpretServerResponse(result.data, 'beneficiaries_list');

      if (beneficiariesResult.success && result.data.beneficiario && Array.isArray(result.data.beneficiario)) {
        console.log('✅ [BENEFICIARIES] Beneficiarios obtenidos exitosamente:', result.data.beneficiario.length, 'beneficiarios');

        // Procesar y normalizar los datos de beneficiarios
        const processedBeneficiaries = result.data.beneficiario.map((beneficiario, index) => {
          // Generar avatar con las iniciales del nombre
          const nombres = beneficiario.nombnf?.split(' ') || ['?', '?'];
          const avatar = nombres.length >= 2
            ? (nombres[0][0] + nombres[1][0]).toUpperCase()
            : (nombres[0]?.substring(0, 2) || '??').toUpperCase();

          return {
            // ID único para React keys
            id: beneficiario.codcta || `beneficiario-${index}`,

            // Información personal
            name: beneficiario.nombnf || 'Nombre no disponible',
            cedula: this.decryptCedula(beneficiario.idebnf), // Desencriptar c�dula
            cedulaEncrypted: beneficiario.idebnf, // Preservar original encriptado
            email: beneficiario.bnfema,
            phone: beneficiario.bnfcel?.trim() || '',

            // Información bancaria
            bank: beneficiario.nomifi || 'Banco no especificado',
            bankCode: beneficiario.codifi,
            accountNumber: this.decryptAccountNumber(beneficiario.codcta), // Desencriptar para mostrar
            accountNumberEncrypted: beneficiario.codcta, // Preservar original para eliminación
            accountType: beneficiario.destcu || 'Cuenta de Ahorros',
            accountTypeCode: beneficiario.codtcu,

            // Información adicional
            documentType: beneficiario.codtid,

            // Para compatibilidad con la vista existente
            avatar: avatar,
            lastTransfer: null, // No viene en la API

            // Datos originales para referencia
            _original: beneficiario
          };
        });

        return {
          success: true,
          data: {
            beneficiarios: processedBeneficiaries,
            totalBeneficiarios: processedBeneficiaries.length,
            rawData: result.data
          },
          message: `Se encontraron ${processedBeneficiaries.length} beneficiarios`
        };
      } else {
        return {
          success: false,
          error: {
            message: beneficiariesResult.error?.message || 'No se encontraron beneficiarios para este cliente',
            code: 'NO_BENEFICIARIES_FOUND'
          }
        };
      }
    }

    return result;
  }

  /**
   * Método de conveniencia para obtener beneficiarios del usuario actual
   */
  async getCurrentUserBeneficiaries() {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: {
          message: 'No hay sesión activa o no se pudo obtener la cédula del usuario',
          code: 'NO_USER_SESSION'
        }
      };
    }

    return await this.getBeneficiaries(cedula);
  }

  /**
   * Buscar beneficiarios por término de búsqueda
   */
  searchBeneficiaries(beneficiaries, searchTerm) {
    if (!searchTerm || !searchTerm.trim()) {
      return beneficiaries;
    }

    const term = searchTerm.toLowerCase().trim();

    return beneficiaries.filter(beneficiario =>
      beneficiario.name.toLowerCase().includes(term) ||
      beneficiario.bank.toLowerCase().includes(term) ||
      beneficiario.cedula?.includes(term) ||
      beneficiario.accountNumber?.includes(term) ||
      beneficiario.email?.toLowerCase().includes(term) ||
      beneficiario.phone?.includes(term)
    );
  }

  /**
   * Paginar array de beneficiarios
   */
  paginateBeneficiaries(beneficiaries, page = 1, itemsPerPage = 3) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return {
      items: beneficiaries.slice(startIndex, endIndex),
      pagination: {
        currentPage: page,
        itemsPerPage: itemsPerPage,
        totalItems: beneficiaries.length,
        totalPages: Math.ceil(beneficiaries.length / itemsPerPage),
        hasNextPage: endIndex < beneficiaries.length,
        hasPreviousPage: page > 1,
        startIndex: startIndex + 1,
        endIndex: Math.min(endIndex, beneficiaries.length)
      }
    };
  }
  async createBeneficiary(beneficiaryData) {
    console.log('➕ [BENEFICIARIES] Creando nuevo beneficiario');

    // Validaciones básicas
    const requiredFields = ['idecl', 'codifi', 'ideclr', 'nomclr', 'codtcur', 'codctac'];
    for (const field of requiredFields) {
      if (!beneficiaryData[field] || !beneficiaryData[field].toString().trim()) {
        return {
          success: false,
          error: {
            message: `El campo ${field} es requerido`,
            code: 'MISSING_REQUIRED_FIELD'
          }
        };
      }
    }

    const createData = {
      prccode: this.processCodes.CREATE_BENEFICIARY, // '2365'
      idecl: beneficiaryData.idecl.trim(), // Cédula del cliente
      codifi: beneficiaryData.codifi.toString(), // Código banco
      codtidr: beneficiaryData.codtidr || '1', // Tipo doc receptor (default 1)
      ideclr: beneficiaryData.ideclr.trim(), // Cédula receptor
      nomclr: beneficiaryData.nomclr.trim(), // Nombre receptor
      codtcur: beneficiaryData.codtcur.toString(), // Tipo cuenta receptor
      codctac: beneficiaryData.codctac.trim(), // Número cuenta
      bnfema: beneficiaryData.bnfema || '', // Email (opcional)
      bnfcel: beneficiaryData.bnfcel || '' // Celular (opcional)
    };

    console.log('📤 [BENEFICIARIES] Datos para crear beneficiario:', {
      ...createData,
      idecl: '***' + createData.idecl.slice(-4),
      ideclr: '***' + createData.ideclr.slice(-4)
    });

    const result = await this.makeRequest(createData);

    if (result.success) {
      const createResult = this.interpretServerResponse(result.data, 'create_beneficiary');

      if (createResult.success && result.data.estado === '000') {
        console.log('✅ [BENEFICIARIES] Beneficiario creado exitosamente');

        return {
          success: true,
          data: {
            message: result.data.msg,
            beneficiaryData: createData
          },
          message: result.data.msg || 'Beneficiario registrado correctamente'
        };
      } else {
        console.error('❌ [BENEFICIARIES] Error al crear beneficiario:', result.data.msg);

        return {
          success: false,
          error: {
            message: result.data.msg || 'Error al registrar el beneficiario',
            code: 'CREATE_BENEFICIARY_ERROR',
            serverState: result.data.estado
          }
        };
      }
    }

    return result;
  }

  /**
   * Eliminar un beneficiario/contacto
   */
  async deleteBeneficiary(beneficiaryData) {
    console.log('🗑️ [BENEFICIARIES] Eliminando beneficiario');
    console.log('📋 [BENEFICIARIES] Datos recibidos:', beneficiaryData);

    // Validaciones básicas
    const requiredFields = ['idecl', 'codifi', 'ideclr', 'codtcur', 'codctac'];
    for (const field of requiredFields) {
      if (!beneficiaryData[field] || !beneficiaryData[field].toString().trim()) {
        console.error(`❌ [BENEFICIARIES] Campo requerido faltante: ${field}`);
        return {
          success: false,
          error: {
            message: `El campo ${field} es requerido para eliminar el beneficiario`,
            code: 'MISSING_REQUIRED_FIELD'
          }
        };
      }
    }

    const deleteData = {
      prccode: this.processCodes.DELETE_BENEFICIARY, // '2370'
      idecl: beneficiaryData.idecl.trim(), // Cédula del cliente
      codifi: beneficiaryData.codifi.toString(), // Código banco
      codtidr: beneficiaryData.codtidr || '1', // Tipo doc receptor (default 1)
      ideclr: beneficiaryData.ideclr.trim(), // Cédula receptor
      codtcur: beneficiaryData.codtcur.toString(), // Tipo cuenta receptor
      codctac: beneficiaryData.codctac.trim() // Número cuenta (ENCRIPTADO desde DB)
    };

    // ⚠️ IMPORTANTE: NO desencriptar codctac aquí
    // El valor debe ir TAL CUAL viene de la base de datos (doblemente encriptado)
    // El backend NO debe encriptar este campo en el proceso 2370
    // Ver: INSTRUCCIONES_BACKEND_ELIMINAR_BENEFICIARIOS.md
    
    /* COMENTADO - Causaba triple encriptación
    const isCodectacEncrypted = /^[A-Za-z0-9+/]*={0,2}$/.test(deleteData.codctac) && deleteData.codctac.length > 20;
    if (isCodectacEncrypted) {
      try {
        const decryptedCodectac = decrypt(deleteData.codctac);
        deleteData.codctac = decryptedCodectac;
      } catch (err) {
        console.error('❌ Error desencriptando codctac:', err);
      }
    }
    */

    console.log('📤 [BENEFICIARIES] Datos para eliminar beneficiario:');
    console.log('   - prccode:', deleteData.prccode);
    console.log('   - idecl:', '***' + deleteData.idecl.slice(-4), '(se encriptará)');
    console.log('   - codifi:', deleteData.codifi);
    console.log('   - codtidr:', deleteData.codtidr);
    console.log('   - ideclr:', '***' + deleteData.ideclr.slice(-4), '(se encriptará)');
    console.log('   - codtcur:', deleteData.codtcur);
    console.log('   - codctac:', deleteData.codctac.substring(0, 30) + '...', '(ENCRIPTADO - sin modificar)');
    console.log('   ⚠️ Backend debe usar codctac SIN desencriptar en la query DELETE');

    const result = await this.makeRequest(deleteData);

    console.log('📨 [BENEFICIARIES] Respuesta del servidor:', result);

    if (result.success) {
      const deleteResult = this.interpretServerResponse(result.data, 'delete_beneficiary');

      console.log('🔍 [BENEFICIARIES] Interpretación del resultado:', deleteResult);
      console.log('🔍 [BENEFICIARIES] Estado del servidor:', result.data.estado);
      console.log('🔍 [BENEFICIARIES] Mensaje del servidor:', result.data.msg);

      if (deleteResult.success && result.data.estado === '000') {
        console.log('✅ [BENEFICIARIES] Beneficiario eliminado exitosamente');

        return {
          success: true,
          data: {
            message: result.data.msg,
            deletedBeneficiary: beneficiaryData
          },
          message: result.data.msg || 'Beneficiario eliminado correctamente'
        };
      } else {
        console.error('❌ [BENEFICIARIES] Error al eliminar beneficiario:', result.data.msg);
        console.error('❌ [BENEFICIARIES] Estado recibido:', result.data.estado);

        return {
          success: false,
          error: {
            message: result.data.msg || 'Error al eliminar el beneficiario',
            code: 'DELETE_BENEFICIARY_ERROR',
            serverState: result.data.estado
          }
        };
      }
    }

    console.error('❌ [BENEFICIARIES] Error en la petición al servidor');
    return result;
  }

  /**
   * Método de conveniencia para crear beneficiario con datos del usuario actual
   */
  async createBeneficiaryForCurrentUser(beneficiaryInfo) {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: {
          message: 'No hay sesión activa o no se pudo obtener la cédula del usuario',
          code: 'NO_USER_SESSION'
        }
      };
    }

    const beneficiaryData = {
      idecl: cedula,
      ...beneficiaryInfo
    };

    return await this.createBeneficiary(beneficiaryData);
  }

  /**
   * Método de conveniencia para eliminar beneficiario con datos del usuario actual
   */
  async deleteBeneficiaryForCurrentUser(beneficiaryInfo) {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: {
          message: 'No hay sesión activa o no se pudo obtener la cédula del usuario',
          code: 'NO_USER_SESSION'
        }
      };
    }

    const beneficiaryData = {
      idecl: cedula,
      ...beneficiaryInfo
    };

    return await this.deleteBeneficiary(beneficiaryData);
  }

  /**
   * ACTUALIZAR EL MÉTODO getBeneficiaries PARA MANEJAR "SIN REGISTROS"
   */
  async getBeneficiaries(cedula) {
    console.log('👥 [BENEFICIARIES] Obteniendo beneficiarios para cédula:', cedula);

    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    const beneficiariesData = {
      prccode: this.processCodes.BENEFICIARIES_LIST, // '2330'
      idecl: cedula.trim()
    };

    console.log('📤 [BENEFICIARIES] Solicitando beneficiarios:', {
      ...beneficiariesData,
      idecl: '***' + beneficiariesData.idecl.slice(-4)
    });

    const result = await this.makeRequest(beneficiariesData);

    if (result.success) {
      console.log('🔍 [BENEFICIARIES] Estado respuesta:', result.data.estado);
      console.log('🔍 [BENEFICIARIES] Mensaje:', result.data.msg);

      // ✅ MANEJO ESPECÍFICO PARA "SIN REGISTROS" - NO ES ERROR
      if (result.data.estado === '001' &&
        (result.data.msg === 'REGISTROS NO DISPONIBLES' ||
          result.data.msg?.includes('NO DISPONIBLES'))) {
        console.log('ℹ️ [BENEFICIARIES] Usuario sin beneficiarios registrados (caso normal)');
        return {
          success: true, // ✅ CAMBIAR A SUCCESS
          data: {
            beneficiarios: [], // Lista vacía
            totalBeneficiarios: 0,
            rawData: result.data
          },
          message: 'No tienes beneficiarios registrados aún'
        };
      }

      const beneficiariesResult = this.interpretServerResponse(result.data, 'beneficiaries_list');

      if (beneficiariesResult.success && result.data.beneficiario && Array.isArray(result.data.beneficiario)) {
        console.log('✅ [BENEFICIARIES] Beneficiarios obtenidos exitosamente:', result.data.beneficiario.length, 'beneficiarios');

        // Procesar y normalizar los datos de beneficiarios
        const processedBeneficiaries = result.data.beneficiario.map((beneficiario, index) => {
          const nombres = beneficiario.nombnf?.split(' ') || ['?', '?'];
          const avatar = nombres.length >= 2
            ? (nombres[0][0] + nombres[1][0]).toUpperCase()
            : (nombres[0]?.substring(0, 2) || '??').toUpperCase();

          return {
            id: beneficiario.codcta || `beneficiario-${index}`,
            name: beneficiario.nombnf || 'Nombre no disponible',
            cedula: this.decryptCedula(beneficiario.idebnf), // Desencriptar cédula
            cedulaEncrypted: beneficiario.idebnf, // Preservar original encriptado
            email: beneficiario.bnfema,
            phone: beneficiario.bnfcel?.trim() || '',
            bank: beneficiario.nomifi || 'Banco no especificado',
            bankCode: beneficiario.codifi,
            accountNumber: this.decryptAccountNumber(beneficiario.codcta), // Desencriptar para mostrar
            accountNumberEncrypted: beneficiario.codcta, // Preservar original para eliminación
            accountType: beneficiario.destcu || 'Cuenta de Ahorros',
            accountTypeCode: beneficiario.codtcu,
            documentType: beneficiario.codtid,
            avatar: avatar,
            lastTransfer: null,
            _original: beneficiario
          };
        });

        return {
          success: true,
          data: {
            beneficiarios: processedBeneficiaries,
            totalBeneficiarios: processedBeneficiaries.length,
            rawData: result.data
          },
          message: `Se encontraron ${processedBeneficiaries.length} beneficiarios`
        };
      } else {
        return {
          success: false,
          error: {
            message: beneficiariesResult.error?.message || 'Error al obtener beneficiarios',
            code: 'NO_BENEFICIARIES_FOUND'
          }
        };
      }
    }

    return result;
  }
  async getFinancialInstitutions() {
  console.log('🏦 [INSTITUTIONS] Obteniendo instituciones financieras');

  const institutionsData = {
    prccode: '2310', // Código para lista de instituciones financieras
    ctrifact: "1"
  };

  console.log('📤 [INSTITUTIONS] Solicitando instituciones:', institutionsData);
  console.log('🔧 [INSTITUTIONS] URL que se usará:', this.config.baseUrl);

  const result = await this.makeRequest(institutionsData);

  if (result.success) {
    const institutionsResult = this.interpretServerResponse(result.data, 'financial_institutions');

    if (institutionsResult.success && result.data.listado && Array.isArray(result.data.listado)) {
      console.log('✅ [INSTITUTIONS] Instituciones obtenidas exitosamente:', result.data.listado.length, 'instituciones');

      // Procesar y normalizar los datos
      const processedInstitutions = result.data.listado.map((institucion, index) => ({
        id: institucion.codigo || `inst-${index}`,
        code: institucion.codigo,
        name: institucion.descri || 'Institución no disponible',
        _original: institucion
      }));

      return {
        success: true,
        data: {
          instituciones: processedInstitutions,
          totalInstituciones: processedInstitutions.length
        },
        message: `Se encontraron ${processedInstitutions.length} instituciones financieras`
      };
    } else {
      return {
        success: false,
        error: {
          message: institutionsResult.error?.message || 'No se encontraron instituciones financieras',
          code: 'NO_INSTITUTIONS_FOUND'
        }
      };
    }
  }

  return result;
}

  /**
   * Obtener tipos de cuentas de captaciones
   */
  async getAccountTypes() {
    console.log('📋 [ACCOUNT-TYPES] Obteniendo tipos de cuenta');

    const accountTypesData = {
      prccode: '2320' // Código para tipos de cuentas de captaciones
    };

    console.log('📤 [ACCOUNT-TYPES] Solicitando tipos de cuenta:', accountTypesData);

    const result = await this.makeRequest(accountTypesData);

    if (result.success) {
      const accountTypesResult = this.interpretServerResponse(result.data, 'account_types');

      if (accountTypesResult.success && result.data.listado && Array.isArray(result.data.listado)) {
        console.log('✅ [ACCOUNT-TYPES] Tipos de cuenta obtenidos exitosamente:', result.data.listado.length, 'tipos');

        // Procesar y normalizar los datos
        const processedAccountTypes = result.data.listado.map((tipo, index) => ({
          id: tipo.codigo || `type-${index}`,
          code: tipo.codigo,
          name: tipo.descri || 'Tipo no disponible',
          _original: tipo
        }));

        return {
          success: true,
          data: {
            tiposCuenta: processedAccountTypes,
            totalTipos: processedAccountTypes.length
          },
          message: `Se encontraron ${processedAccountTypes.length} tipos de cuenta`
        };
      } else {
        return {
          success: false,
          error: {
            message: accountTypesResult.error?.message || 'No se encontraron tipos de cuenta',
            code: 'NO_ACCOUNT_TYPES_FOUND'
          }
        };
      }
    }

    return result;
  }

  /**
   * Obtener tipos de identificación
   */
  async getIdentificationTypes() {
    console.log('🆔 [ID-TYPES] Obteniendo tipos de identificación');

    const idTypesData = {
      prccode: '2315' // Código para tipos de identificación
    };

    console.log('📤 [ID-TYPES] Solicitando tipos de identificación:', idTypesData);

    const result = await this.makeRequest(idTypesData);

    if (result.success) {
      const idTypesResult = this.interpretServerResponse(result.data, 'identification_types');

      if (idTypesResult.success && result.data.listado && Array.isArray(result.data.listado)) {
        console.log('✅ [ID-TYPES] Tipos de identificación obtenidos exitosamente:', result.data.listado.length, 'tipos');

        // Procesar y normalizar los datos
        const processedIdTypes = result.data.listado.map((tipo, index) => ({
          id: tipo.codigo || `id-${index}`,
          code: tipo.codigo,
          name: tipo.descri || 'Tipo no disponible',
          validationLength: this.getValidationLengthForIdType(tipo.descri),
          _original: tipo
        }));

        return {
          success: true,
          data: {
            tiposIdentificacion: processedIdTypes,
            totalTipos: processedIdTypes.length
          },
          message: `Se encontraron ${processedIdTypes.length} tipos de identificación`
        };
      } else {
        return {
          success: false,
          error: {
            message: idTypesResult.error?.message || 'No se encontraron tipos de identificación',
            code: 'NO_ID_TYPES_FOUND'
          }
        };
      }
    }

    return result;
  }

  /**
   * Método auxiliar para obtener la longitud de validación según el tipo de identificación
   */
  getValidationLengthForIdType(idTypeName) {
    if (!idTypeName) return null;

    const name = idTypeName.toLowerCase();

    if (name.includes('cedula') || name.includes('cédula')) {
      return { min: 10, max: 10, label: '10 dígitos' };
    } else if (name.includes('ruc')) {
      return { min: 13, max: 13, label: '13 dígitos' };
    } else if (name.includes('pasaporte')) {
      return { min: 6, max: 15, label: '6-15 caracteres' };
    } else if (name.includes('analogo')) {
      return { min: 5, max: 20, label: '5-20 caracteres' };
    }

    return { min: 5, max: 20, label: '5-20 caracteres' };
  }

  /**
   * Validar número de identificación según el tipo
   */
  validateIdentificationNumber(idType, idNumber) {
    if (!idNumber || !idNumber.trim()) {
      return {
        isValid: false,
        error: 'El número de identificación es requerido'
      };
    }

    const cleanNumber = idNumber.trim();

    if (!idType || !idType.validationLength) {
      return {
        isValid: false,
        error: 'Tipo de identificación no válido'
      };
    }

    const { min, max, label } = idType.validationLength;

    // Validar longitud
    if (cleanNumber.length < min || cleanNumber.length > max) {
      return {
        isValid: false,
        error: `El ${idType.name} debe tener ${label}`
      };
    }

    // Validaciones específicas
    if (idType.name.toLowerCase().includes('cedula') || idType.name.toLowerCase().includes('cédula')) {
      // Validar que solo contenga números
      if (!/^\d{10}$/.test(cleanNumber)) {
        return {
          isValid: false,
          error: 'La cédula debe contener solo 10 dígitos'
        };
      }

      // Validar algoritmo de cédula ecuatoriana
      if (!this.validateEcuadorianCedula(cleanNumber)) {
        return {
          isValid: false,
          error: 'Número de cédula no válido'
        };
      }
    } else if (idType.name.toLowerCase().includes('ruc')) {
      // Validar que solo contenga números
      if (!/^\d{13}$/.test(cleanNumber)) {
        return {
          isValid: false,
          error: 'El RUC debe contener solo 13 dígitos'
        };
      }

      // Validar algoritmo de RUC ecuatoriano
      if (!this.validateEcuadorianRuc(cleanNumber)) {
        return {
          isValid: false,
          error: 'Número de RUC no válido'
        };
      }
    } else if (idType.name.toLowerCase().includes('pasaporte')) {
      // Validar formato de pasaporte (alfanumérico)
      if (!/^[A-Za-z0-9]{6,15}$/.test(cleanNumber)) {
        return {
          isValid: false,
          error: 'El pasaporte debe contener solo letras y números (6-15 caracteres)'
        };
      }
    }

    return {
      isValid: true,
      error: null
    };
  }

  /**
   * Validar cédula ecuatoriana
   */
  validateEcuadorianCedula(cedula) {
    if (!/^\d{10}$/.test(cedula)) return false;

    const digits = cedula.split('').map(Number);
    const province = parseInt(cedula.substring(0, 2));

    // Validar provincia (01-24)
    if (province < 1 || province > 24) return false;

    // Algoritmo de validación de cédula ecuatoriana
    const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      let result = digits[i] * coefficients[i];
      if (result > 9) result -= 9;
      sum += result;
    }

    const checkDigit = sum % 10 === 0 ? 0 : 10 - (sum % 10);
    return checkDigit === digits[9];
  }

  /**
   * Validar RUC ecuatoriano
   */
  validateEcuadorianRuc(ruc) {
    if (!/^\d{13}$/.test(ruc)) return false;

    const thirdDigit = parseInt(ruc[2]);

    // Validar tercer dígito (6, 7, 8, 9 para empresas)
    if (thirdDigit >= 6 && thirdDigit <= 9) {
      // RUC de empresas
      const coefficients = [3, 2, 7, 6, 5, 4, 3, 2];
      let sum = 0;

      for (let i = 0; i < 8; i++) {
        sum += parseInt(ruc[i]) * coefficients[i];
      }

      const remainder = sum % 11;
      const checkDigit = remainder === 0 ? 0 : 11 - remainder;

      return checkDigit === parseInt(ruc[8]);
    } else {
      // RUC de personas naturales (inicia con cédula)
      const cedula = ruc.substring(0, 10);
      return this.validateEcuadorianCedula(cedula) && ruc.substring(10) === '001';
    }
  }

  /**
   * Validar email
   */
  validateEmail(email) {
    if (!email || !email.trim()) {
      return {
        isValid: true, // Email es opcional
        error: null
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      return {
        isValid: false,
        error: 'Ingresa un email válido (debe contener @ y .com)'
      };
    }

    // Validar que termine en un dominio válido
    if (!email.toLowerCase().includes('.com') &&
      !email.toLowerCase().includes('.ec') &&
      !email.toLowerCase().includes('.org') &&
      !email.toLowerCase().includes('.net')) {
      return {
        isValid: false,
        error: 'El email debe tener un dominio válido (.com, .ec, .org, .net)'
      };
    }

    return {
      isValid: true,
      error: null
    };
  }

  /**
   * Validar teléfono celular
   */
  validatePhone(phone) {
    if (!phone || !phone.trim()) {
      return {
        isValid: true, // Teléfono es opcional
        error: null
      };
    }

    const cleanPhone = phone.replace(/\s/g, '');

    // Validar formato ecuatoriano (09xxxxxxxx)
    if (!/^09\d{8}$/.test(cleanPhone)) {
      return {
        isValid: false,
        error: 'El celular debe tener 10 dígitos y comenzar con 09'
      };
    }

    return {
      isValid: true,
      error: null
    };
  }
  async getClientAccountsForTransfer(cedula) {
    console.log('🏦 [INTERNAL-TRANSFER] Obteniendo cuentas para transferencias internas:', cedula);

    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    const accountsData = {
      prccode: '2300',
      idecl: cedula.trim()
    };

    console.log('📤 [INTERNAL-TRANSFER] Solicitando cuentas:', {
      ...accountsData,
      idecl: '***' + accountsData.idecl.slice(-4)
    });

    const result = await this.makeRequest(accountsData);

    if (result.success) {
      const accountsResult = this.interpretServerResponse(result.data, 'internal_transfer_accounts');

      if (accountsResult.success && result.data.cliente?.cuentas && Array.isArray(result.data.cliente.cuentas)) {
        console.log('✅ [INTERNAL-TRANSFER] Cuentas obtenidas exitosamente:', result.data.cliente.cuentas.length, 'cuentas');

        // Procesar y enriquecer los datos de las cuentas
        const processedAccounts = result.data.cliente.cuentas.map((cuenta, index) => {
          // 🔓 Desencriptar codcta para mostrar en UI
          let codctaDecrypted = cuenta.codcta;
          try {
            codctaDecrypted = decrypt(cuenta.codcta);
            if (index === 0) {
              console.log(`🔓 [INTERNAL-TRANSFER] Desencriptando codcta: ${cuenta.codcta.substring(0, 20)}... -> ${codctaDecrypted}`);
            }
          } catch (error) {
            console.error('❌ [INTERNAL-TRANSFER] Error al desencriptar codcta:', error);
          }

          // 🔓 Desencriptar saldos si vienen encriptados
          let saldisDecrypted = cuenta.saldis;
          let salcntDecrypted = cuenta.salcnt;

          if (typeof cuenta.saldis === 'string' && cuenta.saldis.length > 10 && cuenta.saldis.includes('=')) {
            try {
              saldisDecrypted = decrypt(cuenta.saldis);
              if (index === 0) {
                console.log(`🔓 [INTERNAL-TRANSFER] Desencriptando saldis: ${cuenta.saldis.substring(0, 20)}... -> ${saldisDecrypted}`);
              }
            } catch (error) {
              console.error('❌ [INTERNAL-TRANSFER] Error al desencriptar saldis:', error);
            }
          }

          if (typeof cuenta.salcnt === 'string' && cuenta.salcnt.length > 10 && cuenta.salcnt.includes('=')) {
            try {
              salcntDecrypted = decrypt(cuenta.salcnt);
              if (index === 0) {
                console.log(`🔓 [INTERNAL-TRANSFER] Desencriptando salcnt: ${cuenta.salcnt.substring(0, 20)}... -> ${salcntDecrypted}`);
              }
            } catch (error) {
              console.error('❌ [INTERNAL-TRANSFER] Error al desencriptar salcnt:', error);
            }
          }

          const saldoDisponible = parseFloat(saldisDecrypted) || 0;
          const saldoContable = parseFloat(salcntDecrypted) || 0;

          if (index === 0) {
            console.log('💰 [INTERNAL-TRANSFER] Saldos parseados:', {
              saldoDisponible,
              saldoContable,
              saldisOriginal: cuenta.saldis,
              saldisDecrypted,
              salcntOriginal: cuenta.salcnt,
              salcntDecrypted
            });
          }

          return {
            // ✅ USAR NÚMERO DESENCRIPTADO como ID (para select values)
            id: codctaDecrypted,
            codigo: codctaDecrypted,
            codigoEncriptado: cuenta.codcta, // Preservar encriptado por si se necesita
            descripcion: cuenta.desdep,
            estado: cuenta.desect,
            saldoContable: saldoContable,
            saldoDisponible: saldoDisponible,

            // Campos para mostrar en la UI
            numeroFormateado: this.formatAccountNumber(codctaDecrypted),
            numeroDesencriptado: codctaDecrypted,
            saldoFormateado: this.formatCurrency(saldoDisponible),
            tipoProducto: cuenta.desdep || 'Cuenta de Ahorros',

            // Validaciones
            isActive: cuenta.desect === 'ACTIVA',
            hasBalance: saldoDisponible > 0,

            // Datos originales para referencia
            _original: cuenta
          };
        });

        // Filtrar solo cuentas activas para transferencias
        const activeCuentas = processedAccounts.filter(cuenta => cuenta.isActive);

        return {
          success: true,
          data: {
            cliente: result.data.cliente,
            cuentas: activeCuentas,
            todasLasCuentas: processedAccounts,
            totalCuentas: activeCuentas.length
          },
          message: `Se encontraron ${activeCuentas.length} cuentas activas para transferencias`
        };
      } else {
        return {
          success: false,
          error: {
            message: accountsResult.error?.message || 'No se encontraron cuentas para transferencias',
            code: 'NO_TRANSFER_ACCOUNTS'
          }
        };
      }
    }

    return result;
  }

  /**
   * Obtener cuentas de transferencia del usuario actual
   * Wrapper que obtiene automáticamente la cédula del usuario en sesión
   */
  async getCurrentUserTransferAccounts() {
    console.log('🏦 [TRANSFER-ACCOUNTS] Obteniendo cuentas del usuario actual...');
    
    const cedula = this.getUserCedula();
    
    if (!cedula) {
      return {
        success: false,
        error: {
          message: 'No se pudo obtener la cédula del usuario',
          code: 'NO_USER_CEDULA'
        }
      };
    }

    console.log('👤 [TRANSFER-ACCOUNTS] Cédula obtenida:', '***' + cedula.slice(-4));
    
    // Reutilizar la función existente
    return await this.getClientAccountsForTransfer(cedula);
  }

  /**
   * Validar disponibilidad de fondos para transferencia
   * Código de proceso: 2350
   */
  async validateTransferAvailability(cedula, cuentaOrigen, montoTransferencia) {
    console.log('💰 [INTERNAL-TRANSFER] Validando disponibilidad de fondos');
    console.log('👤 [INTERNAL-TRANSFER] Cédula:', '***' + cedula.slice(-4));
    console.log('🏦 [INTERNAL-TRANSFER] Cuenta origen:', cuentaOrigen);
    console.log('💵 [INTERNAL-TRANSFER] Monto:', montoTransferencia);

    // Validaciones básicas
    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    if (!cuentaOrigen || !cuentaOrigen.trim()) {
      return {
        success: false,
        error: {
          message: 'La cuenta origen es requerida',
          code: 'ACCOUNT_ORIGIN_REQUIRED'
        }
      };
    }

    if (!montoTransferencia || parseFloat(montoTransferencia) <= 0) {
      return {
        success: false,
        error: {
          message: 'El monto debe ser mayor a cero',
          code: 'INVALID_AMOUNT'
        }
      };
    }

    const validationData = {
      prccode: '2350',
      idecl: cedula.trim(),
      codctad: cuentaOrigen.trim(),
      valtrnf: parseFloat(montoTransferencia).toFixed(2),
      tiptrnf: "1" // Tipo de transferencia interna
    };

    console.log('📤 [INTERNAL-TRANSFER] Validando disponibilidad:', {
      ...validationData,
      idecl: '***' + validationData.idecl.slice(-4)
    });

    const result = await this.makeRequest(validationData);

    if (result.success) {
      const validationResult = this.interpretServerResponse(result.data, 'transfer_validation');

      if (validationResult.success && result.data.estado === '000') {
        console.log('✅ [INTERNAL-TRANSFER] Fondos disponibles para la transferencia');

        return {
          success: true,
          data: {
            mensaje: result.data.msg,
            validado: true,
            montoValidado: parseFloat(montoTransferencia).toFixed(2)
          },
          message: 'Fondos suficientes para realizar la transferencia'
        };
      } else {
        console.log('❌ [INTERNAL-TRANSFER] Fondos insuficientes:', result.data.msg);

        return {
          success: false,
          error: {
            message: result.data.msg || 'Fondos insuficientes para realizar la transferencia',
            code: 'INSUFFICIENT_FUNDS',
            serverState: result.data.estado
          }
        };
      }
    }

    return result;
  }

  /**
   * Ejecutar transferencia interna con código OTP
   * Código de proceso: 2355
   */
  async executeInternalTransfer(transferData) {
    console.log('🔄 [INTERNAL-TRANSFER] Ejecutando transferencia interna');

    // Validaciones básicas
    const requiredFields = ['cedula', 'cuentaOrigen', 'cuentaDestino', 'monto', 'descripcion', 'idemsg', 'codigoOTP'];
    for (const field of requiredFields) {
      if (!transferData[field] || !transferData[field].toString().trim()) {
        return {
          success: false,
          error: {
            message: `El campo ${field} es requerido`,
            code: 'MISSING_REQUIRED_FIELD'
          }
        };
      }
    }

    // Validar que las cuentas sean diferentes
    if (transferData.cuentaOrigen === transferData.cuentaDestino) {
      return {
        success: false,
        error: {
          message: 'La cuenta origen y destino deben ser diferentes',
          code: 'SAME_ACCOUNTS'
        }
      };
    }

    const executeData = {
      prccode: '2355',
      idecl: transferData.cedula.trim(),
      codctad: transferData.cuentaOrigen.trim(),    // Cuenta origen
      codctac: transferData.cuentaDestino.trim(),   // Cuenta destino
      valtrnf: parseFloat(transferData.monto).toFixed(2),
      idemsg: transferData.idemsg.trim(),
      codseg: transferData.codigoOTP.trim(),
      dettrnf: transferData.descripcion.trim()
    };

    console.log('📤 [INTERNAL-TRANSFER] Ejecutando transferencia:', {
      ...executeData,
      idecl: '***' + executeData.idecl.slice(-4),
      codctad: '***' + executeData.codctad.slice(-4),
      codctac: '***' + executeData.codctac.slice(-4),
      codseg: '***' + executeData.codseg.slice(-2)
    });

    const result = await this.makeRequest(executeData);

    if (result.success) {
      const executeResult = this.interpretServerResponse(result.data, 'internal_transfer');

      if (executeResult.success && result.data.estado === '000') {
        console.log('✅ [INTERNAL-TRANSFER] Transferencia ejecutada exitosamente');

        return {
          success: true,
          data: {
            mensaje: result.data.msg,
            transferencia: {
              cuentaOrigen: transferData.cuentaOrigen,
              cuentaDestino: transferData.cuentaDestino,
              monto: parseFloat(transferData.monto),
              descripcion: transferData.descripcion,
              fecha: new Date().toISOString(),
              numeroReferencia: result.data.numref || 'N/A'
            },
            respuestaCompleta: result.data
          },
          message: result.data.msg || 'Transferencia realizada exitosamente'
        };
      } else {
        console.error('❌ [INTERNAL-TRANSFER] Error en la transferencia:', result.data.msg);

        // Manejar errores específicos
        let errorMessage = result.data.msg || 'Error al ejecutar la transferencia';
        let errorCode = 'TRANSFER_EXECUTION_ERROR';

        switch (result.data.estado) {
          case '006':
            errorMessage = 'Código de seguridad incorrecto';
            errorCode = 'INVALID_OTP_CODE';
            break;
          case '007':
            errorMessage = 'El código de seguridad ha expirado';
            errorCode = 'EXPIRED_OTP_CODE';
            break;
          case '008':
            errorMessage = 'Fondos insuficientes en la cuenta origen';
            errorCode = 'INSUFFICIENT_FUNDS';
            break;
        }

        return {
          success: false,
          error: {
            message: errorMessage,
            code: errorCode,
            serverState: result.data.estado
          }
        };
      }
    }

    return result;
  }

  /**
   * Métodos de conveniencia para usuario actual
   */
  async getCurrentUserAccountsForTransfer() {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: {
          message: 'No hay sesión activa',
          code: 'NO_USER_SESSION'
        }
      };
    }
    return await this.getClientAccountsForTransfer(cedula);
  }

  async validateCurrentUserTransferAvailability(cuentaOrigen, montoTransferencia) {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: {
          message: 'No hay sesión activa',
          code: 'NO_USER_SESSION'
        }
      };
    }
    return await this.validateTransferAvailability(cedula, cuentaOrigen, montoTransferencia);
  }

 async executeCurrentUserInternalTransfer(transferData) {
  const cedula = this.getUserCedula();
  if (!cedula) {
    return {
      success: false,
      error: {
        message: 'No hay sesión activa',
        code: 'NO_USER_SESSION'
      }
    };
  }

  console.log('🔄 [INTERNAL-TRANSFER-EXECUTE] Ejecutando transferencia interna');
  console.log('👤 [INTERNAL-TRANSFER-EXECUTE] Cédula:', '***' + cedula.slice(-4));

  // ✅ VALIDACIÓN ESTRICTA: Requerir todos los campos obligatorios
  const requiredFields = ['cuentaOrigen', 'cuentaDestino', 'monto', 'descripcion', 'idemsg', 'codigoOTP'];
  for (const field of requiredFields) {
    if (!transferData[field] || !transferData[field].toString().trim()) {
      return {
        success: false,
        error: {
          message: `El campo ${field} es requerido para ejecutar la transferencia`,
          code: 'MISSING_REQUIRED_FIELD',
          missingField: field
        }
      };
    }
  }

  // ✅ VALIDAR que las cuentas sean diferentes
  if (transferData.cuentaOrigen === transferData.cuentaDestino) {
    return {
      success: false,
      error: {
        message: 'La cuenta origen y destino deben ser diferentes',
        code: 'SAME_ACCOUNTS'
      }
    };
  }

  // ✅ PREPARAR PAYLOAD SEGÚN DOCUMENTACIÓN OFICIAL
  const executeData = {
    prccode: '2355',                                      // Código para ejecutar transferencia
    idecl: cedula.trim(),                                 // Cédula del usuario
    codctad: transferData.cuentaOrigen.trim(),           // Cuenta origen
    codctac: transferData.cuentaDestino.trim(),          // Cuenta destino  
    valtrnf: parseFloat(transferData.monto).toFixed(2),  // Monto con 2 decimales
    idemsg: transferData.idemsg.trim(),                  // ✅ SIEMPRE REQUERIDO
    codseg: transferData.codigoOTP.trim(),               // Código OTP de 6 dígitos
    dettrnf: transferData.descripcion.trim()             // Descripción de la transferencia
  };

  console.log('📤 [INTERNAL-TRANSFER-EXECUTE] Payload según documentación:', {
    ...executeData,
    idecl: '***' + executeData.idecl.slice(-4),
    codctad: '***' + executeData.codctad.slice(-4),
    codctac: '***' + executeData.codctac.slice(-4),
    idemsg: '***' + executeData.idemsg.slice(-4),
    codseg: '***' + executeData.codseg.slice(-2)
  });

  const result = await this.makeRequest(executeData);

  if (result.success) {
    const executeResult = this.interpretServerResponse(result.data, 'internal_transfer_execute');

    if (executeResult.success && result.data.estado === '000') {
      console.log('✅ [INTERNAL-TRANSFER-EXECUTE] Transferencia ejecutada exitosamente');

      return {
        success: true,
        data: {
          mensaje: result.data.msg,
          transferencia: {
            cuentaOrigen: transferData.cuentaOrigen,
            cuentaDestino: transferData.cuentaDestino,
            monto: parseFloat(transferData.monto),
            descripcion: transferData.descripcion,
            fecha: new Date().toISOString(),
            numeroReferencia: result.data.numref || 'N/A'
          },
          respuestaCompleta: result.data
        },
        message: result.data.msg || 'Transferencia realizada exitosamente'
      };
    } else {
      console.error('❌ [INTERNAL-TRANSFER-EXECUTE] Error en la transferencia:', result.data);

      // ✅ MANEJO ESPECÍFICO DE ERRORES SEGÚN CÓDIGOS DE ESTADO
      let errorMessage = result.data.msg || 'Error al ejecutar la transferencia';
      let errorCode = 'TRANSFER_EXECUTION_ERROR';

      switch (result.data.estado) {
        case '006':
          errorMessage = 'Código de seguridad incorrecto';
          errorCode = 'INVALID_OTP_CODE';
          break;
        case '007':
          errorMessage = 'El código de seguridad ha expirado';
          errorCode = 'EXPIRED_OTP_CODE';
          break;
        case '008':
          errorMessage = 'Fondos insuficientes en la cuenta origen';
          errorCode = 'INSUFFICIENT_FUNDS';
          break;
        case '009':
          errorMessage = 'La cuenta origen no existe o está inactiva';
          errorCode = 'INVALID_SOURCE_ACCOUNT';
          break;
        case '010':
          errorMessage = 'La cuenta destino no existe o está inactiva';
          errorCode = 'INVALID_DESTINATION_ACCOUNT';
          break;
        default:
          // Si el mensaje incluye "CODIGO SEGURIDAD NO EXISTE"
          if (errorMessage.includes('CODIGO SEGURIDAD NO EXISTE')) {
            errorMessage = 'El código de seguridad no es válido o ha expirado. Solicita un nuevo código.';
            errorCode = 'INVALID_OTP_SESSION';
          }
          break;
      }

      return {
        success: false,
        error: {
          message: errorMessage,
          code: errorCode,
          serverState: result.data.estado,
          originalMessage: result.data.msg
        }
      };
    }
  }

  return result;
}

  /**
   * Solicitar código OTP para transferencia interna
   */
 async requestOTPForInternalTransfer() {
  const cedula = this.getUserCedula();
  if (!cedula) {
    return {
      success: false,
      error: {
        message: 'No hay sesión activa',
        code: 'NO_USER_SESSION'
      }
    };
  }

  console.log('📨 [INTERNAL-TRANSFER-OTP] Solicitando código OTP para transferencia interna');
  console.log('👤 [INTERNAL-TRANSFER-OTP] Cédula:', '***' + cedula.slice(-4));

  // ✅ USAR API 2155 ESPECÍFICAMENTE PARA TRANSFERENCIAS
  const codeData = {
    prccode: this.processCodes.REQUEST_CODE, // '2155'
    idecl: cedula.trim()
  };

  console.log('📤 [INTERNAL-TRANSFER-OTP] Solicitando código con API 2155:', codeData);

  const result = await this.makeRequest(codeData);

  if (result.success) {
    const codeResult = this.interpretServerResponse(result.data, 'request_otp_transfer');

    if (codeResult.success && result.data.cliente?.[0]?.idemsg) {
      console.log('✅ [INTERNAL-TRANSFER-OTP] Código OTP solicitado exitosamente');
      
      // 🔓 DESENCRIPTAR idemsg usando helper
      const idemsg = this.decryptIdemsgIfNeeded(
        result.data.cliente[0].idemsg, 
        'INTERNAL-TRANSFER-OTP'
      );
      
      console.log('🆔 [INTERNAL-TRANSFER-OTP] idemsg procesado');

      return {
        success: true,
        data: {
          idemsg: idemsg,
          idecli: result.data.cliente[0].idecli,
          message: result.data.msg || 'Código de seguridad enviado'
        },
        message: 'Código de seguridad enviado a tu celular registrado'
      };
    } else {
      console.error('❌ [INTERNAL-TRANSFER-OTP] Error en respuesta:', result.data);
      return {
        success: false,
        error: {
          message: codeResult.error?.message || 'No se pudo enviar el código de seguridad',
          code: 'OTP_REQUEST_ERROR'
        }
      };
    }
  }

  return result;
}

  /**
   * Métodos auxiliares para formateo
   */
  formatAccountNumber(accountNumber) {
    if (!accountNumber) return '';

    // Formatear con guiones cada 4 dígitos: 4201-0100-4676
    const str = accountNumber.toString().replace(/\D/g, ''); // Eliminar caracteres no numéricos
    if (str.length >= 4) {
      return str.replace(/(.{4})/g, '$1-').replace(/-$/, ''); // Agregar guiones cada 4 dígitos
    }
    return str;
  }

  /**
   * Configurar cupo máximo de transferencia para una cuenta
   * Código de proceso: 2303
   * @param {string} cedula - Cédula del usuario
   * @param {string} codigoCuenta - Código de la cuenta
   * @param {string} montoMaximo - Monto máximo diario a configurar
   * @param {string} idemsg - ID del mensaje de validación OTP
   * @param {string} codigoOTP - Código OTP para validar identidad
   * @returns {Promise<Object>} Resultado de la configuración
   */
  async setAccountTransferLimit(cedula, codigoCuenta, montoMaximo, idemsg, codigoOTP) {
    console.log('🔧 [CUPO] Configurando cupo máximo de transferencia...');
    console.log('👤 [CUPO] Cédula:', cedula);
    console.log('🏦 [CUPO] Cuenta:', codigoCuenta);
    console.log('💰 [CUPO] Monto máximo:', montoMaximo);

    // Validaciones
    if (!cedula || !cedula.trim()) {
      return this.handleError({
        message: 'Cédula es requerida',
        code: 'VALIDATION_ERROR'
      });
    }

    if (!codigoCuenta || !codigoCuenta.trim()) {
      return this.handleError({
        message: 'Código de cuenta es requerido',
        code: 'VALIDATION_ERROR'
      });
    }

    if (!montoMaximo || parseFloat(montoMaximo) <= 0) {
      return this.handleError({
        message: 'El monto máximo debe ser mayor a cero',
        code: 'VALIDATION_ERROR'
      });
    }

    if (!idemsg || !idemsg.trim()) {
      return this.handleError({
        message: 'ID de mensaje es requerido',
        code: 'VALIDATION_ERROR'
      });
    }

    if (!codigoOTP || !codigoOTP.trim()) {
      return this.handleError({
        message: 'Código OTP es requerido',
        code: 'VALIDATION_ERROR'
      });
    }

    try {
      const limitData = {
        prccode: this.processCodes.SET_ACCOUNT_TRANSFER_LIMIT,
        idecl: cedula.trim(),
        codcta: codigoCuenta.trim(),
        mxmret: montoMaximo.toString(),
        idemsg: idemsg.trim(),
        codseg: codigoOTP.trim()
      };

      console.log('📤 [CUPO] Enviando configuración:', {
        ...limitData,
        idecl: '***' + limitData.idecl.slice(-4),
        codseg: '******'
      });

      const result = await this.makeRequest(limitData);

      if (result.success) {
        console.log('✅ [CUPO] Configuración exitosa:', result.data);
        
        return {
          success: true,
          data: {
            cuenta: codigoCuenta,
            montoMaximo: parseFloat(montoMaximo),
            mensaje: result.data?.msg || 'Cupo configurado exitosamente'
          },
          message: 'Cupo máximo diario configurado correctamente'
        };
      } else {
        console.error('❌ [CUPO] Error en configuración:', result.error);
        return result;
      }
    } catch (error) {
      console.error('💥 [CUPO] Error inesperado:', error);
      return this.handleError(error);
    }
  }

  /**
   * Método de conveniencia para configurar cupo del usuario actual
   */
  async setCurrentUserAccountTransferLimit(codigoCuenta, montoMaximo, idemsg, codigoOTP) {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return this.handleError({
        message: 'No hay usuario autenticado',
        code: 'NO_SESSION'
      });
    }
    return await this.setAccountTransferLimit(cedula, codigoCuenta, montoMaximo, idemsg, codigoOTP);
  }

  // ==========================================
  // MÉTODOS PARA AUTENTICACIÓN EN DOS PASOS (2FA)
  // ==========================================

  /**
   * Solicitar código de seguridad para 2FA en login
   * @param {string} cedula - Cédula del usuario
   * @returns {Promise<Object>} Resultado de la solicitud
   */
  async requestSecurityCodeFor2FA(cedula) {
    console.log('🔐 [2FA] Solicitando código de seguridad para autenticación:', cedula);

    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida para solicitar el código',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    const codeData = {
      prccode: this.processCodes.REQUEST_CODE, // '2155'
      idecl: cedula.trim()
    };

    console.log('📨 [2FA] Enviando solicitud de código:', {
      prccode: codeData.prccode,
      idecl: codeData.idecl
    });

    const result = await this.makeRequest(codeData);

    if (result.success) {
      const codeResult = this.interpretServerResponse(result.data, 'request_code');

      if (codeResult.success && result.data.cliente?.[0]?.idemsg) {
        console.log('✅ [2FA] Código solicitado exitosamente');
        
        // � DESENCRIPTAR idemsg usando helper
        const idemsg = this.decryptIdemsgIfNeeded(
          result.data.cliente[0].idemsg, 
          '2FA-OTP'
        );
        
        console.log('📱 [2FA] idemsg procesado');
        
        return {
          success: true,
          data: {
            ...result.data,
            idemsg: idemsg,
            cedula: cedula.trim()
          },
          message: 'Código de seguridad enviado a tu teléfono'
        };
      } else {
        console.log('❌ [2FA] Error en solicitud de código:', codeResult.error);
        return {
          success: false,
          error: {
            message: codeResult.error?.message || 'No se pudo enviar el código de seguridad',
            code: 'CODE_REQUEST_ERROR'
          }
        };
      }
    }

    console.log('🔄 [2FA] Error de red en solicitud de código');
    return result;
  }

  /**
   * Validar código de seguridad para 2FA en login
   * @param {string} cedula - Cédula del usuario
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña actual del usuario
   * @param {string} idemsg - ID del mensaje de seguridad
   * @param {string} securityCode - Código ingresado por el usuario
   * @returns {Promise<Object>} Resultado de la validación
   */
  async validateSecurityCodeFor2FA(cedula, username, password, idemsg, securityCode) {
    console.log('🔐 [2FA] Validando código de seguridad para autenticación');
    console.log('👤 [2FA] Usuario:', username);
    console.log('🆔 [2FA] Cédula:', cedula);
    console.log('📨 [2FA] idemsg:', idemsg);
    console.log('🔢 [2FA] Código (longitud):', securityCode?.length);

    // Validaciones básicas
    if (!cedula || !username || !password || !idemsg || !securityCode) {
      return {
        success: false,
        error: {
          message: 'Todos los parámetros son requeridos para validar el código',
          code: 'MISSING_PARAMETERS'
        }
      };
    }

    if (securityCode.trim().length !== 6) {
      return {
        success: false,
        error: {
          message: 'El código de seguridad debe tener 6 dígitos',
          code: 'INVALID_CODE_LENGTH'
        }
      };
    }

    // ✅ CORRECCIÓN: Usar proceso 2156 (VALIDATE_SECURITY_CODE) para login OTP
    // El proceso 2160 es para ACTUALIZAR contraseña, NO para validar OTP de login
    
    console.log('🔍 [2FA] ===== CONSTRUYENDO REQUEST PARA PROCESO 2156 =====');
    console.log('🔍 [2FA] Parámetros recibidos:');
    console.log('   - cedula:', cedula);
    console.log('   - username:', username);
    console.log('   - idemsg:', idemsg);
    console.log('   - securityCode (ORIGINAL sin trim):', securityCode);
    console.log('   - securityCode.length:', securityCode?.length);
    console.log('   - securityCode tipo:', typeof securityCode);
    
    const validateData = {
      prccode: this.processCodes.VALIDATE_SECURITY_CODE_REGISTRATION, // '2156' - VALIDAR OTP
      idecl: cedula.trim(),
      idemsg: idemsg.trim(),
      codseg: securityCode.trim()
    };
    
    console.log('🔍 [2FA] validateData construido:');
    console.log('   - prccode:', validateData.prccode);
    console.log('   - idecl:', validateData.idecl);
    console.log('   - idemsg:', validateData.idemsg);
    console.log('   - codseg:', validateData.codseg);
    console.log('   - codseg.length:', validateData.codseg?.length);
    console.log('🔍 [2FA] ===== ENVIANDO A makeRequest() =====');

    const result = await this.makeRequest(validateData);

    if (result.success) {
      // ✅ CORRECCIÓN: Validar código OTP es exitoso si estado = '000'
      const validationResult = this.interpretServerResponse(result.data, 'validate_otp_login');

      if (validationResult.success) {
        console.log('✅ [2FA] Código OTP validado correctamente con proceso 2156');
        
        // AHORA SÍ guardamos la sesión ya que el 2FA está completo
        const sessionData = {
          username: username.trim(),
          loginTime: new Date().toISOString(),
          token: this.config.token,
          userData: result.data,
          twoFactorVerified: true
        };

        this.saveUserSession(sessionData);
        console.log('💾 [2FA] Sesión guardada tras completar 2FA exitosamente');
        
        return {
          success: true,
          data: result.data,
          message: 'Autenticación en dos pasos completada exitosamente'
        };
      } else {
        console.log('❌ [2FA] Código OTP inválido:', validationResult.error);
        
        // Interpretar errores específicos del servidor para proceso 2156
        let errorMessage = 'Código OTP incorrecto';
        if (result.data?.estado === '001') {
          errorMessage = 'Código OTP no existe o es incorrecto';
        } else if (result.data?.estado === '006') {
          errorMessage = 'Código OTP no coincide';
        } else if (result.data?.estado === '007') {
          errorMessage = 'Código OTP expirado';
        } else if (result.data?.msg) {
          errorMessage = result.data.msg;
        }

        return {
          success: false,
          error: {
            message: errorMessage,
            code: 'INVALID_SECURITY_CODE',
            serverState: result.data?.estado
          }
        };
      }
    }

    console.log('🔄 [2FA] Error de red en validación de código');
    return result;
  }

  /**
   * Login completo con autenticación en dos pasos
   * PASO 1: Validar credenciales
   * PASO 2: Solicitar código SMS
   * Este método maneja el flujo inicial del 2FA
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} Resultado con datos para continuar 2FA
   */
  /**
   * Validar credenciales sin guardar sesión (para 2FA)
   */
  async validateCredentialsOnly(username, password) {
    console.log('🔐 [2FA-VALIDATE] Validando credenciales sin guardar sesión');
    
    // Validaciones básicas
    if (!username || !password) {
      return {
        success: false,
        error: {
          message: 'Usuario y contraseña son requeridos',
          code: 'MISSING_CREDENTIALS'
        }
      };
    }

    const loginData = {
      prccode: this.processCodes.LOGIN,
      usr: username.trim(),
      pwd: password.trim()
    };

    const result = await this.makeRequest(loginData);

    if (result.success) {
      const loginResult = this.interpretServerResponse(result.data, 'login');
      
      if (loginResult.success) {
        console.log('✅ [2FA-VALIDATE] Credenciales válidas, NO guardando sesión');
        return {
          success: true,
          data: result.data,
          message: 'Credenciales válidas'
        };
      } else {
        return loginResult;
      }
    }

    return result;
  }

  async loginWithTwoFactor(username, password) {
    console.log('🔐 [2FA-LOGIN] Iniciando login con autenticación en dos pasos');
    console.log('👤 [2FA-LOGIN] Usuario:', username);

    // PASO 1: Validar credenciales SIN guardar sesión
    const loginResult = await this.validateCredentialsOnly(username, password);

    if (!loginResult.success) {
      console.log('❌ [2FA-LOGIN] Credenciales inválidas, no proceder con 2FA');
      return loginResult;
    }

    console.log('✅ [2FA-LOGIN] Credenciales válidas, procediendo con 2FA');
    
    // Extraer cédula de los datos del usuario
    const userData = loginResult.data;
    let cedula = null;

    console.log('🔍 [2FA-LOGIN] userData completo:', userData);
    console.log('🔍 [2FA-LOGIN] userData.cliente:', userData.cliente);
    if (userData.cliente && userData.cliente[0]) {
      console.log('🔍 [2FA-LOGIN] userData.cliente[0]:', userData.cliente[0]);
      console.log('🔍 [2FA-LOGIN] idecli (desencriptado):', userData.cliente[0].idecli);
      console.log('🔍 [2FA-LOGIN] idecliE (encriptado):', userData.cliente[0].idecliE);
    }

    // Buscar cédula en diferentes posibles ubicaciones de la respuesta
    if (userData.cliente && userData.cliente[0] && userData.cliente[0].idecli) {
      cedula = userData.cliente[0].idecli;
    } else if (userData.webusu && userData.webusu[0] && userData.webusu[0].idecli) {
      cedula = userData.webusu[0].idecli;
    } else if (userData.idecli) {
      cedula = userData.idecli;
    }

    if (!cedula) {
      console.log('❌ [2FA-LOGIN] No se pudo extraer la cédula de los datos del usuario');
      return {
        success: false,
        error: {
          message: 'Error interno: no se pudo obtener la cédula del usuario',
          code: 'CEDULA_NOT_FOUND'
        }
      };
    }

    console.log('🆔 [2FA-LOGIN] Cédula extraída:', cedula);

    // PASO 2: Solicitar código de seguridad
    const codeRequest = await this.requestSecurityCodeFor2FA(cedula);

    if (!codeRequest.success) {
      console.log('❌ [2FA-LOGIN] Error al solicitar código de seguridad');
      return codeRequest;
    }

    console.log('✅ [2FA-LOGIN] Código enviado, preparando datos para fase 2');

    // Retornar datos necesarios para completar el 2FA
    return {
      success: true,
      requiresTwoFactor: true,
      data: {
        username: username.trim(),
        password: password.trim(), // Necesario para la validación final
        cedula: cedula,
        idemsg: codeRequest.data.idemsg,
        userData: userData
      },
      message: 'Código de seguridad enviado. Ingresa el código para completar el acceso.'
    };
  }

  /**
   * NUEVO MÉTODO: Obtener notificaciones de transferencias/pagos del día
   * Proceso: 2358
   */
  async getNotifications(cedula) {
    console.log('🔔 [NOTIFICATIONS] Obteniendo notificaciones para:', cedula);

    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: {
          message: 'La cédula es requerida',
          code: 'CEDULA_REQUIRED'
        }
      };
    }

    const notificationsData = {
      prccode: this.processCodes.NOTIFICATIONS_LIST, // '2358'
      idecl: cedula.trim()
    };

    console.log('📤 [NOTIFICATIONS] Solicitando lista de notificaciones');

    const result = await this.makeRequest(notificationsData);

    console.log('📥 [NOTIFICATIONS] Resultado completo:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('🔍 [NOTIFICATIONS] Estado respuesta:', result.data.estado, typeof result.data.estado);
      console.log('🔍 [NOTIFICATIONS] Mensaje:', result.data.msg);
      console.log('🔍 [NOTIFICATIONS] Listado:', result.data.listado);
      console.log('🔍 [NOTIFICATIONS] Es array?:', Array.isArray(result.data.listado));

      // Manejo de respuesta exitosa - COMPARAR COMO STRING Y NÚMERO
      const estado = String(result.data.estado);
      if ((estado === '000' || estado === '600') && result.data.listado && Array.isArray(result.data.listado)) {
        console.log('✅ [NOTIFICATIONS] Notificaciones obtenidas:', result.data.listado.length);

        // Procesar notificaciones
        const processedNotifications = result.data.listado.map((notification, index) => ({
          id: `notification-${notification.numreg || index}`,
          numreg: notification.numreg,
          timestamp: notification.fhotrn,
          message: notification.smstxt,
          isPrimary: notification.primtr === '1',
          isRead: false, // Por defecto no leída
          _original: notification
        }));

        return {
          success: true,
          data: {
            notifications: processedNotifications,
            total: processedNotifications.length,
            latest: processedNotifications[0] || null, // Primera notificación (más reciente)
            rawData: result.data
          },
          message: processedNotifications.length > 0 
            ? `${processedNotifications.length} notificación(es) encontrada(s)` 
            : 'No hay notificaciones nuevas'
        };
      }

      // Sin registros - no es error
      if (result.data.estado === '001' || 
          (result.data.msg && result.data.msg.includes('NO DISPONIBLES'))) {
        console.log('ℹ️ [NOTIFICATIONS] Sin notificaciones disponibles');
        return {
          success: true,
          data: {
            notifications: [],
            total: 0,
            latest: null,
            rawData: result.data
          },
          message: 'No hay notificaciones nuevas'
        };
      }

      // Otro estado no exitoso
      const notificationsResult = this.interpretServerResponse(result.data, 'notifications_list');
      return {
        success: false,
        error: {
          message: notificationsResult.error?.message || 'Error al obtener notificaciones',
          code: 'NOTIFICATIONS_ERROR'
        }
      };
    }

    return result;
  }


}

const apiService = new ApiService();

// Exportar para uso en React
export default apiService;  