// src/utils/inactivityDetector.js
/**
 * 🎯 Utilidades para Detección de Inactividad
 * 
 * Proporciona funciones auxiliares para:
 * - Detección avanzada de actividad
 * - Throttling de eventos
 * - Formateo de tiempo
 * - Validación de rutas
 * - Configuración de eventos
 */

/**
 * 📱 CONFIGURACIÓN DE EVENTOS A MONITOREAR
 */
export const ACTIVITY_EVENTS = {
  // Eventos de mouse
  MOUSE: [
    'mousedown',
    'mouseup', 
    'mousemove',
    'click',
    'contextmenu',
    'wheel'
  ],
  
  // Eventos de teclado
  KEYBOARD: [
    'keydown',
    'keyup',
    'keypress'
  ],
  
  // Eventos de touch (móvil)
  TOUCH: [
    'touchstart',
    'touchmove',
    'touchend',
    'touchcancel'
  ],
  
  // Eventos de navegación
  NAVIGATION: [
    'scroll',
    'resize',
    'focus',
    'blur'
  ],
  
  // Eventos de arrastrar y soltar
  DRAG: [
    'dragstart',
    'dragend',
    'drop'
  ]
};

/**
 * 🔄 Obtener todos los eventos como array plano
 */
export const getAllActivityEvents = () => {
  return Object.values(ACTIVITY_EVENTS).flat();
};

/**
 * ⏱️ Clase para manejar throttling de eventos
 */
export class EventThrottler {
  constructor(delay = 500) {
    this.delay = delay;
    this.throttled = false;
    this.callbacks = new Set();
    this.timer = null;
  }

  /**
   * Agregar callback que será ejecutado cuando se dispare el evento
   */
  addCallback(callback) {
    this.callbacks.add(callback);
  }

  /**
   * Remover callback
   */
  removeCallback(callback) {
    this.callbacks.delete(callback);
  }

  /**
   * Ejecutar callbacks si no está throttled
   */
  execute(...args) {
    if (this.throttled) {
      return false;
    }

    this.throttled = true;
    
    // Ejecutar todos los callbacks registrados
    this.callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error('🔴 [EVENT THROTTLER] Error ejecutando callback:', error);
      }
    });

    // Programar reset del throttle
    this.timer = setTimeout(() => {
      this.throttled = false;
    }, this.delay);

    return true;
  }

  /**
   * Limpiar timers
   */
  cleanup() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.callbacks.clear();
    this.throttled = false;
  }

  /**
   * Cambiar delay del throttle
   */
  setDelay(newDelay) {
    this.delay = newDelay;
  }
}

/**
 * 🎯 Detector avanzado de actividad
 */
export class ActivityDetector {
  constructor(options = {}) {
    this.options = {
      throttleDelay: 500,
      events: getAllActivityEvents(),
      passive: true,
      capture: false,
      ...options
    };

    this.throttler = new EventThrottler(this.options.throttleDelay);
    this.isActive = false;
    this.listeners = new Map();
    this.lastActivity = Date.now();
  }

  /**
   * Iniciar detección de actividad
   */
  start() {
    if (this.isActive) {
      console.warn('⚠️ [ACTIVITY DETECTOR] Ya está activo');
      return;
    }

    console.log('🎯 [ACTIVITY DETECTOR] Iniciando detección');
    
    this.isActive = true;
    this.lastActivity = Date.now();

    // Agregar listeners para cada evento
    this.options.events.forEach(eventType => {
      const listener = (event) => {
        this.handleActivity(event);
      };

      // Guardar referencia del listener
      this.listeners.set(eventType, listener);

      // Agregar listener con opciones
      document.addEventListener(eventType, listener, {
        passive: this.options.passive,
        capture: this.options.capture
      });
    });

    console.log(`✅ [ACTIVITY DETECTOR] ${this.options.events.length} eventos configurados`);
  }

  /**
   * Detener detección de actividad
   */
  stop() {
    if (!this.isActive) {
      console.warn('⚠️ [ACTIVITY DETECTOR] Ya está inactivo');
      return;
    }

    console.log('🛑 [ACTIVITY DETECTOR] Deteniendo detección');

    this.isActive = false;

    // Remover todos los listeners
    this.listeners.forEach((listener, eventType) => {
      document.removeEventListener(eventType, listener);
    });

    this.listeners.clear();
    this.throttler.cleanup();

    console.log('✅ [ACTIVITY DETECTOR] Detección detenida');
  }

  /**
   * Manejar actividad detectada
   */
  handleActivity(event) {
    if (!this.isActive) return;

    // Actualizar timestamp de última actividad
    this.lastActivity = Date.now();

    // Ejecutar callbacks con throttling
    this.throttler.execute(event, this.lastActivity);
  }

  /**
   * Agregar callback para actividad
   */
  onActivity(callback) {
    this.throttler.addCallback(callback);
  }

  /**
   * Remover callback
   */
  offActivity(callback) {
    this.throttler.removeCallback(callback);
  }

  /**
   * Obtener tiempo desde última actividad
   */
  getTimeSinceLastActivity() {
    return Date.now() - this.lastActivity;
  }

  /**
   * Verificar si ha habido actividad reciente
   */
  hasRecentActivity(threshold = 1000) {
    return this.getTimeSinceLastActivity() < threshold;
  }

  /**
   * Resetear timestamp de actividad
   */
  resetActivity() {
    this.lastActivity = Date.now();
  }
}

/**
 * ⏰ Utilidades para formateo de tiempo
 */
export const TimeFormatter = {
  /**
   * Formatear milisegundos a MM:SS
   */
  toMinutesSeconds(milliseconds) {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },

  /**
   * Formatear milisegundos a texto legible
   */
  toReadableTime(milliseconds) {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    
    if (totalSeconds < 60) {
      return `${totalSeconds} segundo${totalSeconds !== 1 ? 's' : ''}`;
    }
    
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes < 60) {
      const minuteText = `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
      if (seconds > 0) {
        return `${minuteText} y ${seconds} segundo${seconds !== 1 ? 's' : ''}`;
      }
      return minuteText;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const hourText = `${hours} hora${hours !== 1 ? 's' : ''}`;
    
    if (remainingMinutes > 0) {
      return `${hourText} y ${remainingMinutes} minuto${remainingMinutes !== 1 ? 's' : ''}`;
    }
    
    return hourText;
  },

  /**
   * Formatear para countdown con colores
   */
  toCountdownFormat(milliseconds) {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Determinar urgencia para styling
    let urgency = 'normal';
    if (totalSeconds <= 10) urgency = 'critical';
    else if (totalSeconds <= 30) urgency = 'urgent';
    else if (totalSeconds <= 60) urgency = 'warning';
    
    return {
      formatted: formattedTime,
      totalSeconds,
      minutes,
      seconds,
      urgency
    };
  }
};

/**
 * 🛣️ Utilidades para validación de rutas
 */
export const RouteValidator = {
  /**
   * Verificar si una ruta debe ser excluida
   */
  shouldExclude(currentPath, excludeRoutes = []) {
    if (!currentPath || !Array.isArray(excludeRoutes)) {
      return false;
    }

    return excludeRoutes.some(route => {
      // Coincidencia exacta
      if (currentPath === route) return true;
      
      // Coincidencia con wildcards
      if (route.includes('*')) {
        const pattern = route.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(currentPath);
      }
      
      // Coincidencia por prefijo
      if (route.endsWith('/')) {
        return currentPath.startsWith(route);
      }
      
      return false;
    });
  },

  /**
   * Verificar si una ruta es crítica
   */
  isCriticalRoute(currentPath, criticalRoutes = []) {
    return criticalRoutes.includes(currentPath);
  },

  /**
   * Obtener configuración específica para una ruta
   */
  getRouteConfig(currentPath, routeConfigs = {}) {
    // Buscar coincidencia exacta primero
    if (routeConfigs[currentPath]) {
      return routeConfigs[currentPath];
    }

    // Buscar coincidencia por patrón
    for (const [pattern, config] of Object.entries(routeConfigs)) {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (regex.test(currentPath)) {
          return config;
        }
      }
    }

    return null;
  }
};

/**
 * 🔧 Utilidades de configuración
 */
export const ConfigUtils = {
  /**
   * Merge de configuraciones con valores por defecto
   */
  mergeConfig(defaultConfig, userConfig) {
    return {
      ...defaultConfig,
      ...userConfig,
      // Merge arrays si existen
      ...(defaultConfig.excludeRoutes && userConfig.excludeRoutes && {
        excludeRoutes: [...defaultConfig.excludeRoutes, ...userConfig.excludeRoutes]
      }),
      ...(defaultConfig.criticalOperations && userConfig.criticalOperations && {
        criticalOperations: [...defaultConfig.criticalOperations, ...userConfig.criticalOperations]
      })
    };
  },

  /**
   * Validar configuración
   */
  validateConfig(config) {
    const errors = [];
    
    if (config.warningTime && typeof config.warningTime !== 'number') {
      errors.push('warningTime debe ser un número');
    }
    
    if (config.logoutTime && typeof config.logoutTime !== 'number') {
      errors.push('logoutTime debe ser un número');
    }
    
    if (config.warningTime && config.logoutTime && config.warningTime >= config.logoutTime) {
      errors.push('warningTime debe ser menor que logoutTime');
    }
    
    if (config.excludeRoutes && !Array.isArray(config.excludeRoutes)) {
      errors.push('excludeRoutes debe ser un array');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

/**
 * 📊 Logger especializado para inactividad
 */
export const InactivityLogger = {
  /**
   * Log de inicio de sesión
   */
  logSessionStart(userSession) {
    console.log('🚀 [INACTIVITY] Sesión iniciada:', {
      user: userSession?.username || 'Usuario',
      timestamp: new Date().toISOString(),
      sessionId: userSession?.sessionId || 'N/A'
    });
  },

  /**
   * Log de actividad detectada
   */
  logActivity(eventType, timestamp) {
    console.log('🎯 [INACTIVITY] Actividad detectada:', {
      event: eventType,
      timestamp: new Date(timestamp).toISOString()
    });
  },

  /**
   * Log de advertencia mostrada
   */
  logWarning(timeRemaining) {
    console.log('⚠️ [INACTIVITY] Advertencia mostrada:', {
      timeRemaining: TimeFormatter.toReadableTime(timeRemaining),
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Log de logout por inactividad
   */
  logLogout(reason, userSession) {
    console.log('🚪 [INACTIVITY] Logout ejecutado:', {
      reason,
      user: userSession?.username || 'Usuario',
      timestamp: new Date().toISOString(),
      sessionDuration: userSession?.loginTime ? 
        TimeFormatter.toReadableTime(Date.now() - new Date(userSession.loginTime).getTime()) : 
        'N/A'
    });
  },

  /**
   * Log de configuración
   */
  logConfig(config) {
    console.log('⚙️ [INACTIVITY] Configuración aplicada:', {
      warningTime: TimeFormatter.toReadableTime(config.warningTime),
      logoutTime: TimeFormatter.toReadableTime(config.logoutTime),
      excludeRoutes: config.excludeRoutes,
      enabled: config.enabled
    });
  }
};

export default {
  ACTIVITY_EVENTS,
  getAllActivityEvents,
  EventThrottler,
  ActivityDetector,
  TimeFormatter,
  RouteValidator,
  ConfigUtils,
  InactivityLogger
};