// src/hooks/useNotifications.js
import { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/apiService';

/**
 * Hook para manejar notificaciones de transferencias/pagos
 * 
 * Características:
 * - Obtiene notificaciones del día desde el servicio 2358
 * - Maneja estado de notificaciones leídas en localStorage
 * - Provee función para refrescar notificaciones (llamar después de transferencias)
 * - Notificación más reciente para mostrar en campana
 * 
 * @returns {Object} Estado y funciones para manejar notificaciones
 */
const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState(null);
  
  // Ref para evitar llamadas duplicadas
  const isLoadingRef = useRef(false);

  /**
   * Obtener cédula del usuario loggeado desde sessionStorage
   */
  const getUserCedula = useCallback(() => {
    try {
      // Usar el método de apiService que ya tiene la lógica correcta
      const cedula = apiService.getUserCedula();
      if (!cedula) {
        console.warn('⚠️ [NOTIFICATIONS] No se encontró cédula del usuario');
        return null;
      }
      console.log('✅ [NOTIFICATIONS] Cédula obtenida:', cedula);
      return cedula;
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error al obtener cédula:', error);
      return null;
    }
  }, []);

  /**
   * Obtener IDs de notificaciones leídas desde localStorage
   */
  const getReadNotifications = useCallback(() => {
    try {
      const cedula = getUserCedula();
      if (!cedula) return [];
      
      const storageKey = `notifications_read_${cedula}`;
      const readNotifications = localStorage.getItem(storageKey);
      return readNotifications ? JSON.parse(readNotifications) : [];
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error al obtener notificaciones leídas:', error);
      return [];
    }
  }, [getUserCedula]);

  /**
   * Guardar ID de notificación como leída en localStorage
   */
  const markAsRead = useCallback((notificationId) => {
    try {
      const cedula = getUserCedula();
      if (!cedula) return;

      const storageKey = `notifications_read_${cedula}`;
      const readNotifications = getReadNotifications();
      
      if (!readNotifications.includes(notificationId)) {
        const updated = [...readNotifications, notificationId];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        
        console.log('✅ [NOTIFICATIONS] Notificación marcada como leída:', notificationId);
        
        // Actualizar estado local
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => 
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
        
        // Actualizar contador de no leídas
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Si era la última notificación, limpiarla
        if (latestNotification?.id === notificationId) {
          setLatestNotification(null);
        }
      }
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error al marcar como leída:', error);
    }
  }, [getUserCedula, getReadNotifications, latestNotification]);

  /**
   * Marcar todas las notificaciones como leídas
   */
  const markAllAsRead = useCallback(() => {
    try {
      const cedula = getUserCedula();
      if (!cedula) return;

      const storageKey = `notifications_read_${cedula}`;
      const allIds = notifications.map(n => n.id);
      localStorage.setItem(storageKey, JSON.stringify(allIds));
      
      console.log('✅ [NOTIFICATIONS] Todas las notificaciones marcadas como leídas');
      
      // Actualizar estado local
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      setLatestNotification(null);
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error al marcar todas como leídas:', error);
    }
  }, [getUserCedula, notifications]);

  /**
   * Cargar notificaciones desde el backend
   */
  const fetchNotifications = useCallback(async (forceRefresh = false) => {
    // Evitar llamadas duplicadas
    if (isLoadingRef.current && !forceRefresh) {
      console.log('⏳ [NOTIFICATIONS] Carga ya en progreso, omitiendo...');
      return;
    }

    const cedula = getUserCedula();
    if (!cedula) {
      setError('No se encontró información del usuario');
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      console.log('🔔 [NOTIFICATIONS] Cargando notificaciones para:', cedula);
      
      const result = await apiService.getNotifications(cedula);

      if (result.success) {
        const readNotifications = getReadNotifications();
        
        // Marcar como leídas las que ya están en localStorage
        const processedNotifications = result.data.notifications.map(notif => ({
          ...notif,
          isRead: readNotifications.includes(notif.id)
        }));

        setNotifications(processedNotifications);
        
        // Calcular no leídas
        const unread = processedNotifications.filter(n => !n.isRead).length;
        setUnreadCount(unread);
        
        // Obtener la primera notificación no leída (más reciente)
        const firstUnread = processedNotifications.find(n => !n.isRead);
        setLatestNotification(firstUnread || null);
        
        console.log('✅ [NOTIFICATIONS] Notificaciones cargadas:', {
          total: processedNotifications.length,
          unread,
          latestMessage: firstUnread?.message?.substring(0, 50)
        });
      } else {
        console.error('❌ [NOTIFICATIONS] Error al cargar notificaciones:', result.error);
        setError(result.error?.message || 'Error al cargar notificaciones');
        setNotifications([]);
        setUnreadCount(0);
        setLatestNotification(null);
      }
    } catch (error) {
      console.error('❌ [NOTIFICATIONS] Error inesperado:', error);
      setError('Error al cargar notificaciones');
      setNotifications([]);
      setUnreadCount(0);
      setLatestNotification(null);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [getUserCedula, getReadNotifications]);

  /**
   * Limpiar todas las notificaciones (útil al logout)
   */
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    setLatestNotification(null);
    setError(null);
    console.log('🧹 [NOTIFICATIONS] Notificaciones limpiadas');
  }, []);

  /**
   * Cargar notificaciones al montar el componente
   * Y configurar polling automático cada 30 segundos
   */
  useEffect(() => {
    const cedula = getUserCedula();
    if (!cedula) return;

    // Carga inicial
    fetchNotifications();

    // 🔔 POLLING: Verificar nuevas notificaciones cada 30 segundos
    const intervalId = setInterval(() => {
      console.log('🔄 [NOTIFICATIONS] Polling automático - verificando nuevas notificaciones...');
      fetchNotifications();
    }, 15000); // 30 segundos

    // Cleanup al desmontar
    return () => {
      console.log('🧹 [NOTIFICATIONS] Limpiando interval de polling');
      clearInterval(intervalId);
    };
  }, [getUserCedula, fetchNotifications]);

  return {
    // Estado
    notifications,           // Array de todas las notificaciones
    loading,                // Estado de carga
    error,                  // Mensaje de error si existe
    unreadCount,            // Cantidad de notificaciones no leídas
    latestNotification,     // Notificación más reciente no leída
    
    // Funciones
    fetchNotifications,     // Recargar notificaciones (llamar después de transferencias)
    markAsRead,            // Marcar una notificación como leída
    markAllAsRead,         // Marcar todas como leídas
    clearNotifications,    // Limpiar todas las notificaciones (logout)
    refresh: () => fetchNotifications(true) // Alias para forzar refresh
  };
};

export default useNotifications;
