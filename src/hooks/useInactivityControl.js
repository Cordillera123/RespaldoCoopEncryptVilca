// src/hooks/useInactivityControl.js
import { useEffect, useCallback } from 'react';
import { useInactivity, useInactivityOperation } from '../context/InactivityContext.jsx';

/**
 * 🎛️ Hook para Control Avanzado de Inactividad
 * 
 * Proporciona:
 * - Control granular del sistema de inactividad
 * - Pausar/reanudar durante operaciones críticas
 * - Resetear timer en acciones específicas
 * - Monitoreo de estado del sistema
 */

/**
 * 🔧 Hook principal para control de inactividad
 */
export const useInactivityControl = () => {
  const inactivityContext = useInactivity();
  
  const {
    isActive,
    showWarning,
    timeRemaining,
    isTimerRunning,
    formattedTimeRemaining,
    resetTimer,
    continueSession,
    pauseTimer,
    resumeTimer,
    enableTimer,
    disableTimer,
    forceLogout,
    isEnabled,
    shouldBeActive,
    currentView,
    formatTime
  } = inactivityContext;

  // 📊 Estados computados
  const isSystemActive = shouldBeActive && isEnabled;
  const isInWarningState = showWarning && isSystemActive;
  const timeUntilWarning = !showWarning && isSystemActive ? timeRemaining : 0;

  // 🎮 Métodos de control mejorados
  const pauseForCriticalOperation = useCallback((operationName) => {
    console.log(`⏸️ [INACTIVITY CONTROL] Pausando para operación crítica: ${operationName}`);
    pauseTimer();
  }, [pauseTimer]);

  const resumeAfterCriticalOperation = useCallback((operationName) => {
    console.log(`▶️ [INACTIVITY CONTROL] Reanudando después de operación: ${operationName}`);
    resumeTimer();
  }, [resumeTimer]);

  const resetOnUserAction = useCallback((actionDescription) => {
    console.log(`🔄 [INACTIVITY CONTROL] Reseteando por acción: ${actionDescription}`);
    resetTimer();
  }, [resetTimer]);

  const temporarilyDisable = useCallback((duration = 30000) => {
    console.log(`❌ [INACTIVITY CONTROL] Deshabilitando temporalmente por ${duration}ms`);
    disableTimer();
    
    setTimeout(() => {
      console.log('✅ [INACTIVITY CONTROL] Rehabilitando después de pausa temporal');
      enableTimer();
    }, duration);
  }, [disableTimer, enableTimer]);

  return {
    // Estados
    isSystemActive,
    isInWarningState,
    timeUntilWarning,
    showWarning,
    timeRemaining,
    formattedTimeRemaining,
    isTimerRunning,
    isEnabled,
    currentView,
    
    // Métodos básicos
    reset: resetTimer,
    continue: continueSession,
    pause: pauseTimer,
    resume: resumeTimer,
    enable: enableTimer,
    disable: disableTimer,
    forceLogout,
    
    // Métodos avanzados
    pauseForCriticalOperation,
    resumeAfterCriticalOperation,
    resetOnUserAction,
    temporarilyDisable,
    
    // Utilidades
    formatTime
  };
};

/**
 * 🚨 Hook para operaciones críticas específicas
 */
export const useInactivityForCriticalOperation = (operationName) => {
  const { startOperation, endOperation } = useInactivityOperation(operationName);
  
  useEffect(() => {
    // Auto-iniciar si el operationName está definido
    if (operationName) {
      console.log(`🚨 [CRITICAL OPERATION] Iniciando operación crítica: ${operationName}`);
      startOperation();
      
      // Cleanup al desmontar
      return () => {
        console.log(`✅ [CRITICAL OPERATION] Finalizando operación crítica: ${operationName}`);
        endOperation();
      };
    }
  }, [operationName, startOperation, endOperation]);

  return {
    startOperation,
    endOperation
  };
};

/**
 * 💰 Hook específico para operaciones de transferencia
 */
export const useInactivityForTransfer = () => {
  return useInactivityForCriticalOperation('transfer');
};

/**
 * 📈 Hook específico para operaciones de inversión
 */
export const useInactivityForInvestment = () => {
  return useInactivityForCriticalOperation('investment');
};

/**
 * 🔐 Hook específico para cambio de contraseña
 */
export const useInactivityForPasswordChange = () => {
  return useInactivityForCriticalOperation('password-change');
};

/**
 * 🔑 Hook específico para autenticación de dos factores
 */
export const useInactivityForTwoFactor = () => {
  return useInactivityForCriticalOperation('two-factor-auth');
};

/**
 * 📋 Hook para formularios largos
 */
export const useInactivityForForm = (formName, options = {}) => {
  const { resetOnUserAction, pauseForCriticalOperation, resumeAfterCriticalOperation } = useInactivityControl();
  const {
    resetOnChange = true,
    pauseOnStart = false,
    resumeOnComplete = true
  } = options;

  // 🎯 Resetear en cambios de formulario
  const handleFormChange = useCallback(() => {
    if (resetOnChange) {
      resetOnUserAction(`Cambio en formulario: ${formName}`);
    }
  }, [resetOnChange, resetOnUserAction, formName]);

  // ⏸️ Pausar durante envío
  const handleFormStart = useCallback(() => {
    if (pauseOnStart) {
      pauseForCriticalOperation(`Procesando formulario: ${formName}`);
    }
  }, [pauseOnStart, pauseForCriticalOperation, formName]);

  // ▶️ Reanudar después de envío
  const handleFormComplete = useCallback(() => {
    if (resumeOnComplete) {
      resumeAfterCriticalOperation(`Formulario completado: ${formName}`);
    }
  }, [resumeOnComplete, resumeAfterCriticalOperation, formName]);

  return {
    onFormChange: handleFormChange,
    onFormStart: handleFormStart,
    onFormComplete: handleFormComplete,
    resetOnUserAction
  };
};

/**
 * ⏱️ Hook para monitoreo de tiempo específico
 */
export const useInactivityTimer = (customWarningCallback) => {
  const { showWarning, timeRemaining, formatTime, isSystemActive } = useInactivityControl();
  
  // Ejecutar callback personalizado cuando aparezca la advertencia
  useEffect(() => {
    if (showWarning && customWarningCallback) {
      customWarningCallback({
        timeRemaining,
        formattedTime: formatTime(timeRemaining),
        isSystemActive
      });
    }
  }, [showWarning, timeRemaining, formatTime, isSystemActive, customWarningCallback]);

  return {
    showWarning,
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    isSystemActive
  };
};

/**
 * 🎛️ Hook para configuración dinámica
 */
export const useInactivityConfig = () => {
  const { config, enable, disable, isEnabled } = useInactivityControl();
  
  const updateConfig = useCallback((newConfig) => {
    console.log('⚙️ [INACTIVITY CONFIG] Actualizando configuración:', newConfig);
    // Nota: La configuración se maneja en el context
    // Este método puede ser extendido para permitir cambios dinámicos
  }, []);

  const enableForRoute = useCallback((routePath) => {
    console.log(`✅ [INACTIVITY CONFIG] Habilitando para ruta: ${routePath}`);
    enable();
  }, [enable]);

  const disableForRoute = useCallback((routePath) => {
    console.log(`❌ [INACTIVITY CONFIG] Deshabilitando para ruta: ${routePath}`);
    disable();
  }, [disable]);

  return {
    config,
    isEnabled,
    updateConfig,
    enableForRoute,
    disableForRoute,
    enable,
    disable
  };
};

export default {
  useInactivityControl,
  useInactivityForCriticalOperation,
  useInactivityForTransfer,
  useInactivityForInvestment,
  useInactivityForPasswordChange,
  useInactivityForTwoFactor,
  useInactivityForForm,
  useInactivityTimer,
  useInactivityConfig
};