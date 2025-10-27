// src/components/BlockUser.jsx
import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService.js';
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

const BlockUser = ({ onBackToLogin }) => {
  // Estado para manejar la navegación interna
  const [internalView, setInternalView] = useState('block'); // 'block', 'code'
  const [codeUserInfo, setCodeUserInfo] = useState(null);

  console.log('🔒 [BLOCK-DEBUG] Props recibidas:');
  console.log('🔒 [BLOCK-DEBUG] onBackToLogin:', typeof onBackToLogin, onBackToLogin);
  console.log('🔒 [BLOCK-DEBUG] Vista interna:', internalView);

  // Estados del formulario unificado
  const [formData, setFormData] = useState({
    cedula: '',
    respuesta: ''
  });
  
  const [userInfo, setUserInfo] = useState(null);
  const [securityQuestion, setSecurityQuestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [isAnimated, setIsAnimated] = useState(false);

  // Estados de validación
  const [cedulaValidated, setCedulaValidated] = useState(false);
  const [isValidatingCedula, setIsValidatingCedula] = useState(false);

  useEffect(() => {
    console.log('🔒 [BLOCK] Iniciando componente de bloqueo de usuario');
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Función para navegar internamente al código
  const handleGoToCode = (userData) => {
    console.log('📱 [BLOCK-INTERNAL] Navegando internamente a código con datos:', userData);
    setCodeUserInfo(userData);
    setInternalView('code');
  };

  // Función para volver desde código a block
  const handleBackToBlock = () => {
    console.log('🔄 [BLOCK-INTERNAL] Volviendo desde código a block');
    setInternalView('block');
    setCodeUserInfo(null);
  };

  // Manejar cambios en inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Validar cédula en tiempo real
    if (name === 'cedula') {
      if (value.length >= 10) { // Validar cuando tenga 10 dígitos
        validateCedulaRealTime(value);
      } else {
        // Resetear estados si la cédula es muy corta
        setCedulaValidated(false);
        setUserInfo(null);
        setSecurityQuestion(null);
        setAlert(null);
      }
    }
  };

  // Validación de cédula en tiempo real
  const validateCedulaRealTime = async (cedula) => {
    if (cedula.length !== 10) return;
    
    console.log('⚡ [BLOCK] Validación en tiempo real de cédula:', cedula);
    setIsValidatingCedula(true);
    
    try {
      const result = await apiService.verifyCedula(cedula);
      
      if (result.success) {
        console.log('✅ [BLOCK] Cédula validada en tiempo real:', result.data);
        setUserInfo(result.data);
        setCedulaValidated(true);
        
        // Obtener pregunta de seguridad automáticamente
        await getSecurityQuestionRealTime(cedula);
        

      } else {
        console.log('❌ [BLOCK] Cédula no válida en tiempo real:', result.error);
        setCedulaValidated(false);
        setUserInfo(null);
        setSecurityQuestion(null);
        showAlert(result.error.message, 'error');
      }
    } catch (error) {
      console.error('💥 [BLOCK] Error en validación tiempo real:', error);
      setCedulaValidated(false);
      setUserInfo(null);
      setSecurityQuestion(null);
      showAlert('Error validando cédula', 'error');
    } finally {
      setIsValidatingCedula(false);
    }
  };

  // Obtener pregunta de seguridad en tiempo real
  const getSecurityQuestionRealTime = async (cedula) => {
    console.log('🔒 [BLOCK] Obteniendo pregunta de seguridad automáticamente para:', cedula);
    
    try {
      const result = await apiService.getSecurityQuestion(cedula);
      
      if (result.success && result.questions && result.questions.length > 0) {
        // Seleccionar pregunta aleatoria
        const randomQuestion = result.questions[Math.floor(Math.random() * result.questions.length)];
        console.log('📝 [BLOCK] Pregunta seleccionada automáticamente:', randomQuestion);
        
        setSecurityQuestion(randomQuestion);
      } else {
        console.log('❌ [BLOCK] Error obteniendo pregunta automáticamente:', result.error);
        showAlert('No se pudo obtener la pregunta de seguridad', 'error');
      }
    } catch (error) {
      console.error('💥 [BLOCK] Error obteniendo pregunta automáticamente:', error);
      showAlert('Error obteniendo pregunta de seguridad', 'error');
    }
  };

  // Validar respuesta y proceder al bloqueo
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.cedula.trim()) {
      showAlert('Por favor ingrese su número de cédula', 'error');
      return;
    }

    if (!cedulaValidated) {
      showAlert('Debe validar la cédula primero', 'error');
      return;
    }

    if (!formData.respuesta.trim()) {
      showAlert('Por favor ingrese su respuesta de seguridad', 'error');
      return;
    }

    console.log('🔐 [BLOCK] Validando respuesta para proceder al bloqueo');
    setIsLoading(true);
    
    try {
      const result = await apiService.validateSecurityAnswer(
        formData.cedula,
        securityQuestion.codprg,
        formData.respuesta
      );
      
      if (result.success) {
        console.log('✅ [BLOCK] Respuesta validada correctamente, procediendo al bloqueo');
        showAlert('Respuesta correcta. Enviando código de seguridad...', 'success');
        
        // Proceder al código de bloqueo
        setTimeout(() => {
          handleGoToCode({
            cedula: formData.cedula,
            usuario: userInfo?.webusu,
            clienteInfo: userInfo?.cliente?.[0]
          });
        }, 1500);
      } else {
        console.log('❌ [BLOCK] Respuesta incorrecta:', result.error);
        showAlert(result.error.message || 'Respuesta incorrecta', 'error');
      }
    } catch (error) {
      console.error('💥 [BLOCK] Error validando respuesta:', error);
      showAlert('Error validando respuesta', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar alerta
  const showAlert = (message, type) => {
    setAlert({ message, type });
    if (type === 'error') {
      setTimeout(() => setAlert(null), 5000);
    }
  };

  // RENDER CONDICIONAL: Mostrar CodigoPage si internalView es 'code'
  if (internalView === 'code' && codeUserInfo) {
    return (
      <CodigoPage
        userInfo={codeUserInfo}
        onBackToLogin={onBackToLogin}
        isBlockingUser={true} // Nueva prop para indicar que es bloqueo
        onSuccess={() => {
          console.log('✅ [BLOCK-INTERNAL] Usuario bloqueado exitosamente, volviendo al login');
          setTimeout(() => {
            onBackToLogin();
          }, 3000);
        }}
      />
    );
  }

  // RENDER NORMAL: Mostrar el formulario unificado de bloqueo
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

          {/* Progress indicator - Migajas de pan */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {['Validar Identidad', 'Código de Seguridad'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    index === 0
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-slate-300 text-slate-700'
                  }`}>
                    {index + 1}
                  </div>
                  {index < 1 && (
                    <div className={`w-12 h-0.5 mx-2 transition-all duration-300 bg-slate-300`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-3">
              <p className="text-slate-800 text-sm font-bold">
                Paso 1 de 2: Validar Identidad
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
                Bloquear Usuario
              </h2>
              <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full mx-auto mb-2"></div>
              <p className="text-slate-600 text-xs font-medium">
                Complete la información para proceder con el bloqueo de la cuenta
              </p>
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

            {/* Formulario unificado - ESTILO ACTUALIZADO COMO LOGINPAGE */}
            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              
              {/* Campo de cédula */}
              <div className="space-y-1">
                <label htmlFor="cedula" className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                  Número de Identificación
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-500 group-focus-within:text-cyan-600 transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
                    </svg>
                  </div>
                  <input
                    id="cedula"
                    name="cedula"
                    type="text"
                    value={formData.cedula}
                    onChange={handleInputChange}
                    placeholder="Ej: 1723456789"
                    maxLength="10"
                    disabled={isLoading}
                    className={`block w-full pl-10 pr-12 py-3 border-2 rounded-lg bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm hover:shadow-md ${
                      cedulaValidated 
                        ? 'border-cyan-400 ring-2 ring-cyan-200' 
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  />
                  
                  {/* Indicador de validación */}
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {isValidatingCedula ? (
                      <svg className="animate-spin h-4 w-4 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : cedulaValidated ? (
                      <svg className="h-4 w-4 text-cyan-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Información del usuario - ESTILO ACTUALIZADO COMO LOGINPAGE */}
              {cedulaValidated && userInfo?.cliente?.[0] && (
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
                        Usuario: {userInfo.webusu}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Campo de pregunta de seguridad - ESTILO ACTUALIZADO COMO LOGINPAGE */}
              {cedulaValidated && securityQuestion && (
                <div className="space-y-1">
                  <label htmlFor="respuesta" className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                    {securityQuestion.detprg}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-slate-500 group-focus-within:text-cyan-600 transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22H9M4,4V16H8.5L12,19.5L15.5,16H20V4H4Z"/>
                      </svg>
                    </div>
                    <input
                      id="respuesta"
                      name="respuesta"
                      type="text"
                      value={formData.respuesta}
                      onChange={handleInputChange}
                      placeholder="Ingrese su respuesta..."
                      disabled={isLoading}
                      className="block w-full pl-10 pr-3 py-3 border-2 rounded-lg bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm hover:shadow-md border-slate-300 hover:border-slate-400"
                    />
                  </div>
                </div>
              )}

              {/* Botón de envío - ESTILO ACTUALIZADO COMO LOGINPAGE */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading || !cedulaValidated || !securityQuestion || !formData.respuesta.trim()}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/50 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-transparent rounded-lg"></div>
                  
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="relative z-10 tracking-wide text-xs">Validando...</span>
                    </>
                  ) : (
                    <span className="relative z-10 tracking-wide font-bold uppercase text-sm">Continuar</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security notice - ESTILO ACTUALIZADO COMO LOGINPAGE */}
          
        </div>
      </div>
    </div>
  );
};

export default BlockUser;