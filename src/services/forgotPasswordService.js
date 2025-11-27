// ✅ IMPORTAR SISTEMA DE ENCRIPTACIÓN
import { encryptRequest, decryptResponse } from '../utils/crypto/index.js';

const FORGOT_PASSWORD_CONFIG = {
  // ÚNICA URL: Todas las peticiones van al servidor con L
  baseUrl: '/api-l/prctrans.php', // SOLO servidor con L
    
  token: '0060CoacVilcabamba20220511',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

const FORGOT_PROCESS_CODES = {
  VALIDATE_USERNAME: '2148',
  VALIDATE_PASSWORD: '2151',
  SECURITY_QUESTION: '2340',
  VALIDATE_ANSWER: '2170',
  REQUEST_CODE: '2155',  
  UPDATE_PASSWORD: '2160',      // URL normal
};

class ForgotPasswordService {
  constructor() {
    this.config = FORGOT_PASSWORD_CONFIG;
    this.codes = FORGOT_PROCESS_CODES;
    
    console.log('🔑 [FORGOT-SERVICE] Inicializando servicio específico');
    console.log('🔑 [FORGOT-SERVICE] URL única:', this.config.baseUrl);
  }

  /**
   * Método genérico para hacer peticiones CON ENCRIPTACIÓN
   */
  async makeRequest(url, data) {
    console.log('🚀 [FORGOT-SERVICE] Petición a:', url);
    console.log('📦 [FORGOT-SERVICE] Datos originales:', data);

    // ✅ PASO 1: ENCRIPTAR REQUEST (sin incluir tkn)
    let processedData = { ...data };
    try {
      processedData = encryptRequest(data);
      console.log('🔐 [FORGOT-SERVICE] Datos encriptados aplicados');
    } catch (encryptError) {
      console.warn('⚠️ [FORGOT-SERVICE] Error al encriptar, enviando datos sin encriptar:', encryptError.message);
    }

    // ✅ PASO 2: AGREGAR TOKEN DESPUÉS DE ENCRIPTAR
    const bodyToSend = {
      tkn: this.config.token,
      ...processedData
    };

    console.log('� [FORGOT-SERVICE] Payload final:', {
      ...bodyToSend,
      tkn: '***' + this.config.token.slice(-4),
      pwd: bodyToSend.pwd ? '***' : undefined
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.config.headers,
        body: JSON.stringify(bodyToSend),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📊 [FORGOT-SERVICE] Status:', response.status);
      console.log('🌐 [FORGOT-SERVICE] URL final:', response.url);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
      }

      // ✅ PASO 3: Leer respuesta como texto primero (por si hay logs del backend PHP)
      const responseText = await response.text();
      console.log('📄 [FORGOT-SERVICE] Respuesta raw (primeros 300 chars):', responseText.substring(0, 300));
      
      let result;
      try {
        // Intentar parsear directamente
        result = JSON.parse(responseText);
        console.log('✅ [FORGOT-SERVICE] JSON parseado directamente');
      } catch (jsonError) {
        console.warn('⚠️ [FORGOT-SERVICE] Respuesta no es JSON puro, extrayendo...');
        
        // ESTRATEGIA MEJORADA: Buscar JSON válido ignorando debug PHP
        const lines = responseText.split('\n');
        let jsonString = null;
        
        // Buscar de atrás hacia adelante la primera línea con JSON válido
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (line.startsWith('{') && line.endsWith('}')) {
            try {
              const testParse = JSON.parse(line);
              jsonString = line;
              console.log('✅ [FORGOT-SERVICE] JSON encontrado en línea', i + 1);
              break;
            } catch (e) {
              continue;
            }
          }
        }
        
        // Fallback: buscar con regex
        if (!jsonString) {
          const jsonMatch = responseText.match(/\{[^{}]*"estado"[^{}]*\}/);
          if (jsonMatch) {
            jsonString = jsonMatch[0];
            console.log('✅ [FORGOT-SERVICE] JSON encontrado con regex');
          }
        }
        
        if (!jsonString) {
          throw new Error(`No se encontró JSON válido en la respuesta: ${responseText.substring(0, 200)}`);
        }
        
        result = JSON.parse(jsonString);
      }
      
      // ✅ PASO 4: DESENCRIPTAR RESPONSE
      const decryptedResult = decryptResponse(result, data.prccode);
      
      console.log('✅ [FORGOT-SERVICE] Respuesta desencriptada:', decryptedResult);
      
      return {
        success: true,
        data: decryptedResult
      };

    } catch (error) {
      console.error('❌ [FORGOT-SERVICE] Error:', error);
      
      let errorMessage = 'Error desconocido';
      let errorCode = 'UNKNOWN_ERROR';

      if (error.name === 'AbortError') {
        errorMessage = 'La petición ha excedido el tiempo límite';
        errorCode = 'TIMEOUT_ERROR';
      } else if (error.message.includes('Failed to fetch')) {
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
        }
      };
    }
  }

  /**
   * 1. Validar usuario (REQUIERE URL CON 'L')
   */
  async validateUsername(username) {
    console.log('👤 [FORGOT-SERVICE] Validando usuario:', username);
    
    if (!username || !username.trim()) {
      return {
        success: false,
        error: {
          message: 'El nombre de usuario es requerido',
          code: 'USERNAME_REQUIRED'
        }
      };
    }

    const result = await this.makeRequest(this.config.baseUrl, {
      prccode: this.codes.VALIDATE_USERNAME,
      usr: username.trim()
    });

    if (result.success) {
      if (result.data.estado === '000' && result.data.cliente && Array.isArray(result.data.cliente)) {
        console.log('✅ [FORGOT-SERVICE] Usuario validado exitosamente');
        return {
          success: true,
          data: result.data,
          message: 'Usuario encontrado correctamente'
        };
      } else {
        return {
          success: false,
          error: {
            message: result.data?.msg || 'Usuario no encontrado en el sistema',
            code: 'USER_NOT_FOUND'
          }
        };
      }
    }

    return result;
  }

  /**
   * 2. Validar formato de contraseña
   */
  async validatePasswordFormat(username, password) {
    console.log('🔐 [FORGOT-SERVICE] Validando formato de contraseña');

    const result = await this.makeRequest(this.config.baseUrl, {
      prccode: this.codes.VALIDATE_PASSWORD,
      usr: username.trim(),
      pwd: password.trim()
    });

    if (result.success) {
      if (result.data.estado === '000') {
        console.log('✅ [FORGOT-SERVICE] Formato de contraseña validado');
        return {
          success: true,
          message: 'La contraseña cumple con los requisitos de seguridad'
        };
      } else {
        return {
          success: false,
          error: {
            message: result.data?.msg || 'La contraseña no cumple con los requisitos',
            code: 'INVALID_PASSWORD_FORMAT'
          }
        };
      }
    }

    return result;
  }

  /**
   * 3. Obtener pregunta de seguridad (URL NORMAL)
   */
  async getSecurityQuestion(cedula) {
    console.log('🔒 [FORGOT-SERVICE] Obteniendo pregunta de seguridad para:', cedula);

    const result = await this.makeRequest(this.config.baseUrl, {
      prccode: this.codes.SECURITY_QUESTION,
      idecl: cedula.trim()
    });

    if (result.success) {
      if (result.data.estado === '000' && result.data.listado && Array.isArray(result.data.listado)) {
        console.log('✅ [FORGOT-SERVICE] Preguntas obtenidas exitosamente');
        return {
          success: true,
          questions: result.data.listado,
          message: 'Preguntas de seguridad obtenidas correctamente'
        };
      } else {
        return {
          success: false,
          error: {
            message: result.data?.msg || 'No se pudieron obtener las preguntas de seguridad',
            code: 'SECURITY_QUESTIONS_ERROR'
          }
        };
      }
    }

    return result;
  }

  /**
   * 4. Validar respuesta de seguridad (URL NORMAL)
   */
  async validateSecurityAnswer(cedula, codigoPregunta, respuesta) {
    console.log('🔐 [FORGOT-SERVICE] Validando respuesta de seguridad');

    const result = await this.makeRequest(this.config.baseUrl, {
      prccode: this.codes.VALIDATE_ANSWER,
      idecl: cedula.trim(),
      codprg: codigoPregunta.toString(),
      detrsp: respuesta.trim()
    });

    if (result.success) {
      if (result.data.estado === '000') {
        console.log('✅ [FORGOT-SERVICE] Respuesta validada correctamente');
        return {
          success: true,
          message: 'Respuesta de seguridad correcta'
        };
      } else {
        return {
          success: false,
          error: {
            message: result.data?.msg || 'La respuesta de seguridad es incorrecta',
            code: 'INVALID_SECURITY_ANSWER'
          }
        };
      }
    }

    return result;
  }

  /**
   * 5. Solicitar código de seguridad (URL NORMAL)
   */
  async requestSecurityCode(cedula) {
    console.log('📨 [FORGOT-SERVICE] Solicitando código de seguridad para:', cedula);

    const result = await this.makeRequest(this.config.baseUrl, {
      prccode: this.codes.REQUEST_CODE,
      idecl: cedula.trim()
    });

    if (result.success) {
      if (result.data.estado === '000' && result.data.cliente?.[0]?.idemsg) {
        console.log('✅ [FORGOT-SERVICE] Código solicitado exitosamente');
        return {
          success: true,
          data: result.data,
          message: 'Código de seguridad enviado correctamente'
        };
      } else {
        return {
          success: false,
          error: {
            message: result.data?.msg || 'No se pudo enviar el código de seguridad',
            code: 'CODE_REQUEST_ERROR'
          }
        };
      }
    }

    return result;
  }

  /**
   * 6. Actualizar contraseña con nueva contraseña (URL NORMAL)
   */
  async updatePasswordWithNewPassword({ cedula, usuario, newPassword, idemsg, codigo }) {
    console.log('🔄 [FORGOT-SERVICE] Actualizando con nueva contraseña');

    const result = await this.makeRequest(this.config.baseUrl, {
      prccode: this.codes.UPDATE_PASSWORD,
      idecl: cedula.trim(),
      usr: usuario.trim(),
      pwd: newPassword.trim(),
      idemsg: idemsg.trim(),
      codseg: codigo.trim()
    });

    if (result.success) {
      if (result.data.estado === '000') {
        console.log('✅ [FORGOT-SERVICE] Contraseña actualizada exitosamente');
        return {
          success: true,
          data: result.data,
          message: 'Contraseña actualizada correctamente'
        };
      } else {
        let errorMessage = result.data?.msg || 'Error al actualizar la contraseña';
        let errorCode = 'PASSWORD_UPDATE_ERROR';

        // Mapear códigos de error específicos
        switch (result.data?.estado) {
          case "006":
            errorMessage = 'El código de seguridad es incorrecto';
            errorCode = 'INVALID_SECURITY_CODE';
            break;
          case "007":
            errorMessage = 'El código de seguridad ha expirado';
            errorCode = 'EXPIRED_CODE';
            break;
          case "008":
            errorMessage = 'Usuario no encontrado';
            errorCode = 'USER_NOT_FOUND';
            break;
        }

        return {
          success: false,
          error: {
            message: errorMessage,
            code: errorCode
          }
        };
      }
    }

    return result;
  }
}

// Crear y exportar instancia
const forgotPasswordService = new ForgotPasswordService();
export default forgotPasswordService;