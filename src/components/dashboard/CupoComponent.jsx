import React, { useState, useEffect, useRef } from 'react';
import { 
  MdAccountBalance, 
  MdEdit, 
  MdCheckCircle, 
  MdArrowBack,
  MdInfo,
  MdSecurity,
  MdAttachMoney
} from 'react-icons/md';

/**
 * Componente para personalización de cupos diarios de transferencia
 * Permite al usuario configurar el monto máximo diario por cuenta
 */
const CupoComponent = () => {
  // Estados principales
  const [currentView, setCurrentView] = useState('select'); // 'select' | 'configure' | 'verify' | 'success'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Datos del formulario
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [customLimit, setCustomLimit] = useState('');
  const [accounts, setAccounts] = useState([]);
  
  // Estados para OTP
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const otpInputRefs = useRef([]);

  // Datos simulados de cuentas (esto se reemplazará con API real)
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      // TODO: Reemplazar con llamada a API real
      // Simulación de cuentas con cupos actuales
      const mockAccounts = [
        {
          id: '12009333652',
          name: 'Cuenta De Ahorros Nacional',
          number: '12009333652',
          balance: 115.75,
          currentLimit: null, // Sin cupo personalizado
          defaultLimit: 1000 // Límite por defecto del sistema
        },
        {
          id: '12009333653',
          name: 'Cuenta Corriente',
          number: '12009333653',
          balance: 2500.00,
          currentLimit: 500, // Cupo personalizado
          defaultLimit: 1000
        },
        {
          id: '12009333654',
          name: 'Cuenta De Ahorros Pro',
          number: '12009333654',
          balance: 5000.00,
          currentLimit: null,
          defaultLimit: 1000
        }
      ];
      
      setAccounts(mockAccounts);
    } catch (error) {
      console.error('Error cargando cuentas:', error);
      setError('No se pudieron cargar las cuentas');
    } finally {
      setLoading(false);
    }
  };

  // Manejo de selección de cuenta
  const handleSelectAccount = (account) => {
    setSelectedAccount(account);
    setCustomLimit(account.currentLimit || '');
    setCurrentView('configure');
  };

  // Manejo de cambio de monto
  const handleLimitChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomLimit(value);
  };

  // Continuar a verificación OTP
  const handleContinueToVerify = () => {
    if (!customLimit || parseFloat(customLimit) <= 0) {
      setError('Ingrese un monto válido');
      return;
    }
    
    if (parseFloat(customLimit) > selectedAccount.balance) {
      setError('El monto no puede ser mayor al saldo disponible');
      return;
    }
    
    setError(null);
    setCurrentView('verify');
  };

  // Solicitar código OTP
  const handleRequestOTP = async () => {
    setLoading(true);
    setOtpError(null);
    
    try {
      // TODO: Implementar llamada a API para solicitar OTP
      console.log('📧 Solicitando código OTP...');
      
      // Simulación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOtpSent(true);
      setCanResend(false);
      setCountdown(60);
      
      console.log('✅ Código OTP enviado');
    } catch (error) {
      console.error('Error solicitando OTP:', error);
      setOtpError('No se pudo enviar el código. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Manejo de cambio en inputs OTP
  const handleOTPChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOTP = [...otpCode];
    newOTP[index] = value;
    setOtpCode(newOTP);

    // Auto-focus al siguiente input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Manejo de tecla en inputs OTP
  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Validar código OTP
  const handleValidateOTP = async () => {
    const fullCode = otpCode.join('');
    
    if (fullCode.length !== 6) {
      setOtpError('Por favor ingrese el código completo de 6 dígitos');
      return;
    }

    setLoading(true);
    setOtpError(null);

    try {
      // TODO: Implementar validación de OTP con API
      console.log('🔐 Validando código OTP:', fullCode);
      
      // Simulación
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: Aquí iría la llamada real a la API para actualizar el cupo
      console.log('✅ Cupo actualizado exitosamente');
      
      setCurrentView('success');
    } catch (error) {
      console.error('Error validando OTP:', error);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setOtpError('Ha superado el número máximo de intentos. El proceso se cancelará.');
        setTimeout(() => {
          handleBackToSelect();
        }, 3000);
      } else {
        setOtpError(`Código incorrecto. Intentos restantes: ${3 - newAttempts}`);
        setOtpCode(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  // Countdown para reenvío de OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  // Navegación
  const handleBackToSelect = () => {
    setCurrentView('select');
    setSelectedAccount(null);
    setCustomLimit('');
    setError(null);
    setOtpCode(['', '', '', '', '', '']);
    setOtpSent(false);
    setOtpError(null);
    setAttempts(0);
  };

  const handleBackToConfigure = () => {
    setCurrentView('configure');
    setOtpCode(['', '', '', '', '', '']);
    setOtpSent(false);
    setOtpError(null);
  };

  // VISTA 1: Selección de cuenta
  const renderSelectView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-blue-100">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-sky-600 p-4 rounded-xl shadow-lg">
              <MdAttachMoney className="text-white text-3xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Personaliza tus cupos
              </h1>
              <p className="text-gray-600 mt-1">
                Configura el monto máximo diario de transferencia por cuenta
              </p>
            </div>
          </div>
        </div>

        {/* Información */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <MdInfo className="text-blue-600 text-xl mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-800">
              El cupo personalizado te permite establecer un límite máximo de transferencias diarias para cada cuenta. 
              Esto te ayuda a mantener un mejor control de tus finanzas.
            </p>
          </div>
        </div>

        {/* Lista de cuentas */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Cuenta a configurar
          </h2>

          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Cargando cuentas...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <p className="text-gray-600">No hay cuentas disponibles</p>
            </div>
          ) : (
            accounts.map((account) => (
              <div
                key={account.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden cursor-pointer group"
                onClick={() => handleSelectAccount(account)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="bg-gradient-to-br from-blue-500 to-sky-600 p-3 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300">
                        <MdAccountBalance className="text-white text-2xl" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {account.name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Nro. {account.number} | Saldo ${account.balance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Cupo actual</p>
                        <p className="font-bold text-lg">
                          {account.currentLimit ? (
                            <span className="text-green-600">
                              ${account.currentLimit.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-400">
                              Sin cupo personalizado
                            </span>
                          )}
                        </p>
                      </div>
                      <MdEdit className="text-blue-600 text-2xl group-hover:scale-125 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // VISTA 2: Configuración de monto
  const renderConfigureView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Botón regresar */}
        <button
          onClick={handleBackToSelect}
          className="flex items-center gap-2 text-green-700 hover:text-green-800 mb-6 font-medium transition-colors"
        >
          <MdArrowBack className="text-xl" />
          Regresar
        </button>

        {/* Información de cuenta seleccionada */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-blue-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-sky-600 p-3 rounded-lg shadow-md">
              <MdAccountBalance className="text-white text-2xl" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800">
                {selectedAccount?.name}
              </h2>
              <p className="text-gray-600">
                Nro. {selectedAccount?.number} | Saldo ${selectedAccount?.balance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de configuración */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            Monto máximo diario
          </h3>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto máximo diario
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-medium">
                $
              </span>
              <input
                type="text"
                value={customLimit}
                onChange={handleLimitChange}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-lg font-medium"
              />
            </div>
            {error && (
              <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                <MdInfo className="text-base" />
                {error}
              </p>
            )}
          </div>

          {/* Información de cupo actual */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <MdInfo className="text-blue-600 text-xl mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">
                  {selectedAccount?.currentLimit 
                    ? `Tu cupo actual es de $${selectedAccount.currentLimit.toFixed(2)}` 
                    : 'Esta cuenta no tiene un cupo personalizado'}
                </p>
                <p>
                  Esta configuración se realizará de forma inmediata.
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-4">
            <button
              onClick={handleBackToSelect}
              className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleContinueToVerify}
              disabled={!customLimit || parseFloat(customLimit) <= 0}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // VISTA 3: Verificación con OTP
  const renderVerifyView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Botón regresar */}
        <button
          onClick={handleBackToConfigure}
          className="flex items-center gap-2 text-green-700 hover:text-green-800 mb-6 font-medium transition-colors"
        >
          <MdArrowBack className="text-xl" />
          Regresar
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-sky-600 p-4 rounded-full w-20 h-20 mx-auto mb-4 shadow-lg">
              <MdSecurity className="text-white text-4xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Confirmar identidad
            </h2>
            <p className="text-gray-600">
              Para tu seguridad, necesitamos verificar tu identidad
            </p>
          </div>

          {/* Vista de instrucciones o código OTP */}
          {!otpSent ? (
            <div>
              {/* Resumen de cambios */}
              <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-6 mb-6 border border-blue-200">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MdInfo className="text-blue-600" />
                  Resumen de configuración
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cuenta:</span>
                    <span className="font-medium text-gray-800">
                      {selectedAccount?.number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cupo anterior:</span>
                    <span className="font-medium text-gray-800">
                      {selectedAccount?.currentLimit 
                        ? `$${selectedAccount.currentLimit.toFixed(2)}` 
                        : 'Sin cupo'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-3">
                    <span className="text-gray-600">Nuevo cupo diario:</span>
                    <span className="font-bold text-green-600 text-lg">
                      ${parseFloat(customLimit).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instrucciones */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>¿Por qué necesitamos esto?</strong><br />
                  Por tu seguridad, enviaremos un código de verificación de 6 dígitos a tu correo electrónico registrado.
                </p>
              </div>

              {/* Botón para solicitar código */}
              <button
                onClick={handleRequestOTP}
                disabled={loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-sky-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-sky-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enviando código...
                  </>
                ) : (
                  <>
                    <MdSecurity className="text-xl" />
                    Enviar código de verificación
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              {/* Entrada de código OTP */}
              <div className="mb-6">
                <p className="text-center text-gray-600 mb-6">
                  Ingresa el código de 6 dígitos que enviamos a tu correo
                </p>
                
                <div className="flex justify-center gap-3 mb-6">
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                  ))}
                </div>

                {otpError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <p className="text-red-600 text-sm text-center flex items-center justify-center gap-2">
                      <MdInfo />
                      {otpError}
                    </p>
                  </div>
                )}

                {/* Botón reenviar */}
                <div className="text-center">
                  <button
                    onClick={handleRequestOTP}
                    disabled={!canResend || loading}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {countdown > 0 
                      ? `Reenviar código en ${countdown}s` 
                      : 'Reenviar código'}
                  </button>
                </div>
              </div>

              {/* Botón validar */}
              <button
                onClick={handleValidateOTP}
                disabled={loading || otpCode.some(d => !d)}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Verificando...
                  </>
                ) : (
                  <>
                    <MdCheckCircle className="text-xl" />
                    Confirmar configuración
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // VISTA 4: Éxito
  const renderSuccessView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 p-6 flex items-center justify-center">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-200">
          {/* Icono de éxito */}
          <div className="text-center mb-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-full w-24 h-24 mx-auto mb-4 shadow-lg animate-bounce">
              <MdCheckCircle className="text-white text-6xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              ¡Configuración exitosa!
            </h2>
            <p className="text-gray-600">
              El cupo diario de tu cuenta ha sido actualizado
            </p>
          </div>

          {/* Detalles */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-200">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cuenta configurada:</span>
                <span className="font-medium text-gray-800">
                  {selectedAccount?.number}
                </span>
              </div>
              <div className="flex justify-between border-t border-green-200 pt-3">
                <span className="text-gray-600">Nuevo cupo diario máximo:</span>
                <span className="font-bold text-green-600 text-xl">
                  ${parseFloat(customLimit).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Mensaje informativo */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800 text-center">
              <MdInfo className="inline mr-1" />
              Esta configuración estará activa de inmediato y te ayudará a mantener un mejor control de tus transferencias diarias.
            </p>
          </div>

          {/* Botón volver */}
          <button
            onClick={handleBackToSelect}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-sky-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-sky-800 transition-all shadow-lg hover:shadow-xl"
          >
            Volver a mis cuentas
          </button>
        </div>
      </div>
    </div>
  );

  // Render principal
  return (
    <>
      {currentView === 'select' && renderSelectView()}
      {currentView === 'configure' && renderConfigureView()}
      {currentView === 'verify' && renderVerifyView()}
      {currentView === 'success' && renderSuccessView()}
    </>
  );
};

export default CupoComponent;
