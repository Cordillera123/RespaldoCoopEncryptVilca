// src/components/SecurityCodeValidationPage1.jsx - PASO 4: VALIDACIÓN FINAL Y REGISTRO COMPLETO
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

const SecurityCodeValidationPage1 = ({ registrationData, onSuccess, onBack }) => {
  const [currentStep, setCurrentStep] = useState('request'); // 'request' | 'validate' | 'completing'
  const [securityCode, setSecurityCode] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [idemsg, setIdemsg] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [isAnimated, setIsAnimated] = useState(false);

  const inputRefs = useRef([]);
  const countdownRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [countdown]);

  const handleRequestCode = async () => {
    console.log('📨 [CODE-VALIDATION] Solicitando código de seguridad');
    
    setIsLoading(true);
    setAlert({ message: 'Enviando código de seguridad...', type: 'info' });

    try {
      const result = await apiService.requestSecurityCodeForUserRegistration(registrationData.cedula);
      
      if (result.success) {
        console.log('✅ [CODE-VALIDATION] Código solicitado exitosamente');
        
        setIdemsg(result.data.idemsg);
        setCurrentStep('validate');
              setCountdown(120); // Reiniciar contador a 2 minutos
        setAlert({ 
          message: 'Código de seguridad enviado a su teléfono registrado. Ingrese el código recibido.', 
          type: 'success' 
        });
        
        setTimeout(() => inputRefs.current[0]?.focus(), 500);
      } else {
        console.error('❌ [CODE-VALIDATION] Error solicitando código:', result.error);
        setAlert({ message: result.error.message, type: 'error' });
      }
    } catch (error) {
      console.error('💥 [CODE-VALIDATION] Error inesperado:', error);
      setAlert({ message: 'Error al enviar el código de seguridad', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateCode = async (e) => {
    e.preventDefault();
    
    console.log('🔐 [CODE-VALIDATION] Validando código de seguridad');
    
    if (securityCode.trim().length < 6) {
      setErrors({ code: 'El código debe tener 6 dígitos' });
      setAlert({ message: 'Código de seguridad inválido', type: 'error' });
      return;
    }

    setIsLoading(true);
    setCurrentStep('completing');
    setAlert({ message: 'Validando código y completando registro...', type: 'info' });

    try {
      // Paso 1: Validar el código de seguridad
      console.log('🔐 [CODE-VALIDATION] Validando código...');
      const codeValidation = await apiService.validateSecurityCodeForUserRegistration(
        registrationData.cedula,
        idemsg,
        securityCode.trim()
      );

      if (!codeValidation.success) {
        throw new Error(codeValidation.error.message);
      }

      console.log('✅ [CODE-VALIDATION] Código validado correctamente');
      setAlert({ message: 'Código válido. Completando registro de usuario...', type: 'info' });

      // Paso 2: Ejecutar el registro completo (preguntas + usuario)
      console.log('👤 [CODE-VALIDATION] Ejecutando registro completo...');
      
      const completeRegistrationData = {
        cedula: registrationData.cedula,
        username: registrationData.username,
        password: registrationData.password,
        selectedQuestions: registrationData.selectedQuestions,
        idemsg: idemsg,
        securityCode: securityCode.trim()
      };

      const registrationResult = await apiService.completeUserRegistration(completeRegistrationData);

      if (registrationResult.success) {
        console.log('🎉 [CODE-VALIDATION] ¡Registro completo exitoso!');
        setAlert({ message: '¡Registro completado exitosamente!', type: 'success' });
        
        setTimeout(() => {
          if (onSuccess) {
            onSuccess({
              username: registrationData.username,
              message: registrationResult.message
            });
          }
        }, 2000);
      } else {
        throw new Error(registrationResult.error.message);
      }

    } catch (error) {
      console.error('💥 [CODE-VALIDATION] Error en registro:', error);
      
      let errorMessage = error.message;
      if (errorMessage.includes('código') || errorMessage.includes('CODE')) {
        setCurrentStep('validate');
        setErrors({ code: 'Código incorrecto o expirado' });
        setOtpCode(['', '', '', '', '', '']);
        setSecurityCode('');
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        errorMessage = 'Error al completar el registro. Intente nuevamente o contacte soporte.';
      }
      
      setAlert({ message: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtpCode = [...otpCode];
    newOtpCode[index] = value;
    setOtpCode(newOtpCode);
    
    const fullCode = newOtpCode.join('');
    setSecurityCode(fullCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (errors.code) {
      setErrors(prev => ({ ...prev, code: '' }));
    }
    if (alert && alert.type === 'error') {
      setAlert(null);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const numbers = pasteData.replace(/\D/g, '').slice(0, 6);
    
    if (numbers.length > 0) {
      const newOtpCode = Array(6).fill('');
      for (let i = 0; i < numbers.length; i++) {
        newOtpCode[i] = numbers[i];
      }
      setOtpCode(newOtpCode);
      setSecurityCode(newOtpCode.join(''));
      
      const focusIndex = Math.min(numbers.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    console.log('🔄 [CODE-VALIDATION] Reenviando código de seguridad');
    setSecurityCode('');
    setOtpCode(['', '', '', '', '', '']);
    setErrors({});
    setCountdown(120); // Reiniciar contador
    setAlert(null);
    await handleRequestCode();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const commonUIWrapper = (content, showBackButton = true) => (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" style={backgroundStyle}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-cyan-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>
      <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <div className={`w-full max-w-md transition-all duration-1000 ${isAnimated ? 'transform translate-y-0 opacity-100' : 'transform translate-y-8 opacity-0'}`}>
          {showBackButton && (
            <div className="mb-6">
              <button
                onClick={onBack}
                disabled={isLoading}
                className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 transition-colors duration-200 font-semibold"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/></svg>
                <span>Regresar</span>
              </button>
            </div>
          )}
          
          {/* Progress indicator - Migajas de pan */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-2">
              {['Identidad', 'Credenciales', 'Preguntas', 'Código'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    index < 3
                      ? 'bg-green-500 text-white'
                      : index === 3
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                        : 'bg-slate-300 text-slate-700'
                  }`}>
                    {index < 3 ? (
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 3 && (
                    <div className={`w-8 h-0.5 mx-1 transition-all duration-300 ${
                      index < 2
                        ? 'bg-green-500'
                        : 'bg-green-500'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-3">
              <p className="text-slate-800 text-sm font-bold">
                Paso 4 de 4: Código de Seguridad
              </p>
            </div>
          </div>

          {content}
        </div>
      </div>
    </div>
  );

  const alertUI = alert && (
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
              {alert.type === 'success' ? <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/> :
               alert.type === 'error' ? <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/> :
               <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>}
            </svg>
          </div>
          <span className="text-sm font-semibold">{alert.message}</span>
        </div>
      </div>
    </div>
  );

  // PASO 1: SOLICITAR CÓDIGO
  if (currentStep === 'request') {
    const requestContent = (
      <div className="backdrop-blur-xl bg-white/95 rounded-2xl p-6 shadow-2xl border border-white/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600"></div>
        <div className="text-center mb-6 relative z-10">
          <div className="w-24 h-24 mx-auto mb-4"><img src="/assets/images/isocoaclasnaves.png" alt="Logo" className="w-full h-full object-contain" /></div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Validación Final</h2>
          <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full mx-auto mb-2"></div>
          <p className="text-slate-600 text-xs font-medium">Paso 4 de 4: Confirmar su identidad</p>
        </div>
        
        {alertUI}

        <div className="bg-cyan-50/90 rounded-xl p-6 border border-cyan-200/70 mb-6">
          <h3 className="text-cyan-900 font-bold mb-3 flex items-center">
            <svg className="w-5 h-5 text-cyan-700 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
            Verificación de Seguridad
          </h3>
          <div className="text-cyan-800 text-sm space-y-2 font-medium">
            <p>Para completar su registro, se enviará un código de seguridad a su teléfono para confirmar su identidad.</p>
          </div>
        </div>

        <div className="bg-slate-50/90 rounded-xl p-4 border border-slate-200/70 mb-6">
          <h4 className="text-slate-900 font-bold text-sm mb-2">Resumen del Registro:</h4>
          <div className="text-slate-800 text-sm space-y-1 font-medium">
            <p>• Cédula: {registrationData.cedula}</p>
            <p>• Usuario: {registrationData.username}</p>
            <p>• Preguntas de seguridad: {registrationData.selectedQuestions?.length || 0} configuradas</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRequestCode}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isLoading ? 'ENVIANDO CÓDIGO...' : 'SOLICITAR CÓDIGO DE SEGURIDAD'}
          </button>
        </div>
      </div>
    );
    return commonUIWrapper(requestContent);
  }

  // PASO 2: VALIDAR CÓDIGO
  if (currentStep === 'validate') {
    const validateContent = (
      <div className="backdrop-blur-xl bg-white/95 rounded-2xl p-6 shadow-2xl border border-white/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600"></div>
        <div className="text-center mb-6 relative z-10">
          <div className="w-24 h-24 mx-auto mb-4"><img src="/assets/images/isocoaclasnaves.png" alt="Logo" className="w-full h-full object-contain" /></div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">Código de Seguridad</h2>
          <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full mx-auto mb-2"></div>
          <p className="text-slate-600 text-xs font-medium">Ingrese el código de 6 dígitos enviado a su celular.</p>
        </div>

        {alertUI}

        <form onSubmit={handleValidateCode} className="space-y-6">
          

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase">Código de 6 dígitos</label>
            <div className="flex justify-center space-x-3 pt-2">
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
            {errors.code && <p className="text-red-700 text-xs mt-2 font-medium text-center">{errors.code}</p>}
          </div>

          <div className="space-y-3 pt-1">
            <button
              type="submit"
              disabled={isLoading || securityCode.length !== 6}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLoading ? 'PROCESANDO...' : 'COMPLETAR REGISTRO'}
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
      </div>
    );
    return commonUIWrapper(validateContent);
  }

  // PASO 3: COMPLETANDO REGISTRO
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" style={backgroundStyle}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-500/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-green-500/10 rounded-full animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Procesando Registro</h2>
            <p className="text-slate-700 text-sm font-medium">Guardando sus datos de forma segura...</p>
          </div>

          {alertUI}

          <div className="flex justify-center mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
          </div>

          <div className="bg-white/80 rounded-xl p-6 border border-slate-200 backdrop-blur-sm">
            <div className="space-y-3">
              <div className="flex items-center text-sm text-slate-700 font-medium">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                Código de seguridad validado
              </div>
              <div className="flex items-center text-sm text-slate-700 font-medium">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                Guardando credenciales y preguntas...
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <div className="w-4 h-4 bg-slate-300 rounded-full mr-3"></div>
                Finalizando configuración...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityCodeValidationPage1;