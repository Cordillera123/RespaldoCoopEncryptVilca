// src/components/TwoFactorAuthPage.jsx - AUTENTICACIÓN EN DOS PASOS (ESTANDARIZADO)
import React, { useState, useEffect, useRef } from 'react';
import apiService from '../services/apiService';
import backgroundImage from "/public/assets/images/onu.jpg";

const backgroundStyle = {
  backgroundImage: `url(${backgroundImage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "fixed",
};

const TwoFactorAuthPage = ({ twoFactorData, onTwoFactorSuccess, onBack }) => {
  const [securityCode, setSecurityCode] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isValidating, setIsValidating] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  const inputRefs = useRef([]);
  const countdownRef = useRef(null);

  useEffect(() => {
    setTimeout(() => setIsAnimated(true), 100);
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else {
      apiService.clearIncompleteSession();
      console.log('⏰ [2FA-UI] Código expirado, sesión limpiada');
      
      setAlert({
        type: 'error',
        message: 'El código ha expirado. Vuelve al login para solicitar uno nuevo.'
      });
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [countdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtpCode = [...otpCode];
    newOtpCode[index] = value;
    setOtpCode(newOtpCode);
    
    setSecurityCode(newOtpCode.join(''));
    
    setErrors({});
    setAlert(null);
    
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
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
      
      const nextEmptyIndex = newOtpCode.findIndex(code => !code);
      const focusIndex = nextEmptyIndex >= 0 ? nextEmptyIndex : 5;
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const maskPhoneNumber = (phone) => {
    if (!phone) return '';
    const phoneStr = phone.toString();
    if (phoneStr.length >= 4) {
      const lastFour = phoneStr.slice(-4);
      const masked = '*'.repeat(Math.max(0, phoneStr.length - 4));
      return `${masked}${lastFour}`;
    }
    return phoneStr;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!securityCode || securityCode.length !== 6) {
      setErrors({ code: 'El código debe tener 6 dígitos' });
      return;
    }

    if (countdown <= 0) {
      apiService.clearIncompleteSession();
      setAlert({
        type: 'error',
        message: 'El código ha expirado. Vuelve al login para solicitar uno nuevo.'
      });
      return;
    }

    if (attempts >= maxAttempts) {
      apiService.clearIncompleteSession();
      setAlert({
        type: 'error',
        message: 'Has excedido el número máximo de intentos. Vuelve al login.'
      });
      return;
    }

    setIsValidating(true);
    setErrors({});
    setAlert(null);

    try {
      console.log('🔐 [2FA-UI] Validando código:', securityCode);
      console.log('📋 [2FA-UI] Datos 2FA:', twoFactorData);

      const result = await apiService.validateSecurityCodeFor2FA(
        twoFactorData.cedula,
        twoFactorData.username,
        twoFactorData.password,
        twoFactorData.idemsg,
        securityCode
      );

      if (result.success) {
        console.log('✅ [2FA-UI] Código validado correctamente');
        setAlert({
          type: 'success',
          message: 'Código verificado correctamente. Accediendo al sistema...'
        });

        setTimeout(() => {
          onTwoFactorSuccess({
            ...twoFactorData.userData,
            twoFactorVerified: true
          });
        }, 1500);

      } else {
        console.log('❌ [2FA-UI] Error en validación:', result.error);
        setAttempts(prev => prev + 1);
        
        const remainingAttempts = maxAttempts - (attempts + 1);
        let errorMessage = result.error.message || 'Código incorrecto';
        
        if (remainingAttempts > 0) {
          errorMessage += `. Te quedan ${remainingAttempts} intentos.`;
        } else {
          errorMessage = 'Has excedido el número máximo de intentos. Vuelve al login.';
          apiService.clearIncompleteSession();
          console.log('🚫 [2FA-UI] Máximo de intentos excedido, sesión limpiada');
        }

        setAlert({
          type: 'error',
          message: errorMessage
        });

        setSecurityCode('');
        setOtpCode(['', '', '', '', '', '']);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }

    } catch (error) {
      console.error('💥 [2FA-UI] Error inesperado:', error);
      setAlert({
        type: 'error',
        message: 'Error de conexión. Inténtalo de nuevo.'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const requestNewCode = async () => {
    setIsValidating(true);
    setAlert({ type: 'info', message: 'Solicitando un nuevo código...' });

    try {
      console.log('🔄 [2FA-UI] Re-solicitando código para:', twoFactorData.username);
      const result = await apiService.requestSecurityCodeFor2FA(
        twoFactorData.cedula,
        twoFactorData.username,
        twoFactorData.password
      );

      if (result.success) {
        console.log('✅ [2FA-UI] Nuevo código solicitado. ID de mensaje:', result.idemsg);
        twoFactorData.idemsg = result.idemsg;
        
        setAlert({
          type: 'success',
          message: 'Se ha enviado un nuevo código a tu celular.'
        });
        setCountdown(120);
        setAttempts(0);
        setSecurityCode('');
        setOtpCode(['', '', '', '', '', '']);
        setErrors({});
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      } else {
        console.log('❌ [2FA-UI] Error al solicitar nuevo código:', result.error);
        setAlert({
          type: 'error',
          message: result.error.message || 'No se pudo reenviar el código. Intenta volver al login.'
        });
      }
    } catch (error) {
      console.error('💥 [2FA-UI] Error inesperado al reenviar código:', error);
      setAlert({
        type: 'error',
        message: 'Error de conexión al solicitar un nuevo código.'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return; // Bloquear si el contador aún está corriendo
    
    console.log('🔄 [2FA-UI] Solicitando reenvío de código...');
    
    // Reiniciar el contador cuando se solicite un nuevo código
    setCountdown(120);
    setOtpCode(['', '', '', '', '', '']);
    setSecurityCode('');
    setErrors({});
    setAlert(null);
    
    await requestNewCode();
  };

  const handleBack = () => {
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
    }
    
    apiService.clearIncompleteSession();
    console.log('🔙 [2FA-UI] Usuario canceló 2FA, sesión limpiada');
    
    onBack();
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" style={backgroundStyle}>
      
      {/* Elementos decorativos sutiles - IDÉNTICO A CODIGOPAGE */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-cyan-600/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-cyan-400/12 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "4s" }}></div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
        <div className={`w-full max-w-md transition-all duration-1000 ${
          isAnimated ? 'transform translate-y-0 opacity-100' : 'transform translate-y-8 opacity-0'
        }`}>
          
          {/* Back to login button - IDÉNTICO A CODIGOPAGE */}
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 transition-colors duration-200 font-semibold"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
              </svg>
              <span>Volver al login</span>
            </button>
          </div>

          {/* Main card - IDÉNTICO A CODIGOPAGE */}
          <div className="backdrop-blur-xl bg-white/95 rounded-2xl p-6 shadow-2xl border border-white/50 relative overflow-hidden">
            
            {/* Efectos de brillo sutiles - IDÉNTICO A CODIGOPAGE */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-transparent to-cyan-50/30 pointer-events-none rounded-2xl"></div>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600"></div>
            
            {/* Header - IDÉNTICO A CODIGOPAGE */}
            <div className="text-center mb-6 relative z-10">
              <div className="w-24 h-24 mx-auto mb-4">
                <img src="/assets/images/isocoaclasnaves.png" alt="Logo Cooperativa" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                Verificación de Seguridad
              </h2>
              <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full mx-auto mb-2"></div>
              <p className="text-slate-600 text-xs font-medium">
                Ingrese el código de 6 dígitos enviado a su celular
              </p>
              {twoFactorData?.userData?.tlfcel && (
                <p className="text-slate-600 text-xs mt-2 font-medium">
                  Enviado a: {maskPhoneNumber(twoFactorData.userData.tlfcel)}
                </p>
              )}
            </div>

            {/* Alert - IDÉNTICO A CODIGOPAGE */}
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

            

            {/* Formulario - IDÉNTICO A CODIGOPAGE */}
            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              
              {/* Input del código - IDÉNTICO A CODIGOPAGE */}
              <div className="space-y-1">
                <label htmlFor="codigo-0" className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                  Código de 6 dígitos
                </label>
                
                {/* Inputs OTP - IDÉNTICO A CODIGOPAGE */}
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
                      disabled={isValidating}
                    />
                  ))}
                </div>
                
                {errors.code && (
                  <p className="text-red-600 text-xs text-center font-medium">{errors.code}</p>
                )}
                
                
              </div>

              {/* Botones - IDÉNTICO A CODIGOPAGE */}
              <div className="space-y-3 pt-1">
                <button
                  type="submit"
                  disabled={isValidating || securityCode.length !== 6}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white focus:outline-none focus:ring-4 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500/50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent rounded-lg"></div>
                  
                  {isValidating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="relative z-10 tracking-wide text-xs">Procesando...</span>
                    </>
                  ) : (
                    <span className="relative z-10 tracking-wide font-bold uppercase text-sm"> Verificar Código</span>
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
                    disabled={isValidating}
                    className={`w-full flex justify-center py-2 px-4 text-xs font-semibold transition-colors duration-200 hover:underline decoration-2 underline-offset-2 ${
                      isValidating ? 'text-slate-400 cursor-not-allowed' : 'text-cyan-600 hover:text-cyan-800'
                    }`}
                  >
                    Reenviar código
                  </button>
                )}
              </div>
            </form>

          </div>

        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuthPage;