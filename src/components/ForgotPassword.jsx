// src/components/ForgotPassword.jsx
import React, { useState, useEffect, useCallback } from 'react';
import forgotPasswordService from '../services/forgotPasswordService.js';
import CodigoPage from './CodigoPage';
import backgroundImage from "/public/assets/images/onu.jpg";

// Match RegisterPage overlay: dark gradient + background image for opacity/dim effect
const backgroundStyle = {
  backgroundImage: `url(${backgroundImage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundAttachment: "fixed",
};

const ForgotPassword = ({ onBackToLogin }) => {
  // Estado para manejar la navegación interna
  const [internalView, setInternalView] = useState('password'); // 'password', 'identity', 'code'
  const [codeUserInfo, setCodeUserInfo] = useState(null);

  console.log('🔑 [FORGOT-DEBUG] Props recibidas:');
  console.log('🔑 [FORGOT-DEBUG] onBackToLogin:', typeof onBackToLogin, onBackToLogin);
  console.log('🔑 [FORGOT-DEBUG] Vista interna:', internalView);

  // Estados del formulario
  const [formData, setFormData] = useState({
    username: '',
    newPassword: '',
    confirmPassword: '',
    cedula: '',
    respuesta: ''
  });
  
  const [userInfo, setUserInfo] = useState(null);
  const [securityQuestion, setSecurityQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [isAnimated, setIsAnimated] = useState(false);

  // Estados de validación automática
  const [usernameStatus, setUsernameStatus] = useState('idle'); // 'idle', 'checking', 'valid', 'invalid'
  const [isValidatingUsername, setIsValidatingUsername] = useState(false);

  // Estados para mostrar/ocultar contraseñas
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    console.log('🔑 [FORGOT] Iniciando componente de cambio de contraseña');
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Función para validar usuario automáticamente con debounce
  const validateUsernameAuto = useCallback(async (username) => {
    if (!username.trim()) {
      setUsernameStatus('idle');
      setUserInfo(null);
      return;
    }

    console.log('🔍 [AUTO-VALIDATE] Validando usuario automáticamente:', username);
    setUsernameStatus('checking');
    setIsValidatingUsername(true);

    try {
      const result = await forgotPasswordService.validateUsername(username.trim());
      
      if (result.success) {
        console.log('✅ [AUTO-VALIDATE] Usuario válido:', result.data);
        setUsernameStatus('valid');
        setUserInfo(result.data);
      } else {
        console.log('❌ [AUTO-VALIDATE] Usuario no válido:', result.error);
        setUsernameStatus('invalid');
        setUserInfo(null);
      }
    } catch (error) {
      console.error('💥 [AUTO-VALIDATE] Error validando usuario:', error);
      setUsernameStatus('invalid');
      setUserInfo(null);
    } finally {
      setIsValidatingUsername(false);
    }
  }, []);

  // Debounce para la validación automática del usuario
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username) {
        validateUsernameAuto(formData.username);
      }
    }, 800); // Esperar 800ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [formData.username, validateUsernameAuto]);

  // Función para navegar internamente al código
  const handleGoToCode = (userData) => {
    console.log('📱 [FORGOT-INTERNAL] Navegando internamente a código con datos:', userData);
    console.log('🔑 [FORGOT-INTERNAL] Nueva contraseña disponible:', !!formData.newPassword);
    
    setCodeUserInfo({
      ...userData,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword,
      originalUserInfo: userInfo
    });
    setInternalView('code');
  };

  // Manejar cambios en inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('🔥 [DEBUG] Input cambió:', { name, value });
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar alertas cuando se empiece a escribir
    if (alert && alert.type === 'error') {
      setAlert(null);
    }

    // Si cambia el username, resetear estados
    if (name === 'username') {
      setUserInfo(null);
      setUsernameStatus('idle');
    }
  };

  // PASO 1: Validar contraseñas (después de que usuario sea válido)
  const handleValidatePassword = async (e) => {
    e.preventDefault();
    
    // Validaciones del formulario
    if (!formData.username.trim()) {
      showAlert('Por favor ingrese su nombre de usuario', 'error');
      return;
    }

    if (usernameStatus !== 'valid') {
      showAlert('El nombre de usuario no es válido o no ha sido validado', 'error');
      return;
    }

    if (!formData.newPassword.trim()) {
      showAlert('Por favor ingrese la nueva contraseña', 'error');
      return;
    }

    if (!formData.confirmPassword.trim()) {
      showAlert('Por favor confirme la nueva contraseña', 'error');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showAlert('Las contraseñas no coinciden', 'error');
      return;
    }

    console.log('🔐 [FORGOT] Validando nueva contraseña');
    setIsLoading(true);
    
    try {
      const result = await forgotPasswordService.validatePasswordFormat(
        formData.username,
        formData.newPassword
      );
      
      if (result.success) {
        console.log('✅ [FORGOT] Contraseña validada correctamente');
        showAlert('Contraseña válida. Proceda con la validación de identidad.', 'success');
        
        // Obtener pregunta de seguridad
        const userCedula = userInfo?.cliente?.[0]?.idecli;
        if (userCedula) {
          await getSecurityQuestion(userCedula);
        }
        
        // Ir al siguiente paso
        setTimeout(() => {
          setInternalView('identity');
        }, 1500);
      } else {
        console.log('❌ [FORGOT] Contraseña no válida:', result.error);
        showAlert(result.error.message || 'La contraseña no cumple con los requisitos', 'error');
      }
    } catch (error) {
      console.error('💥 [FORGOT] Error validando contraseña:', error);
      showAlert('Error validando contraseña', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // PASO 2: Validar identidad y pregunta de seguridad
  const handleValidateIdentity = async (e) => {
    e.preventDefault();
    
    if (!formData.cedula.trim()) {
      showAlert('Por favor ingrese su número de cédula', 'error');
      return;
    }

    // Validar que la cédula coincida con la del usuario
    const userCedula = userInfo?.cliente?.[0]?.idecli;
    if (formData.cedula.trim() !== userCedula) {
      showAlert('La cédula ingresada no coincide con la registrada para este usuario', 'error');
      return;
    }

    if (!formData.respuesta.trim()) {
      showAlert('Por favor ingrese su respuesta de seguridad', 'error');
      return;
    }

    console.log('🔐 [FORGOT] Validando identidad y respuesta');
    setIsLoading(true);
    
    try {
      const result = await forgotPasswordService.validateSecurityAnswer(
        formData.cedula,
        securityQuestion.codprg,
        formData.respuesta
      );
      
      if (result.success) {
        console.log('✅ [FORGOT] Identidad validada correctamente');
        showAlert('Identidad confirmada. Enviando código de seguridad...', 'success');
        
        // Proceder al código de seguridad
        setTimeout(() => {
          handleGoToCode({
            cedula: formData.cedula,
            usuario: formData.username,
            clienteInfo: userInfo?.cliente?.[0]
          });
        }, 1500);
      } else {
        console.log('❌ [FORGOT] Validación fallida:', result.error);
        showAlert(result.error.message || 'Respuesta de seguridad incorrecta', 'error');
      }
    } catch (error) {
      console.error('💥 [FORGOT] Error validando identidad:', error);
      showAlert('Error validando identidad', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener pregunta de seguridad
  const getSecurityQuestion = async (cedula) => {
    console.log('🔒 [FORGOT] Obteniendo pregunta de seguridad para:', cedula);
    
    try {
      const result = await forgotPasswordService.getSecurityQuestion(cedula);
      
      if (result.success && result.questions && result.questions.length > 0) {
        // Seleccionar pregunta aleatoria
        const randomQuestion = result.questions[Math.floor(Math.random() * result.questions.length)];
        console.log('📝 [FORGOT] Pregunta seleccionada:', randomQuestion);
        
        setSecurityQuestion(randomQuestion);
      } else {
        console.log('❌ [FORGOT] Error obteniendo pregunta:', result.error);
        setSecurityQuestion(null);
      }
    } catch (error) {
      console.error('💥 [FORGOT] Error obteniendo pregunta:', error);
      setSecurityQuestion(null);
    }
  };

  // Mostrar alerta
  const showAlert = (message, type) => {
    setAlert({ message, type });
    if (type === 'error') {
      setTimeout(() => setAlert(null), 5000);
    }
  };

  // Funciones de navegación
  const handleBack = () => {
    if (internalView === 'identity') {
      setInternalView('password');
      setSecurityQuestion(null);
    }
  };

  // RENDER CONDICIONAL: Mostrar CodigoPage si internalView es 'code'
  if (internalView === 'code' && codeUserInfo) {
    return (
      <CodigoPage
        userInfo={codeUserInfo}
        onBackToLogin={onBackToLogin}
        isChangingPassword={true}
        onSuccess={() => {
          console.log('✅ [FORGOT-INTERNAL] Contraseña cambiada exitosamente');
          setTimeout(() => {
            onBackToLogin();
          }, 3000);
        }}
      />
    );
  }

  // Función para obtener el ícono de estado del username
  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return (
          <svg className="animate-spin h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'valid':
        return (
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
          </svg>
        );
      case 'invalid':
        return (
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-white/60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
          </svg>
        );
    }
  };

  // Obtener textos según el paso actual
  const getStepInfo = () => {
    switch (internalView) {
      case 'password':
        return {
          title: 'Nueva Contraseña',
          subtitle: 'Ingrese su usuario y nueva contraseña',
          icon: (
            <svg className="w-8 h-8 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z" />
            </svg>
          )
        };
      case 'identity':
        return {
          title: 'Validar Identidad',
          subtitle: 'Confirme su identidad y responda la pregunta de seguridad',
          icon: (
            <svg className="w-8 h-8 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
            </svg>
          )
        };
      default:
        return { title: 'Cambiar Contraseña', subtitle: '', icon: null };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <div className="min-h-screen relative overflow-hidden" style={backgroundStyle}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-16 w-24 h-24 bg-cyan-400/5 rounded-lg rotate-45 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/4 w-20 h-20 bg-cyan-500/10 rounded-full animate-pulse" style={{animationDelay: '4s'}}></div>
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

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {['password', 'identity'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    internalView === step
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                      : index < ['password', 'identity'].indexOf(internalView)
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-300 text-slate-700'
                  }`}>
                    {index < ['password', 'identity'].indexOf(internalView) ? (
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 1 && (
                    <div className={`w-12 h-0.5 mx-2 transition-all duration-300 ${
                      index < ['password', 'identity'].indexOf(internalView)
                        ? 'bg-green-500'
                        : 'bg-slate-300'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main card - ESTILO ACTUALIZADO COMO LOGINPAGE */}
          <div className="backdrop-blur-xl bg-white/95 rounded-2xl p-6 shadow-2xl border border-white/50 relative overflow-hidden">
            
            {/* Efectos de brillo sutiles */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-transparent to-cyan-50/30 pointer-events-none rounded-2xl"></div>
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600"></div>
            
            {/* Header - ESTILO ACTUALIZADO COMO LOGINPAGE */}
            <div className="text-center mb-6 relative z-10">
              <img src="/assets/images/isocoaclasnaves.png" alt="Logo" className="w-20 h-20 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                {stepInfo.title}
              </h2>
              <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full mx-auto mb-2"></div>
              <p className="text-slate-600 text-xs font-medium">
                {stepInfo.subtitle}
              </p>
            </div>

            {/* Alert */}
            {alert && (
              <div className="mb-6">
                <div className={`p-4 rounded-lg border transition-all duration-300 ${
                  alert.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      {alert.type === 'success' ? (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                      )}
                    </svg>
                    <span className="text-sm font-medium">{alert.message}</span>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 1: Usuario y contraseñas */}
            {internalView === 'password' && (
              <div className="space-y-6">
                {/* Usuario con validación automática */}
                <div className="space-y-2">
                  <label htmlFor="username" className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                    Nombre de Usuario
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {getUsernameStatusIcon()}
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Ej: usuario123"
                      className={`block w-full pl-10 pr-3 py-3 border-2 rounded-lg bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm hover:shadow-md ${
                        usernameStatus === 'valid' ? 'border-cyan-400 ring-2 ring-cyan-200' :
                        usernameStatus === 'invalid' ? 'border-red-400 ring-2 ring-red-200' :
                        'border-slate-300 hover:border-slate-400'
                      }`}
                    />
                  </div>
                  {usernameStatus === 'checking' && (
                    <p className="text-cyan-600 text-xs">Validando usuario...</p>
                  )}
                  {usernameStatus === 'invalid' && (
                    <p className="text-red-600 text-xs">Usuario no encontrado o inválido</p>
                  )}
                  {usernameStatus === 'valid' && (
                    <p className="text-cyan-600 text-xs">Usuario válido ✓</p>
                  )}
                </div>

                {/* Información del usuario validado automáticamente */}
                {usernameStatus === 'valid' && userInfo?.cliente?.[0] && (
                  <div className="bg-cyan-50/80 border-cyan-200/60 text-cyan-800 rounded-lg p-3 border backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-cyan-100/80 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-4 h-4 text-cyan-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-cyan-800 font-semibold text-sm">
                          {userInfo.cliente[0].nomcli} {userInfo.cliente[0].apecli}
                        </p>
                        <p className="text-cyan-600 text-xs">
                          Usuario: {formData.username}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contraseñas (solo se muestran si el usuario es válido) */}
                {usernameStatus === 'valid' && (
                  <form onSubmit={handleValidatePassword} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="newPassword" className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                        Nueva Contraseña
                      </label>
                      <div className="relative">
                        <input
                          id="newPassword"
                          name="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          placeholder="Ingrese su nueva contraseña"
                          className="block w-full pl-3 pr-12 py-3 border-2 rounded-lg bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 font-medium text-sm shadow-sm hover:shadow-md border-slate-300 hover:border-slate-400"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="text-slate-500 hover:text-slate-700 transition-colors duration-300 p-1 rounded-lg hover:bg-slate-100"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              {showNewPassword ? (
                                <path d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.37,7 12,7Z" />
                              ) : (
                                <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                              )}
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                        Confirmar Nueva Contraseña
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          placeholder="Confirme su nueva contraseña"
                          className="block w-full pl-3 pr-12 py-3 border-2 rounded-lg bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 font-medium text-sm shadow-sm hover:shadow-md border-slate-300 hover:border-slate-400"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="text-slate-500 hover:text-slate-700 transition-colors duration-300 p-1 rounded-lg hover:bg-slate-100"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                              {showConfirmPassword ? (
                                <path d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.09L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.76,7.13 11.37,7 12,7Z" />
                              ) : (
                                <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                              )}
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Indicador de coincidencia de contraseñas */}
                    {formData.newPassword && formData.confirmPassword && (
                      <div className={`text-xs ${
                        formData.newPassword === formData.confirmPassword ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formData.newPassword === formData.confirmPassword ? 
                          '✓ Las contraseñas coinciden' : 
                          '✗ Las contraseñas no coinciden'
                        }
                      </div>
                    )}

                    {/* Requisitos de contraseña */}
                    <div className="bg-cyan-50/80 rounded-lg p-3 border border-cyan-200/60 backdrop-blur-sm">
                      <p className="text-cyan-800 text-sm font-medium mb-2">Requisitos de la contraseña:</p>
                      <ul className="text-cyan-700 text-xs space-y-1">
                        <li>• Al menos 8 caracteres</li>
                        <li>• Una letra mayúscula</li>
                        <li>• Una letra minúscula</li>
                        <li>• Un número</li>
                        <li>• Un carácter especial</li>
                      </ul>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || usernameStatus !== 'valid'}
                      className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed ${
                        isLoading || usernameStatus !== 'valid'
                          ? 'bg-slate-400'
                          : 'bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Validando contraseña...
                        </>
                      ) : usernameStatus !== 'valid' ? (
                        'Ingrese un usuario válido para continuar'
                      ) : (
                        ' CONTINUAR'
                      )}
                    </button>
                  </form>
                )}

                {/* Mensaje si el usuario no es válido aún */}
                {usernameStatus !== 'valid' && formData.username && (
                  <div className="bg-cyan-50/80 rounded-lg p-3 border border-cyan-200/60 backdrop-blur-sm">
                    <p className="text-cyan-800 text-sm font-bold">
                      {usernameStatus === 'checking' ? 
                        'Validando usuario...' : 
                        'Complete un nombre de usuario válido para continuar con las contraseñas.'
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* PASO 2: Validar identidad */}
            {internalView === 'identity' && (
              <div className="space-y-6">
                {/* Información del usuario */}
                {userInfo?.cliente?.[0] && (
                  <div className="bg-cyan-50/80 border-cyan-200/60 text-cyan-800 rounded-lg p-3 border backdrop-blur-sm">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-cyan-100/80 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-4 h-4 text-cyan-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-cyan-800 font-semibold text-sm">
                          {userInfo.cliente[0].nomcli} {userInfo.cliente[0].apecli}
                        </p>
                        <p className="text-cyan-600 text-xs">
                          Usuario: {formData.username} | Contraseña validada ✓
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleValidateIdentity} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="cedula" className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                      Número de Identificación
                    </label>
                    <input
                      id="cedula"
                      name="cedula"
                      type="text"
                      value={formData.cedula}
                      onChange={handleInputChange}
                      placeholder="Ej: 1723456789"
                      maxLength="10"
                      className="block w-full px-3 py-3 border-2 rounded-lg bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 font-medium text-sm shadow-sm hover:shadow-md border-slate-300 hover:border-slate-400"
                    />
                    <p className="text-slate-600 text-xs">
                      Debe coincidir con la cédula registrada para el usuario {formData.username}
                    </p>
                  </div>

                  {securityQuestion ? (
                    <div className="space-y-2">
                      <label htmlFor="respuesta" className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                        {securityQuestion.detprg}
                      </label>
                      <input
                        id="respuesta"
                        name="respuesta"
                        type="text"
                        value={formData.respuesta}
                        onChange={handleInputChange}
                        placeholder="Ingrese su respuesta..."
                        className="block w-full px-3 py-3 border-2 rounded-lg bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 font-medium text-sm shadow-sm hover:shadow-md border-slate-300 hover:border-slate-400"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-2"></div>
                      <p className="text-slate-600 text-sm">Cargando pregunta de seguridad...</p>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 py-3 px-4 border-2 border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      ← VOLVER
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !securityQuestion}
                      className={`group relative flex-1 flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed ${
                        (isLoading || !securityQuestion) ? 'bg-slate-400' : 'bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Validando...
                        </>
                      ) : (
                        <span className="relative z-10 tracking-wide font-bold uppercase text-sm">CONTINUAR</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Security notice - ESTILO ACTUALIZADO COMO LOGINPAGE */}
          
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;