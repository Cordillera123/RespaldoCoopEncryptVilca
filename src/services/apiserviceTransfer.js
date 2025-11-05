import apiService from './apiService';

// 🔐 IMPORTACIÓN: Sistema de encriptación
import { encryptRequest, decryptResponse } from '../utils/crypto/index.js';
import { decrypt } from '../utils/crypto/encryptionService.js';

/**
 * API Service especializado para transferencias entre usuarios de CACVIL (Cooperativa Vilcabamba)
 * Documentación basada en APIs 2300, 2325, 2350, 2355
 */

const API_CONFIG = {
  baseUrl: '/api-l/prctrans.php', // SOLO servidor con L
  token: '0999SolSTIC20220719',
  // Aumentado a 60 segundos porque algunas operaciones en el servidor pueden tardar
  // más de 10s y provocar abortos prematuros en la UI (ver: TIMEOUT_ERROR).
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

const PROCESS_CODES = {
  // Códigos para transferencias internas CACVIL (Cooperativa Vilcabamba)
  COOP_ACCOUNTS_ORIGIN: '2300',          // Obtener cuentas origen del usuario
  COOP_BENEFICIARIES_DEST: '2325',       // Obtener beneficiarios destino misma institución
  VALIDATE_TRANSFER_FUNDS: '2350',       // Validar disponibilidad de fondos
  EXECUTE_COOP_TRANSFER: '2355',         // Ejecutar transferencia cooperativa
  REQUEST_SECURITY_CODE: '2155',         // Solicitar código de seguridad OTP
};

class ApiServiceTransfer {
  constructor() {
    this.config = API_CONFIG;
    this.processCodes = PROCESS_CODES;
  }

  /**
   * 🔓 HELPER: Desencripta idemsg si viene encriptado desde el backend
   * Centraliza la lógica de desencriptación para todos los métodos OTP
   * @param {string} idemsg - El valor idemsg recibido del backend
   * @param {string} context - Contexto para logging (ej: 'COOP-TRANSFER')
   * @returns {string} - El idemsg desencriptado o el original si no está encriptado
   */
  decryptIdemsgIfNeeded(idemsg, context = 'OTP') {
    if (!idemsg) return idemsg;

    // Detectar si está encriptado (Base64 pattern)
    const isEncrypted = /^[A-Za-z0-9+/]*={0,2}$/.test(String(idemsg));
    
    if (isEncrypted && String(idemsg).length > 20) {
      try {
        const { decrypt } = require('@/utils/crypto/encryptionService');
        const decryptedIdemsg = decrypt(idemsg);
        console.log(`🔓 [${context}] idemsg desencriptado exitosamente`);
        return decryptedIdemsg;
      } catch (err) {
        console.error(`❌ [${context}] Error desencriptando idemsg:`, err);
        // Si falla, retornar el valor original como fallback
        return idemsg;
      }
    }
    
    // No está encriptado o es muy corto, retornar tal cual
    return idemsg;
  }

  /**
   * Método genérico para realizar peticiones HTTP
   */
  async makeRequest(data, options = {}) {
    const targetUrl = this.config.baseUrl;

    console.log('🔧 [API-TRANSFER] Configurando petición...');
    console.log('🌐 [API-TRANSFER] URL objetivo:', targetUrl);
    console.log('📋 [API-TRANSFER] Código de proceso:', data.prccode);

    // 🔐 ENCRIPTAR DATOS SENSIBLES ANTES DE ENVIAR
    let processedData = { ...data };
    try {
      processedData = encryptRequest(data);
      console.log('🔐 [API-TRANSFER] Datos encriptados aplicados');
    } catch (encryptError) {
      console.warn('⚠️ [API-TRANSFER] Error al encriptar, enviando datos sin encriptar:', encryptError.message);
    }

    const requestOptions = {
      method: 'POST',
      headers: {
        ...this.config.headers,
        ...options.headers
      },
      body: JSON.stringify({
        tkn: this.config.token,
        ...processedData
      })
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ [API-TRANSFER] Timeout alcanzado, abortando petición...');
        controller.abort();
      }, options.timeout || this.config.timeout);

      requestOptions.signal = controller.signal;

      const response = await fetch(targetUrl, requestOptions);
      clearTimeout(timeoutId);

      console.log('📊 [API-TRANSFER] Respuesta recibida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [API-TRANSFER] Datos parseados correctamente:', result);
      
      // 🔓 DESENCRIPTAR RESPUESTA DEL BACKEND
      let decryptedResult = result;
      try {
        decryptedResult = decryptResponse(result, data.prccode);
        console.log('🔓 [API-TRANSFER] Datos desencriptados aplicados');
      } catch (decryptError) {
        console.warn('⚠️ [API-TRANSFER] Error al desencriptar, usando datos sin desencriptar:', decryptError.message);
      }
      
      return this.handleResponse(decryptedResult);

    } catch (error) {
      console.error('❌ [API-TRANSFER] Error en la petición:', error);
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
          code: `SERVER_ERROR_${estado}`,
          serverState: estado
        }
      };
    }
  }

  /**
   * Obtener cédula del usuario logueado desde apiService
   */
  getUserCedula() {
    return apiService.getUserCedula();
  }

  // ==========================================
  // MÉTODOS PARA TRANSFERENCIAS COOPERATIVA
  // ==========================================

  /**
   * 1. Obtener cuentas origen del usuario (API 2300)
   * Mismo método que transferencias internas
   */
  async getCoopAccountsOrigin(cedula) {
    console.log('🏦 [COOP-TRANSFER] Obteniendo cuentas origen para cédula:', cedula);

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
      prccode: this.processCodes.COOP_ACCOUNTS_ORIGIN,
      idecl: cedula.trim()
    };

    const result = await this.makeRequest(accountsData);

    if (result.success) {
      const accountsResult = this.interpretServerResponse(result.data, 'coop_accounts_origin');

      if (accountsResult.success && result.data.cliente?.cuentas && Array.isArray(result.data.cliente.cuentas)) {
        console.log('✅ [COOP-TRANSFER] Cuentas origen obtenidas:', result.data.cliente.cuentas.length);

        const processedAccounts = result.data.cliente.cuentas.map((cuenta) => ({
          id: cuenta.codcta,
          codigo: cuenta.codcta,
          descripcion: cuenta.desdep,
          estado: cuenta.desect,
          saldoContable: parseFloat(cuenta.salcnt) || 0,
          saldoDisponible: parseFloat(cuenta.saldis) || 0,
          numeroFormateado: this.formatAccountNumber(cuenta.codcta),
          saldoFormateado: this.formatCurrency(parseFloat(cuenta.saldis) || 0),
          tipoProducto: cuenta.desdep || 'Cuenta de Ahorros',
          isActive: cuenta.desect === 'ACTIVA',
          hasBalance: parseFloat(cuenta.saldis) > 0,
          _original: cuenta
        }));

        const activeCuentas = processedAccounts.filter(cuenta => cuenta.isActive);

        return {
          success: true,
          data: {
            cliente: result.data.cliente,
            cuentas: activeCuentas,
            totalCuentas: activeCuentas.length
          },
          message: `Se encontraron ${activeCuentas.length} cuentas activas`
        };
      } else {
        return {
          success: false,
          error: {
            message: 'No se encontraron cuentas activas',
            code: 'NO_ACCOUNTS_FOUND'
          }
        };
      }
    }

    return result;
  }

  /**
   * Desencripta un número de cuenta si está encriptado
   * @param {string} accountNumber - Número de cuenta potencialmente encriptado
   * @returns {string} - Número de cuenta desencriptado
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
   * 2. Obtener beneficiarios de la misma cooperativa (API 2325)
   */
  async getCoopBeneficiariesDestination(cedula) {
    console.log('👥 [COOP-TRANSFER] Obteniendo beneficiarios cooperativa para cédula:', cedula);

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
      prccode: this.processCodes.COOP_BENEFICIARIES_DEST,
      idecl: cedula.trim()
    };

    console.log('📤 [COOP-TRANSFER] Solicitando beneficiarios cooperativa:', {
      ...beneficiariesData,
      idecl: '***' + beneficiariesData.idecl.slice(-4)
    });

    const result = await this.makeRequest(beneficiariesData);

    if (result.success) {
      console.log('🔍 [COOP-TRANSFER] Estado respuesta:', result.data.estado);
      console.log('🔍 [COOP-TRANSFER] Mensaje:', result.data.msg);

      // Manejo para "sin registros" - es un caso normal, no error
      if (result.data.estado === '001' && 
          (result.data.msg === 'REGISTROS NO DISPONIBLES' || 
           result.data.msg?.includes('NO DISPONIBLES'))) {
        console.log('ℹ️ [COOP-TRANSFER] Usuario sin beneficiarios cooperativa (caso normal)');
        return {
          success: true,
          data: {
            beneficiarios: [],
            totalBeneficiarios: 0
          },
          message: 'No tienes beneficiarios de la cooperativa registrados aún'
        };
      }

      const beneficiariesResult = this.interpretServerResponse(result.data, 'coop_beneficiaries');

      if (beneficiariesResult.success && result.data.beneficiario && Array.isArray(result.data.beneficiario)) {
        console.log('✅ [COOP-TRANSFER] Beneficiarios cooperativa obtenidos:', result.data.beneficiario.length);

        const processedBeneficiaries = result.data.beneficiario.map((beneficiario, index) => {
          const nombres = beneficiario.nombnf?.split(' ') || ['?', '?'];
          const avatar = nombres.length >= 2
            ? (nombres[0][0] + nombres[1][0]).toUpperCase()
            : (nombres[0]?.substring(0, 2) || '??').toUpperCase();

          return {
            id: beneficiario.codcta || `coop-beneficiario-${index}`,
            name: beneficiario.nombnf || 'Nombre no disponible',
            cedula: beneficiario.idebnf,
            email: beneficiario.bnfema?.trim() || '',
            phone: beneficiario.bnfcel?.trim() || '',
            bank: beneficiario.nomifi || 'COOPERATIVA DE AHORRO Y CREDITO VILCABAMBA',
            bankCode: beneficiario.codifi || 'CACVIL', // Valor por defecto, pero se usa el que viene de la API
            accountNumber: this.decryptAccountNumber(beneficiario.codcta), // 🔓 Desencriptar para mostrar
            accountNumberEncrypted: beneficiario.codcta, // 🔐 Preservar ORIGINAL para eliminación
            accountType: beneficiario.destcu || 'CUENTA DE AHORRO',
            accountTypeCode: beneficiario.codtcu,
            documentType: beneficiario.codtid,
            avatar: avatar,
            isCoopMember: true, // Identificador para miembros de la cooperativa
            _original: beneficiario
          };
        });

        return {
          success: true,
          data: {
            beneficiarios: processedBeneficiaries,
            totalBeneficiarios: processedBeneficiaries.length
          },
          message: `Se encontraron ${processedBeneficiaries.length} beneficiarios de la cooperativa`
        };
      } else {
        return {
          success: false,
          error: {
            message: beneficiariesResult.error?.message || 'Error al obtener beneficiarios de la cooperativa',
            code: 'NO_COOP_BENEFICIARIES_FOUND'
          }
        };
      }
    }

    return result;
  }

  /**
   * 3. Validar disponibilidad de fondos (API 2350)
   */
  async validateCoopTransferFunds(cedula, cuentaOrigen, montoTransferencia) {
    console.log('💰 [COOP-TRANSFER] Validando fondos para transferencia cooperativa');
    console.log('👤 [COOP-TRANSFER] Cédula:', '***' + cedula.slice(-4));
    console.log('🏦 [COOP-TRANSFER] Cuenta origen:', cuentaOrigen);
    console.log('💵 [COOP-TRANSFER] Monto:', montoTransferencia);

    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: { message: 'La cédula es requerida', code: 'CEDULA_REQUIRED' }
      };
    }

    if (!cuentaOrigen || !cuentaOrigen.trim()) {
      return {
        success: false,
        error: { message: 'La cuenta origen es requerida', code: 'ACCOUNT_ORIGIN_REQUIRED' }
      };
    }

    if (!montoTransferencia || parseFloat(montoTransferencia) <= 0) {
      return {
        success: false,
        error: { message: 'El monto debe ser mayor a cero', code: 'INVALID_AMOUNT' }
      };
    }

    const validationData = {
      prccode: this.processCodes.VALIDATE_TRANSFER_FUNDS,
      idecl: cedula.trim(),
      codctad: cuentaOrigen.trim(),
      valtrnf: parseFloat(montoTransferencia).toFixed(2),
      tiptrnf: "1" // Tipo transferencia cooperativa
    };

    console.log('📤 [COOP-TRANSFER] Validando fondos:', {
      ...validationData,
      idecl: '***' + validationData.idecl.slice(-4)
    });

    const result = await this.makeRequest(validationData);

    if (result.success) {
      const validationResult = this.interpretServerResponse(result.data, 'validate_coop_transfer');

      if (validationResult.success && result.data.estado === '000') {
        console.log('✅ [COOP-TRANSFER] Fondos disponibles para transferencia cooperativa');

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
        console.log('❌ [COOP-TRANSFER] Fondos insuficientes:', result.data.msg);

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
   * 4. Solicitar código de seguridad OTP para transferencia cooperativa (API 2155)
   */
  async requestOTPForCoopTransfer(cedula) {
    console.log('📨 [COOP-TRANSFER] Solicitando código OTP para transferencia cooperativa');
    console.log('👤 [COOP-TRANSFER] Cédula:', '***' + cedula.slice(-4));

    if (!cedula || !cedula.trim()) {
      return {
        success: false,
        error: { message: 'La cédula es requerida', code: 'CEDULA_REQUIRED' }
      };
    }

    const codeData = {
      prccode: this.processCodes.REQUEST_SECURITY_CODE,
      idecl: cedula.trim()
    };

    console.log('📤 [COOP-TRANSFER] Solicitando código OTP:', codeData);

    const result = await this.makeRequest(codeData);

    if (result.success) {
      const codeResult = this.interpretServerResponse(result.data, 'request_otp_coop');

      if (codeResult.success && result.data.cliente?.[0]?.idemsg) {
        console.log('✅ [COOP-TRANSFER] Código OTP solicitado exitosamente');
        
        // 🔓 DESENCRIPTAR idemsg usando helper
        const idemsg = this.decryptIdemsgIfNeeded(
          result.data.cliente[0].idemsg, 
          'COOP-TRANSFER-OTP'
        );
        
        console.log('🆔 [COOP-TRANSFER] idemsg procesado');

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
        console.error('❌ [COOP-TRANSFER] Error en respuesta:', result.data);
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
   * 5. Ejecutar transferencia entre usuarios cooperativa (API 2355)
   */
  async executeCoopTransfer(transferData) {
    console.log('🔄 [COOP-TRANSFER] Ejecutando transferencia entre usuarios cooperativa');

    // Validaciones básicas
    const requiredFields = ['cedula', 'cuentaOrigen', 'cuentaDestino', 'monto', 'descripcion', 'idemsg', 'codigoOTP'];
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
      prccode: this.processCodes.EXECUTE_COOP_TRANSFER,
      idecl: transferData.cedula.trim(),
      codctad: transferData.cuentaOrigen.trim(),    // Cuenta origen
      codctac: transferData.cuentaDestino.trim(),   // Cuenta destino (beneficiario cooperativa)
      valtrnf: parseFloat(transferData.monto).toFixed(2),
      idemsg: transferData.idemsg.trim(),
      codseg: transferData.codigoOTP.trim(),
      dettrnf: transferData.descripcion.trim()
    };

    console.log('📤 [COOP-TRANSFER] Ejecutando transferencia cooperativa:', {
      ...executeData,
      idecl: '***' + executeData.idecl.slice(-4),
      codctad: '***' + executeData.codctad.slice(-4),
      codctac: '***' + executeData.codctac.slice(-4),
      codseg: '***' + executeData.codseg.slice(-2)
    });

    const result = await this.makeRequest(executeData);

    if (result.success) {
      const executeResult = this.interpretServerResponse(result.data, 'execute_coop_transfer');

      if (executeResult.success && result.data.estado === '000') {
        console.log('✅ [COOP-TRANSFER] Transferencia cooperativa ejecutada exitosamente');

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
              numeroReferencia: result.data.numref || 'N/A',
              tipoTransferencia: 'cooperativa'
            },
            respuestaCompleta: result.data
          },
          message: result.data.msg || 'Transferencia cooperativa realizada exitosamente'
        };
      } else {
        console.error('❌ [COOP-TRANSFER] Error en transferencia cooperativa:', result.data);

        let errorMessage = result.data.msg || 'Error al ejecutar la transferencia cooperativa';
        let errorCode = 'COOP_TRANSFER_EXECUTION_ERROR';

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

  // ==========================================
  // MÉTODOS DE CONVENIENCIA
  // ==========================================

  /**
   * Obtener cuentas origen del usuario actual
   */
  async getCurrentUserCoopAccountsOrigin() {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: { message: 'No hay sesión activa', code: 'NO_USER_SESSION' }
      };
    }
    return await this.getCoopAccountsOrigin(cedula);
  }

  /**
   * Obtener beneficiarios cooperativa del usuario actual
   */
  async getCurrentUserCoopBeneficiaries() {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: { message: 'No hay sesión activa', code: 'NO_USER_SESSION' }
      };
    }
    return await this.getCoopBeneficiariesDestination(cedula);
  }

  /**
   * Validar fondos del usuario actual
   */
  async validateCurrentUserCoopTransfer(cuentaOrigen, montoTransferencia) {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: { message: 'No hay sesión activa', code: 'NO_USER_SESSION' }
      };
    }
    return await this.validateCoopTransferFunds(cedula, cuentaOrigen, montoTransferencia);
  }

  /**
   * Solicitar OTP del usuario actual
   */
  async requestCurrentUserCoopOTP() {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: { message: 'No hay sesión activa', code: 'NO_USER_SESSION' }
      };
    }
    return await this.requestOTPForCoopTransfer(cedula);
  }

  /**
   * Ejecutar transferencia cooperativa del usuario actual
   */
  async executeCurrentUserCoopTransfer(transferData) {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: { message: 'No hay sesión activa', code: 'NO_USER_SESSION' }
      };
    }

    const completeTransferData = {
      cedula: cedula,
      ...transferData
    };

    return await this.executeCoopTransfer(completeTransferData);
  }

  /**
 * Obtener instituciones financieras (API 2310)
 */
async getFinancialInstitutions() {
  console.log('🏦 [INSTITUTIONS] Obteniendo instituciones financieras');

  const institutionsData = {
    prccode: '2310',
    ctrifact: "1"
  };

  const result = await this.makeRequest(institutionsData);

  if (result.success) {
    const institutionsResult = this.interpretServerResponse(result.data, 'financial_institutions');

    if (institutionsResult.success && result.data.listado && Array.isArray(result.data.listado)) {
      console.log('✅ [INSTITUTIONS] Instituciones obtenidas:', result.data.listado.length);

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
          message: 'No se encontraron instituciones financieras',
          code: 'NO_INSTITUTIONS_FOUND'
        }
      };
    }
  }

  return result;
}

/**
 * Obtener tipos de cuentas (API 2320)
 */
async getAccountTypes() {
  console.log('📋 [ACCOUNT-TYPES] Obteniendo tipos de cuenta');

  const accountTypesData = {
    prccode: '2320'
  };

  const result = await this.makeRequest(accountTypesData);

  if (result.success) {
    const accountTypesResult = this.interpretServerResponse(result.data, 'account_types');

    if (accountTypesResult.success && result.data.listado && Array.isArray(result.data.listado)) {
      console.log('✅ [ACCOUNT-TYPES] Tipos de cuenta obtenidos:', result.data.listado.length);

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
          message: 'No se encontraron tipos de cuenta',
          code: 'NO_ACCOUNT_TYPES_FOUND'
        }
      };
    }
  }

  return result;
}

/**
 * Crear beneficiario con nueva cuenta (API 2365)
 */
async createBeneficiaryForCurrentUser(beneficiaryInfo) {
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

  const beneficiaryData = {
    idecl: cedula,
    codtidr: '1', // Tipo documento por defecto
    ...beneficiaryInfo
  };

  console.log('➕ [CREATE-BENEFICIARY] Creando beneficiario con nueva cuenta:', {
    ...beneficiaryData,
    idecl: '***' + beneficiaryData.idecl.slice(-4)
  });

  const createData = {
    prccode: '2365',
    idecl: beneficiaryData.idecl.trim(),
    codifi: beneficiaryData.codifi.toString(),
    codtidr: beneficiaryData.codtidr || '1',
    ideclr: beneficiaryData.ideclr.trim(),
    nomclr: beneficiaryData.nomclr.trim(),
    codtcur: beneficiaryData.codtcur.toString(),
    codctac: beneficiaryData.codctac.trim(),
    bnfema: beneficiaryData.bnfema || '',
    bnfcel: beneficiaryData.bnfcel || ''
  };

  const result = await this.makeRequest(createData);

  if (result.success) {
    const createResult = this.interpretServerResponse(result.data, 'create_beneficiary');

    if (createResult.success && result.data.estado === '000') {
      console.log('✅ [CREATE-BENEFICIARY] Beneficiario creado exitosamente');

      return {
        success: true,
        data: {
          message: result.data.msg,
          beneficiaryData: createData
        },
        message: result.data.msg || 'Beneficiario registrado correctamente'
      };
    } else {
      console.error('❌ [CREATE-BENEFICIARY] Error:', result.data.msg);

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

  // ==========================================
  // MÉTODOS AUXILIARES
  // ==========================================

  /**
   * Formatear número de cuenta
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

  /**
   * Buscar beneficiarios por término
   */
  searchBeneficiaries(beneficiaries, searchTerm) {
    if (!searchTerm || !searchTerm.trim()) {
      return beneficiaries;
    }

    const term = searchTerm.toLowerCase().trim();

    return beneficiaries.filter(beneficiario =>
      beneficiario.name.toLowerCase().includes(term) ||
      beneficiario.cedula?.includes(term) ||
      beneficiario.accountNumber?.includes(term) ||
      beneficiario.email?.toLowerCase().includes(term) ||
      beneficiario.phone?.includes(term)
    );
  }

  /**
   * Validar email
   */
  validateEmail(email) {
    if (!email || !email.trim()) {
      return { isValid: true, error: null }; // Email es opcional
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return {
        isValid: false,
        error: 'Ingresa un email válido'
      };
    }

    return { isValid: true, error: null };
  }

  /**
   * Validar teléfono
   */
  validatePhone(phone) {
    if (!phone || !phone.trim()) {
      return { isValid: true, error: null }; // Teléfono es opcional
    }

    const cleanPhone = phone.replace(/\s/g, '');
    if (!/^09\d{8}$/.test(cleanPhone)) {
      return {
        isValid: false,
        error: 'El celular debe tener 10 dígitos y comenzar con 09'
      };
    }

    return { isValid: true, error: null };
  }
}

// Crear instancia del servicio
const apiServiceTransfer = new ApiServiceTransfer();

export default apiServiceTransfer;