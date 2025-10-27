// src/hooks/useInactivityTimer.js
import { useState, useEffect, useRef, useCallback } from 'react';

const INACTIVITY_CONFIG = {
  WARNING_TIME: 2 * 60 * 1000,
  LOGOUT_TIME: 4 * 60 * 1000,
  CHECK_INTERVAL: 1000,
  EVENTS_THROTTLE: 500,
  COUNTDOWN_TIME: 2 * 60 * 1000
};

const ACTIVITY_EVENTS = [
  'mousedown', 'mousemove', 'mouseup',
  'keypress', 'keydown', 'scroll',
  'touchstart', 'touchmove', 'click',
  'focus', 'blur'
];

const useInactivityTimer = (options = {}) => {
  const config = {
    ...INACTIVITY_CONFIG,
    ...options,
    enabled: options.enabled !== false,
    onWarning: options.onWarning || (() => {}),
    onLogout: options.onLogout || (() => {}),
    onReset: options.onReset || (() => {})
  };

  const [isActive, setIsActive] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(config.COUNTDOWN_TIME);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const lastActivityRef = useRef(Date.now());
  const warningTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const isThrottledRef = useRef(false);

  const resetTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    setShowWarning(false);
    setTimeRemaining(config.COUNTDOWN_TIME);
    setIsTimerRunning(false);
    setIsActive(true);
    lastActivityRef.current = Date.now();

    console.log('⏰ [INACTIVITY] Timers reseteados');
  }, [config.COUNTDOWN_TIME]);

  const handleLogout = useCallback(() => {
    console.log('🚪 [INACTIVITY] Cerrando sesión por inactividad');
    
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    
    setShowWarning(false);
    setTimeRemaining(config.COUNTDOWN_TIME);
    setIsTimerRunning(false);
    setIsActive(false);
    
    config.onLogout();
  }, [config]);

  const showInactivityWarning = useCallback(() => {
    console.log('⚠️ [INACTIVITY] Mostrando advertencia');
    
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    
    setShowWarning(true);
    setTimeRemaining(config.COUNTDOWN_TIME);
    setIsTimerRunning(true);
    config.onWarning();
  }, [config]);

  // ⭐ NUEVO: useEffect SEPARADO para el countdown
  useEffect(() => {
    if (!showWarning || !isTimerRunning) {
      return;
    }

    console.log(`🚀 [COUNTDOWN] Iniciando countdown desde ${timeRemaining}ms`);

    countdownTimerRef.current = setInterval(() => {
      setTimeRemaining(prevTime => {
        const newTime = Math.max(0, prevTime - 1000);
        const secondsLeft = Math.ceil(newTime / 1000);
        
        console.log(`⏱️ [COUNTDOWN] ${secondsLeft}s restantes`);
        
        if (newTime <= 0) {
          console.log('🔥 [COUNTDOWN] ¡TIEMPO AGOTADO!');
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          handleLogout();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    // Cleanup del countdown
    return () => {
      console.log('🧹 [COUNTDOWN] Limpiando intervalo');
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [showWarning, isTimerRunning, handleLogout]); // Solo depende de showWarning y isTimerRunning

  const handleUserActivity = useCallback(() => {
    if (!config.enabled) return;
    if (isThrottledRef.current) return;
    
    isThrottledRef.current = true;
    setTimeout(() => {
      isThrottledRef.current = false;
    }, config.EVENTS_THROTTLE);

    console.log('🎯 [INACTIVITY] Actividad detectada');
    lastActivityRef.current = Date.now();
    
    if (showWarning) {
      console.log('⚠️ [INACTIVITY] Actividad durante advertencia - ignorando');
      return;
    }

    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }

    warningTimerRef.current = setTimeout(() => {
      showInactivityWarning();
    }, config.WARNING_TIME);
  }, [config.enabled, config.EVENTS_THROTTLE, config.WARNING_TIME, showWarning, showInactivityWarning]);

  const continueSession = useCallback(() => {
    console.log('✅ [INACTIVITY] Continuando sesión');
    
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    
    setShowWarning(false);
    setTimeRemaining(config.COUNTDOWN_TIME);
    setIsTimerRunning(false);
    setIsActive(true);
    lastActivityRef.current = Date.now();
    config.onReset();
    
    warningTimerRef.current = setTimeout(() => {
      showInactivityWarning();
    }, config.WARNING_TIME);
  }, [config, showInactivityWarning]);

  const pauseTimer = useCallback(() => {
    console.log('⏸️ [INACTIVITY] Timer pausado');
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  }, []);

  const resumeTimer = useCallback(() => {
    console.log('▶️ [INACTIVITY] Timer reanudado');
    
    if (showWarning && timeRemaining > 0) {
      setIsTimerRunning(true);
    } else {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      const timeUntilWarning = Math.max(0, config.WARNING_TIME - timeSinceLastActivity);
      
      warningTimerRef.current = setTimeout(() => {
        showInactivityWarning();
      }, timeUntilWarning);
    }
  }, [showWarning, timeRemaining, config.WARNING_TIME, showInactivityWarning]);

  // ⭐ useEffect SOLO para listeners de eventos
  useEffect(() => {
    if (!config.enabled) {
      console.log('❌ [INACTIVITY] Sistema deshabilitado');
      return;
    }

    console.log('🎛️ [INACTIVITY] Configurando listeners');

    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    if (!showWarning) {
      lastActivityRef.current = Date.now();
      warningTimerRef.current = setTimeout(() => {
        showInactivityWarning();
      }, config.WARNING_TIME);
    }

    return () => {
      console.log('🧹 [LISTENERS] Limpiando listeners');
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
    };
  }, [config.enabled, config.WARNING_TIME, handleUserActivity, showInactivityWarning, showWarning]);

  const formatTime = useCallback((milliseconds) => {
    if (milliseconds <= 0) return '0:00';
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    isActive,
    showWarning,
    timeRemaining,
    isTimerRunning,
    resetTimer: resetTimers,
    continueSession,
    pauseTimer,
    resumeTimer,
    handleLogout,
    formatTime,
    formattedTimeRemaining: formatTime(timeRemaining),
    config: {
      warningTime: config.WARNING_TIME,
      logoutTime: config.LOGOUT_TIME,
      countdownTime: config.COUNTDOWN_TIME,
      enabled: config.enabled
    }
  };
};

export default useInactivityTimer;