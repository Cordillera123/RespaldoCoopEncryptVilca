// src/components/App.jsx - ACTUALIZADO CON NUEVO FLUJO DE REGISTRO Y SERVICIOS FACILITO + SISTEMA DE INACTIVIDAD
import React, { useState, useEffect } from 'react';
import LoginPage from './LoginPage.jsx';
import Dashboard from './dashboard/Dashboard.jsx';
import BlockUser from './BlockUser.jsx';
import ForgotPassword from './ForgotPassword.jsx';

// ⭐ NUEVAS IMPORTACIONES PARA EL PROCESO DE REGISTRO COMPLETO
import RegisterPage from './RegisterPage.jsx'; // Paso 1: Validación de Identidad
import UserCredentialsPage from './UserCredentialsPage.jsx'; // Paso 2: Credenciales
import SecurityQuestionsPage1 from './SecurityQuestionsPage1.jsx'; // Paso 3: Preguntas de Seguridad
import SecurityCodeValidationPage1 from './SecurityCodeValidationPage1.jsx'; // Paso 4: Validación Final

// ⭐ IMPORTACIONES PARA REGISTRO DE PREGUNTAS DE SEGURIDAD (mantener compatibilidad)
import IdentityValidationPage from './IdentityValidationPage.jsx';
import SecurityQuestionsPage from './SecurityQuestionsPage.jsx';
import SecurityCodeValidationPage from './SecurityCodeValidationPage.jsx';

// ⭐ NUEVA IMPORTACIÓN: SERVICIOS FACILITO
import ServiciosFacilitoForm from './dashboard/ServiciosFacilitoForm.jsx';

// ⭐ NUEVA IMPORTACIÓN: AUTENTICACIÓN EN DOS PASOS (2FA)
import TwoFactorAuthPage from './TwoFactorAuthPage.jsx';

// 🚨 NUEVA IMPORTACIÓN: SISTEMA DE INACTIVIDAD
import { InactivityProvider } from '../context/InactivityContext.jsx';

// 🔒 NUEVA IMPORTACIÓN: CONTEXTO DE VENTANAS (bloqueo de cierre)
import { WindowProvider } from '../context/WindowContext.jsx';

// 🧪 IMPORTACIÓN: PÁGINA DE PRUEBAS DE ENCRIPTACIÓN (solo desarrollo)
import CryptoTestPage from './CryptoTestPage.jsx';

import apiService from '../services/apiService.js';

const App = () => {
  
  console.log('🎬 [APP-RENDER] ===== COMPONENTE APP EJECUTÁNDOSE =====');
  
  // ⭐ VISTAS DISPONIBLES ACTUALIZADAS
  const [currentView, setCurrentView] = useState('login'); 
  // Vistas disponibles: 
  // - 'login', 'login-2fa', 'dashboard', 'block-user', 'forgot-password'
  // - 'register-step-1', 'register-step-2', 'register-step-3', 'register-step-4' (NUEVO FLUJO)
  // - 'security-identity', 'security-questions', 'security-code' (FLUJO DE PREGUNTAS SOLAMENTE)
  // - 'crypto-test' (🧪 SOLO DESARROLLO - Página de pruebas de encriptación)
  
  const [userSession, setUserSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  console.log('🎬 [APP-RENDER] Estados inicializados:', { currentView, loading });
  
  // ⭐ NUEVO STATE PARA EL FLUJO COMPLETO DE REGISTRO
  const [registrationFlow, setRegistrationFlow] = useState({
    // Paso 1: Identidad
    cedula: '',
    clienteData: null,
    
    // Paso 2: Credenciales
    username: '',
    password: '',
    
    // Paso 3: Preguntas de seguridad
    selectedQuestions: [],
    
    // Paso 4: Validación final
    idemsg: '',
    securityCode: ''
  });

  // ⭐ STATE PARA REGISTRO DE PREGUNTAS DE SEGURIDAD (mantener compatibilidad)
  const [securityRegistrationFlow, setSecurityRegistrationFlow] = useState({
    cedula: '',
    clientData: null,
    username: '',
    acceptedTerms: false,
    selectedQuestions: [],
    idemsg: ''
  });

  // ⭐ NUEVO STATE PARA AUTENTICACIÓN EN DOS PASOS (2FA)
  const [twoFactorData, setTwoFactorData] = useState(null);

  useEffect(() => {
    console.log('🚀 [APP] Inicializando aplicación...');
    checkExistingSession();
  }, []);

  const checkExistingSession = () => {
    console.log('🔍 [APP] Verificando sesión existente...');
    
    try {
      const session = apiService.getUserSession();
      console.log('📊 [APP] Datos de sesión encontrados:', session);
      
      if (session && apiService.isAuthenticated()) {
        console.log('✅ [APP] Sesión válida encontrada');
        setUserSession(session);
        setCurrentView('dashboard');
      } else {
        console.log('❌ [APP] No hay sesión válida');
        setCurrentView('login');
      }
    } catch (error) {
      console.error('💥 [APP] Error verificando sesión:', error);
      setCurrentView('login');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    console.log('🎉 [APP] Login exitoso recibido');
    console.log('👤 [APP] Datos del usuario:', userData);
    
    // ⭐ NUEVO: Verificar si requiere 2FA
    if (userData.requiresTwoFactor) {
      console.log('🔐 [APP] Login requiere 2FA, redirigiendo...');
      setTwoFactorData(userData.data);
      setCurrentView('login-2fa');
      return;
    }
    
    const completeSession = {
      username: userData.cliente?.[0]?.nomcli || 'Usuario',
      loginTime: new Date().toISOString(),
      token: apiService.config.token,
      userData: userData
    };
    
    console.log('💾 [APP] Guardando sesión completa:', completeSession);
    apiService.saveUserSession(completeSession);
    
    setUserSession(completeSession);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    console.log('🚪 [APP] Procesando logout...');
    
    apiService.logout();
    setUserSession(null);
    setCurrentView('login');
    
    console.log('✅ [APP] Logout completado');
  };

  // 🚨 NUEVA FUNCIÓN: Logout por inactividad
  const handleInactivityLogout = (reason = 'inactivity') => {
    console.log(`🚨 [APP] Procesando logout por ${reason}...`);
    
    try {
      // Limpiar sesión del API service
      apiService.logout();
      
      // Limpiar estados locales
      setUserSession(null);
      setTwoFactorData(null);
      
      // Limpiar flujos de registro si están activos
      setRegistrationFlow({
        cedula: '',
        clienteData: null,
        username: '',
        password: '',
        selectedQuestions: [],
        idemsg: '',
        securityCode: ''
      });
      
      setSecurityRegistrationFlow({
        cedula: '',
        clientData: null,
        username: '',
        acceptedTerms: false,
        selectedQuestions: [],
        idemsg: ''
      });
      
      // Redirigir a login
      setCurrentView('login');
      
      console.log(`✅ [APP] Logout por ${reason} completado`);
      
      // Opcionalmente mostrar un mensaje específico al usuario
      if (reason === 'inactivity') {
        // Aquí podrías mostrar un toast o mensaje específico
        console.log('💤 [APP] Sesión cerrada por inactividad');
      }
      
    } catch (error) {
      console.error('💥 [APP] Error durante logout por inactividad:', error);
      // Asegurar que al menos se redirija al login
      setCurrentView('login');
    }
  };

  const handleForgotPassword = () => {
    console.log('🔐 [APP] Navegando a CAMBIO DE CONTRASEÑA');
    setCurrentView('forgot-password');
  };

  const handleBlockUser = () => {
    console.log('🔒 [APP] Navegando a BLOQUEO DE USUARIO');
    setCurrentView('block-user');
  };

  // ⭐ NUEVAS FUNCIONES PARA AUTENTICACIÓN EN DOS PASOS (2FA)

  const handleTwoFactorSuccess = (userData) => {
    console.log('🎉 [APP] 2FA completado exitosamente');
    console.log('👤 [APP] Datos del usuario verificados:', userData);
    
    const completeSession = {
      username: userData.cliente?.[0]?.nomcli || 'Usuario',
      loginTime: new Date().toISOString(),
      token: apiService.config.token,
      userData: userData,
      twoFactorVerified: true
    };
    
    console.log('💾 [APP] Guardando sesión completa con 2FA:', completeSession);
    apiService.saveUserSession(completeSession);
    
    setUserSession(completeSession);
    setTwoFactorData(null); // Limpiar datos temporales
    setCurrentView('dashboard');
  };

  const handleTwoFactorBack = () => {
    console.log('🔙 [APP] Regresando al login desde 2FA');
    setTwoFactorData(null); // Limpiar datos temporales
    setCurrentView('login');
  };

  // ⭐ NUEVAS FUNCIONES PARA EL FLUJO COMPLETO DE REGISTRO

  const handleRegister = () => {
    console.log('📝 [APP] Iniciando FLUJO COMPLETO DE REGISTRO');
    
    // Limpiar datos del flujo anterior
    setRegistrationFlow({
      cedula: '',
      clienteData: null,
      username: '',
      password: '',
      selectedQuestions: [],
      idemsg: '',
      securityCode: ''
    });
    
    setCurrentView('register-step-1');
  };

  // PASO 1 → PASO 2: Identidad validada
  const handleRegistrationStep1Next = (step1Data) => {
    console.log('✅ [APP] Paso 1 completado, avanzando al Paso 2:', step1Data);
    
    setRegistrationFlow(prev => ({
      ...prev,
      cedula: step1Data.cedula,
      clienteData: step1Data.clienteData
    }));
    
    setCurrentView('register-step-2');
  };

  // PASO 2 → PASO 3: Credenciales creadas
  const handleRegistrationStep2Next = (step2Data) => {
    console.log('✅ [APP] Paso 2 completado, avanzando al Paso 3:', step2Data);
    
    setRegistrationFlow(prev => ({
      ...prev,
      username: step2Data.username,
      password: step2Data.password
    }));
    
    setCurrentView('register-step-3');
  };

  // PASO 3 → PASO 4: Preguntas configuradas
  const handleRegistrationStep3Next = (step3Data) => {
    console.log('✅ [APP] Paso 3 completado, avanzando al Paso 4:', step3Data);
    
    setRegistrationFlow(prev => ({
      ...prev,
      selectedQuestions: step3Data.selectedQuestions
    }));
    
    setCurrentView('register-step-4');
  };

  // PASO 4: Registro completado exitosamente
  const handleRegistrationComplete = (completionData) => {
    console.log('🎉 [APP] ¡REGISTRO COMPLETO EXITOSO!:', completionData);
    
    // Limpiar datos del flujo
    setRegistrationFlow({
      cedula: '',
      clienteData: null,
      username: '',
      password: '',
      selectedQuestions: [],
      idemsg: '',
      securityCode: ''
    });
    
    // Regresar al login
    setCurrentView('login');
    
    console.log('✨ [APP] Usuario creado exitosamente:', completionData.username);
  };

  // FUNCIONES DE NAVEGACIÓN HACIA ATRÁS EN EL FLUJO
  const handleRegistrationStep2Back = () => {
    console.log('🔙 [APP] Regresando del Paso 2 al Paso 1');
    setCurrentView('register-step-1');
  };

  const handleRegistrationStep3Back = () => {
    console.log('🔙 [APP] Regresando del Paso 3 al Paso 2');
    setCurrentView('register-step-2');
  };

  const handleRegistrationStep4Back = () => {
    console.log('🔙 [APP] Regresando del Paso 4 al Paso 3');
    setCurrentView('register-step-3');
  };

  // ⭐ FUNCIONES PARA REGISTRO DE PREGUNTAS DE SEGURIDAD (mantener compatibilidad existente)

  const handleSecurityQuestionsRegister = () => {
    console.log('🔐 [APP] Iniciando registro de preguntas de seguridad');
    
    setSecurityRegistrationFlow({
      cedula: '',
      clientData: null,
      username: '',
      acceptedTerms: false,
      selectedQuestions: [],
      idemsg: ''
    });
    
    setCurrentView('security-identity');
  };

  const handleIdentityValidationNext = (identityData) => {
    console.log('✅ [APP] Identidad validada, avanzando a preguntas:', identityData);
    
    setSecurityRegistrationFlow(prev => ({
      ...prev,
      cedula: identityData.cedula,
      clientData: identityData.clientData,
      username: identityData.username,
      acceptedTerms: identityData.acceptedTerms
    }));
    
    setCurrentView('security-questions');
  };

  const handleSecurityQuestionsNext = (questionsData) => {
    console.log('✅ [APP] Preguntas configuradas, avanzando a validación:', questionsData);
    
    setSecurityRegistrationFlow(prev => ({
      ...prev,
      selectedQuestions: questionsData.selectedQuestions,
      idemsg: questionsData.idemsg
    }));
    
    setCurrentView('security-code');
  };

  const handleSecurityRegistrationComplete = (completionData) => {
    console.log('🎉 [APP] Registro de preguntas completado exitosamente:', completionData);
    
    setSecurityRegistrationFlow({
      cedula: '',
      clientData: null,
      username: '',
      acceptedTerms: false,
      selectedQuestions: [],
      idemsg: ''
    });
    
    setCurrentView('login');
    
    console.log('✨ [APP] Mensaje de éxito: Sus preguntas de seguridad han sido registradas correctamente');
  };

  const handleSecurityRegistrationBack = (targetStep) => {
    console.log('🔙 [APP] Regresando en el flujo de registro a:', targetStep);
    
    switch (targetStep) {
      case 'identity':
        setCurrentView('security-identity');
        break;
      case 'questions':
        setCurrentView('security-questions');
        break;
      case 'login':
      default:
        setSecurityRegistrationFlow({
          cedula: '',
          clientData: null,
          username: '',
          acceptedTerms: false,
          selectedQuestions: [],
          idemsg: ''
        });
        setCurrentView('login');
        break;
    }
  };

  const handleBackToLogin = () => {
    console.log('🔙 [APP] Regresando al login');
    
    // Limpiar todos los flujos en progreso
    setRegistrationFlow({
      cedula: '',
      clienteData: null,
      username: '',
      password: '',
      selectedQuestions: [],
      idemsg: '',
      securityCode: ''
    });
    
    setSecurityRegistrationFlow({
      cedula: '',
      clientData: null,
      username: '',
      acceptedTerms: false,
      selectedQuestions: [],
      idemsg: ''
    });
    
    setCurrentView('login');
  };

  // Reemplaza en App.jsx la sección de loading (líneas ~290-299)

// Reemplaza en App.jsx la sección de loading para que use el estilo gris

if (loading) {
  return (
    <div className="min-h-screen bg-black bg-opacity-10 backdrop-blur-2xl flex items-center justify-center">
      <div className="text-center bg-white bg-opacity-90 backdrop-blur-lg border border-gray-200 p-8 rounded-2xl shadow-2xl max-w-md mx-auto">
        {/* Logo centrado - MISMO ESTILO QUE DASHBOARD */}
        <div className="mb-8 transform animate-fadeInScale">
          <div className="relative inline-block">
            {/* Contenedor del logo - TAMAÑO GRANDE */}
            <div className="relative w-96 h-96 mx-auto flex items-center justify-center p-4 bg-gray-50 rounded-2xl shadow-sm">
              <img 
                src="/assets/images/logolasnaves_c.png"
                alt="Las Naves Cooperativa"
                className="w-full h-full object-contain animate-logoFloat"
                onError={(e) => {
                  // Fallback en caso de error al cargar la imagen
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              {/* Fallback text en caso de error */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-4xl"
                style={{ display: 'none' }}
              >
                NAVES
              </div>
            </div>
          </div>
        </div>

        {/* Texto de verificación de autenticación */}
        <div className="animate-fadeInUp" style={{animationDelay: '0.3s'}}>
          <p className="text-gray-600 text-base">
            Verificando autenticación...
          </p>
        </div>
      </div>

      {/* Estilos CSS */}
      <style>{`
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes logoFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        .animate-fadeInScale {
          animation: fadeInScale 0.8s ease-out;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out both;
        }

        .animate-logoFloat {
          animation: logoFloat 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

  console.log('🎬 [APP-RENDER] A punto de renderizar componente principal');
  console.log('🎬 [APP-RENDER] Estado:', { loading, currentView, hasSession: !!userSession });

  return (
    <WindowProvider>
    <InactivityProvider 
      onLogout={handleInactivityLogout} 
      userSession={userSession}
      currentView={currentView}
      config={{
        excludeViews: [
          'login', 
          'register', 
          'forgot-password', 
          'register-step-1', 
          'register-step-2', 
          'register-step-3', 
          'register-step-4', 
          'security-identity', 
          'security-questions', 
          'security-code', 
          'login-2fa', 
          'block-user'
        ]
      }}
    >
      <div className="App">
        
        {/* 🧪 BOTÓN FLOTANTE PARA ACCEDER A PRUEBAS (solo en desarrollo) */}
        {import.meta.env.DEV && currentView !== 'crypto-test' && (
          <button
            onClick={() => setCurrentView('crypto-test')}
            className="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
            title="Abrir página de pruebas de encriptación"
          >
            <span className="text-2xl">🔐</span>
          </button>
        )}

        {/* VISTA PRINCIPAL - DASHBOARD */}
        {currentView === 'dashboard' && (
          <Dashboard 
            userSession={userSession} 
            onLogout={handleLogout}
          />
        )}
        
        {/* VISTA DE LOGIN */}
        {currentView === 'login' && (
          <LoginPage 
            onLoginSuccess={handleLoginSuccess}
            onForgotPassword={handleForgotPassword}
            onBlockUser={handleBlockUser}
            onRegister={handleRegister}
            onSecurityQuestionsRegister={handleSecurityQuestionsRegister}
          />
        )}

        {/* ⭐ NUEVA VISTA: AUTENTICACIÓN EN DOS PASOS (2FA) */}
        {currentView === 'login-2fa' && (
          <TwoFactorAuthPage 
            twoFactorData={twoFactorData}
            onTwoFactorSuccess={handleTwoFactorSuccess}
            onBack={handleTwoFactorBack}
          />
        )}
        
        {/* ⭐ NUEVO FLUJO COMPLETO DE REGISTRO - 4 PASOS */}
        
        {/* PASO 1: VALIDACIÓN DE IDENTIDAD */}
        {currentView === 'register-step-1' && (
          <RegisterPage 
            onNext={handleRegistrationStep1Next}
            onBack={handleBackToLogin}
          />
        )}
        
        {/* PASO 2: CREDENCIALES DE USUARIO */}
        {currentView === 'register-step-2' && (
          <UserCredentialsPage 
            registrationData={registrationFlow}
            onNext={handleRegistrationStep2Next}
            onBack={handleRegistrationStep2Back}
          />
        )}
        
        {/* PASO 3: PREGUNTAS DE SEGURIDAD */}
        {currentView === 'register-step-3' && (
          <SecurityQuestionsPage1 
            registrationData={registrationFlow}
            onNext={handleRegistrationStep3Next}
            onBack={handleRegistrationStep3Back}
          />
        )}
        
        {/* PASO 4: VALIDACIÓN DE CÓDIGO Y FINALIZACIÓN */}
        {currentView === 'register-step-4' && (
          <SecurityCodeValidationPage1 
            registrationData={registrationFlow}
            onSuccess={handleRegistrationComplete}
            onBack={handleRegistrationStep4Back}
          />
        )}
        
        {/* VISTA DE BLOQUEO DE USUARIO */}
        {currentView === 'block-user' && (
          <BlockUser 
            onBackToLogin={handleBackToLogin}
          />
        )}
        
        {/* VISTA DE CAMBIO DE CONTRASEÑA */}
        {currentView === 'forgot-password' && (
          <ForgotPassword 
            onBackToLogin={handleBackToLogin}
          />
        )}

        {/* ⭐ VISTAS PARA REGISTRO DE PREGUNTAS DE SEGURIDAD (mantener compatibilidad) */}
        
        {/* PASO 1: VALIDACIÓN DE IDENTIDAD (solo preguntas) */}
        {currentView === 'security-identity' && (
          <IdentityValidationPage 
            onNext={handleIdentityValidationNext}
            onCancel={() => handleSecurityRegistrationBack('login')}
          />
        )}
        
        {/* PASO 2: CONFIGURACIÓN DE PREGUNTAS (solo preguntas) */}
        {currentView === 'security-questions' && (
          <SecurityQuestionsPage 
            clientData={securityRegistrationFlow.clientData}
            cedula={securityRegistrationFlow.cedula}
            onNext={handleSecurityQuestionsNext}
            onBack={() => handleSecurityRegistrationBack('identity')}
          />
        )}
        
        {/* PASO 3: VALIDACIÓN POR CÓDIGO (solo preguntas) */}
        {currentView === 'security-code' && (
          <SecurityCodeValidationPage 
            flowData={securityRegistrationFlow}
            onComplete={handleSecurityRegistrationComplete}
            onBack={() => handleSecurityRegistrationBack('questions')}
          />
        )}

        {/* 🧪 PÁGINA DE PRUEBAS DE ENCRIPTACIÓN (solo en desarrollo) */}
        {import.meta.env.DEV && currentView === 'crypto-test' && (
          <CryptoTestPage />
        )}

       
      </div>
    </InactivityProvider>
    </WindowProvider>
  );
};

export default App;