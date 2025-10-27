import React, { useState, useEffect, useRef, useCallback } from 'react';
import apiServiceTransfer from '../../services/apiserviceTransfer';
import PageSucces from './PageSucces';
import CancelComponent from './CancelComponent';

const SecurityquestionCoopint = ({ 
  transferData, 
  onBack, 
  onTransferSuccess,
  onTransferError 
}) => {
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [idemsg, setIdemsg] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [transferExecuting, setTransferExecuting] = useState(false);
  
  // ✅ NUEVO ESTADO PARA CONTROLAR LA ANIMACIÓN DE ÉXITO
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [transferResult, setTransferResult] = useState(null);
  
  // ✅ NUEVO ESTADO PARA CONTROLAR LA ANIMACIÓN DE ERROR
  const [showErrorAnimation, setShowErrorAnimation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // ✅ NUEVO: Sistema de 3 intentos
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;
  
  // ✅ NUEVO: Timer para regresar después del CancelComponent
  const cancelTimerRef = useRef(null);

  // Referencias para los inputs
  const inputRefs = useRef([]);
  
  // REF para evitar doble solicitud
  const otpRequestedRef = useRef(false);

  useEffect(() => {
    // Solicitar código OTP solo una vez al montar el componente
    if (!otpRequestedRef.current) {
      console.log('🚀 [COOP-OTP-MOUNT] Solicitando código OTP para transferencia cooperativa...');
      otpRequestedRef.current = true;
      requestOTPCode();
    }

    // Cleanup
    return () => {
      console.log('🔚 [COOP-OTP-UNMOUNT] Componente desmontado');
    };
  }, []);

  useEffect(() => {
    // Countdown para reenvío
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);
  
  // ✅ CLEANUP del timer al desmontar
  useEffect(() => {
    return () => {
      if (cancelTimerRef.current) {
        clearTimeout(cancelTimerRef.current);
        cancelTimerRef.current = null;
      }
    };
  }, []);

  // Función para solicitar código OTP (usando API 2155)
  const requestOTPCode = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📨 [COOP-OTP-REQUEST] Solicitando código OTP cooperativa...');
      
      const result = await apiServiceTransfer.requestCurrentUserCoopOTP();
      
      if (result.success && result.data?.idemsg) {
        setIdemsg(result.data.idemsg);
        setResendCooldown(120); // 2 minutos de cooldown
        console.log('✅ [COOP-OTP-REQUEST] Código solicitado exitosamente');
        console.log('🆔 [COOP-OTP-REQUEST] idemsg obtenido:', result.data.idemsg);
        
        // Enfocar el primer input después de recibir el código
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      } else {
        console.error('❌ [COOP-OTP-REQUEST] Error en la respuesta:', result);
        setError(result.error?.message || 'Error al solicitar código de seguridad');
      }
    } catch (error) {
      console.error('💥 [COOP-OTP-REQUEST] Excepción capturada:', error);
      setError('Error inesperado al solicitar código de seguridad');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (index, value) => {
    // Solo permitir números
    if (value && !/^\d$/.test(value)) return;

    const newOtpCode = [...otpCode];
    newOtpCode[index] = value;
    setOtpCode(newOtpCode);
    setError(null);

    // Auto-avanzar al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Retroceder en backspace si el input está vacío
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const numbers = pasteData.replace(/\D/g, '').slice(0, 6);
    
    if (numbers.length > 0) {
      const newOtpCode = [...otpCode];
      for (let i = 0; i < numbers.length && i < 6; i++) {
        newOtpCode[i] = numbers[i];
      }
      setOtpCode(newOtpCode);
      
      // Enfocar el siguiente input vacío o el último
      const nextEmptyIndex = newOtpCode.findIndex(code => !code);
      const focusIndex = nextEmptyIndex >= 0 ? nextEmptyIndex : 5;
      inputRefs.current[focusIndex]?.focus();
    }
  };

  // Función para ejecutar transferencia cooperativa (usando API 2355)
  const executeTransfer = async () => {
    const fullOtpCode = otpCode.join('');
    
    // Validaciones básicas
    if (fullOtpCode.length !== 6) {
      setError('Ingresa el código completo de 6 dígitos');
      return;
    }

    if (!idemsg) {
      setError('Error de sesión. Por favor, solicita un nuevo código.');
      return;
    }

    try {
      setTransferExecuting(true);
      setError(null);

      console.log('🔄 [COOP-TRANSFER-EXECUTE] Ejecutando transferencia cooperativa...');
      console.log('🔑 [COOP-TRANSFER-EXECUTE] Usando idemsg válido:', idemsg);

      // Payload completo para transferencia cooperativa
      const transferPayload = {
        cuentaOrigen: transferData.cuentaOrigen,
        cuentaDestino: transferData.cuentaDestino,
        monto: transferData.monto,
        descripcion: transferData.descripcion,
        idemsg: idemsg,
        codigoOTP: fullOtpCode
      };

      console.log('📤 [COOP-TRANSFER-EXECUTE] Payload completo enviado para transferencia cooperativa');

      const result = await apiServiceTransfer.executeCurrentUserCoopTransfer(transferPayload);

      if (result.success) {
        console.log('✅ [COOP-TRANSFER-SUCCESS] Transferencia cooperativa ejecutada exitosamente');
        
        // ✅ GUARDAR EL RESULTADO Y MOSTRAR ANIMACIÓN
        setTransferResult(result.data);
        setShowSuccessAnimation(true);
        
        // NO llamar onTransferSuccess inmediatamente, esperar a que termine la animación
      } else {
        console.error('❌ [COOP-TRANSFER-ERROR] Error ejecutando transferencia cooperativa:', result.error);
        
        // ✅ MANEJO ESPECÍFICO DE ERRORES CON SISTEMA DE 3 INTENTOS
        if (result.error.code === 'INVALID_OTP_CODE') {
          // ✅ INCREMENTAR INTENTOS
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          
          console.log(`⚠️ [COOP-OTP-ATTEMPT] Intento ${newAttempts} de ${MAX_ATTEMPTS} fallido`);
          
          if (newAttempts >= MAX_ATTEMPTS) {
            // ✅ 3 INTENTOS FALLIDOS - MOSTRAR CANCELCOMPONENT
            console.log('🚨 [COOP-MAX-ATTEMPTS] Se alcanzó el máximo de intentos, mostrando CancelComponent');
            setErrorMessage('Has superado el número máximo de intentos (3). La transferencia será cancelada.');
            setShowErrorAnimation(true);
            // NO llamar onTransferError aquí, se llamará después del CancelComponent
          } else {
            // ✅ AÚN HAY INTENTOS DISPONIBLES - NO DESMONTAR EL COMPONENTE
            const remainingAttempts = MAX_ATTEMPTS - newAttempts;
            setError(`Código incorrecto. Te quedan ${remainingAttempts} ${remainingAttempts === 1 ? 'intento' : 'intentos'}`);
            setOtpCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            // NO llamar onTransferError, permitir al usuario reintentar
          }
        } else if (result.error.code === 'EXPIRED_OTP_CODE') {
          setError('El código ha expirado. Solicita uno nuevo');
          setResendCooldown(0); // Permitir reenvío inmediato
          // NO desmontar, permitir reenvío
        } else if (result.error.code === 'INVALID_OTP_SESSION') {
          setError('La sesión de seguridad ha expirado. Solicita un nuevo código');
          setOtpCode(['', '', '', '', '', '']);
          setResendCooldown(0);
          // NO desmontar, permitir reenvío
        } else if (result.error.code === 'SERVER_ERROR' || result.error.code === 'NETWORK_ERROR' || result.error.code === 'TIMEOUT_ERROR') {
          // ✅ ERRORES GRAVES - MOSTRAR ANIMACIÓN DE CANCELACIÓN
          console.log('🚨 [COOP-TRANSFER-ERROR] Error grave detectado, mostrando animación de cancelación');
          setErrorMessage(result.error.message || 'Error de comunicación con el servidor cooperativo');
          setShowErrorAnimation(true);
          return; // No ejecutar onTransferError aún
        } else {
          // ✅ OTROS ERRORES - DESMONTAR Y REGRESAR
          setError(result.error.message || 'Error al procesar la transferencia cooperativa');
          onTransferError(result.error);
        }
      }
    } catch (error) {
      console.error('💥 [COOP-TRANSFER-CRASH] Error inesperado:', error);
      
      // ✅ ERROR DE RED O INESPERADO - MOSTRAR ANIMACIÓN DE CANCELACIÓN
      console.log('🚨 [COOP-TRANSFER-CRASH] Error de red/inesperado, mostrando animación de cancelación');
      setErrorMessage('Error de comunicación con el servidor cooperativo. Revisa tu conexión.');
      setShowErrorAnimation(true);
      return; // No ejecutar onTransferError aún, esperar animación
    } finally {
      setTransferExecuting(false);
    }
  };

  // ✅ FUNCIÓN PARA MANEJAR CUANDO TERMINA LA ANIMACIÓN
  const handleSuccessAnimationComplete = useCallback(() => {
    console.log('✅ [COOP-ANIMATION-COMPLETE] Animación terminada, llamando onTransferSuccess...');
    setShowSuccessAnimation(false);
    onTransferSuccess(transferResult);
  }, [transferResult, onTransferSuccess]);

  // ✅ FUNCIÓN PARA MANEJAR CUANDO TERMINA LA ANIMACIÓN DE ERROR
  const handleErrorAnimationComplete = useCallback(() => {
    console.log('🚨 [COOP-ERROR-ANIMATION-COMPLETE] Animación de error terminada');
    
    // ✅ SI SE ALCANZÓ EL MÁXIMO DE INTENTOS, ESPERAR 5 SEGUNDOS Y REGRESAR
    if (attempts >= MAX_ATTEMPTS) {
      console.log('⏰ [COOP-MAX-ATTEMPTS] Iniciando timer de 5 segundos para regresar...');
      
      // ✅ MANTENER VISIBLE EL CANCELCOMPONENT POR 5 SEGUNDOS
      cancelTimerRef.current = setTimeout(() => {
        console.log('🔙 [COOP-TIMEOUT] 5 segundos transcurridos, regresando a InternaTransferWindow...');
        setShowErrorAnimation(false);
        setErrorMessage('');
        
        // ✅ ENVIAR CÓDIGO ESPECIAL PARA QUE EL COMPONENTE PADRE REGRESE A INTERNA TRANSFER WINDOW
        onTransferError({ 
          message: 'Máximo de intentos alcanzado', 
          code: 'MAX_ATTEMPTS_REACHED' 
        });
      }, 5000); // 5 segundos
    } else {
      // ✅ ERROR GRAVE (no por intentos) - REGRESAR INMEDIATAMENTE
      setShowErrorAnimation(false);
      setErrorMessage('');
      onTransferError({ message: errorMessage, code: 'CANCELLED_BY_ERROR' });
    }
  }, [attempts, errorMessage, onTransferError]);

  // Función para reenviar código
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    console.log('🔄 [COOP-OTP-RESEND] Reenviando código OTP cooperativa...');
    
    setResendLoading(true);
    setOtpCode(['', '', '', '', '', '']);
    setIdemsg(null);
    setError(null);
    
    // Resetear el flag y solicitar nuevo código
    otpRequestedRef.current = false;
    await requestOTPCode();
    otpRequestedRef.current = true;
    
    setResendLoading(false);
    inputRefs.current[0]?.focus();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatAccountNumber = (accountNumber) => {
    if (!accountNumber) return '';
    return accountNumber.toString();
  };

  // ✅ RENDERIZAR LA ANIMACIÓN DE ÉXITO SI ESTÁ ACTIVA
  if (showSuccessAnimation) {
    return (
      <PageSucces 
        onComplete={handleSuccessAnimationComplete}
        transferType="coop"
      />
    );
  }

  // ✅ RENDERIZAR LA ANIMACIÓN DE ERROR SI ESTÁ ACTIVA
  if (showErrorAnimation) {
    return (
      <CancelComponent 
        onComplete={handleErrorAnimationComplete}
        errorMessage={errorMessage}
        transferType="coop"
        countdown={attempts >= MAX_ATTEMPTS ? 5 : 300}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-sky-100 flex flex-col">
      {/* Header */}
<div className="bg-white/90 shadow-sm border-b border-slate-200/60 flex-shrink-0 backdrop-blur-sm">
  <div className="max-w-4xl mx-auto px-6 py-4">
    <div className="flex items-center justify-between">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
        disabled={transferExecuting}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
        </svg>
        <span className="text-sm font-medium">Volver</span>
      </button>
      
      <div className="text-center">
        <h1 className="text-lg font-bold text-slate-800">Código de Seguridad</h1>
        <p className="text-sm text-slate-500">Transferencia cooperativa CACVIL</p>
      </div>
      
      <div className="w-20"></div>
    </div>
  </div>
</div>

{/* ✅ NUEVO: Stepper - Paso 2 Activo */}
<div className="bg-white/90 border-b border-slate-200/60 flex-shrink-0 backdrop-blur-sm">
  <div className="max-w-4xl mx-auto px-6 py-4">
    <div className="flex items-center justify-center">
      {/* Paso 1 - COMPLETADO */}
      <div className="flex items-center text-emerald-600">
        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-500/20">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
          </svg>
        </div>
        <span className="ml-2 text-sm font-medium text-emerald-600">Formulario</span>
      </div>
      
      {/* Línea conectora 1-2 - COMPLETADA */}
      <div className="flex-1 h-px bg-emerald-300 mx-4"></div>
      
      {/* Paso 2 - ACTIVO */}
      <div className="flex items-center text-sky-600">
        <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-sky-500/20">2</div>
        <span className="ml-2 text-sm font-medium text-sky-600">Código Seguridad</span>
      </div>
      
      {/* Línea conectora 2-3 */}
      <div className="flex-1 h-px bg-gray-300 mx-4"></div>
      
      {/* Paso 3 - INACTIVO */}
      <div className="flex items-center text-gray-400">
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-sm">3</div>
        <span className="ml-2 text-sm font-medium text-gray-400">Completado</span>
      </div>
    </div>
  </div>
</div>

{/* Contenido principal */}
<div className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full p-6 gap-6">
        
        {/* Panel izquierdo: Resumen de transferencia */}
        <div className="lg:w-1/2">
          <div className="bg-white/90 rounded-2xl shadow-lg border border-slate-200/60 p-6 h-fit backdrop-blur-sm">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-sky-600 to-sky-700 rounded-full flex items-center justify-center mr-3 shadow-md shadow-sky-500/20">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A3,3 0 0,1 15,5V7H16A2,2 0 0,1 18,9V19A2,2 0 0,1 16,21H8A2,2 0 0,1 6,19V9A2,2 0 0,1 8,7H9V5A3,3 0 0,1 12,2M12,4A1,1 0 0,0 11,5V7H13V5A1,1 0 0,0 12,4Z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Resumen de Transferencia</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-sky-50/80 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-sky-700">Cuenta Origen:</span>
                </div>
                <div className="text-sm font-mono text-sky-800 bg-white/80 p-2 rounded border backdrop-blur-sm">
                  {formatAccountNumber(transferData.cuentaOrigen)}
                </div>
              </div>
              
                <div className="flex justify-center">
                <div className="w-8 h-8 bg-gradient-to-r from-sky-100 to-sky-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4,15V9H12L7.5,4.5L9,3L16,10L9,17L7.5,15.5L12,11H4Z"/>
                  </svg>
                </div>
              </div>
              
              <div className="bg-sky-50/80 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-sky-700">Beneficiario:</span>
                </div>
                <div className="text-sm font-semibold text-sky-800 bg-white/80 p-2 rounded border backdrop-blur-sm">
                  {transferData.beneficiario?.name}
                </div>
                <div className="text-xs text-emerald-600 mt-1">
                  Cuenta: {formatAccountNumber(transferData.cuentaDestino)}
                </div>
              </div>
              
              <div className="border-t border-slate-200/60 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-base font-medium text-slate-800">Monto a transferir:</span>
                  <span className="text-2xl font-bold text-sky-600">
                    {formatCurrency(transferData.monto)}
                  </span>
                </div>
                
                {transferData.descripcion && (
                  <div className="mt-3 p-3 bg-sky-50/80 rounded-lg backdrop-blur-sm">
                    <span className="text-sm font-medium text-sky-800">Descripción:</span>
                    <p className="text-sm text-sky-700 mt-1">{transferData.descripcion}</p>
                  </div>
                )}

                <div className="mt-3 p-3 bg-amber-50/80 rounded-lg border border-amber-200/60 backdrop-blur-sm">
                  <p className="text-xs text-amber-700">
                    <strong>Transferencia cooperativa:</strong> Sin comisiones entre miembros de CACVIL
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho: Formulario OTP */}
        <div className="lg:w-1/2">
          <div className="bg-white/90 rounded-2xl shadow-lg border border-slate-200/60 p-6 backdrop-blur-sm">
            
            {/* Estado de carga inicial */}
                {loading && !idemsg && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse shadow-lg shadow-sky-500/20">
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Enviando código de seguridad</h3>
                <p className="text-slate-600">Estamos enviando un código de 6 dígitos a tu celular registrado...</p>
              </div>
            )}

            {/* Formulario OTP (solo cuando hay idemsg válido) */}
            {!loading && idemsg && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/20">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Ingresa el código de seguridad</h3>
                  <p className="text-slate-600 mb-6">
                    Código enviado a tu celular registrado
                  </p>
                </div>

                {/* Inputs OTP */}
                <div className="flex justify-center space-x-4 mb-6">
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => inputRefs.current[index] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleInputChange(index, e.target.value)}
                      onKeyDown={e => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className="w-12 h-12 text-center text-xl font-bold bg-white/90 border-2 border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400/50 transition-all duration-200 hover:border-slate-300/60 backdrop-blur-sm shadow-sm"
                      disabled={transferExecuting}
                    />
                  ))}
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50/80 border border-red-200/60 rounded-xl p-4 mb-6 backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-red-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                      </svg>
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                {/* Botón reenviar código */}
                <div className="text-center mb-6">
                  {resendCooldown > 0 ? (
                    <div className="bg-slate-100/80 rounded-lg p-3 backdrop-blur-sm">
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">Reenviar código en {resendCooldown}s</span>
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handleResendCode}
                      disabled={resendLoading || transferExecuting}
                      className="text-sm text-sky-600 hover:text-sky-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-sky-50/80 hover:bg-sky-100/80 px-4 py-2 rounded-lg backdrop-blur-sm"
                    >
                      {resendLoading ? 'Enviando nuevo código...' : 'Reenviar código'}
                    </button>
                  )}
                </div>

                {/* Botón confirmar transferencia */}
                <button
                  onClick={executeTransfer}
                  disabled={transferExecuting || otpCode.join('').length !== 6 || !idemsg}
                  className="w-full bg-gradient-to-r from-sky-600 to-sky-700 text-white py-4 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-sky-700 hover:to-sky-800 transition-all duration-200 flex items-center justify-center space-x-2 text-lg shadow-lg shadow-sky-500/20"
                >
                  {transferExecuting ? (
                    <>
                      <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      <span>Procesando transferencia...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                      </svg>
                      <span>Confirmar Transferencia</span>
                    </>
                  )}
                </button>
                
                <p className="text-xs text-slate-500 mt-3 text-center">
                  Tu transferencia está protegida con cifrado de extremo a extremo
                </p>
              </div>
            )}

            {/* Estado de error al solicitar código */}
            {!loading && !idemsg && error && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100/80 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                  <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Error al enviar código</h3>
                <p className="text-slate-600 mb-6">{error}</p>
                
                <button
                  onClick={() => {
                    setError(null);
                    otpRequestedRef.current = false;
                    requestOTPCode();
                  }}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-medium py-3 px-6 rounded-xl transition-colors shadow-md shadow-sky-500/20"
                >
                  Reintentar envío
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityquestionCoopint;
