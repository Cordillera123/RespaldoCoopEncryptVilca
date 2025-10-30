/**
 * ==========================================
 * API SERVICE PARA CERTIFICADOS BANCARIOS
 * ==========================================
 * 
 * Servicio especializado para manejar la generación de certificados
 * consolidados con debito de cuenta y generación de PDF
 * 
 * ✅ INTEGRADO CON SISTEMA DE ENCRIPTACIÓN AES-256-CBC
 * 
 * Process Codes utilizados:
 * - 2400: Obtener costo del certificado
 * - 2374: Listar cuentas para debitar (con saldo suficiente)
 * - 2300: Obtener todas las cuentas del usuario
 * - 2350: Validar débito y enviar OTP
 * - 2401: Generar certificado con OTP
 */

// 🔐 IMPORTACIÓN: Sistema de encriptación
import { encryptRequest, decryptResponse } from '../utils/crypto/index.js';

const API_CONFIG = {
  baseUrl: '/api-l/prctrans.php', // URL con 'L' para certificados
  token: '0999SolSTIC20220719',
  timeout: 15000, // 15 segundos (más tiempo para generación de PDF)
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

/**
 * Códigos de proceso para certificados
 */
const PROCESS_CODES = {
  GET_CERTIFICATE_COST: '2400',      // Obtener costo del certificado
  GET_DEBIT_ACCOUNTS: '2374',        // Listar cuentas para debitar
  GET_ALL_ACCOUNTS: '2300',          // Obtener todas las cuentas del usuario
  VALIDATE_DEBIT: '2350',            // Validar débito y enviar OTP (similar a transferencias)
  GENERATE_CERTIFICATE: '2401'       // Generar certificado con OTP
};

/**
 * Clase para manejar operaciones de certificados
 */
class ApiServiceCertificados {
  constructor() {
    this.config = API_CONFIG;
    this.processCodes = PROCESS_CODES;
  }

  /**
   * Método genérico para realizar peticiones HTTP CON ENCRIPTACIÓN
   */
  async makeRequest(data, options = {}) {
    console.log('🔧 [CERT] Configurando petición de certificados...');
    console.log('🌐 [CERT] URL:', this.config.baseUrl);
    console.log('📋 [CERT] Código de proceso:', data.prccode);

    try {
      // 🔐 PASO 1: Encriptar datos sensibles según el process code
      const encryptedData = encryptRequest(data);
      console.log('✅ [CERT] Datos encriptados aplicados');

      const requestOptions = {
        method: 'POST',
        headers: {
          ...this.config.headers,
          ...options.headers
        },
        body: JSON.stringify({
          tkn: this.config.token,
          ...encryptedData
        })
      };

      console.log('🚀 [CERT] Enviando petición...');

      // Crear AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ [CERT] Timeout alcanzado, abortando petición...');
        controller.abort();
      }, options.timeout || this.config.timeout);

      requestOptions.signal = controller.signal;

      const response = await fetch(this.config.baseUrl, requestOptions);
      clearTimeout(timeoutId);

      console.log('📊 [CERT] Respuesta recibida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [CERT] Datos parseados correctamente');
      
      // 🔓 PASO 2: Desencriptar respuesta según el process code
      const decryptedResult = decryptResponse(result, data.prccode);
      console.log('🔓 [CERT] Datos desencriptados aplicados');

      return this.handleResponse(decryptedResult);

    } catch (error) {
      console.error('❌ [CERT] Error en la petición:', error);
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
      errorMessage = error.message;
      errorCode = 'HTTP_ERROR';
    } else {
      errorMessage = error.message || 'Error desconocido';
    }

    console.error('ApiServiceCertificados Error:', {
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
   * Interpretar respuesta del servidor
   */
  interpretServerResponse(serverResponse, operationType = 'general') {
    console.log('🔍 [CERT] Interpretando respuesta del servidor:', serverResponse);
    console.log('📋 [CERT] Tipo de operación:', operationType);

    if (!serverResponse) {
      return {
        success: false,
        error: {
          message: 'No se recibió respuesta del servidor',
          code: 'NO_RESPONSE'
        }
      };
    }

    const estado = serverResponse.estado || serverResponse.status || 'unknown';
    const mensaje = serverResponse.msg || serverResponse.message || '';

    console.log('📊 [CERT] Estado recibido:', estado);
    console.log('💬 [CERT] Mensaje recibido:', mensaje);

    // Estado 000 = éxito
    if (estado === '000') {
      return {
        success: true,
        data: serverResponse,
        message: mensaje || 'Operación exitosa'
      };
    } else {
      return {
        success: false,
        error: {
          message: mensaje || 'Error en la operación',
          code: estado,
          serverState: estado
        }
      };
    }
  }

  /**
   * Obtener cédula del usuario desde la sesión
   */
  getUserCedula() {
    console.log('🔍 [CERT] Obteniendo cédula del usuario...');
    
    try {
      const session = sessionStorage.getItem('userSession');
      if (!session) {
        console.log('❌ [CERT] No hay sesión activa');
        return null;
      }

      const sessionData = JSON.parse(session);
      console.log('📊 [CERT] Datos de sesión completos:', sessionData);
      
      // Intentar múltiples rutas para obtener la cédula
      let cedula = null;

      if (sessionData.userData?.cliente && Array.isArray(sessionData.userData.cliente) && sessionData.userData.cliente[0]?.idecli) {
        cedula = sessionData.userData.cliente[0].idecli;
      } else if (sessionData.userData?.cliente?.idecli) {
        cedula = sessionData.userData.cliente.idecli;
      } else if (sessionData.cedula) {
        cedula = sessionData.cedula;
      }

      console.log('✅ [CERT] Cédula obtenida:', cedula);
      return cedula;

    } catch (error) {
      console.error('❌ [CERT] Error obteniendo cédula:', error);
      return null;
    }
  }

  /**
   * ==========================================
   * SERVICIOS DE CERTIFICADOS
   * ==========================================
   */

  /**
   * Obtener el costo del certificado
   * Servicio: 2400
   */
  async getCertificateCost(cedula = null) {
    console.log('💰 [CERT] Obteniendo costo del certificado');

    // Si no se proporciona cédula, obtenerla de la sesión
    const idecl = cedula || this.getUserCedula();
    
    if (!idecl) {
      return {
        success: false,
        error: {
          message: 'No se pudo obtener la identificación del usuario',
          code: 'NO_USER_ID'
        }
      };
    }

    const costData = {
      prccode: this.processCodes.GET_CERTIFICATE_COST,
      idecl: idecl.trim()
    };

    console.log('📤 [CERT] Solicitando costo (ANTES de encriptar):', costData);

    const result = await this.makeRequest(costData);

    if (result.success) {
      const costResult = this.interpretServerResponse(result.data, 'certificate_cost');

      if (costResult.success && result.data.valcms) {
        console.log('✅ [CERT] Costo obtenido exitosamente:', result.data.valcms);

        return {
          success: true,
          data: {
            costo: parseFloat(result.data.valcms),
            mensaje: result.data.msg
          },
          message: `Costo del certificado: $${result.data.valcms}`
        };
      } else {
        return {
          success: false,
          error: {
            message: costResult.error?.message || 'No se pudo obtener el costo del certificado',
            code: 'COST_ERROR'
          }
        };
      }
    }

    return result;
  }

  /**
   * Obtener TODAS las cuentas del usuario (sin filtrar por saldo)
   * Para que el usuario pueda seleccionar de cuál cuenta quiere el certificado
   * 
   * Usa el servicio 2300 que devuelve todas las cuentas activas
   */
  async getAllUserAccounts(cedula = null) {
    console.log('🏦 [CERT] ===== OBTENIENDO TODAS LAS CUENTAS DEL USUARIO =====');

    const idecl = cedula || this.getUserCedula();
    
    if (!idecl) {
      return {
        success: false,
        error: {
          message: 'No se pudo obtener la identificación del usuario',
          code: 'NO_USER_ID'
        }
      };
    }

    try {
      const allAccountsData = {
        prccode: this.processCodes.GET_ALL_ACCOUNTS, // '2300'
        idecl: idecl.trim()
      };

      console.log('📤 [CERT] Solicitando todas las cuentas del usuario...');
      const result = await this.makeRequest(allAccountsData);

      if (!result.success) {
        return result;
      }

      const accountsResult = this.interpretServerResponse(result.data, 'all_user_accounts');

      if (!accountsResult.success || !result.data.cliente?.cuentas || !Array.isArray(result.data.cliente.cuentas)) {
        return {
          success: false,
          error: {
            message: 'No se encontraron cuentas asociadas',
            code: 'NO_ACCOUNTS'
          }
        };
      }

      // Formatear todas las cuentas (YA DESENCRIPTADAS por decryptResponse)
      const cuentasFormateadas = result.data.cliente.cuentas.map(cuenta => {
        const saldoDisp = parseFloat(cuenta.saldis) || 0;
        const saldoCont = parseFloat(cuenta.salcnt) || 0;

        return {
          codigo: cuenta.codcta, // Ya desencriptado
          numeroCuenta: cuenta.codcta, // Ya desencriptado
          tipo: cuenta.desdep || cuenta.descri || 'Cuenta',
          tipoProducto: cuenta.desdep || cuenta.descri || 'Cuenta',
          estado: cuenta.desect || 'ACTIVA',
          saldo: saldoDisp, // Ya desencriptado
          saldoDisponible: saldoDisp,
          saldoContable: saldoCont,
          numero: cuenta.codcta // Ya desencriptado
        };
      });

      console.log('✅ [CERT] Total de cuentas formateadas:', cuentasFormateadas.length);

      return {
        success: true,
        data: {
          cuentas: cuentasFormateadas,
          totalCuentas: cuentasFormateadas.length
        },
        message: `Se encontraron ${cuentasFormateadas.length} cuenta(s)`
      };

    } catch (error) {
      console.error('💥 [CERT] Error obteniendo todas las cuentas:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Error al obtener las cuentas',
          code: 'GET_ALL_ACCOUNTS_ERROR'
        }
      };
    }
  }

  /**
   * Obtener cuentas disponibles para debitar el costo
   * Servicio: 2374 (devuelve solo cuentas con saldo suficiente, sin info de saldo)
   * Servicio: 2300 (devuelve todas las cuentas con saldo detallado)
   * 
   * ESTRATEGIA: Combinar ambos servicios
   * 1. Llamar 2374 para obtener códigos de cuentas con saldo suficiente
   * 2. Llamar 2300 para obtener detalles y saldos de todas las cuentas
   * 3. Filtrar las cuentas de 2300 que estén en la lista de 2374
   */
  async getDebitAccounts(cedula = null, valorDebito = null) {
    console.log('🏦 [CERT] ===== OBTENIENDO CUENTAS PARA DEBITAR =====');
    console.log('🏦 [CERT] Cédula recibida:', cedula);
    console.log('💰 [CERT] Valor a debitar:', valorDebito);

    const idecl = cedula || this.getUserCedula();
    
    if (!idecl) {
      return {
        success: false,
        error: {
          message: 'No se pudo obtener la identificación del usuario',
          code: 'NO_USER_ID'
        }
      };
    }

    try {
      // PASO 1: Obtener códigos de cuentas con saldo suficiente (2374)
      const accountsData = {
        prccode: this.processCodes.GET_DEBIT_ACCOUNTS, // '2374'
        idecl: idecl.trim()
      };

      if (valorDebito) {
        accountsData.valor = valorDebito.toString();
      }

      console.log('📤 [CERT] PASO 1: Solicitando cuentas con saldo suficiente (2374)...');
      const result2374 = await this.makeRequest(accountsData);

      console.log('📥 [CERT] Respuesta de 2374:', JSON.stringify(result2374, null, 2));

      if (!result2374.success) {
        return result2374;
      }

      const accountsResult = this.interpretServerResponse(result2374.data, 'debit_accounts');

      if (!accountsResult.success || !result2374.data.listado || !Array.isArray(result2374.data.listado)) {
        return {
          success: false,
          error: {
            message: accountsResult.error?.message || 'No se encontraron cuentas con saldo suficiente',
            code: 'NO_DEBIT_ACCOUNTS'
          }
        };
      }

      // Extraer códigos de cuentas válidas (YA DESENCRIPTADAS)
      const codigosCuentasValidas = result2374.data.listado.map(cuenta => cuenta.codcta);
      console.log('✅ [CERT] Códigos de cuentas con saldo suficiente:', codigosCuentasValidas);

      if (codigosCuentasValidas.length === 0) {
        return {
          success: false,
          error: {
            message: 'No tiene cuentas con saldo suficiente para pagar el certificado',
            code: 'INSUFFICIENT_FUNDS'
          }
        };
      }

      // PASO 2: Obtener detalles completos de todas las cuentas (2300)
      console.log('📤 [CERT] PASO 2: Obteniendo detalles de cuentas (2300)...');
      
      const allAccountsData = {
        prccode: this.processCodes.GET_ALL_ACCOUNTS, // '2300'
        idecl: idecl.trim()
      };

      const result2300 = await this.makeRequest(allAccountsData);
      console.log('📥 [CERT] Respuesta de 2300:', JSON.stringify(result2300, null, 2));

      if (!result2300.success) {
        return result2300;
      }

      const allAccountsResult = this.interpretServerResponse(result2300.data, 'all_accounts');

      if (!allAccountsResult.success || !result2300.data.cliente?.cuentas || !Array.isArray(result2300.data.cliente.cuentas)) {
        return {
          success: false,
          error: {
            message: 'No se pudieron obtener los detalles de las cuentas',
            code: 'NO_ACCOUNT_DETAILS'
          }
        };
      }

      // PASO 3: Filtrar y combinar datos (YA DESENCRIPTADOS)
      console.log('🔄 [CERT] PASO 3: Filtrando y combinando datos...');
      
      const cuentasConDetalles = result2300.data.cliente.cuentas
        .filter(cuenta => codigosCuentasValidas.includes(cuenta.codcta))
        .map(cuenta => {
          const saldoDisp = parseFloat(cuenta.saldis) || 0;
          const saldoCont = parseFloat(cuenta.salcnt) || 0;

          return {
            codigo: cuenta.codcta, // Ya desencriptado
            numeroCuenta: cuenta.codcta,
            tipo: cuenta.desdep || cuenta.descri || 'Cuenta',
            tipoProducto: cuenta.desdep || cuenta.descri,
            estado: cuenta.desect || 'ACTIVA',
            saldo: saldoDisp,
            saldoDisponible: saldoDisp,
            saldoContable: saldoCont,
            numero: cuenta.codcta
          };
        });

      console.log('✅ [CERT] Cuentas con detalles completos:', cuentasConDetalles.length);
      
      // Log detallado de cada cuenta
      cuentasConDetalles.forEach((cuenta, index) => {
        console.log(`   [${index + 1}] ${cuenta.tipo} - ${cuenta.numeroCuenta} - Disponible: $${cuenta.saldo.toFixed(2)}`);
      });

      return {
        success: true,
        data: {
          cuentas: cuentasConDetalles,
          mensaje: result2374.data.msg,
          valorDebito: valorDebito,
          totalCuentas: cuentasConDetalles.length
        },
        message: `Se encontraron ${cuentasConDetalles.length} cuenta(s) disponible(s)`
      };

    } catch (error) {
      console.error('💥 [CERT] Error obteniendo cuentas:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Error al obtener cuentas disponibles',
          code: 'GET_ACCOUNTS_ERROR'
        }
      };
    }
  }

  /**
   * Validar débito de certificado y solicitar código OTP
   * Servicio: 2350 (similar al flujo de transferencias)
   * 
   * Este servicio:
   * 1. Valida que la cuenta tenga saldo suficiente
   * 2. Envía código OTP al usuario (SMS/Email)
   * 3. Retorna idemsg para usar en la confirmación
   * 
   * @param {string} cedula - Cédula del cliente
   * @param {string} codigoCuenta - Cuenta a debitar
   * @param {number} valor - Monto del certificado
   * @returns {Promise} idemsg para confirmación
   */
  async validateCertificateDebit(cedula = null, codigoCuenta, valor) {
    console.log('🔐 [CERT] Validando débito y solicitando OTP...');
    console.log('🏦 [CERT] Cuenta:', codigoCuenta);
    console.log('💰 [CERT] Valor:', valor);

    const idecl = cedula || this.getUserCedula();
    
    if (!idecl) {
      return {
        success: false,
        error: {
          message: 'No se pudo obtener la identificación del usuario',
          code: 'NO_USER_ID'
        }
      };
    }

    const validateData = {
      prccode: this.processCodes.VALIDATE_DEBIT, // '2350'
      idecl: idecl.trim(),
      codctad: codigoCuenta.trim(),
      valtrnf: valor.toString(),
      tiptrnf: '3' // Tipo de transacción: débito certificado
    };

    console.log('📤 [CERT] Solicitando validación y OTP (ANTES de encriptar):', validateData);

    const result = await this.makeRequest(validateData);

    if (result.success) {
      const estado = result.data.estado || 'unknown';
      const mensaje = result.data.msg || '';
      const idemsg = result.data.idemsg || result.data.idMsg || '';

      console.log('📊 [CERT] Estado validación:', estado);
      console.log('💬 [CERT] Mensaje:', mensaje);
      console.log('🔑 [CERT] ID Mensaje (idemsg):', idemsg);

      if (estado === '000' && idemsg) {
        return {
          success: true,
          data: {
            idemsg: idemsg,
            mensaje: mensaje
          },
          message: 'Código OTP enviado exitosamente'
        };
      } else {
        return {
          success: false,
          error: {
            message: mensaje || 'No se pudo validar el débito',
            code: estado
          }
        };
      }
    }

    return result;
  }

  /**
   * Registrar débito del certificado CON código OTP
   * Servicio: 2401
   * 
   * @param {string} cedula - Cédula del cliente
   * @param {string} codigoCuenta - Código de la cuenta a debitar
   * @param {number} valor - Monto del certificado
   * @param {string} idemsg - ID del mensaje OTP (retornado por validateCertificateDebit)
   * @param {string} codigoOTP - Código OTP ingresado por el usuario
   * @param {string} tipoVisualizacion - 'saldo' o 'cifras'
   * @returns {Promise} Confirmación del débito
   */
  async generateConsolidatedCertificateWithOTP(cedula = null, codigoCuenta, valor, idemsg, codigoOTP, tipoVisualizacion = 'saldo') {
    console.log('📄 [CERT] Registrando débito del certificado CON OTP...');
    console.log('🏦 [CERT] Cuenta a debitar:', codigoCuenta);
    console.log('💰 [CERT] Valor:', valor);
    console.log('🔑 [CERT] ID Mensaje:', idemsg);
    console.log('📊 [CERT] Tipo visualización:', tipoVisualizacion);

    const idecl = cedula || this.getUserCedula();
    
    if (!idecl) {
      return {
        success: false,
        error: {
          message: 'No se pudo obtener la identificación del usuario',
          code: 'NO_USER_ID'
        }
      };
    }

    if (!codigoCuenta || !idemsg || !codigoOTP) {
      return {
        success: false,
        error: {
          message: 'Datos incompletos para registrar el débito',
          code: 'INCOMPLETE_DATA'
        }
      };
    }

    const certificateData = {
      prccode: this.processCodes.GENERATE_CERTIFICATE, // '2401'
      idecl: idecl.trim(),
      codcta: codigoCuenta.trim(),
      valtrnf: valor.toString(),
      idemsg: idemsg.trim(), // NO se encripta (viene del backend)
      codseg: codigoOTP.trim(), // Código OTP - SÍ se encripta
      tpvisu: tipoVisualizacion === 'cifras' ? '2' : '1' // NO se encripta (código de catálogo)
    };

    console.log('📤 [CERT] Solicitando débito CON OTP (ANTES de encriptar):', certificateData);

    const result = await this.makeRequest(certificateData);

    if (result.success) {
      const estado = result.data.estado || 'unknown';
      const mensaje = result.data.msg || '';

      console.log('📊 [CERT] Estado del débito:', estado);
      console.log('💬 [CERT] Mensaje del servidor:', mensaje);

      if (estado === '000') {
        return {
          success: true,
          data: {
            ...result.data,
            mensaje: mensaje
          },
          message: 'Certificado generado y débito procesado correctamente'
        };
      } else {
        return {
          success: false,
          error: {
            message: mensaje || 'Error al procesar el débito del certificado',
            code: estado
          }
        };
      }
    }

    return result;
  }

  /**
   * Formatear número de cuenta (ocultar dígitos centrales)
   */
  formatAccountNumber(accountNumber) {
    if (!accountNumber) return '';
    const str = accountNumber.toString();
    if (str.length >= 4) {
      const visiblePart = str.slice(-4);
      const hiddenPart = '*'.repeat(Math.max(0, str.length - 4));
      return `${hiddenPart}${visiblePart}`.replace(/(.{4})/g, '$1 ').trim();
    }
    return str;
  }

  /**
   * Formatear moneda
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
}

// Exportar instancia única del servicio
const apiServiceCertificados = new ApiServiceCertificados();
export default apiServiceCertificados;
