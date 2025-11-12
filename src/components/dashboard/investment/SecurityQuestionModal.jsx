import React, { useState, useRef, useEffect } from 'react';
import apiService from '../../../services/apiService';

const SecurityQuestionModal = ({
  isOpen,
  securityQuestion,
  onValidateAnswer,
  onCancel,
  investmentData
}) => {
  // Estados para preguntas de seguridad
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;
  
  // 🆕 Estados para múltiples preguntas
  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  
  // 🆕 Estados para método de validación (pregunta vs OTP)
  const [validationMethod, setValidationMethod] = useState('question'); // 'question' | 'otp'
  
  // 🆕 Estados para código OTP
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [idemsg, setIdemsg] = useState(null);
  const [isRequestingOTP, setIsRequestingOTP] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showOTPInstructions, setShowOTPInstructions] = useState(true);
  
  const answerInputRef = useRef(null);
  const inputRefs = useRef([]);

  // Focus en el input cuando se abre el modal
  useEffect(() => {
    if (isOpen && validationMethod === 'question' && answerInputRef.current) {
      setTimeout(() => {
        answerInputRef.current.focus();
      }, 100);
    }
  }, [isOpen, validationMethod]);

  // 🆕 Cargar todas las preguntas de seguridad cuando se abre el modal
  useEffect(() => {
    if (isOpen && validationMethod === 'question') {
      loadAllSecurityQuestions();
    }
  }, [isOpen, validationMethod]);

  // Limpiar estados cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setAnswer('');
      setError(null);
      setAttempts(0);
      setValidationMethod('question');
      setCurrentQuestionIndex(0);
      setOtpCode(['', '', '', '', '', '']);
      setIdemsg(null);
      setOtpAttempts(0);
      setResendCooldown(0);
      setShowOTPInstructions(true);
      
      // 🔧 CORRECCIÓN: Inicializar con la pregunta existente si está disponible
      if (securityQuestion.data) {
        setSecurityQuestions([securityQuestion.data]);
      }
    }
  }, [isOpen, securityQuestion.data]);

  // 🆕 Efecto para countdown del resend de OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // 🆕 Función para cargar todas las preguntas de seguridad del usuario
  const loadAllSecurityQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const cedula = apiService.getUserCedula();
      
      if (!cedula) {
        throw new Error('No se pudo obtener la cédula del usuario');
      }

      const result = await apiService.getUserSecurityQuestions(cedula);

      if (result.success && result.data && result.data.length > 0) {
        setSecurityQuestions(result.data);
        console.log(`✅ [SECURITY-MODAL] Cargadas ${result.data.length} preguntas de seguridad`);
      } else {
        // Si no hay múltiples preguntas, mantener la pregunta existente
        console.log('⚠️ [SECURITY-MODAL] No se obtuvieron múltiples preguntas, usando pregunta existente');
        if (securityQuestion.data && securityQuestions.length === 0) {
          setSecurityQuestions([securityQuestion.data]);
        }
      }
    } catch (error) {
      console.error('❌ [SECURITY-MODAL] Error cargando preguntas:', error);
      // Fallback: mantener la pregunta existente
      if (securityQuestion.data && securityQuestions.length === 0) {
        console.log('🔄 [SECURITY-MODAL] Fallback a pregunta existente');
        setSecurityQuestions([securityQuestion.data]);
      }
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!answer.trim()) {
      setError('Por favor ingrese su respuesta');
      return;
    }

    if (answer.trim().length < 2) {
      setError('La respuesta debe tener al menos 2 caracteres');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('🔒 [SECURITY-MODAL] Validando respuesta de seguridad...');
      
      const result = await onValidateAnswer(answer.trim());
      
      if (result.success) {
        console.log('✅ [SECURITY-MODAL] Respuesta validada correctamente');
        // El modal se cerrará automáticamente
      } else {
        console.error('❌ [SECURITY-MODAL] Respuesta incorrecta:', result.error);
        
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= maxAttempts) {
          setError(`Respuesta incorrecta. Ha superado el máximo de ${maxAttempts} intentos. El proceso se cancelará.`);
          setTimeout(() => {
            onCancel();
          }, 3000);
        } else {
          // Cambiar a la siguiente pregunta si hay más disponibles
          if (securityQuestions.length > 1 && currentQuestionIndex < securityQuestions.length - 1) {
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            setAnswer('');
            setError(`Respuesta incorrecta. Te quedan ${maxAttempts - newAttempts} intentos. Intenta con esta otra pregunta.`);
            console.log('🔄 [SECURITY-MODAL] Cambiando a la siguiente pregunta');
          } else {
            setError(`Respuesta incorrecta. Intentos restantes: ${maxAttempts - newAttempts}`);
            setAnswer('');
          }
          
          setTimeout(() => {
            if (answerInputRef.current) {
              answerInputRef.current.focus();
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('💥 [SECURITY-MODAL] Error inesperado:', error);
      setError('Error inesperado. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🆕 Función para cambiar de pregunta manualmente
  const handleChangeQuestion = () => {
    if (securityQuestions.length > 1) {
      const nextIndex = (currentQuestionIndex + 1) % securityQuestions.length;
      setCurrentQuestionIndex(nextIndex);
      setAnswer('');
      setError(null);
      console.log(`🔄 [SECURITY-MODAL] Cambiando a pregunta ${nextIndex + 1} de ${securityQuestions.length}`);
    }
  };

  // 🆕 Función para cambiar a validación OTP
  const handleSwitchToOTP = () => {
    console.log('🔐 [SECURITY-MODAL] Cambiando a validación OTP');
    setValidationMethod('otp');
    setError(null);
    setAnswer('');
    setShowOTPInstructions(true);
  };

  // 🆕 Función para volver a pregunta de seguridad
  const handleSwitchToQuestion = () => {
    console.log('🔐 [SECURITY-MODAL] Cambiando a pregunta de seguridad');
    setValidationMethod('question');
    setError(null);
    setOtpCode(['', '', '', '', '', '']);
    setIdemsg(null);
    setShowOTPInstructions(true);
  };

  // 🆕 Función para solicitar código OTP
  const requestOTPCode = async () => {
    try {
      setIsRequestingOTP(true);
      setError(null);
      
      console.log('📱 [SECURITY-MODAL] Solicitando código OTP...');
      
      const cedula = apiService.getUserCedula();
      if (!cedula) {
        throw new Error('No se pudo obtener la cédula del usuario');
      }

      const result = await apiService.requestSecurityCodeForRegistration(cedula);

      if (result.success && result.data && result.data.idemsg) {
        setIdemsg(result.data.idemsg);
        setShowOTPInstructions(false);
        setResendCooldown(60);
        console.log('✅ [SECURITY-MODAL] Código OTP enviado correctamente');
        
        setTimeout(() => {
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
          }
        }, 100);
      } else {
        throw new Error(result.error?.message || 'No se pudo enviar el código OTP');
      }
    } catch (error) {
      console.error('❌ [SECURITY-MODAL] Error solicitando OTP:', error);
      setError(error.message || 'Error al solicitar código OTP. Intente nuevamente.');
    } finally {
      setIsRequestingOTP(false);
    }
  };

  // 🆕 Función para manejar cambio en inputs OTP
  const handleOTPChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOTP = [...otpCode];
    newOTP[index] = value;
    setOtpCode(newOTP);

    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  // 🆕 Función para validar código OTP
  const handleValidateOTP = async () => {
    const fullCode = otpCode.join('');
    
    if (fullCode.length !== 6) {
      setError('Por favor ingrese el código completo de 6 dígitos');
      return;
    }

    if (!idemsg) {
      setError('No hay identificador de mensaje. Solicite un nuevo código.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      console.log('🔐 [SECURITY-MODAL] Validando código OTP...');
      
      const cedula = apiService.getUserCedula();
      if (!cedula) {
        throw new Error('No se pudo obtener la cédula del usuario');
      }

      const result = await apiService.validateSecurityCodeForRegistration(
        cedula,
        idemsg,
        fullCode
      );
      
      if (result.success) {
        console.log('✅ [SECURITY-MODAL] Código OTP validado correctamente');
        // Llamar al callback con resultado exitoso
        await onValidateAnswer(null, 'otp');
      } else {
        const newAttempts = otpAttempts + 1;
        setOtpAttempts(newAttempts);
        
        if (newAttempts >= maxAttempts) {
          setError(`Código incorrecto. Ha superado el máximo de ${maxAttempts} intentos. El proceso se cancelará.`);
          setTimeout(() => {
            onCancel();
          }, 3000);
        } else {
          setError(
            result.error?.message || 
            `Código incorrecto. Te quedan ${maxAttempts - newAttempts} intentos.`
          );
          setOtpCode(['', '', '', '', '', '']);
          if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
          }
        }
      }
    } catch (error) {
      console.error('💥 [SECURITY-MODAL] Error inesperado:', error);
      setError('Error inesperado al validar el código: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    console.log('❌ [SECURITY-MODAL] Usuario canceló validación de seguridad');
    setAnswer('');
    setError(null);
    onCancel();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Validación de Seguridad</h2>
              <p className="text-blue-100 text-sm">Confirme su identidad para continuar</p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          
          {/* Resumen de inversión */}
          {investmentData && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.41,10.09L6,11.5L11,16.5Z"/>
                </svg>
                Confirmar Inversión
              </h4>
              <div className="text-green-700 text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Monto:</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(investmentData.valinver))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Plazo:</span>
                  <span className="font-semibold">{investmentData.plzinver} días</span>
                </div>
                <div className="flex justify-between">
                  <span>Tasa:</span>
                  <span className="font-semibold">{investmentData.tasinver}% anual</span>
                </div>
              </div>
            </div>
          )}

          {/* 🆕 Pestañas para seleccionar método de validación */}
          <div className="mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={handleSwitchToQuestion}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  validationMethod === 'question'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.07,11.25L14.17,12.17C13.45,12.89 13,13.5 13,15H11V14.5C11,13.39 11.45,12.39 12.17,11.67L13.41,10.41C13.78,10.05 14,9.55 14,9C14,7.89 13.1,7 12,7A2,2 0 0,0 10,9H8A4,4 0 0,1 12,5A4,4 0 0,1 16,9C16,10.1 15.57,11.1 14.83,11.84L15.07,11.25M13,19H11V17H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2Z" />
                  </svg>
                  <span>Pregunta de Seguridad</span>
                </div>
              </button>
              <button
                onClick={handleSwitchToOTP}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  validationMethod === 'otp'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1Z" />
                  </svg>
                  <span>Código OTP</span>
                </div>
              </button>
            </div>
          </div>

          {/* 🆕 FORMULARIO DE PREGUNTA DE SEGURIDAD */}
          {validationMethod === 'question' && (
            <>
              {/* Estado de carga de pregunta */}
              {loadingQuestions && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-blue-700 text-sm font-medium">
                      Cargando preguntas de seguridad...
                    </span>
                  </div>
                </div>
              )}

              {/* Formulario de pregunta de seguridad */}
              {securityQuestions.length > 0 && !loadingQuestions && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Pregunta actual */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Pregunta de Seguridad:
                      </label>
                      {/* 🆕 Botón para cambiar de pregunta */}
                      {securityQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={handleChangeQuestion}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12,4V1L8,5L12,9V6A6,6 0 0,1 18,12C18,13.31 17.5,14.5 16.7,15.39L18.1,16.8C19.33,15.45 20,13.78 20,12A8,8 0 0,0 12,4M12,18A6,6 0 0,1 6,12C6,10.69 6.5,9.5 7.3,8.61L5.9,7.2C4.67,8.55 4,10.22 4,12A8,8 0 0,0 12,20V23L16,19L12,15V18Z" />
                          </svg>
                          <span>Cambiar pregunta ({currentQuestionIndex + 1}/{securityQuestions.length})</span>
                        </button>
                      )}
                    </div>
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-gray-800 font-medium">
                        {securityQuestions[currentQuestionIndex]?.detprg}
                      </p>
                    </div>
                  </div>

                  {/* Input de respuesta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Su respuesta:
                    </label>
                    <input
                      ref={answerInputRef}
                      type="text"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Ingrese su respuesta exacta..."
                      disabled={isSubmitting || attempts >= maxAttempts}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        error 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !isSubmitting && answer.trim()) {
                          handleSubmit(e);
                        }
                      }}
                    />
                    
                    {/* Contador de caracteres */}
                    {answer && (
                      <p className="text-xs text-gray-500 mt-1">
                        Longitud: {answer.length} caracteres
                      </p>
                    )}
                  </div>

                  {/* Mensaje de error */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-red-700 text-sm font-medium">{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Indicador de intentos */}
                  {attempts > 0 && attempts < maxAttempts && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-yellow-700 text-sm">
                          Intento {attempts} de {maxAttempts}. Quedan {maxAttempts - attempts} intentos.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Botones */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={!answer.trim() || isSubmitting || attempts >= maxAttempts}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Validando...</span>
                        </div>
                      ) : (
                        'Validar Respuesta'
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* 🆕 FORMULARIO DE CÓDIGO OTP */}
          {validationMethod === 'otp' && (
            <>
              {/* Pantalla de instrucciones o entrada de código */}
              {showOTPInstructions ? (
                <div className="space-y-4">
                  {/* Instrucciones */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21A2,2 0 0,0 7,23H17A2,2 0 0,0 19,21V3C19,1.89 18.1,1 17,1Z" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 mb-2">Validación con Código OTP</h3>
                        <div className="text-sm text-blue-700 space-y-2">
                          <p>Para confirmar esta inversión, le enviaremos un código de seguridad de 6 dígitos.</p>
                          <div className="bg-blue-100 p-3 rounded-lg mt-3">
                            <p className="font-medium text-blue-900 mb-1">El código será enviado a:</p>
                            <p className="text-blue-800">📧 Su correo electrónico registrado</p>
                            <p className="text-blue-800">📱 Su teléfono celular registrado</p>
                          </div>
                          <p className="text-xs text-blue-600 mt-2">
                            💡 <strong>Nota:</strong> El código tiene una validez de 2 minutos.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mensaje de error */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-red-700 text-sm font-medium">{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Botones */}
                  <div className="flex space-x-3">
                    <button
                      onClick={requestOTPCode}
                      disabled={isRequestingOTP}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
                    >
                      {isRequestingOTP ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Enviando...</span>
                        </div>
                      ) : (
                        'Enviar Código'
                      )}
                    </button>
                    
                    <button
                      onClick={handleCancel}
                      disabled={isRequestingOTP}
                      className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Confirmación de envío */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <svg className="w-6 h-6 text-green-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10,17L5,12L6.41,10.58L10,14.17L17.59,6.58L19,8M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold text-green-900 mb-1">✅ Código enviado</h3>
                        <p className="text-sm text-green-700">
                          Ingrese el código de 6 dígitos que enviamos a su correo/teléfono
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Inputs OTP */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                      Código de Verificación
                    </label>
                    <div className="flex justify-center space-x-2">
                      {otpCode.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (inputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOTPChange(index, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !digit && index > 0) {
                              inputRefs.current[index - 1].focus();
                            }
                          }}
                          disabled={isSubmitting || otpAttempts >= maxAttempts}
                          className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Mensaje de error */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-red-700 text-sm font-medium">{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Indicador de intentos */}
                  {otpAttempts > 0 && otpAttempts < maxAttempts && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-yellow-700 text-sm">
                          Intento {otpAttempts} de {maxAttempts}. Quedan {maxAttempts - otpAttempts} intentos.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex space-x-3">
                    <button
                      onClick={handleValidateOTP}
                      disabled={otpCode.join('').length !== 6 || isSubmitting || otpAttempts >= maxAttempts}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Validando código...</span>
                        </div>
                      ) : (
                        'Validar Código'
                      )}
                    </button>
                    
                    <button
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>
                  </div>

                  {/* Opción de reenviar */}
                  <div className="text-center">
                    {resendCooldown > 0 ? (
                      <p className="text-sm text-gray-500">
                        Podrás reenviar el código en {resendCooldown} segundos
                      </p>
                    ) : (
                      <button
                        onClick={requestOTPCode}
                        disabled={isRequestingOTP}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {isRequestingOTP ? 'Reenviando...' : '🔄 Reenviar código'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Información de seguridad */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
              </svg>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">¿Por qué necesitamos esto?</p>
                <ul className="space-y-1 text-xs text-blue-600">
                  <li>• Esta validación protege sus inversiones</li>
                  <li>• Confirma que usted autorizó esta transacción</li>
                  <li>• Es requerido para transacciones de alto valor</li>
                  <li>• Sus datos están protegidos y encriptados</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SecurityQuestionModal;