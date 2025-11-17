// Helpers de Notificaciones para DevTools Console
// Copiar y pegar en la consola del navegador para pruebas rápidas

window.notificationHelpers = {
  /**
   * Obtener notificaciones manualmente
   */
  async fetchNotifications() {
    const apiService = (await import('./src/services/apiService.js')).default;
    const cedula = sessionStorage.getItem('cedula');
    
    if (!cedula) {
      console.error('❌ No hay sesión activa (falta cedula en sessionStorage)');
      return null;
    }
    
    console.log('🔔 Obteniendo notificaciones para:', cedula);
    const result = await apiService.getNotifications(cedula);
    console.log('📊 Resultado:', result);
    return result;
  },

  /**
   * Ver notificaciones leídas del usuario actual
   */
  getReadNotifications() {
    const cedula = sessionStorage.getItem('cedula');
    if (!cedula) {
      console.error('❌ No hay sesión activa');
      return [];
    }
    
    const key = `notifications_read_${cedula}`;
    const read = localStorage.getItem(key);
    const parsed = read ? JSON.parse(read) : [];
    
    console.log('✅ Notificaciones leídas:', parsed);
    return parsed;
  },

  /**
   * Limpiar notificaciones leídas (reset)
   */
  clearReadNotifications() {
    const cedula = sessionStorage.getItem('cedula');
    if (!cedula) {
      console.error('❌ No hay sesión activa');
      return;
    }
    
    const key = `notifications_read_${cedula}`;
    localStorage.removeItem(key);
    console.log('🧹 Notificaciones leídas eliminadas. Refresca la página.');
  },

  /**
   * Ver información de sesión
   */
  getSessionInfo() {
    const info = {
      cedula: sessionStorage.getItem('cedula'),
      userType: sessionStorage.getItem('userType'),
      loginTime: sessionStorage.getItem('loginTime'),
      userSession: JSON.parse(sessionStorage.getItem('userSession') || '{}')
    };
    
    console.log('👤 Información de sesión:', info);
    return info;
  },

  /**
   * Simular refresh de notificaciones
   */
  async refreshNotifications() {
    console.log('🔄 Simulando refresh de notificaciones...');
    
    // Disparar evento personalizado para que el hook escuche
    const event = new CustomEvent('refreshNotifications');
    window.dispatchEvent(event);
    
    console.log('✅ Evento disparado. Si hay un listener, se actualizará.');
  },

  /**
   * Ver todas las keys de localStorage relacionadas con notificaciones
   */
  listNotificationKeys() {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith('notifications_read_')
    );
    
    console.log('🔑 Keys de notificaciones en localStorage:', keys);
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`  ${key}:`, JSON.parse(value));
    });
    
    return keys;
  },

  /**
   * Ayuda
   */
  help() {
    console.log(`
🔔 HELPERS DE NOTIFICACIONES
============================

Funciones disponibles:
- fetchNotifications()      → Obtener notificaciones del backend
- getReadNotifications()     → Ver notificaciones marcadas como leídas
- clearReadNotifications()   → Limpiar notificaciones leídas (reset)
- getSessionInfo()           → Ver información de sesión actual
- refreshNotifications()     → Simular refresh manual
- listNotificationKeys()     → Ver todas las keys de localStorage
- help()                     → Mostrar esta ayuda

Ejemplo de uso:
  await notificationHelpers.fetchNotifications()
  notificationHelpers.getReadNotifications()
  notificationHelpers.clearReadNotifications()
    `);
  }
};

// Mostrar ayuda automáticamente
console.log('✅ Helpers de notificaciones cargados. Escribe notificationHelpers.help() para ver los comandos.');
