import apiService from './apiService';

// 🔐 IMPORTACIÓN: Sistema de encriptación
import { encryptRequest, decryptResponse } from '../utils/crypto/index.js';

/**
 * API Service especializado para transferencias interbancarias (externas)
 * Documentación basada en APIs 2300, 2330, 2350, 2360, 2155
 */

const API_CONFIG = {
  baseUrl: '/api-l/prctrans.php', // SOLO servidor con L
  token: '0999SolSTIC20220719',
  // Aumentado a 60s para evitar abortos prematuros en transferencias externas
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

/**
 * Códigos de proceso para transferencias interbancarias
 */
const PROCESS_CODES = {
  // Códigos para transferencias interbancarias
  ACCOUNTS_ORIGIN: '2300',              // Obtener cuentas origen del usuario
  EXTERNAL_BENEFICIARIES: '2330',       // Obtener beneficiarios externos (otros bancos)
  VALIDATE_TRANSFER_FUNDS: '2350',      // Validar disponibilidad de fondos
  EXECUTE_EXTERNAL_TRANSFER: '2360',    // Ejecutar transferencia interbancaria
  REQUEST_SECURITY_CODE: '2155',        // Solicitar código de seguridad OTP
};

class ApiServiceTransferExt {
  constructor() {
    this.config = API_CONFIG;
    this.processCodes = PROCESS_CODES;
  }

  /**
   * Método genérico para realizar peticiones HTTP
   */
  async makeRequest(data, options = {}) {
    const targetUrl = this.config.baseUrl;

    console.log('🔧 [API-TRANSFER-EXT] Configurando petición...');
    console.log('🌐 [API-TRANSFER-EXT] URL objetivo:', targetUrl);
    console.log('📋 [API-TRANSFER-EXT] Código de proceso:', data.prccode);

    // 🔐 ENCRIPTAR DATOS SENSIBLES ANTES DE ENVIAR
    let processedData = { ...data };
    try {
      processedData = encryptRequest(data);
      console.log('🔐 [API-TRANSFER-EXT] Datos encriptados aplicados');
    } catch (encryptError) {
      console.warn('⚠️ [API-TRANSFER-EXT] Error al encriptar, enviando datos sin encriptar:', encryptError.message);
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
        console.log('⏰ [API-TRANSFER-EXT] Timeout alcanzado, abortando petición...');
        controller.abort();
      }, options.timeout || this.config.timeout);

      requestOptions.signal = controller.signal;

      const response = await fetch(targetUrl, requestOptions);
      clearTimeout(timeoutId);

      console.log('📊 [API-TRANSFER-EXT] Respuesta recibida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ [API-TRANSFER-EXT] Datos parseados correctamente:', result);
      
      // 🔓 DESENCRIPTAR RESPUESTA DEL BACKEND
      let decryptedResult = result;
      try {
        decryptedResult = decryptResponse(result, data.prccode);
        console.log('🔓 [API-TRANSFER-EXT] Datos desencriptados aplicados');
      } catch (decryptError) {
        console.warn('⚠️ [API-TRANSFER-EXT] Error al desencriptar, usando datos sin desencriptar:', decryptError.message);
      }
      
      return this.handleResponse(decryptedResult);

    } catch (error) {
      console.error('❌ [API-TRANSFER-EXT] Error en la petición:', error);
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
  // MÉTODOS PARA TRANSFERENCIAS INTERBANCARIAS
  // ==========================================

  /**
   * 1. Obtener cuentas origen del usuario (API 2300)
   * Mismo método que transferencias internas
   */
  async getExternalAccountsOrigin(cedula) {
    console.log('🏦 [EXTERNAL-TRANSFER] Obteniendo cuentas origen para cédula:', cedula);

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
      prccode: this.processCodes.ACCOUNTS_ORIGIN,
      idecl: cedula.trim()
    };

    const result = await this.makeRequest(accountsData);

    if (result.success) {
      const accountsResult = this.interpretServerResponse(result.data, 'external_accounts_origin');

      if (accountsResult.success && result.data.cliente?.cuentas && Array.isArray(result.data.cliente.cuentas)) {
        console.log('✅ [EXTERNAL-TRANSFER] Cuentas origen obtenidas:', result.data.cliente.cuentas.length);

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
   * 2. Obtener beneficiarios externos (otros bancos) (API 2330)
   */
  async getExternalBeneficiariesDestination(cedula) {
    console.log('👥 [EXTERNAL-TRANSFER] Obteniendo beneficiarios externos para cédula:', cedula);

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
      prccode: this.processCodes.EXTERNAL_BENEFICIARIES,
      idecl: cedula.trim()
    };

    console.log('📤 [EXTERNAL-TRANSFER] Solicitando beneficiarios externos:', {
      ...beneficiariesData,
      idecl: '***' + beneficiariesData.idecl.slice(-4)
    });

    const result = await this.makeRequest(beneficiariesData);

    if (result.success) {
      console.log('🔍 [EXTERNAL-TRANSFER] Estado respuesta:', result.data.estado);
      console.log('🔍 [EXTERNAL-TRANSFER] Mensaje:', result.data.msg);

      // Manejo para "sin registros" - es un caso normal, no error
      if (result.data.estado === '001' && 
          (result.data.msg === 'REGISTROS NO DISPONIBLES' || 
           result.data.msg?.includes('NO DISPONIBLES'))) {
        console.log('ℹ️ [EXTERNAL-TRANSFER] Usuario sin beneficiarios externos (caso normal)');
        return {
          success: true,
          data: {
            beneficiarios: [],
            totalBeneficiarios: 0
          },
          message: 'No tienes beneficiarios de otros bancos registrados aún'
        };
      }

      const beneficiariesResult = this.interpretServerResponse(result.data, 'external_beneficiaries');

      if (beneficiariesResult.success && result.data.beneficiario && Array.isArray(result.data.beneficiario)) {
        console.log('✅ [EXTERNAL-TRANSFER] Beneficiarios externos obtenidos:', result.data.beneficiario.length);

        const processedBeneficiaries = result.data.beneficiario.map((beneficiario, index) => {
          const nombres = beneficiario.nombnf?.split(' ') || ['?', '?'];
          const avatar = nombres.length >= 2
            ? (nombres[0][0] + nombres[1][0]).toUpperCase()
            : (nombres[0]?.substring(0, 2) || '??').toUpperCase();

          return {
            id: beneficiario.codcta || `external-beneficiario-${index}`,
            name: beneficiario.nombnf || 'Nombre no disponible',
            cedula: beneficiario.idebnf,
            email: beneficiario.bnfema?.trim() || '',
            phone: beneficiario.bnfcel?.trim() || '',
            bank: beneficiario.nomifi || 'Banco no especificado',
            bankCode: beneficiario.codifi,
            accountNumber: beneficiario.codcta,
            accountType: beneficiario.destcu || 'CUENTA DE AHORRO',
            accountTypeCode: beneficiario.codtcu,
            documentType: beneficiario.codtid,
            avatar: avatar,
            isExternal: true, // Identificador para beneficiarios externos
            _original: beneficiario
          };
        });

        return {
          success: true,
          data: {
            beneficiarios: processedBeneficiaries,
            totalBeneficiarios: processedBeneficiaries.length
          },
          message: `Se encontraron ${processedBeneficiaries.length} beneficiarios externos`
        };
      } else {
        return {
          success: false,
          error: {
            message: beneficiariesResult.error?.message || 'Error al obtener beneficiarios externos',
            code: 'NO_EXTERNAL_BENEFICIARIES_FOUND'
          }
        };
      }
    }

    return result;
  }

  /**
   * 3. Validar disponibilidad de fondos (API 2350)
   * Mismo método que transferencias internas
   */
  async validateExternalTransferFunds(cedula, cuentaOrigen, montoTransferencia) {
    console.log('💰 [EXTERNAL-TRANSFER] Validando fondos para transferencia externa');
    console.log('👤 [EXTERNAL-TRANSFER] Cédula:', '***' + cedula.slice(-4));
    console.log('🏦 [EXTERNAL-TRANSFER] Cuenta origen:', cuentaOrigen);
    console.log('💵 [EXTERNAL-TRANSFER] Monto:', montoTransferencia);

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
      tiptrnf: "1" // Tipo transferencia externa
    };

    console.log('📤 [EXTERNAL-TRANSFER] Validando fondos:', {
      ...validationData,
      idecl: '***' + validationData.idecl.slice(-4)
    });

    const result = await this.makeRequest(validationData);

    if (result.success) {
      const validationResult = this.interpretServerResponse(result.data, 'validate_external_transfer');

      if (validationResult.success && result.data.estado === '000') {
        console.log('✅ [EXTERNAL-TRANSFER] Fondos disponibles para transferencia externa');

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
        console.log('❌ [EXTERNAL-TRANSFER] Fondos insuficientes:', result.data.msg);

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
   * 4. Solicitar código de seguridad OTP para transferencia externa (API 2155)
   */
  async requestOTPForExternalTransfer(cedula) {
    console.log('📨 [EXTERNAL-TRANSFER] Solicitando código OTP para transferencia externa');
    console.log('👤 [EXTERNAL-TRANSFER] Cédula:', '***' + cedula.slice(-4));

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

    console.log('📤 [EXTERNAL-TRANSFER] Solicitando código OTP:', codeData);

    const result = await this.makeRequest(codeData);

    if (result.success) {
      const codeResult = this.interpretServerResponse(result.data, 'request_otp_external');

      if (codeResult.success && result.data.cliente?.[0]?.idemsg) {
        console.log('✅ [EXTERNAL-TRANSFER] Código OTP solicitado exitosamente');
        console.log('🆔 [EXTERNAL-TRANSFER] idemsg obtenido:', result.data.cliente[0].idemsg);

        return {
          success: true,
          data: {
            idemsg: result.data.cliente[0].idemsg,
            idecli: result.data.cliente[0].idecli,
            message: result.data.msg || 'Código de seguridad enviado'
          },
          message: 'Código de seguridad enviado a tu celular registrado'
        };
      } else {
        console.error('❌ [EXTERNAL-TRANSFER] Error en respuesta:', result.data);
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
   * 5. Ejecutar transferencia interbancaria (API 2360)
   */
  async executeExternalTransfer(transferData) {
    console.log('🔄 [EXTERNAL-TRANSFER] Ejecutando transferencia interbancaria');

    // Validaciones básicas - más campos que transferencia interna
    const requiredFields = [
      'cedula', 'cuentaOrigen', 'cuentaDestino', 'monto', 'codigoBanco', 
      'tipoDocumentoReceptor', 'cedulaReceptor', 'nombreReceptor', 
      'tipoCuentaReceptor', 'descripcion', 'idemsg', 'codigoOTP'
    ];
    
    for (const field of requiredFields) {
      if (!transferData[field] || !transferData[field].toString().trim()) {
        return {
          success: false,
          error: {
            message: `El campo ${field} es requerido para ejecutar la transferencia interbancaria`,
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
      prccode: this.processCodes.EXECUTE_EXTERNAL_TRANSFER,
      idecl: transferData.cedula.trim(),
      codctad: transferData.cuentaOrigen.trim(),     // Cuenta origen
      valtrnf: parseFloat(transferData.monto).toFixed(2),
      codifi: transferData.codigoBanco.toString(),   // Código institución receptora
      codtidr: transferData.tipoDocumentoReceptor.toString(),
      ideclr: transferData.cedulaReceptor.trim(),    // Cédula receptor
      nomclr: transferData.nombreReceptor.trim(),    // Nombre receptor
      codtcur: transferData.tipoCuentaReceptor.toString(),
      codctac: transferData.cuentaDestino.trim(),    // Cuenta destino
      infopi: transferData.descripcion.trim(),       // Descripción/concepto
      idemsg: transferData.idemsg.trim(),
      codseg: transferData.codigoOTP.trim(),
      bnfcel: transferData.telefonoReceptor?.trim() || '', // Opcional
      bnfema: transferData.emailReceptor?.trim() || ''     // Opcional
    };

    console.log('📤 [EXTERNAL-TRANSFER] Ejecutando transferencia interbancaria:', {
      ...executeData,
      idecl: '***' + executeData.idecl.slice(-4),
      codctad: '***' + executeData.codctad.slice(-4),
      codctac: '***' + executeData.codctac.slice(-4),
      ideclr: '***' + executeData.ideclr.slice(-4),
      codseg: '***' + executeData.codseg.slice(-2)
    });

    const result = await this.makeRequest(executeData);

    if (result.success) {
      const executeResult = this.interpretServerResponse(result.data, 'execute_external_transfer');

      if (executeResult.success && result.data.estado === '000') {
        console.log('✅ [EXTERNAL-TRANSFER] Transferencia interbancaria ejecutada exitosamente');

        return {
          success: true,
          data: {
            mensaje: result.data.msg,
            transferencia: {
              cuentaOrigen: transferData.cuentaOrigen,
              cuentaDestino: transferData.cuentaDestino,
              monto: parseFloat(transferData.monto),
              descripcion: transferData.descripcion,
              beneficiario: transferData.nombreReceptor,
              bancoDestino: transferData.nombreBanco,
              fecha: new Date().toISOString(),
              numeroReferencia: result.data.numref || 'N/A',
              tipoTransferencia: 'interbancaria'
            },
            respuestaCompleta: result.data
          },
          message: result.data.msg || 'Transferencia interbancaria realizada exitosamente'
        };
      } else {
        console.error('❌ [EXTERNAL-TRANSFER] Error en transferencia interbancaria:', result.data);

        let errorMessage = result.data.msg || 'Error al ejecutar la transferencia interbancaria';
        let errorCode = 'EXTERNAL_TRANSFER_EXECUTION_ERROR';

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
          case '011':
            errorMessage = 'El banco destino no está disponible temporalmente';
            errorCode = 'BANK_UNAVAILABLE';
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
  async getCurrentUserExternalAccountsOrigin() {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: { message: 'No hay sesión activa', code: 'NO_USER_SESSION' }
      };
    }
    return await this.getExternalAccountsOrigin(cedula);
  }

  /**
   * Obtener beneficiarios externos del usuario actual
   */
  async getCurrentUserExternalBeneficiaries() {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: { message: 'No hay sesión activa', code: 'NO_USER_SESSION' }
      };
    }
    return await this.getExternalBeneficiariesDestination(cedula);
  }

  /**
   * Validar fondos del usuario actual
   */
  async validateCurrentUserExternalTransfer(cuentaOrigen, montoTransferencia) {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: { message: 'No hay sesión activa', code: 'NO_USER_SESSION' }
      };
    }
    return await this.validateExternalTransferFunds(cedula, cuentaOrigen, montoTransferencia);
  }

  /**
   * Solicitar OTP del usuario actual
   */
  async requestCurrentUserExternalOTP() {
    const cedula = this.getUserCedula();
    if (!cedula) {
      return {
        success: false,
        error: { message: 'No hay sesión activa', code: 'NO_USER_SESSION' }
      };
    }
    return await this.requestOTPForExternalTransfer(cedula);
  }

  /**
   * Ejecutar transferencia externa del usuario actual
   */
  async executeCurrentUserExternalTransfer(transferData) {
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

    return await this.executeExternalTransfer(completeTransferData);
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
      beneficiario.bank.toLowerCase().includes(term) ||
      beneficiario.cedula?.includes(term) ||
      beneficiario.accountNumber?.includes(term) ||
      beneficiario.email?.toLowerCase().includes(term) ||
      beneficiario.phone?.includes(term)
    );
  }

  /**
   * Identificar si un beneficiario es de CACVIL (Cooperativa Vilcabamba)
   */
  isCoopVilcabamba(beneficiario) {
    // Identificar por código de institución o nombre
    // CACVIL es cooperativa interna, Las Naves (136) es externa
    return beneficiario.bankCode === 'CACVIL' || 
           beneficiario.bankCode === '999' ||
           beneficiario.bank.toUpperCase().includes('CACVIL') ||
           beneficiario.bank.toUpperCase().includes('VILCABAMBA') ||
           beneficiario.bank.toUpperCase().includes('COOPERATIVA VILCABAMBA');
  }

  /**
   * Separar beneficiarios por tipo
   */
  separateBeneficiariesByType(beneficiaries) {
    const coopBeneficiaries = [];
    const externalBeneficiaries = [];

    beneficiaries.forEach(beneficiario => {
      if (this.isCoopVilcabamba(beneficiario)) {
        coopBeneficiaries.push({ ...beneficiario, isCoopMember: true });
      } else {
        externalBeneficiaries.push({ ...beneficiario, isExternal: true });
      }
    });

    return {
      coopBeneficiaries,
      externalBeneficiaries,
      total: beneficiaries.length
    };
  }
}

// Crear instancia del servicio
const apiServiceTransferExt = new ApiServiceTransferExt();

export default apiServiceTransferExt;