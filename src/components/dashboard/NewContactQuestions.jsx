import React, { useState, useEffect, useRef } from 'react';
import apiService from '../../services/apiService';

const NewContactQuestions = ({ beneficiaryData, onSecurityValidated, onBack, onCancel }) => {
  // Estados para preguntas de seguridad
  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [validationAttempts, setValidationAttempts] = useState(0);
  const maxAttempts = 3;
  
  // 🆕 Estados para selección de método de validación
  const [validationMethod, setValidationMethod] = useState('question'); // 'question' | 'otp'
  
  // 🆕 Estados para código OTP
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [idemsg, setIdemsg] = useState(null);
  const [isRequestingOTP, setIsRequestingOTP] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    loadSecurityQuestion();
  }, []);
  
  // 🆕 Efecto para countdown del resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const loadSecurityQuestion = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('🔒 [SECURITY-Q] Cargando preguntas de seguridad del usuario...');
      
      // Obtener cédula del usuario actual
      const cedula = apiService.getUserCedula();
      if (!cedula) {
        throw new Error('No se pudo obtener la cédula del usuario');
      }

      // Obtener preguntas de seguridad del usuario registrado
      const result = await apiService.getSecurityQuestion(cedula);
      
      if (result.success && result.questions && result.questions.length > 0) {
        // Almacenar todas las preguntas disponibles del usuario
        setSecurityQuestions(result.questions);
        setCurrentQuestionIndex(0); // Comenzar con la primera pregunta
        console.log('✅ [SECURITY-Q] Preguntas cargadas:', result.questions.length, 'preguntas encontradas');
        console.log('📝 [SECURITY-Q] Primera pregunta:', result.questions[0].detprg);
      } else {
        throw new Error(result.error?.message || 'No tienes preguntas de seguridad registradas. Contacta al administrador.');
      }
    } catch (error) {
      console.error('❌ [SECURITY-Q] Error cargando preguntas:', error);
      setError('Error al cargar las preguntas de seguridad: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateAnswer = async () => {
    // Prevenir múltiples clicks cuando está validando
    if (isValidating) {
      console.log('⚠️ [SECURITY-Q] Validación en curso, ignorando click adicional');
      return;
    }

    if (!userAnswer.trim()) {
      setError('Por favor, ingresa tu respuesta');
      return;
    }

    const currentQuestion = securityQuestions[currentQuestionIndex];
    if (!currentQuestion) {
      setError('No hay pregunta de seguridad disponible');
      return;
    }

    try {
      setIsValidating(true);
      setError('');
      
      console.log('🔐 [SECURITY-Q] Validando respuesta de seguridad...');
      console.log('📝 [SECURITY-Q] Pregunta actual:', currentQuestion.detprg);
      
      // Obtener cédula del usuario actual
      const cedula = apiService.getUserCedula();
      if (!cedula) {
        throw new Error('No se pudo obtener la cédula del usuario');
      }

      // Validar respuesta de seguridad
      const result = await apiService.validateSecurityAnswer(
        cedula,
        currentQuestion.codprg,
        userAnswer.trim()
      );

      if (result.success) {
        console.log('✅ [SECURITY-Q] Respuesta correcta, procediendo...');
        
        // ⚠️ NO desactivar isValidating aquí - el padre continuará creando el beneficiario
        // Notificar al componente padre que la validación fue exitosa
        onSecurityValidated({
          questionCode: currentQuestion.codprg,
          answer: userAnswer.trim(),
          beneficiaryData: beneficiaryData
        });
        
        // Mantener isValidating = true para que el botón permanezca deshabilitado
        return; // Salir sin ejecutar finally
      } else {
        console.error('❌ [SECURITY-Q] Respuesta incorrecta:', result.error?.message);
        
        const newAttempts = validationAttempts + 1;
        setValidationAttempts(newAttempts);
        
        if (newAttempts >= maxAttempts) {
          setError(`Respuesta incorrecta. Has agotado tus ${maxAttempts} intentos. Por seguridad, el proceso ha sido cancelado.`);
          
          // Después de 3 segundos, cancelar el proceso
          setTimeout(() => {
            onCancel();
          }, 3000);
        } else {
          // Si hay más preguntas disponibles y aún quedan intentos, cambiar a la siguiente pregunta
          if (securityQuestions.length > 1 && currentQuestionIndex < securityQuestions.length - 1) {
            const nextIndex = currentQuestionIndex + 1;
            setCurrentQuestionIndex(nextIndex);
            setUserAnswer(''); // Limpiar respuesta
            setError(`Respuesta incorrecta. Te quedan ${maxAttempts - newAttempts} intentos. Intenta con esta otra pregunta.`);
            console.log('🔄 [SECURITY-Q] Cambiando a la siguiente pregunta:', securityQuestions[nextIndex].detprg);
          } else {
            setError(`Respuesta incorrecta. Te quedan ${maxAttempts - newAttempts} intentos.`);
            setUserAnswer(''); // Limpiar respuesta
          }
        }
        setIsValidating(false); // Solo desactivar cuando hay error
      }
    } catch (error) {
      console.error('💥 [SECURITY-Q] Error inesperado:', error);
      setError('Error inesperado al validar la respuesta: ' + error.message);
      setIsValidating(false); // Desactivar en caso de excepción
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isValidating && userAnswer.trim()) {
      handleValidateAnswer();
    }
  };

  const handleChangeQuestion = () => {
    if (securityQuestions.length > 1 && !isValidating) {
      const nextIndex = (currentQuestionIndex + 1) % securityQuestions.length;
      setCurrentQuestionIndex(nextIndex);
      setUserAnswer('');
      setError('');
      console.log('🔄 [SECURITY-Q] Cambiando a pregunta:', securityQuestions[nextIndex].detprg);
    }
  };
  
  // 🆕 FUNCIÓN PARA SOLICITAR CÓDIGO OTP (API 2155)
  const requestOTPCode = async () => {
    try {
      setIsRequestingOTP(true);
      setError('');
      
      console.log('📱 [OTP] Solicitando código OTP para creación de beneficiario...');
      
      const cedula = apiService.getUserCedula();
      if (!cedula) {
        throw new Error('No se pudo obtener la cédula del usuario');
      }
      
      const result = await apiService.requestSecurityCodeForRegistration(cedula);
      
      // 🔧 CORRECCIÓN: Acceder a result.data.idemsg en lugar de result.idemsg
      if (result.success && result.data?.idemsg) {
        setIdemsg(result.data.idemsg);
        setResendCooldown(60); // 60 segundos de cooldown
        console.log('✅ [OTP] Código enviado exitosamente. idemsg:', result.data.idemsg);
        setError(''); // Limpiar cualquier error previo
      } else {
        throw new Error(result.error?.message || 'No se pudo enviar el código OTP');
      }
    } catch (error) {
      console.error('❌ [OTP] Error solicitando código:', error);
      setError('Error al enviar código OTP: ' + error.message);
    } finally {
      setIsRequestingOTP(false);
    }
  };
  
  // 🆕 FUNCIÓN PARA CAMBIAR MÉTODO DE VALIDACIÓN (SIN ENVÍO AUTOMÁTICO)
  const handleSwitchToOTP = () => {
    setValidationMethod('otp');
    setError('');
    setUserAnswer('');
    setValidationAttempts(0);
    
    // ❌ NO solicitar código automáticamente - el usuario debe hacer click en "Enviar código"
    // await requestOTPCode();
  };
  
  // 🆕 FUNCIÓN PARA VOLVER A PREGUNTA DE SEGURIDAD
  const handleSwitchToQuestion = () => {
    setValidationMethod('question');
    setError('');
    setOtpCode(['', '', '', '', '', '']);
    setOtpAttempts(0);
    setIdemsg(null);
  };
  
  // 🆕 FUNCIÓN PARA MANEJAR CAMBIO EN INPUTS OTP
  const handleOTPInputChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Solo números
    
    const newOtpCode = [...otpCode];
    newOtpCode[index] = value;
    setOtpCode(newOtpCode);
    
    // Auto-focus al siguiente input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };
  
  // 🆕 FUNCIÓN PARA MANEJAR TECLAS EN INPUTS OTP
  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };
  
  // 🆕 FUNCIÓN PARA MANEJAR PASTE EN OTP
  const handleOTPPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    const newOtpCode = [...otpCode];
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtpCode[i] = pastedData[i];
    }
    
    setOtpCode(newOtpCode);
    
    // Focus al último input con valor o al siguiente vacío
    const nextEmptyIndex = newOtpCode.findIndex(code => !code);
    if (nextEmptyIndex !== -1 && inputRefs.current[nextEmptyIndex]) {
      inputRefs.current[nextEmptyIndex].focus();
    } else if (inputRefs.current[5]) {
      inputRefs.current[5].focus();
    }
  };
  
  // 🆕 FUNCIÓN PARA VALIDAR CÓDIGO OTP (API 2156)
  const handleValidateOTP = async () => {
    if (isValidating) {
      console.log('⚠️ [OTP] Validación en curso, ignorando click adicional');
      return;
    }
    
    const fullCode = otpCode.join('');
    if (fullCode.length !== 6) {
      setError('Por favor, ingresa el código completo de 6 dígitos');
      return;
    }
    
    if (!idemsg) {
      setError('No hay código OTP solicitado. Solicita uno nuevo.');
      return;
    }
    
    try {
      setIsValidating(true);
      setError('');
      
      console.log('🔐 [OTP] Validando código OTP...');
      
      const cedula = apiService.getUserCedula();
      if (!cedula) {
        throw new Error('No se pudo obtener la cédula del usuario');
      }
      
      // ✅ SEGÚN DOCUMENTACIÓN: Proceso 2156 solo necesita idecl, idemsg, codseg
      const result = await apiService.validateSecurityCodeForRegistration(
        cedula,      // idecl
        idemsg,      // idemsg (viene encriptado del proceso 2155)
        fullCode     // codseg (código OTP ingresado)
      );
      
      if (result.success) {
        console.log('✅ [OTP] Código validado correctamente');
        
        // ⚠️ NO desactivar isValidating aquí - el padre continuará creando el beneficiario
        // Notificar al componente padre que la validación fue exitosa
        // Incluir beneficiaryData igual que con pregunta de seguridad
        onSecurityValidated({
          method: 'otp',
          code: fullCode,
          idemsg: idemsg,
          beneficiaryData: beneficiaryData  // ✅ Pasar datos del beneficiario
        });
        
        // Mantener isValidating = true para que el botón permanezca deshabilitado
        return; // Salir sin ejecutar finally
      } else {
        const newAttempts = otpAttempts + 1;
        setOtpAttempts(newAttempts);
        
        if (newAttempts >= maxAttempts) {
          setError(`Has alcanzado el máximo de ${maxAttempts} intentos. La operación ha sido cancelada.`);
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
        setIsValidating(false); // Solo desactivar cuando hay error
      }
    } catch (error) {
      console.error('💥 [OTP] Error inesperado:', error);
      setError('Error inesperado al validar el código: ' + error.message);
      setIsValidating(false); // Desactivar en caso de excepción
    }
  };
  
  // 🆕 FUNCIÓN PARA REENVIAR CÓDIGO OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0 || isRequestingOTP) return;
    
    setOtpCode(['', '', '', '', '', '']);
    setOtpAttempts(0);
    await requestOTPCode();
  };

  if (isLoading) {
    return (
      <div className="p-6 h-full bg-white overflow-auto">
        <div className="max-w-2xl mx-auto">
          {/* Header con botón de regreso */}
          <div className="flex items-center mb-6">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors duration-200 mr-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
              </svg>
              <span>Nuevo beneficiario</span>
            </button>
          </div>

          {/* Loading State */}
          <div className="text-center py-12">
            <div className="inline-flex items-center space-x-3">
              <svg className="animate-spin h-8 w-8 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-lg text-gray-700">Cargando pregunta de seguridad...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full bg-white overflow-auto">
      <div className="max-w-2xl mx-auto">
        {/* Header con botón de regreso */}
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors duration-200 mr-4"
            disabled={isValidating}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
            </svg>
            <span>Nuevo beneficiario</span>
          </button>
        </div>

        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Verificación de seguridad</h1>
          <p className="text-gray-600">Responde la pregunta de seguridad para continuar</p>
        </div>

        {/* Resumen del beneficiario */}
        {beneficiaryData && (
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-sky-800 mb-4">Datos del beneficiario a registrar:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-sky-600 font-medium">Nombre:</span>
                <p className="text-gray-800">{beneficiaryData.beneficiaryName}</p>
              </div>
              <div>
                <span className="text-sky-600 font-medium">Identificación:</span>
                <p className="text-gray-800">{beneficiaryData.identificationNumber}</p>
              </div>
              <div>
                <span className="text-sky-600 font-medium">Banco:</span>
                <p className="text-gray-800">{beneficiaryData.bankName}</p>
              </div>
              <div>
                <span className="text-sky-600 font-medium">Cuenta:</span>
                <p className="text-gray-800">{beneficiaryData.accountTypeName} - {beneficiaryData.accountNumber}</p>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de pregunta de seguridad */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {/* 🆕 TABS PARA SELECCIONAR MÉTODO DE VALIDACIÓN */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={handleSwitchToQuestion}
              disabled={isValidating || validationAttempts >= maxAttempts}
              className={`flex-1 px-6 py-4 font-medium transition-all duration-200 ${
                validationMethod === 'question'
                  ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,17.4 15.4,18 14.8,18H9.2C8.6,18 8,17.4 8,16V13C8,12.4 8.6,11.5 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,10V11.5H13.5V10C13.5,8.7 12.8,8.2 12,8.2Z"/>
                </svg>
                <span>Pregunta de seguridad</span>
              </div>
            </button>
            <button
              onClick={handleSwitchToOTP}
              disabled={isValidating || otpAttempts >= maxAttempts}
              className={`flex-1 px-6 py-4 font-medium transition-all duration-200 ${
                validationMethod === 'otp'
                  ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17,12V3A1,1 0 0,0 16,2H3A1,1 0 0,0 2,3V17L6,13H16A1,1 0 0,0 17,12M21,6H19V15H6V17A1,1 0 0,0 7,18H18L22,22V7A1,1 0 0,0 21,6Z"/>
                </svg>
                <span>Código OTP</span>
              </div>
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Icono de seguridad */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-sky-500 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
                {validationMethod === 'question' ? (
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,17.4 15.4,18 14.8,18H9.2C8.6,18 8,17.4 8,16V13C8,12.4 8.6,11.5 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,10V11.5H13.5V10C13.5,8.7 12.8,8.2 12,8.2Z"/>
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/>
                  </svg>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {validationMethod === 'question' 
                  ? 'Responde la pregunta de seguridad' 
                  : 'Ingresa el código enviado a tu correo/teléfono'
                }
              </p>
            </div>

            {/* Error o mensaje de intentos */}
            {error && (
              <div className={`border rounded-xl p-4 ${
                (validationMethod === 'question' && validationAttempts >= maxAttempts) ||
                (validationMethod === 'otp' && otpAttempts >= maxAttempts)
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    (validationMethod === 'question' && validationAttempts >= maxAttempts) ||
                    (validationMethod === 'otp' && otpAttempts >= maxAttempts)
                      ? 'bg-red-500' 
                      : 'bg-yellow-500'
                  }`}>
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                    </svg>
                  </div>
                  <p className={`font-medium ${
                    (validationMethod === 'question' && validationAttempts >= maxAttempts) ||
                    (validationMethod === 'otp' && otpAttempts >= maxAttempts)
                      ? 'text-red-700' 
                      : 'text-yellow-700'
                  }`}>
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* 🆕 CONTENIDO SEGÚN EL MÉTODO SELECCIONADO */}
            {validationMethod === 'question' ? (
              /* PREGUNTA DE SEGURIDAD */
              securityQuestions.length > 0 && validationAttempts < maxAttempts && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Pregunta de seguridad:
                      {securityQuestions.length > 1 && (
                        <span className="text-sm text-gray-500 ml-2">
                          ({currentQuestionIndex + 1} de {securityQuestions.length})
                        </span>
                      )}
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 flex items-center justify-between">
                      <p className="text-gray-800 font-medium flex-1">{securityQuestions[currentQuestionIndex]?.detprg}</p>
                      {securityQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={handleChangeQuestion}
                          disabled={isValidating}
                          className="ml-4 text-sky-600 hover:text-sky-800 disabled:text-gray-400 transition-colors duration-200 flex items-center space-x-1"
                          title="Cambiar pregunta"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                          </svg>
                          <span className="text-sm">Otra pregunta</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tu respuesta *
                    </label>
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ingresa tu respuesta"
                      disabled={isValidating}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-transparent transition-all duration-300 disabled:opacity-50"
                      autoFocus
                    />
                    {validationAttempts > 0 && (
                      <p className="text-sm text-orange-600 mt-1">
                        Intento {validationAttempts} de {maxAttempts}
                      </p>
                    )}
                  </div>
                </>
              )
            ) : (
              /* 🆕 CÓDIGO OTP */
              otpAttempts < maxAttempts && (
                <>
                  {/* 🆕 MENSAJE INICIAL O CONFIRMACIÓN DE ENVÍO */}
                  {!idemsg ? (
                    /* PANTALLA INICIAL - SOLICITAR CÓDIGO */
                    <div className="space-y-6">
                      <div className="bg-sky-50 border border-sky-200 rounded-xl p-6">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <svg className="w-8 h-8 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12,15C12.81,15 13.5,14.7 14.11,14.11C14.7,13.5 15,12.81 15,12C15,11.19 14.7,10.5 14.11,9.89C13.5,9.3 12.81,9 12,9C11.19,9 10.5,9.3 9.89,9.89C9.3,10.5 9,11.19 9,12C9,12.81 9.3,13.5 9.89,14.11C10.5,14.7 11.19,15 12,15M12,2C14.75,2 17.1,3 19.05,4.95C21,6.9 22,9.25 22,12V13.45C22,14.45 21.65,15.3 21,16C20.3,16.67 19.5,17 18.5,17C17.3,17 16.31,16.5 15.56,15.5C14.56,16.5 13.38,17 12,17C10.63,17 9.45,16.5 8.46,15.54C7.5,14.55 7,13.38 7,12C7,10.63 7.5,9.45 8.46,8.46C9.45,7.5 10.63,7 12,7C13.38,7 14.55,7.5 15.54,8.46C16.5,9.45 17,10.63 17,12V13.45C17,13.86 17.16,14.22 17.46,14.53C17.77,14.84 18.11,15 18.5,15C18.92,15 19.27,14.84 19.57,14.53C19.87,14.22 20,13.86 20,13.45V12C20,9.81 19.23,7.93 17.65,6.35C16.07,4.77 14.19,4 12,4C9.81,4 7.93,4.77 6.35,6.35C4.77,7.93 4,9.81 4,12C4,14.19 4.77,16.07 6.35,17.65C7.93,19.23 9.81,20 12,20H17V22H12C9.25,22 6.9,21 4.95,19.05C3,17.1 2,14.75 2,12C2,9.25 3,6.9 4.95,4.95C6.9,3 9.25,2 12,2Z"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-sky-800 mb-2">
                              Verificación mediante código OTP
                            </h3>
                            <p className="text-sm text-sky-700 mb-4">
                              Enviaremos un código de verificación de 6 dígitos a tu teléfono registrado en el sistema.
                            </p>
                            <ul className="text-sm text-sky-600 space-y-1 mb-4">
                              <li className="flex items-center">
                                <svg className="w-4 h-4 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
                                </svg>
                                El código es válido por tiempo limitado
                              </li>
                              <li className="flex items-center">
                                <svg className="w-4 h-4 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
                                </svg>
                                Tienes máximo 3 intentos para validar el código
                              </li>
                              <li className="flex items-center">
                                <svg className="w-4 h-4 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
                                </svg>
                                Puedes solicitar un nuevo código si no lo recibes
                              </li>
                            </ul>
                            <button
                              onClick={requestOTPCode}
                              disabled={isRequestingOTP}
                              className={`w-full bg-gradient-to-r text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center shadow-md ${
                                isRequestingOTP
                                  ? 'from-gray-400 to-gray-500 cursor-wait opacity-75'
                                  : 'from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 hover:shadow-lg cursor-pointer'
                              }`}
                            >
                              {isRequestingOTP ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span className="animate-pulse">Enviando código...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/>
                                  </svg>
                                  Enviar código de verificación
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* PANTALLA DE INGRESO DE CÓDIGO */
                    <>
                      {/* Mensaje informativo */}
                      <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                          <svg className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm text-sky-800 font-medium">
                              Código de verificación enviado
                            </p>
                            <p className="text-sm text-sky-700 mt-1">
                              Ingresa el código de 6 dígitos que enviamos a tu correo electrónico/teléfono registrado.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Inputs OTP */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Código de verificación *
                        </label>
                        <div className="flex justify-center space-x-3">
                          {otpCode.map((digit, index) => (
                            <input
                              key={index}
                              ref={(el) => (inputRefs.current[index] = el)}
                              type="text"
                              maxLength="1"
                              value={digit}
                              onChange={(e) => handleOTPInputChange(index, e.target.value)}
                              onKeyDown={(e) => handleOTPKeyDown(index, e)}
                              onPaste={index === 0 ? handleOTPPaste : undefined}
                              disabled={isValidating}
                              className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 border-2 border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          ))}
                        </div>
                        {otpAttempts > 0 && (
                          <p className="text-sm text-orange-600 mt-2 text-center">
                            Intento {otpAttempts} de {maxAttempts}
                          </p>
                        )}
                      </div>

                      {/* Botón de reenviar código */}
                      <div className="text-center">
                        {resendCooldown > 0 ? (
                          <p className="text-sm text-gray-500">
                            Podrás reenviar el código en {resendCooldown} segundos
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOTP}
                            disabled={isRequestingOTP}
                            className="text-sm text-sky-600 hover:text-sky-800 font-medium disabled:text-gray-400 transition-colors duration-200"
                          >
                            {isRequestingOTP ? 'Enviando...' : '¿No recibiste el código? Reenviar'}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </>
              )
            )}

            {/* Botones */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-xl transition-colors duration-300"
                disabled={isValidating || isRequestingOTP}
              >
                Cancelar
              </button>
              
              {/* 🆕 BOTÓN DINÁMICO SEGÚN MÉTODO SELECCIONADO */}
              {validationMethod === 'question' ? (
                securityQuestions.length > 0 && validationAttempts < maxAttempts && (
                  <button
                    type="button"
                    onClick={handleValidateAnswer}
                    disabled={isValidating || !userAnswer.trim()}
                    className={`flex-1 bg-gradient-to-r text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center shadow-md ${
                      isValidating 
                        ? 'from-gray-400 to-gray-500 cursor-wait opacity-75' 
                        : !userAnswer.trim()
                          ? 'from-gray-400 to-gray-500 cursor-not-allowed'
                          : 'from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 hover:shadow-lg cursor-pointer'
                    }`}
                  >
                    {isValidating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="animate-pulse">Validando respuesta...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                        </svg>
                        Verificar respuesta
                      </>
                    )}
                  </button>
                )
              ) : (
                /* 🆕 BOTÓN DE VALIDACIÓN OTP - Solo visible si ya se envió el código */
                otpAttempts < maxAttempts && idemsg && (
                  <button
                    type="button"
                    onClick={handleValidateOTP}
                    disabled={isValidating || otpCode.join('').length !== 6}
                    className={`flex-1 bg-gradient-to-r text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center shadow-md ${
                      isValidating 
                        ? 'from-gray-400 to-gray-500 cursor-wait opacity-75' 
                        : otpCode.join('').length !== 6
                          ? 'from-gray-400 to-gray-500 cursor-not-allowed'
                          : 'from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 hover:shadow-lg cursor-pointer'
                    }`}
                  >
                    {isValidating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="animate-pulse">Validando código...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                        </svg>
                        Verificar código
                      </>
                    )}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 text-center text-sm text-gray-500 space-y-1">
          <p>Por seguridad, tienes máximo {maxAttempts} intentos para {validationMethod === 'question' ? 'responder correctamente' : 'validar el código'}</p>
          {validationMethod === 'question' && securityQuestions.length > 1 && (
            <p>Tienes {securityQuestions.length} preguntas de seguridad disponibles</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewContactQuestions;
