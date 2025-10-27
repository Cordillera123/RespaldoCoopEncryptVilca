// src/components/SecurityCodeValidationPage.jsx - DISEÑO CENTRADO COMPLETO
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

const SecurityCodeValidationPage = ({ flowData, onComplete, onBack }) => {
  const [securityCode, setSecurityCode] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']); // Array para los 6 dígitos
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [countdown, setCountdown] = useState(120); // 2 minutos
  const [isAnimated, setIsAnimated] = useState(false);
  const [currentStep, setCurrentStep] = useState('code'); // 'code', 'success', 'error'
  const codeRef = useRef(null);
  const inputRefs = useRef([]); // Referencias para los inputs OTP

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    
    // Enfocar primer input OTP
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 200);
    
    // Mostrar mensaje inicial sobre el código enviado
    
    
    return () => clearTimeout(timer);
  }, []);

  // Countdown timer
  useEffect(() => {
    let interval = null;
    if (currentStep === 'code' && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setAlert({ message: 'El código de seguridad ha expirado. Solicite uno nuevo.', type: 'error' });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, countdown]);

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Solo números, máximo 6 dígitos
    setSecurityCode(value);
    
    if (errors.securityCode) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.securityCode;
        return newErrors;
      });
    }

    if (alert && alert.type === 'error') {
      setAlert(null);
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
    setSecurityCode(newOtpCode.join(''));

    // Auto-avanzar al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Limpiar errores
    if (errors.securityCode) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.securityCode;
        return newErrors;
      });
    }

    if (alert && alert.type === 'error') {
      setAlert(null);
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
      setSecurityCode(newOtpCode.join(''));
      
      // Enfocar el siguiente input vacío o el último
      const nextEmptyIndex = newOtpCode.findIndex(code => !code);
      const focusIndex = nextEmptyIndex >= 0 ? nextEmptyIndex : 5;
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const validateCode = () => {
    const newErrors = {};

    if (!securityCode.trim()) {
      newErrors.securityCode = 'El código de seguridad es requerido';
    } else if (securityCode.length !== 6) {
      newErrors.securityCode = 'El código debe tener 6 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleValidateAndSave = async () => {
    if (!validateCode()) {
      setAlert({ message: 'Por favor, ingrese un código válido de 6 dígitos', type: 'error' });
      return;
    }

    setIsValidating(true);
    setAlert({ message: 'Validando código de seguridad...', type: 'info' });

    try {
      console.log('🔐 [CODE-VALIDATION] Validando código de seguridad');
      
      // Primero validar el código
      const validateResult = await apiService.validateSecurityCodeForRegistration(
        flowData.cedula,
        flowData.idemsg,
        securityCode
      );

      if (validateResult.success) {
        console.log('✅ [CODE-VALIDATION] Código validado correctamente');
        setAlert({ message: 'Código validado. Guardando preguntas de seguridad...', type: 'success' });
        setIsSaving(true);

        // Luego guardar las preguntas de seguridad
        console.log('💾 [CODE-VALIDATION] Guardando preguntas:', flowData.selectedQuestions.length);
        const saveResult = await apiService.saveMultipleSecurityQuestions(
          flowData.cedula,
          flowData.selectedQuestions
        );

        if (saveResult.success) {
          console.log('🎉 [CODE-VALIDATION] ¡Todas las preguntas guardadas exitosamente!');
          setCurrentStep('success');
          setAlert({ message: '¡Registro completado exitosamente!', type: 'success' });
          
          // Notificar al componente padre después de un breve delay
          setTimeout(() => {
            if (onComplete) {
              onComplete({
                securityCode: securityCode,
                saveResult: saveResult.data,
                message: 'Preguntas de seguridad registradas correctamente'
              });
            }
          }, 2000);
        } else {
          console.error('❌ [CODE-VALIDATION] Error guardando preguntas:', saveResult.error);
          setAlert({ message: saveResult.error.message, type: 'error' });
          setCurrentStep('error');
        }
      } else {
        console.error('❌ [CODE-VALIDATION] Error validando código:', validateResult.error);
        setAlert({ message: validateResult.error.message, type: 'error' });
        setSecurityCode(''); // Limpiar código incorrecto
        setOtpCode(['', '', '', '', '', '']); // Limpiar inputs OTP
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('💥 [CODE-VALIDATION] Error inesperado:', error);
      setAlert({ message: 'Error de conexión. Intente nuevamente.', type: 'error' });
      setCurrentStep('error');
    } finally {
      setIsValidating(false);
      setIsSaving(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setAlert({ message: 'Enviando nuevo código...', type: 'info' });
    
    try {
      console.log('📨 [CODE-VALIDATION] Reenviando código de seguridad');
      const result = await apiService.requestSecurityCodeForRegistration(flowData.cedula);
      
      if (result.success) {
        setAlert({ message: 'Nuevo código enviado correctamente', type: 'success' });
        setCountdown(120); // Reiniciar countdown
        setSecurityCode(''); // Limpiar código anterior
        setOtpCode(['', '', '', '', '', '']); // Limpiar inputs OTP
        inputRefs.current[0]?.focus();
      } else {
        setAlert({ message: result.error.message, type: 'error' });
      }
    } catch (error) {
      console.error('💥 [CODE-VALIDATION] Error reenviando código:', error);
      setAlert({ message: 'Error al reenviar el código', type: 'error' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleValidateAndSave();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleValidateAndSave();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maskPhoneNumber = (phone) => {
    if (!phone) return '***';
    const str = phone.toString();
    if (str.length >= 4) {
      return str.slice(0, -4).replace(/./g, '*') + str.slice(-4);
    }
    return str;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" style={backgroundStyle}>
      {/* Elementos decorativos sutiles - siguiendo patrón de CodigoPage */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-cyan-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-cyan-400/12 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "4s" }}></div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <div className={`w-full max-w-md transition-all duration-1000 ${
          isAnimated ? 'transform translate-y-0 opacity-100' : 'transform translate-y-8 opacity-0'
        }`}>
          
          {/* Back button - siguiendo patrón de CodigoPage */}
          <div className="mb-6">
            <button
              onClick={onBack}
              disabled={isValidating || isSaving || currentStep === 'success'}
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 transition-colors duration-200 font-semibold disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
              </svg>
              <span>Regresar</span>
            </button>
          </div>

          {/* Progress indicator - Migajas de pan */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {['Validar Identidad', 'Preguntas de Seguridad', 'Código de Seguridad'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    index < 2
                      ? 'bg-green-500 text-white'
                      : index === 2
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                        : 'bg-slate-300 text-slate-700'
                  }`}>
                    {index < 2 ? (
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 2 && (
                    <div className={`w-12 h-0.5 mx-2 transition-all duration-300 ${
                      index < 1
                        ? 'bg-green-500'
                        : 'bg-green-500'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-3">
              <p className="text-slate-800 text-sm font-bold">
                Paso 3 de 3: Código de Seguridad
              </p>
            </div>
          </div>

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
                {currentStep === 'success' ? '¡Registro Completado!' : 
                 currentStep === 'error' ? 'Error en el Proceso' : 
                 'Código de Seguridad'}
              </h2>
              <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full mx-auto mb-2"></div>
              <p className="text-slate-600 text-xs font-medium">
                {currentStep === 'success' ? 'Sus preguntas de seguridad han sido registradas exitosamente' :
                 currentStep === 'error' ? 'Ocurrió un problema durante el registro' :
                 'Ingrese el código de 6 dígitos enviado a su celular'}
              </p>
              {currentStep === 'code' && flowData.clientData?.tlfcel && (
                <p className="text-slate-600 text-xs mt-2 font-medium">
                  Enviado a: {maskPhoneNumber(flowData.clientData.tlfcel)}
                </p>
              )}
            </div>

            

            {/* Alert */}
            {alert && (
              <div className="mb-6">
                <div className={`p-4 rounded-lg border backdrop-blur-sm transition-all duration-300 ${
                  alert.type === 'success' ? 'bg-cyan-50/80 border-cyan-200/60 text-cyan-800' : 
                  alert.type === 'error' ? 'bg-red-50/80 border-red-200/60 text-red-800' :
                  'bg-cyan-50/80 border-cyan-200/60 text-cyan-800'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center mr-2 backdrop-blur-sm ${
                      alert.type === 'success' ? 'bg-cyan-100/80' : 
                      alert.type === 'error' ? 'bg-red-100/80' : 'bg-cyan-100/80'
                    }`}>
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        {alert.type === 'success' ? (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        ) : alert.type === 'error' ? (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                        ) : (
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                        )}
                      </svg>
                    </div>
                    <span className="text-sm font-semibold">{alert.message}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Estado: Ingresar código */}
            {currentStep === 'code' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                

                {/* Input del código - 6 cuadritos separados COMO CODIGOPAGE */}
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
                        disabled={isValidating || isSaving}
                      />
                    ))}
                  </div>
                  
                  {errors.securityCode && (
                    <p className="text-red-700 text-xs mt-1 font-medium">{errors.securityCode}</p>
                  )}
                  
                  
                </div>

                {/* Botones - ESTILO ACTUALIZADO COMO CODIGOPAGE */}
                <div className="space-y-3 pt-1">
                  <button
                    type="submit"
                    disabled={isValidating || isSaving || securityCode.length !== 6}
                    className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white focus:outline-none focus:ring-4 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500/50`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent rounded-lg"></div>
                    
                    {isValidating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="relative z-10 tracking-wide text-xs">Validando...</span>
                      </>
                    ) : isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="relative z-10 tracking-wide text-xs">Guardando...</span>
                      </>
                    ) : (
                      <span className="relative z-10 tracking-wide font-bold uppercase text-sm"> CONTINUAR </span>
                    )}
                  </button>

                  {countdown > 0 ? (
                    <div className="w-full flex justify-center py-2 px-4 bg-slate-100/80 rounded-lg backdrop-blur-sm">
                      <span className="text-xs font-semibold text-slate-600">
                        Reenviar código en {formatTime(countdown)}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isValidating || isSaving}
                      className={`w-full flex justify-center py-2 px-4 text-xs font-semibold transition-colors duration-200 hover:underline decoration-2 underline-offset-2 ${
                        isValidating || isSaving ? 'text-slate-400 cursor-not-allowed' : 'text-cyan-600 hover:text-cyan-800'
                      }`}
                    >
                      Reenviar código
                    </button>
                  )}
                  
                  
                </div>
              </form>
            )}

            {/* Estado: Éxito - ESTILO ACTUALIZADO COMO CODIGOPAGE */}
            {currentStep === 'success' && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-cyan-400 mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
                </svg>
                <h3 className="text-slate-800 text-xl font-bold mb-2">
                  ¡Registro Completado!
                </h3>
                <p className="text-slate-600 text-sm mb-6">
                  Sus preguntas de seguridad han sido registradas exitosamente y serán utilizadas para validar transacciones importantes en su cuenta.
                </p>
                
                <div className="bg-cyan-500/20 border border-cyan-400/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
                  <p className="text-slate-800 text-sm">
                    <strong>Importante:</strong> Memorice sus respuestas exactamente como las escribió para futuras validaciones.
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    if (onComplete) {
                      onComplete({
                        securityCode: securityCode,
                        message: 'Preguntas de seguridad registradas correctamente'
                      });
                    }
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700 shadow-cyan-500/20 text-white px-8 py-3 rounded-xl transition-colors duration-200 font-medium"
                >
                  🏠 Continuar
                </button>
              </div>
            )}

            {/* Estado: Error - ESTILO ACTUALIZADO COMO CODIGOPAGE */}
            {currentStep === 'error' && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-red-400 mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2M12,21L10.91,15.74L2,15L10.91,14.26L12,8L13.09,14.26L22,15L13.09,15.74L12,21Z"/>
                </svg>
                <p className="text-slate-800 text-lg mb-4">Ocurrió un problema</p>
                <button
                  onClick={() => {
                    setCurrentStep('code');
                    setSecurityCode('');
                    setOtpCode(['', '', '', '', '', '']);
                    setAlert(null);
                    inputRefs.current[0]?.focus();
                  }}
                  className="bg-white/20 hover:bg-white/30 text-slate-800 px-6 py-2 rounded-lg transition-colors duration-200"
                >
                  Intentar nuevamente
                </button>
              </div>
            )}
          </div>

          
        </div>
      </div>
    </div>
  );
};

export default SecurityCodeValidationPage;