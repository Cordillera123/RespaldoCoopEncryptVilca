// src/components/dashboard/NotificationBell.jsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNotificationContext } from '../../context/NotificationContext';

/**
 * Componente de Campana de Notificaciones
 * 
 * Características:
 * - Muestra icono de campana con badge de contador
 * - Dropdown con lista de notificaciones al hacer clic
 * - Muestra la notificación más reciente destacada
 * - Permite marcar notificaciones como leídas
 * - Botón para marcar todas como leídas
 * - Sincroniza con localStorage por usuario (cedula)
 * - Usa Portal para renderizar sobre todas las ventanas
 */
const NotificationBell = () => {
  const {
    notifications,
    loading,
    error,
    unreadCount,
    latestNotification,
    markAsRead,
    markAllAsRead,
    refresh
  } = useNotificationContext();

  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  /**
   * Calcular posición del dropdown basándose en el botón
   */
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px de margen
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen]);

  /**
   * Cerrar dropdown al hacer clic fuera
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  /**
   * Toggle del dropdown
   */
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  /**
   * Marcar notificación como leída
   */
  const handleMarkAsRead = (notificationId, event) => {
    event.stopPropagation(); // Evitar que cierre el dropdown
    markAsRead(notificationId);
  };

  /**
   * Marcar todas como leídas
   */
  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  /**
   * Formatear timestamp
   */
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Hace un momento';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Hace ${diffHours}h`;
      
      // Formato fecha completa YYYY/MM/DD HH:MM
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}/${month}/${day} ${hours}:${minutes}`;
    } catch (error) {
      return timestamp;
    }
  };

  return (
    <div className="relative">
      {/* Botón de Campana */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Notificaciones"
        title={unreadCount > 0 ? `${unreadCount} notificación(es) nueva(s)` : 'Sin notificaciones nuevas'}
      >
        {/* Icono de Campana */}
        <svg
          className={`w-6 h-6 ${unreadCount > 0 ? 'animate-pulse' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge de Contador */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de Notificaciones - Renderizado con Portal */}
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed w-96 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[500px] overflow-hidden flex flex-col"
          style={{ 
            zIndex: 999999,
            top: dropdownPosition.top,
            right: dropdownPosition.right
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Notificaciones
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                {unreadCount} notificación(es) nueva(s)
              </p>
            )}
          </div>

          {/* Contenido */}
          <div className="overflow-y-auto flex-1">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Cargando notificaciones...</span>
              </div>
            )}

            {error && (
              <div className="px-4 py-8 text-center">
                <svg className="w-12 h-12 mx-auto text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-600 mb-3">{error}</p>
                <button
                  onClick={refresh}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                  Reintentar
                </button>
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="px-4 py-12 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-gray-500 font-medium mb-1">Sin notificaciones</p>
                <p className="text-xs text-gray-400">No hay transacciones recientes para mostrar</p>
              </div>
            )}

            {!loading && !error && notifications.length > 0 && (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.isRead ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>

                      {/* Botón marcar como leída */}
                      {!notification.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          className="flex-shrink-0 text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline"
                          title="Marcar como leída"
                        >
                          ✓
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer con botón de actualizar */}
          {!loading && !error && notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <button
                onClick={refresh}
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-2 hover:bg-blue-50 rounded transition-colors"
              >
                Actualizar notificaciones
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default NotificationBell;
