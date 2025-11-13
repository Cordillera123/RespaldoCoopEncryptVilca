import React, { useState, useEffect } from 'react';
import { MdAccountBalance, MdEdit, MdCheckCircle, MdWarning, MdArrowBack } from 'react-icons/md';
import apiService from '../../services/apiService';
import { decrypt } from '../../utils/crypto/encryptionService';

/**
 * Componente para Personalización de Cupos de Transferencia
 * Permite al usuario configurar el monto máximo diario de transferencia por cuenta
 */
const CupoComponent = () => {
  // Estados principales
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'configure' | 'otp' | 'success'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cuentas y configuración
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [maximumAmount, setMaximumAmount] = useState('');
  const [amountError, setAmountError] = useState('');

  // Estados para OTP
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [idemsg, setIdemsg] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [canResendOTP, setCanResendOTP] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [showOTPInstructions, setShowOTPInstructions] = useState(true);

  // Información del usuario
  const [userCedula, setUserCedula] = useState('');

  const maxAttempts = 3;
  const otpInputRefs = React.useRef([]);

  // Cargar cuentas al montar
  useEffect(() => {
    loadTransferAccounts();
  }, []);

  // Countdown para reenvío de OTP
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (resendCountdown === 0 && !canResendOTP) {
      setCanResendOTP(true);
    }
  }, [resendCountdown, canResendOTP]);

  /**
   * Cargar cuentas habilitadas para transferencia (API 2300)
   */
  const loadTransferAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🏦 [CUPO] Cargando cuentas habilitadas para transferencia...');

      // Obtener cédula del usuario
      const cedula = apiService.getUserCedula();
      if (!cedula) {
        throw new Error('No se pudo obtener la cédula del usuario');
      }
      setUserCedula(cedula);

      // Llamar a API 2300 para obtener cuentas
      const result = await apiService.getCurrentUserTransferAccounts(cedula);

      if (!result.success) {
        throw new Error(result.error?.message || 'Error al cargar cuentas');
      }

      // Procesar y desencriptar cuentas
      if (result.data?.cliente?.cuentas && Array.isArray(result.data.cliente.cuentas)) {
        const cuentasFormateadas = result.data.cliente.cuentas.map((cuenta, index) => {
          // 🔓 Desencriptar código de cuenta
          let codctaDecrypted = cuenta.codcta;
          try {
            codctaDecrypted = decrypt(cuenta.codcta);
            if (index === 0) {
              console.log(`🔓 [CUPO] Desencriptando codcta: ${cuenta.codcta.substring(0, 20)}... -> ${codctaDecrypted}`);
            }
          } catch (error) {
            console.error('❌ [CUPO] Error al desencriptar codcta:', error);
          }

          // 🔓 Desencriptar saldos si vienen encriptados
          let saldisDecrypted = cuenta.saldis;
          let salcntDecrypted = cuenta.salcnt;
          let mxmretDecrypted = cuenta.mxmret; // Cupo máximo actual

          // Desencriptar saldo disponible
          if (typeof cuenta.saldis === 'string' && cuenta.saldis.length > 10 && cuenta.saldis.includes('=')) {
            try {
              saldisDecrypted = decrypt(cuenta.saldis);
              if (index === 0) {
                console.log(`🔓 [CUPO] Desencriptando saldis: ${cuenta.saldis.substring(0, 20)}... -> ${saldisDecrypted}`);
              }
            } catch (error) {
              console.error('❌ [CUPO] Error al desencriptar saldis:', error);
            }
          }

          // Desencriptar saldo contable
          if (typeof cuenta.salcnt === 'string' && cuenta.salcnt.length > 10 && cuenta.salcnt.includes('=')) {
            try {
              salcntDecrypted = decrypt(cuenta.salcnt);
              if (index === 0) {
                console.log(`🔓 [CUPO] Desencriptando salcnt: ${cuenta.salcnt.substring(0, 20)}... -> ${salcntDecrypted}`);
              }
            } catch (error) {
              console.error('❌ [CUPO] Error al desencriptar salcnt:', error);
            }
          }

          // Desencriptar cupo máximo si está encriptado
          if (typeof cuenta.mxmret === 'string' && cuenta.mxmret.length > 10 && cuenta.mxmret.includes('=')) {
            try {
              mxmretDecrypted = decrypt(cuenta.mxmret);
              if (index === 0) {
                console.log(`🔓 [CUPO] Desencriptando mxmret: ${cuenta.mxmret.substring(0, 20)}... -> ${mxmretDecrypted}`);
              }
            } catch (error) {
              console.error('❌ [CUPO] Error al desencriptar mxmret:', error);
            }
          }

          const saldoDisp = parseFloat(saldisDecrypted) || 0;
          const saldoCont = parseFloat(salcntDecrypted) || 0;
          const cupoMaximo = parseFloat(mxmretDecrypted) || 0;

          if (index === 0) {
            console.log('💰 [CUPO] Datos procesados:', {
              cuenta: codctaDecrypted,
              saldoDisponible: saldoDisp,
              saldoContable: saldoCont,
              cupoMaximo: cupoMaximo
            });
          }

          return {
            id: codctaDecrypted,
            numeroCuenta: codctaDecrypted,
            tipo: cuenta.desdep || cuenta.descri || 'Cuenta',
            estado: cuenta.desect || 'ACTIVA',
            saldoDisponible: saldoDisp,
            saldoContable: saldoCont,
            cupoMaximo: cupoMaximo,
            cupoPersonalizado: cupoMaximo > 0, // Si tiene cupo > 0, ya está personalizado
            // Guardar datos originales encriptados para envío posterior
            _originalData: {
              codcta: cuenta.codcta, // Encriptado
              codctaDecrypted: codctaDecrypted // Desencriptado
            }
          };
        });

        setAccounts(cuentasFormateadas);
        console.log(`✅ [CUPO] ${cuentasFormateadas.length} cuentas cargadas correctamente`);
      } else {
        throw new Error('No se encontraron cuentas habilitadas para transferencia');
      }

    } catch (err) {
      console.error('❌ [CUPO] Error cargando cuentas:', err);
      setError(err.message || 'Error al cargar cuentas');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Seleccionar cuenta para configurar
   */
  const handleSelectAccount = (account) => {
    console.log('📝 [CUPO] Cuenta seleccionada:', account.numeroCuenta);
    setSelectedAccount(account);
    setMaximumAmount(account.cupoMaximo > 0 ? account.cupoMaximo.toString() : '');
    setAmountError('');
    setCurrentView('configure');
  };

  /**
   * Validar monto ingresado
   */
  const validateAmount = (amount) => {
    const numAmount = parseFloat(amount);

    if (!amount || amount.trim() === '') {
      return 'Ingrese un monto';
    }

    if (isNaN(numAmount)) {
      return 'Ingrese un monto válido';
    }

    if (numAmount <= 0) {
      return 'El monto debe ser mayor a 0';
    }

    if (numAmount > selectedAccount.saldoDisponible) {
      return `El monto no puede superar el saldo disponible ($${selectedAccount.saldoDisponible.toLocaleString('es-EC', { minimumFractionDigits: 2 })})`;
    }

    return '';
  };

  /**
   * Continuar a validación OTP
   */
  const handleContinueToOTP = () => {
    const error = validateAmount(maximumAmount);
    if (error) {
      setAmountError(error);
      return;
    }

    setAmountError('');
    setCurrentView('otp');
    setShowOTPInstructions(true);
  };

  /**
   * Solicitar código OTP
   */
  const requestOTPCode = async () => {
    try {
      setOtpLoading(true);
      setOtpError('');

      console.log('📧 [CUPO] Solicitando código OTP...');

      const result = await apiService.requestSecurityCodeForRegistration(userCedula);

      if (result.success) {
        setIdemsg(result.data.idemsg);
        setOtpRequested(true);
        setShowOTPInstructions(false);
        setCanResendOTP(false);
        setResendCountdown(60);
        
        console.log('✅ [CUPO] Código OTP enviado exitosamente');
        console.log('📱 [CUPO] idemsg:', result.data.idemsg);

        // Focus en primer input
        setTimeout(() => {
          if (otpInputRefs.current[0]) {
            otpInputRefs.current[0].focus();
          }
        }, 100);
      } else {
        throw new Error(result.error?.message || 'Error al solicitar código OTP');
      }
    } catch (err) {
      console.error('❌ [CUPO] Error solicitando OTP:', err);
      setOtpError(err.message || 'Error al solicitar código de verificación');
    } finally {
      setOtpLoading(false);
    }
  };

  /**
   * Manejar cambio en inputs de OTP
   */
  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtpCode = [...otpCode];
    newOtpCode[index] = value;
    setOtpCode(newOtpCode);
    setOtpError('');

    // Auto-focus al siguiente input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * Manejar tecla en inputs de OTP
   */
  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  /**
   * Validar OTP y configurar cupo (API 2303)
   */
  const handleValidateOTP = async () => {
    const fullCode = otpCode.join('');

    if (fullCode.length !== 6) {
      setOtpError('Por favor ingrese el código completo de 6 dígitos');
      return;
    }

    if (!idemsg) {
      setOtpError('No hay identificador de mensaje. Solicite un nuevo código.');
      return;
    }

    try {
      setOtpLoading(true);
      setOtpError('');

      console.log('🔐 [CUPO] Validando código OTP...');

      // Primero validar el OTP
      const validateResult = await apiService.validateSecurityCodeForRegistration(
        userCedula,
        idemsg,
        fullCode
      );

      if (!validateResult.success) {
        const newAttempts = otpAttempts + 1;
        setOtpAttempts(newAttempts);

        if (newAttempts >= maxAttempts) {
          setOtpError(`Código incorrecto. Ha superado el máximo de ${maxAttempts} intentos. El proceso se cancelará.`);
          setTimeout(() => {
            handleBackToList();
          }, 3000);
        } else {
          setOtpError(
            validateResult.error?.message || 
            `Código incorrecto. Te quedan ${maxAttempts - newAttempts} intentos.`
          );
          setOtpCode(['', '', '', '', '', '']);
          otpInputRefs.current[0]?.focus();
        }
        return;
      }

      console.log('✅ [CUPO] Código OTP validado correctamente');

      // Ahora configurar el cupo usando API 2303
      console.log('💾 [CUPO] Configurando cupo máximo...');
      console.log('📋 [CUPO] Parámetros:', {
        cedula: '***' + userCedula.slice(-4),
        cuenta: selectedAccount.numeroCuenta,
        monto: maximumAmount,
        idemsg: idemsg,
        codigo: fullCode
      });
      
      const configResult = await apiService.setAccountTransferLimit(
        userCedula,
        selectedAccount._originalData.codcta, // Usar cuenta encriptada
        parseFloat(maximumAmount),
        idemsg, // ID del mensaje OTP
        fullCode // Código OTP validado
      );

      if (configResult.success) {
        console.log('✅ [CUPO] Cupo configurado exitosamente');
        
        // Mostrar vista de éxito
        setCurrentView('success');
        
        // Recargar cuentas en segundo plano
        setTimeout(() => {
          loadTransferAccounts();
        }, 1000);
      } else {
        throw new Error(configResult.error?.message || 'Error al configurar el cupo');
      }

    } catch (err) {
      console.error('❌ [CUPO] Error en validación:', err);
      setOtpError(err.message || 'Error al validar el código');
    } finally {
      setOtpLoading(false);
    }
  };

  /**
   * Volver a lista principal
   */
  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedAccount(null);
    setMaximumAmount('');
    setAmountError('');
    setOtpCode(['', '', '', '', '', '']);
    setIdemsg('');
    setOtpRequested(false);
    setOtpError('');
    setOtpAttempts(0);
    setShowOTPInstructions(true);
  };

  // ==========================================
  // RENDERIZADO CONDICIONAL POR VISTA
  // ==========================================

  // Vista de carga
  if (loading) {
    return (
      <div className="min-h-full bg-sky-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando cuentas...</p>
          </div>
        </div>
      </div>
    );
  }

  // Vista de error
  if (error) {
    return (
      <div className="min-h-full bg-sky-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <MdWarning className="text-red-600 text-4xl mx-auto mb-2" />
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={loadTransferAccounts}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de configuración de monto
  if (currentView === 'configure' && selectedAccount) {
    return (
      <div className="min-h-full bg-sky-50">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={handleBackToList}
              className="flex items-center text-sky-600 hover:text-sky-700 font-medium mb-4"
            >
              <MdArrowBack className="mr-2" />
              Regresar
            </button>
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <MdEdit className="text-white text-2xl" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Personaliza tu cupo</h1>
            </div>
          </div>

          {/* Cuenta seleccionada */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Cuenta a configurar</h2>
            <div className="flex items-center space-x-4 p-4 bg-sky-50 rounded-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-sky-500 to-sky-600 rounded-full flex items-center justify-center shadow-md">
                <MdAccountBalance className="text-white text-xl" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{selectedAccount.tipo}</p>
                <p className="text-xs text-gray-500 font-mono">Nro. {selectedAccount.numeroCuenta}</p>
                <p className="text-sm text-sky-600 font-semibold mt-1">
                  Saldo: ${selectedAccount.saldoDisponible.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Formulario de monto */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Monto máximo diario</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingresa el monto máximo que deseas transferir diariamente desde esta cuenta
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-semibold">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={maximumAmount}
                  onChange={(e) => {
                    setMaximumAmount(e.target.value);
                    setAmountError('');
                  }}
                  onBlur={() => {
                    const error = validateAmount(maximumAmount);
                    setAmountError(error);
                  }}
                  placeholder="0.00"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg text-lg ${
                    amountError ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-sky-500`}
                />
              </div>
              {amountError && (
                <p className="mt-2 text-sm text-red-600">{amountError}</p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-blue-700">
                  Esta configuración se realizará de forma inmediata. El monto máximo que configures será el límite diario para realizar transferencias desde esta cuenta.
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleBackToList}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleContinueToOTP}
                disabled={!maximumAmount || amountError}
                className="flex-1 px-6 py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white rounded-lg font-medium transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista de éxito
  if (currentView === 'success' && selectedAccount) {
    return (
      <div className="min-h-full bg-sky-50">
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            {/* Icono de éxito animado */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <MdCheckCircle className="text-green-600 text-6xl" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                ¡Configuración Exitosa!
              </h2>
              <p className="text-gray-600">
                Tu cupo de transferencia ha sido actualizado correctamente
              </p>
            </div>

            {/* Detalles de la configuración */}
            <div className="bg-gradient-to-r from-sky-50 to-sky-100 rounded-xl p-6 mb-6 border border-sky-200">
              <h3 className="text-sm font-semibold text-sky-800 mb-4 flex items-center">
                <MdAccountBalance className="mr-2" />
                Detalles de la configuración
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Cuenta configurada:</span>
                  <span className="text-sm font-mono font-semibold text-gray-900">
                    {selectedAccount.numeroCuenta}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">Tipo de cuenta:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedAccount.tipo}
                  </span>
                </div>
                <div className="border-t border-sky-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base text-gray-700 font-medium">Cupo máximo diario:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${parseFloat(maximumAmount).toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800 mb-1">Importante:</p>
                  <p className="text-sm text-blue-700">
                    Este límite se aplicará a todas las transferencias realizadas desde esta cuenta durante el día. 
                    Puedes modificar este cupo en cualquier momento desde esta misma opción.
                  </p>
                </div>
              </div>
            </div>

            {/* Botón para finalizar */}
            <button
              onClick={handleBackToList}
              className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <MdCheckCircle className="text-xl" />
              <span>Aceptar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista de validación OTP
  if (currentView === 'otp' && selectedAccount) {
    return (
      <div className="min-h-full bg-sky-50">
        <div className="max-w-2xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => setCurrentView('configure')}
              className="flex items-center text-sky-600 hover:text-sky-700 font-medium mb-4"
            >
              <MdArrowBack className="mr-2" />
              Regresar
            </button>
            <div className="text-center">
              <div className="w-14 h-14 bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Verificación de Identidad</h1>
            </div>
          </div>

          {/* Pantalla de instrucciones */}
          {showOTPInstructions && !otpRequested && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">¿Por qué necesitamos esto?</h2>
                <p className="text-gray-600 mb-6">
                  Para tu seguridad, necesitamos verificar tu identidad antes de configurar el cupo de transferencia.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-sky-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    1
                  </div>
                  <p className="text-gray-700">Se enviará un código de verificación de 6 dígitos a tu correo electrónico y número de celular registrados.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-sky-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    2
                  </div>
                  <p className="text-gray-700">Recibirás el código en los próximos segundos.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-sky-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    3
                  </div>
                  <p className="text-gray-700">Ingresa el código en la siguiente pantalla para confirmar la configuración.</p>
                </div>
              </div>

              <button
                onClick={requestOTPCode}
                disabled={otpLoading}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white rounded-lg font-medium transition-colors"
              >
                {otpLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Enviando código...
                  </span>
                ) : (
                  'Enviar código de verificación'
                )}
              </button>
            </div>
          )}

          {/* Pantalla de ingreso de código */}
          {otpRequested && !showOTPInstructions && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="text-center mb-6">
                <MdCheckCircle className="text-sky-600 text-5xl mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Código Enviado</h2>
                <p className="text-gray-600">
                  Hemos enviado un código de 6 dígitos a tu correo y celular registrados.
                </p>
              </div>

              {/* Resumen de configuración */}
              <div className="bg-sky-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Configuración a aplicar:</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cuenta:</span>
                    <span className="font-mono text-gray-800">{selectedAccount.numeroCuenta}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cupo máximo diario:</span>
                    <span className="font-semibold text-sky-600">
                      ${parseFloat(maximumAmount).toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inputs de OTP */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Ingresa el código de verificación
                </label>
                <div className="flex justify-center space-x-2 mb-4">
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-sky-500 focus:outline-none"
                    />
                  ))}
                </div>

                {otpError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-700 text-center">{otpError}</p>
                  </div>
                )}

                {/* Botón de validar */}
                <button
                  onClick={handleValidateOTP}
                  disabled={otpLoading || otpCode.join('').length !== 6}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white rounded-lg font-medium transition-colors mb-4"
                >
                  {otpLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Validando...
                    </span>
                  ) : (
                    'Validar código'
                  )}
                </button>

                {/* Botón de reenviar */}
                <div className="text-center">
                  {canResendOTP ? (
                    <button
                      onClick={requestOTPCode}
                      disabled={otpLoading}
                      className="text-sm text-sky-600 hover:text-sky-700 font-medium"
                    >
                      Reenviar código
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Puedes solicitar un nuevo código en {resendCountdown}s
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista principal - Lista de cuentas
  return (
    <div className="min-h-full bg-sky-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <MdEdit className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Personalización de Cupos</h1>
          <p className="text-gray-600">Configura el monto máximo diario de transferencia por cuenta</p>
        </div>

        {/* Lista de cuentas */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Cuenta a configurar</h2>
          </div>

          {accounts.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleSelectAccount(account)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-sky-500 to-sky-600 rounded-full flex items-center justify-center shadow-md">
                        <MdAccountBalance className="text-white text-xl" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{account.tipo}</p>
                        <p className="text-xs text-gray-500 font-mono">Nro. {account.numeroCuenta} | Saldo ${account.saldoDisponible.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Cupo actual</p>
                        <p className={`text-sm font-semibold ${account.cupoPersonalizado ? 'text-sky-600' : 'text-gray-400'}`}>
                          {account.cupoPersonalizado 
                            ? `$${account.cupoMaximo.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`
                            : 'Sin cupo personalizado'
                          }
                        </p>
                      </div>
                      <button
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <MdEdit />
                        <span>Editar cupo</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <MdWarning className="text-gray-400 text-5xl mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No hay cuentas disponibles
              </h3>
              <p className="text-sm text-gray-500">
                No tienes cuentas habilitadas para transferencia.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CupoComponent;
