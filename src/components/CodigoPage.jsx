// src/components/CodigoPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import apiService from '../services/apiService.js';
import backgroundImage from "/public/assets/images/onu.jpg";


const backgroundStyle = {
  backgroundImage: `url(${backgroundImage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "fixed",
};

const CodigoPage = ({ userInfo, onBackToLogin, onSuccess, isBlockingUser = false, isChangingPassword = false }) => {
  // Estados separados para evitar re-renders
  const [currentStep, setCurrentStep] = useState('requesting'); // 'requesting', 'code', 'success', 'error'
  const [codigo, setCodigo] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']); // Array para los 6 dígitos
  const [securityData, setSecurityData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutos en segundos

  // Ref para el input del código
  const codigoRef = useRef(null);
  const inputRefs = useRef([]); // Referencias para los inputs OTP

  useEffect(() => {
    console.log('📱 [CODE] Iniciando componente de código de seguridad');
    console.log('👤 [CODE] Datos del usuario:', userInfo);
    console.log('🔒 [CODE] Es bloqueo de usuario:', isBlockingUser);
    console.log('🔑 [CODE] Es cambio de contraseña:', isChangingPassword);
    
    const timer = setTimeout(() => setIsAnimated(true), 100);
    
    // PREVENIR MÚLTIPLES LLAMADAS: Solo solicitar si no se ha hecho antes
    let hasRequested = false;
    
    const initializeCode = () => {
      if (!hasRequested && userInfo?.cedula) {
        hasRequested = true;
        console.log('🔄 [CODE] Solicitando código (primera vez)');
        requestSecurityCode();
      }
    };
    
    // Pequeño delay para evitar doble ejecución
    const requestTimer = setTimeout(initializeCode, 100);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(requestTimer);
      hasRequested = true; // Marcar como ejecutado en cleanup
    };
  }, []); // Sin dependencias para evitar re-ejecuciones

  // Timer para countdown
  useEffect(() => {
    let interval = null;
    if (currentStep === 'code' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => {
          if (timeLeft <= 1) {
            showAlert('El código de seguridad ha expirado. Solicite uno nuevo.', 'error');
            setCurrentStep('requesting');
            return 120;
          }
          return timeLeft - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [currentStep, timeLeft]);

  // Solicitar código de seguridad
 // En tu CodigoPage.jsx, actualizar el método requestSecurityCode

// Solicitar código de seguridad - MÉTODO ACTUALIZADO
const requestSecurityCode = async () => {
  console.log('📨 [CODE] Solicitando código de seguridad para:', userInfo?.cedula);
  console.log('🔍 [CODE] Tipo de flujo:', isChangingPassword ? 'CAMBIO_CONTRASEÑA' : 'BLOQUEO/RECUPERACIÓN');
  
  setIsLoading(true);
  setCurrentStep('requesting');
  
  try {
    let result;
    
    if (isChangingPassword) {
      // PARA CAMBIO DE CONTRASEÑA: usar método específico
      result = await apiService.requestSecurityCodeForPasswordChange(userInfo.cedula);
    } else {
      // PARA BLOQUEO/RECUPERACIÓN: usar método original que funcionaba
      result = await apiService.requestSecurityCode(userInfo.cedula);
    }
    
    if (result.success) {
      console.log('✅ [CODE] Código solicitado exitosamente:', result.data);
      setSecurityData(result.data);
      setCurrentStep('code');
      setTimeLeft(120); // Reiniciar timer
      setOtpCode(['', '', '', '', '', '']); // Limpiar inputs OTP
      
      
      // Enfocar primer input después de un momento
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 500);
    } else {
      console.log('❌ [CODE] Error solicitando código:', result.error);
      showAlert(result.error.message, 'error');
      setCurrentStep('error');
    }
  } catch (error) {
    console.error('💥 [CODE] Error inesperado:', error);
    showAlert('Error solicitando código de seguridad', 'error');
    setCurrentStep('error');
  } finally {
    setIsLoading(false);
  }
};

  // Validar código y procesar bloqueo/recuperación
  const handleValidateCode = async (e) => {
    e.preventDefault();
    
    if (!codigo.trim()) {
      showAlert('Por favor ingrese el código de seguridad', 'error');
      return;
    }

    if (codigo.length !== 6) {
      showAlert('El código debe tener 6 dígitos', 'error');
      return;
    }

    console.log('🔐 [CODE] Validando código de seguridad');
    console.log('🔒 [CODE] Tipo de operación:', isBlockingUser ? 'BLOQUEO' : isChangingPassword ? 'CAMBIO_CONTRASEÑA' : 'RECUPERACIÓN');
    setIsLoading(true);
    
    try {
      let result;
      
      if (isChangingPassword && userInfo.newPassword) {
        // Para cambio de contraseña, usar la nueva contraseña del usuario
        result = await apiService.updatePasswordWithNewPassword({
          cedula: userInfo.cedula,
          usuario: userInfo.usuario,
          newPassword: userInfo.newPassword,
          idemsg: securityData.cliente[0].idemsg,
          codigo: codigo.trim()
        });
      } else {
        // Para bloqueo o recuperación, usar contraseña temporal fija
        result = await apiService.updatePasswordWithCode({
          cedula: userInfo.cedula,
          usuario: userInfo.usuario,
          idemsg: securityData.cliente[0].idemsg,
          codigo: codigo.trim()
        });
      }
      
      if (result.success) {
        console.log('✅ [CODE] Código validado correctamente');
        setCurrentStep('success');
        
        if (isBlockingUser) {
          showAlert('¡Usuario bloqueado exitosamente!', 'success');
        } else if (isChangingPassword) {
          showAlert('¡Contraseña actualizada exitosamente!', 'success');
        } else {
          showAlert('¡Contraseña temporal generada exitosamente!', 'success');
        }
      } else {
        console.log('❌ [CODE] Error validando código:', result.error);
        
        // Determinar mensaje de error específico
        let errorMessage = result.error.message || 'Código de seguridad incorrecto';
        
        switch (result.error.code) {
          case 'INVALID_SECURITY_CODE':
            errorMessage = 'El código de seguridad es incorrecto';
            break;
          case 'EXPIRED_CODE':
            errorMessage = 'El código de seguridad ha expirado';
            break;
          case 'USER_NOT_FOUND':
            errorMessage = 'Usuario no encontrado';
            break;
          default:
            errorMessage = result.error.message || 'Error al procesar el código';
        }
        
        showAlert(errorMessage, 'error');
        
        // Limpiar código si es incorrecto
        setCodigo('');
        setOtpCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('💥 [CODE] Error inesperado:', error);
      showAlert('Error validando código', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambio en el input del código
  const handleCodigoChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Solo números
    if (value.length <= 6) {
      setCodigo(value);
    }
  };

  // Funciones para manejar los inputs OTP individuales
  const handleInputChange = (index, value) => {
    // Solo permitir números
    if (value && !/^\d$/.test(value)) return;

    const newOtpCode = [...otpCode];
    newOtpCode[index] = value;
    setOtpCode(newOtpCode);
    
    // Actualizar el código completo también
    setCodigo(newOtpCode.join(''));

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
      setCodigo(newOtpCode.join(''));
      
      // Enfocar el siguiente input vacío o el último
      const nextEmptyIndex = newOtpCode.findIndex(code => !code);
      const focusIndex = nextEmptyIndex >= 0 ? nextEmptyIndex : 5;
      inputRefs.current[focusIndex]?.focus();
    }
  };

  // Mostrar alerta
  const showAlert = (message, type) => {
    setAlert({ message, type });
    if (type === 'error') {
      setTimeout(() => setAlert(null), 5000);
    }
  };

  // Formatear tiempo restante
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Enmascarar número de teléfono
  const maskPhoneNumber = (phone) => {
    if (!phone) return '***';
    const str = phone.toString();
    if (str.length >= 4) {
      return str.slice(0, -4).replace(/./g, '*') + str.slice(-4);
    }
    return str;
  };

  // Reintentar proceso
  const handleRetry = () => {
    if (timeLeft > 0) return; // Bloquear si el contador aún está corriendo
    
    setCodigo('');
    setOtpCode(['', '', '', '', '', '']);
    setAlert(null);
    setTimeLeft(120); // Reiniciar contador
    requestSecurityCode();
  };

  // Textos dinámicos según el tipo de operación
  const getTexts = () => {
    if (isBlockingUser) {
      return {
        title: {
          requesting: 'Enviando Código',
          code: 'Código de Bloqueo',
          success: '¡Usuario Bloqueado!',
          error: 'Código de Bloqueo'
        },
        subtitle: {
          requesting: 'Enviando código de seguridad a su teléfono...',
          code: 'Ingrese el código para confirmar el bloqueo',
          success: 'El usuario ha sido bloqueado exitosamente',
          error: 'Confirmación de bloqueo'
        },
        button: ' Bloquear Usuario',
        successMessage: 'El usuario ha sido bloqueado correctamente. Se ha asignado una contraseña temporal que solo conoce el administrador.',
        icon: (
          <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,1C18.5,1 23.91,6.41 23.91,13C23.91,19.59 18.5,25 12,25C5.5,25 0.0900002,19.59 0.0900002,13C0.0900002,6.41 5.5,1 12,1M12,8A1.5,1.5 0 0,0 10.5,9.5V16.5A1.5,1.5 0 0,0 12,18A1.5,1.5 0 0,0 13.5,16.5V9.5A1.5,1.5 0 0,0 12,8Z"/>
          </svg>
        ),
        successIcon: (
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,1C18.5,1 23.91,6.41 23.91,13C23.91,19.59 18.5,25 12,25C5.5,25 0.0900002,19.59 0.0900002,13C0.0900002,6.41 5.5,1 12,1M12,8A1.5,1.5 0 0,0 10.5,9.5V16.5A1.5,1.5 0 0,0 12,18A1.5,1.5 0 0,0 13.5,16.5V9.5A1.5,1.5 0 0,0 12,8Z"/>
          </svg>
        ),
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-400/30'
      };
    } else if (isChangingPassword) {
      return {
        title: {
          requesting: 'Enviando Código',
          code: 'Código de Verificación',
          success: '¡Contraseña Actualizada!',
          error: 'Código de Verificación'
        },
        subtitle: {
          requesting: 'Enviando código de seguridad a su teléfono...',
          code: 'Ingrese el código para confirmar el cambio',
          success: 'Su contraseña ha sido actualizada exitosamente',
          error: 'Confirmación de cambio de contraseña'
        },
        button: ' Actualizar Contraseña',
        successMessage: 'Su contraseña ha sido actualizada correctamente. Ya puede iniciar sesión con su nueva contraseña.',
        icon: (
          <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
          </svg>
        ),
        successIcon: (
          <svg className="w-16 h-16 text-blue-400 mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
          </svg>
        ),
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-400/30'
      };
    } else {
      return {
        title: {
          requesting: 'Enviando Código',
          code: 'Código de Seguridad',
          success: '¡Proceso Completado!',
          error: 'Código de Seguridad'
        },
        subtitle: {
          requesting: 'Enviando código de seguridad a su teléfono...',
          code: 'Ingrese el código de 6 dígitos enviado a su celular',
          success: 'Su contraseña temporal ha sido generada',
          error: 'Validación de código de seguridad'
        },
        button: '🔑 Generar Contraseña Temporal',
        successMessage: 'Se ha generado una contraseña temporal para su cuenta.',
        temporaryPassword: 'AAAAA012345',
        icon: (
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M10.5,17L6,12.5L7.41,11.09L10.5,14.17L16.59,8.09L18,9.5L10.5,17Z"/>
          </svg>
        ),
        successIcon: (
          <svg className="w-16 h-16 text-blue-400 mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
          </svg>
        ),
        bgColor: 'bg-white/20',
        borderColor: 'border-white/20'
      };
    }
  };

  const texts = getTexts();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" style={backgroundStyle}>
      
      {/* Elementos decorativos sutiles - siguiendo patrón de LoginPage */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-cyan-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-cyan-400/12 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "4s" }}></div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <div className={`w-full max-w-md transition-all duration-1000 ${
          isAnimated ? 'transform translate-y-0 opacity-100' : 'transform translate-y-8 opacity-0'
        }`}>
          
          {/* Back to login button */}
          <div className="mb-6">
            <button
              onClick={onBackToLogin}
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 transition-colors duration-200 font-semibold"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
              </svg>
              <span>Volver al login</span>
            </button>
          </div>

          {/* Progress indicator - Migajas de pan (solo si es bloqueo de usuario) */}
          {isBlockingUser && (
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4">
                {['Validar Identidad', 'Código de Seguridad'].map((step, index) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      index === 0
                        ? 'bg-green-500 text-white'
                        : index === 1
                          ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                          : 'bg-slate-300 text-slate-700'
                    }`}>
                      {index === 0 ? (
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < 1 && (
                      <div className={`w-12 h-0.5 mx-2 transition-all duration-300 bg-green-500`}></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center mt-3">
                <p className="text-slate-800 text-sm font-bold">
                  Paso 2 de 2: Código de Seguridad
                </p>
              </div>
            </div>
          )}

          {/* Main card - ESTILO ACTUALIZADO COMO LOGINPAGE */}
          <div className="backdrop-blur-xl bg-white/95 rounded-2xl p-6 shadow-2xl border border-white/50 relative overflow-hidden">
            
            {/* Efectos de brillo sutiles */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-transparent to-cyan-50/30 pointer-events-none rounded-2xl"></div>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600"></div>
            
            {/* Header - ESTILO ACTUALIZADO COMO LOGINPAGE */}
            <div className="text-center mb-6 relative z-10">
              <div className="w-24 h-24 mx-auto mb-4">
                <img src="/assets/images/isocoaclasnaves.png" alt="Logo Cooperativa" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                {texts.title[currentStep]}
              </h2>
              <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full mx-auto mb-2"></div>
              <p className="text-slate-600 text-xs font-medium">
                {texts.subtitle[currentStep]}
              </p>
              {currentStep === 'code' && userInfo?.clienteInfo?.tlfcel && (
                <p className="text-slate-600 text-xs mt-2 font-medium">
                  Enviado a: {maskPhoneNumber(userInfo.clienteInfo.tlfcel)}
                </p>
              )}
            </div>

            

            {/* Alert - ESTILO ACTUALIZADO COMO LOGINPAGE */}
            {alert && (
              <div className="mb-4 relative z-10">
                <div className={`p-3 rounded-lg border transition-all duration-500 backdrop-blur-sm ${
                  alert.type === "success"
                    ? "bg-cyan-50/80 border-cyan-200/60 text-cyan-800"
                    : "bg-red-50/80 border-red-200/60 text-red-800"
                }`}>
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center mr-2 backdrop-blur-sm ${
                      alert.type === "success" ? "bg-cyan-100/80" : "bg-red-100/80"
                    }`}>
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        {alert.type === "success" ? (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        )}
                      </svg>
                    </div>
                    <span className="text-xs font-semibold">{alert.message}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Estado: Solicitando código - ESTILO ACTUALIZADO COMO LOGINPAGE */}
            {currentStep === 'requesting' && (
              <div className="text-center py-12 relative z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
                <p className="text-slate-800 text-lg mb-2 font-semibold">Enviando código de seguridad...</p>
                <p className="text-slate-600 text-sm">
                  Esto puede tomar unos segundos
                </p>
              </div>
            )}

            {/* Estado: Ingresar código - ESTILO ACTUALIZADO COMO LOGINPAGE */}
            {currentStep === 'code' && (
              <form onSubmit={handleValidateCode} className="space-y-4 relative z-10">
                

                {/* Input del código - 6 cuadritos separados */}
                <div className="space-y-1">
                  <label htmlFor="codigo-0" className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                    Código de 6 dígitos
                  </label>
                  
                  {/* Inputs OTP - 6 cuadritos separados */}
                  <div className="flex justify-center space-x-3 mb-4">
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
                        className="w-12 h-12 text-center text-xl font-bold bg-white/90 border-2 border-slate-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all duration-200 hover:border-slate-300/60 backdrop-blur-sm shadow-sm"
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                  
                  <p className="text-slate-600 text-xs text-center font-medium">
                   
                  </p>
                </div>

                {/* Botones - ESTILO ACTUALIZADO COMO LOGINPAGE */}
                <div className="space-y-3 pt-1">
                  <button
                    type="submit"
                    disabled={isLoading || codigo.length !== 6}
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent rounded-lg"></div>
                    
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="relative z-10 tracking-wide text-xs">Procesando...</span>
                      </>
                    ) : (
                      <span className="relative z-10 tracking-wide font-bold uppercase text-sm">{texts.button}</span>
                    )}
                  </button>

                  {timeLeft > 0 ? (
                    <div className="w-full flex justify-center py-2 px-4 bg-slate-100/80 rounded-lg backdrop-blur-sm">
                      <span className="text-xs font-semibold text-slate-600">
                        Reenviar código en {formatTime(timeLeft)}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRetry}
                      disabled={isLoading}
                      className={`w-full flex justify-center py-2 px-4 text-xs font-semibold transition-colors duration-200 hover:underline decoration-2 underline-offset-2 ${
                        isLoading ? 'text-slate-400 cursor-not-allowed' : 'text-cyan-600 hover:text-cyan-800'
                      }`}
                    >
                      Reenviar código
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Estado: Éxito - ESTILO ACTUALIZADO COMO LOGINPAGE */}
            {currentStep === 'success' && (
              <div className="text-center py-12 relative z-10">
                {texts.successIcon}
                <h3 className="text-slate-800 text-xl font-bold mb-2">
                  {texts.title.success}
                </h3>
                <p className="text-slate-600 text-sm mb-6 font-medium">
                  {texts.successMessage}
                  {!isBlockingUser && !isChangingPassword && (
                    <>
                      <br/>
                      <strong className="text-slate-800">Contraseña temporal: {texts.temporaryPassword}</strong>
                    </>
                  )}
                </p>
                
                {!isChangingPassword && !isBlockingUser && (
                  <div className="bg-cyan-50/80 border border-cyan-200/60 rounded-lg p-4 mb-6 backdrop-blur-sm">
                    <p className="text-cyan-800 text-sm font-medium">
                      <strong>Importante:</strong> Deberá cambiar esta contraseña en su primer inicio de sesión.
                    </p>
                  </div>
                )}
                
                {isBlockingUser && (
                  <div className="bg-red-50/80 border border-red-200/60 rounded-lg p-4 mb-6 backdrop-blur-sm">
                    <p className="text-red-800 text-sm font-medium">
                      <strong>Importante:</strong> El usuario necesitará contactar al administrador para reactivar su cuenta.
                    </p>
                  </div>
                )}

                {isChangingPassword && (
                  <div className="bg-cyan-50/80 border border-cyan-200/60 rounded-lg p-4 mb-6 backdrop-blur-sm">
                    <p className="text-cyan-800 text-sm font-medium">
                      <strong>Importante:</strong> Su contraseña ha sido actualizada. Ya puede iniciar sesión con su nueva contraseña.
                    </p>
                  </div>
                )}
                
                <button
                  onClick={onBackToLogin}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent rounded-lg"></div>
                  <span className="relative z-10 tracking-wide font-bold uppercase text-sm">🏠 Volver al Login</span>
                </button>
              </div>
            )}

            {/* Estado: Error - ESTILO ACTUALIZADO COMO LOGINPAGE */}
            {currentStep === 'error' && (
              <div className="text-center py-12 relative z-10">
                <svg className="w-16 h-16 text-red-500 mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2M12,21L10.91,15.74L2,15L10.91,14.26L12,8L13.09,14.26L22,15L13.09,15.74L12,21Z"/>
                </svg>
                <h3 className="text-slate-800 text-lg font-bold mb-2">Ocurrió un problema</h3>
                <p className="text-slate-600 text-sm mb-6 font-medium">
                  No se pudo procesar la solicitud
                </p>
                <button
                  onClick={handleRetry}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent rounded-lg"></div>
                  <span className="relative z-10 tracking-wide font-bold uppercase text-sm">Intentar nuevamente</span>
                </button>
              </div>
            )}
          </div>

          {/* Security notice - ESTILO ACTUALIZADO COMO LOGINPAGE */}

        </div>
      </div>
    </div>
  );
};

export default CodigoPage;