// src/context/NotificationContext.jsx
import React, { createContext, useContext, useCallback } from 'react';
import useNotifications from '../hooks/useNotifications';

/**
 * Contexto Global de Notificaciones
 * 
 * Proporciona acceso a las notificaciones en toda la aplicación
 * y permite refrescar las notificaciones desde cualquier componente
 * (especialmente después de realizar transferencias)
 */

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const notificationsHook = useNotifications();

  /**
   * Función helper para refrescar notificaciones desde cualquier componente
   */
  const refreshNotifications = useCallback(() => {
    console.log('🔔 [NOTIFICATION-CONTEXT] Refrescando notificaciones...');
    notificationsHook.refresh();
  }, [notificationsHook]);

  const value = {
    ...notificationsHook,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Hook para acceder al contexto de notificaciones
 */
export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotificationContext debe usarse dentro de NotificationProvider');
  }
  
  return context;
};

export default NotificationContext;
