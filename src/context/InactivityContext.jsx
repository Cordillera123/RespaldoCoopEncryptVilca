// src/context/InactivityContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import useInactivityTimer from '../hooks/useInactivityTimer.js';
import InactivityWarningModal from '../components/InactivityWarningModal.jsx';

/**
 * 🌐 Context de Inactividad Global
 * 
 * Proporciona:
 * - Estado global de inactividad
 * - Control centralizado del sistema
 * - Integración con routing
 * - Manejo de exclusiones por ruta
 * - API consistente para toda la app
 */

// 🏗️ CREAR CONTEXT
const InactivityContext = createContext({
  // Estados
  isActive: true,
  showWarning: false,
  timeRemaining: 0,
  isTimerRunning: false,
  
  // Métodos
  resetTimer: () => {},
  continueSession: () => {},
  pauseTimer: () => {},
  resumeTimer: () => {},
  forceLogout: () => {},
  
  // Configuración
  isEnabled: true,
  enableTimer: () => {},
  disableTimer: () => {}
});

// 🔧 CONFIGURACIÓN POR DEFECTO
const DEFAULT_CONFIG = {
  // Vistas donde NO debe activarse el sistema (basado en currentView del App.jsx)
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
    // Nota: 'test-inactivity' y 'dashboard' NO están aquí porque queremos que funcionen
  ],
  
  // Operaciones críticas donde pausar el timer
  criticalOperations: [
    'transfer',
    'investment',
    'password-change',
    'security-questions',
    'two-factor-auth'
  ],
  
  // Configuración de tiempos
  warningTime: 2 * 60 * 1000,    // 2 minutos
  logoutTime: 4 * 60 * 1000,     // 4 minutos
  countdownTime: 2 * 60 * 1000   // 2 minutos countdown
};

/**
 * 🏭 Provider del Context de Inactividad
 */
export const InactivityProvider = ({ 
  children, 
  onLogout,
  config = {},
  userSession = null,
  currentView = 'login' // Nueva prop para recibir la vista actual desde App.jsx
}) => {
  // 🎛️ CONFIGURACIÓN FINAL
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // 🔄 ESTADOS LOCALES
  const [isEnabled, setIsEnabled] = useState(true);
  const [currentOperation, setCurrentOperation] = useState(null);

  // 🚦 VERIFICAR SI DEBE ESTAR ACTIVO EN LA VISTA ACTUAL
  // Activo en dashboard (con sesión válida) o en vista de prueba
  const shouldBeActive = (
    (currentView === 'dashboard' && userSession) || 
    currentView === 'test-inactivity'
  ) && isEnabled && !finalConfig.excludeViews.includes(currentView);

  // 📞 CALLBACKS PARA EL HOOK
  const handleWarning = () => {
    console.log('⚠️ [INACTIVITY CONTEXT] Advertencia de inactividad');
  };

  const handleLogout = () => {
    console.log('🚪 [INACTIVITY CONTEXT] Logout por inactividad');
    
    if (onLogout && typeof onLogout === 'function') {
      onLogout('inactivity');
    } else {
      console.warn('⚠️ [INACTIVITY CONTEXT] No se proporcionó función de logout');
    }
  };

  const handleReset = () => {
    console.log('🔄 [INACTIVITY CONTEXT] Timer reseteado');
  };

  // 🎯 CONFIGURAR HOOK DE INACTIVIDAD
  const inactivityHook = useInactivityTimer({
    enabled: shouldBeActive,
    warningTime: finalConfig.warningTime,
    logoutTime: finalConfig.logoutTime,
    countdownTime: finalConfig.countdownTime,
    onWarning: handleWarning,
    onLogout: handleLogout,
    onReset: handleReset
  });

  // 🔄 EFECTOS DE MONITOREO
  useEffect(() => {
    console.log(`🎛️ [INACTIVITY CONTEXT] Estado cambiado:`, {
      currentView,
      shouldBeActive,
      isEnabled,
      hasUserSession: !!userSession,
      showWarning: inactivityHook.showWarning
    });
  }, [currentView, shouldBeActive, isEnabled, userSession, inactivityHook.showWarning]);

  // 🎮 MÉTODOS DE CONTROL ADICIONALES
  const enableTimer = () => {
    console.log('✅ [INACTIVITY CONTEXT] Timer habilitado');
    setIsEnabled(true);
  };

  const disableTimer = () => {
    console.log('❌ [INACTIVITY CONTEXT] Timer deshabilitado');
    setIsEnabled(false);
    inactivityHook.pauseTimer();
  };

  const pauseForOperation = (operationName) => {
    console.log(`⏸️ [INACTIVITY CONTEXT] Timer pausado para operación: ${operationName}`);
    setCurrentOperation(operationName);
    inactivityHook.pauseTimer();
  };

  const resumeAfterOperation = () => {
    console.log(`▶️ [INACTIVITY CONTEXT] Timer reanudado después de operación: ${currentOperation}`);
    setCurrentOperation(null);
    inactivityHook.resumeTimer();
  };

  const forceLogout = () => {
    console.log('🚨 [INACTIVITY CONTEXT] Logout forzado');
    inactivityHook.handleLogout();
  };

  // 📦 VALOR DEL CONTEXT
  const contextValue = {
    // Estados del hook
    isActive: inactivityHook.isActive,
    showWarning: inactivityHook.showWarning,
    timeRemaining: inactivityHook.timeRemaining,
    isTimerRunning: inactivityHook.isTimerRunning,
    formattedTimeRemaining: inactivityHook.formattedTimeRemaining,
    
    // Métodos del hook
    resetTimer: inactivityHook.resetTimer,
    continueSession: inactivityHook.continueSession,
    pauseTimer: inactivityHook.pauseTimer,
    resumeTimer: inactivityHook.resumeTimer,
    
    // Métodos adicionales del context
    enableTimer,
    disableTimer,
    pauseForOperation,
    resumeAfterOperation,
    forceLogout,
    
    // Estados adicionales
    isEnabled,
    currentOperation,
    shouldBeActive,
    currentView,
    
    // Configuración
    config: finalConfig,
    formatTime: inactivityHook.formatTime
  };

  return (
    <InactivityContext.Provider value={contextValue}>
      {children}
      
      {/* 🚨 MODAL DE ADVERTENCIA */}
      <InactivityWarningModal
        isVisible={inactivityHook.showWarning && shouldBeActive}
        timeRemaining={inactivityHook.timeRemaining}
        onContinueSession={inactivityHook.continueSession}
        onLogout={handleLogout}
        formatTime={inactivityHook.formatTime}
        totalCountdownTime={finalConfig.countdownTime}
      />
    </InactivityContext.Provider>
  );
};

/**
 * 🎣 Hook para usar el Context de Inactividad
 */
export const useInactivity = () => {
  const context = useContext(InactivityContext);
  
  if (!context) {
    throw new Error('useInactivity debe usarse dentro de un InactivityProvider');
  }
  
  return context;
};

/**
 * 🔧 Hook para operaciones críticas
 * Facilita el pausar/reanudar el timer durante operaciones importantes
 */
export const useInactivityOperation = (operationName) => {
  const { pauseForOperation, resumeAfterOperation } = useInactivity();
  
  const startOperation = () => {
    pauseForOperation(operationName);
  };
  
  const endOperation = () => {
    resumeAfterOperation();
  };
  
  return { startOperation, endOperation };
};

/**
 * 🎛️ Hook para control manual del timer
 * Para casos específicos donde necesitas control granular
 */
export const useInactivityControl = () => {
  const { 
    enableTimer, 
    disableTimer, 
    resetTimer, 
    forceLogout,
    isEnabled,
    shouldBeActive 
  } = useInactivity();
  
  return {
    enable: enableTimer,
    disable: disableTimer,
    reset: resetTimer,
    forceLogout,
    isEnabled,
    isActive: shouldBeActive
  };
};

export default InactivityContext;