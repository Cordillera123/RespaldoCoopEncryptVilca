// context/WindowContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const WindowContext = createContext(null);

export const WindowProvider = ({ children }) => {
  const [windowCloseBlocked, setWindowCloseBlocked] = useState({});

  // Función para establecer bloqueo de cierre por componente
  const setCloseBlockedByComponent = useCallback((componentName, blocked) => {
    console.log(`🔒 [WindowContext] ${blocked ? 'Bloqueando' : 'Desbloqueando'} cierre para:`, componentName);
    setWindowCloseBlocked(prev => ({
      ...prev,
      [componentName]: blocked
    }));
  }, []);

  // Verificar si un componente específico está bloqueado
  const isComponentBlocked = useCallback((componentName) => {
    return windowCloseBlocked[componentName] || false;
  }, [windowCloseBlocked]);

  // Verificar si alguna ventana está bloqueada
  const isAnyWindowBlocked = useCallback(() => {
    return Object.values(windowCloseBlocked).some(blocked => blocked);
  }, [windowCloseBlocked]);

  const value = {
    windowCloseBlocked,
    setCloseBlockedByComponent,
    isComponentBlocked,
    isAnyWindowBlocked
  };

  return (
    <WindowContext.Provider value={value}>
      {children}
    </WindowContext.Provider>
  );
};

export const useWindowContext = () => {
  const context = useContext(WindowContext);
  if (!context) {
    console.warn('⚠️ [WindowContext] useWindowContext debe usarse dentro de un WindowProvider');
    // Retornar funciones dummy para evitar errores
    return {
      windowCloseBlocked: {},
      setCloseBlockedByComponent: () => {},
      isComponentBlocked: () => false,
      isAnyWindowBlocked: () => false
    };
  }
  return context;
};

export default WindowContext;
