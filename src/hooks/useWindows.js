// hooks/useWindows.js
import { useState, useCallback } from 'react';

const useWindows = () => {
  const [windows, setWindows] = useState([]);
  const [zIndexCounter, setZIndexCounter] = useState(1000);

  // Crear nueva ventana o enfocar existente
  const openWindow = useCallback((windowConfig) => {
    // 🔍 Verificar si ya existe una ventana con el mismo componente (sin minimizadas)
    const existingWindow = windows.find(w => 
      (w.componentName === windowConfig.component || w.title === windowConfig.title) && 
      !w.isMinimized
    );

    if (existingWindow) {
      console.log('🔄 [useWindows] Ventana ya existe, enfocando:', existingWindow.title);
      
      // Si existe pero no está minimizada, solo enfocarla
      focusWindow(existingWindow.id);
      return existingWindow.id;
    }

    // 🔍 Verificar si existe una ventana minimizada del mismo tipo
    const minimizedWindow = windows.find(w => 
      (w.componentName === windowConfig.component || w.title === windowConfig.title) && 
      w.isMinimized
    );

    if (minimizedWindow) {
      console.log('🔄 [useWindows] Restaurando ventana minimizada:', minimizedWindow.title);
      
      // Restaurar la ventana minimizada y traerla al frente
      setWindows(prev => prev.map(w => 
        w.id === minimizedWindow.id 
          ? { 
              ...w, 
              isMinimized: false, 
              zIndex: zIndexCounter + 1,
              // Si solo hay una ventana, maximizarla
              isMaximized: prev.filter(win => !win.isMinimized).length === 0
            }
          : w
      ));
      setZIndexCounter(prev => prev + 2);
      return minimizedWindow.id;
    }

    // 🆕 Crear nueva ventana si no existe
    const newWindow = {
      id: `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: windowConfig.title || 'Nueva Ventana',
      component: windowConfig.component || null,
      componentName: windowConfig.component, // 📝 Guardar nombre del componente para comparaciones
      props: windowConfig.props || {},
      isMinimized: false,
      isMaximized: true, // 🎯 Abrir siempre maximizada por defecto
      zIndex: 9999, // Z-index alto para ventanas maximizadas
      position: { x: 0, y: 0 }, // Posición temporal
      size: { width: 800, height: 600 }, // Tamaño temporal
      minSize: windowConfig.minSize || { width: 400, height: 300 },
      ...windowConfig
    };

    console.log('✨ [useWindows] Creando nueva ventana:', newWindow.title);

    setWindows(prev => {
      // Filtrar ventanas no minimizadas para el conteo real
      const visibleWindows = prev.filter(w => !w.isMinimized);
      let newWindows;
      
      // Máximo 4 ventanas visibles
      if (visibleWindows.length >= 4) {
        console.log('⚠️ [useWindows] Máximo de ventanas alcanzado, cerrando la más antigua visible');
        // Mantener ventanas minimizadas, remover la más antigua visible
        const oldestVisible = visibleWindows[0];
        newWindows = [...prev.filter(w => w.id !== oldestVisible.id), newWindow];
      } else {
        newWindows = [...prev, newWindow];
      }
      
      // Auto-organizar inmediatamente si hay múltiples ventanas visibles
      const visibleAfterAdd = newWindows.filter(w => !w.isMinimized);
      if (visibleAfterAdd.length > 1) {
        return autoOrganizeWindows(newWindows);
      }
      
      return newWindows;
    });

    setZIndexCounter(prev => prev + 1);
    return newWindow.id;
  }, [windows, zIndexCounter]);

  // Cerrar ventana
  const closeWindow = useCallback((windowId) => {
    console.log('❌ [useWindows] Cerrando ventana:', windowId);
    
    setWindows(prev => {
      const newWindows = prev.filter(w => w.id !== windowId);
      
      // Auto-reorganizar inmediatamente si hay múltiples ventanas visibles
      const visibleWindows = newWindows.filter(w => !w.isMinimized);
      if (visibleWindows.length > 1) {
        return autoOrganizeWindows(newWindows);
      }
      
      return newWindows;
    });
  }, []);

  // Minimizar ventana
  const minimizeWindow = useCallback((windowId) => {
    console.log('🔽 [useWindows] Minimizando ventana:', windowId);
    
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, isMinimized: !w.isMinimized } : w
    ));
  }, []);

  // 🔼 Restaurar y maximizar ventana (para taskbar)
  const restoreAndMaximizeWindow = useCallback((windowId) => {
    console.log('🔼 [useWindows] Restaurando y maximizando ventana:', windowId);
    
    setWindows(prev => {
      const maxZIndex = Math.max(...prev.map(w => w.zIndex || 1000));
      
      return prev.map(w => {
        if (w.id === windowId) {
          return {
            ...w,
            isMinimized: false,    // Restaurar
            isMaximized: true,     // Maximizar
            zIndex: Math.max(maxZIndex + 10, 10000)  // Traer al frente
          };
        }
        return w;
      });
    });
    
    setZIndexCounter(prev => prev + 11);
  }, []);

  // Maximizar ventana
  const maximizeWindow = useCallback((windowId) => {
    console.log('🔼 [useWindows] Maximizando ventana:', windowId);
    
    setWindows(prev => {
      // Calcular el z-index más alto actual
      const maxZIndex = Math.max(...prev.map(w => w.zIndex || 1000));
      
      return prev.map(w => {
        if (w.id === windowId) {
          const newMaximized = !w.isMaximized;
          return { 
            ...w, 
            isMaximized: newMaximized,
            // Si se maximiza, usar z-index muy alto, si se restaura, usar el siguiente disponible
            zIndex: newMaximized ? Math.max(maxZIndex + 10, 10000) : maxZIndex + 1
          };
        }
        return w;
      });
    });
    
    setZIndexCounter(prev => prev + 11); // Incrementar considerablemente para evitar conflictos
  }, []);

  // Traer ventana al frente
const focusWindow = useCallback((windowId) => {
  console.log('🎯 [useWindows] Enfocando ventana:', windowId);
  
  setWindows(prev => {
    const targetWindow = prev.find(w => w.id === windowId);
    if (!targetWindow) return prev;
    
    // Calcular el z-index más alto actual + 1
    const maxZIndex = Math.max(...prev.map(w => w.zIndex || 1000));
    const newZIndex = Math.max(maxZIndex + 1, zIndexCounter);
    
    return prev.map(w => 
      w.id === windowId ? { ...w, zIndex: newZIndex } : w
    );
  });
  
  setZIndexCounter(prev => {
    const maxZIndex = Math.max(...windows.map(w => w.zIndex || 1000));
    return Math.max(maxZIndex + 2, prev + 1);
  });
}, [windows, zIndexCounter]);

  // Actualizar posición de ventana
  const updateWindowPosition = useCallback((windowId, position) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, position } : w
    ));
  }, []);

  // Actualizar tamaño de ventana
  const updateWindowSize = useCallback((windowId, size) => {
    setWindows(prev => prev.map(w => 
      w.id === windowId ? { ...w, size } : w
    ));
  }, []);

  // 🔍 Función para verificar si existe una ventana de un tipo específico
  const windowExists = useCallback((componentName) => {
    return windows.some(w => w.componentName === componentName);
  }, [windows]);

  // 🎯 Función para enfocar una ventana por nombre de componente
  const focusWindowByComponent = useCallback((componentName) => {
    const existingWindow = windows.find(w => w.componentName === componentName);
    if (existingWindow) {
      focusWindow(existingWindow.id);
      return true;
    }
    return false;
  }, [windows, focusWindow]);

  // Función para auto-organizar ventanas cuando cambia el número
  const autoOrganizeWindows = (windowsList) => {
    if (windowsList.length === 0) return windowsList;

    // Solo organizar ventanas visibles (no minimizadas)
    const visibleWindows = windowsList.filter(w => !w.isMinimized);
    
    if (visibleWindows.length === 0) return windowsList;

    const containerWidth = window.innerWidth - 280; // Sidebar (256px) + padding
    const containerHeight = window.innerHeight - 100; // Header + padding
    const startX = 280; // Después del sidebar más estrecho
    const startY = 80;  // Después del header

    let positions = [];
    
    switch (visibleWindows.length) {
      case 1:
        // Una ventana: ocupa todo el espacio disponible
        positions = [{
          position: { x: startX, y: startY },
          size: { 
            width: containerWidth - 20, 
            height: containerHeight - 20 
          }
        }];
        break;
        
      case 2:
        // Dos ventanas: dividir verticalmente
        const halfWidth = (containerWidth - 30) / 2;
        positions = [
          {
            position: { x: startX, y: startY },
            size: { width: halfWidth, height: containerHeight - 20 }
          },
          {
            position: { x: startX + halfWidth + 10, y: startY },
            size: { width: halfWidth, height: containerHeight - 20 }
          }
        ];
        break;
        
      case 3:
        // Tres ventanas: una arriba ocupando todo el ancho, dos abajo
        const thirdHeight = (containerHeight - 30) / 2;
        const thirdHalfWidth = (containerWidth - 30) / 2;
        positions = [
          {
            position: { x: startX, y: startY },
            size: { width: containerWidth - 20, height: thirdHeight }
          },
          {
            position: { x: startX, y: startY + thirdHeight + 10 },
            size: { width: thirdHalfWidth, height: thirdHeight }
          },
          {
            position: { x: startX + thirdHalfWidth + 10, y: startY + thirdHeight + 10 },
            size: { width: thirdHalfWidth, height: thirdHeight }
          }
        ];
        break;
        
      case 4:
        // Cuatro ventanas: mosaico 2x2
        const quarterWidth = (containerWidth - 30) / 2;
        const quarterHeight = (containerHeight - 30) / 2;
        positions = [
          {
            position: { x: startX, y: startY },
            size: { width: quarterWidth, height: quarterHeight }
          },
          {
            position: { x: startX + quarterWidth + 10, y: startY },
            size: { width: quarterWidth, height: quarterHeight }
          },
          {
            position: { x: startX, y: startY + quarterHeight + 10 },
            size: { width: quarterWidth, height: quarterHeight }
          },
          {
            position: { x: startX + quarterWidth + 10, y: startY + quarterHeight + 10 },
            size: { width: quarterWidth, height: quarterHeight }
          }
        ];
        break;
        
      default:
        positions = visibleWindows.map(() => ({
          position: { x: startX, y: startY },
          size: { width: 800, height: 600 }
        }));
    }

    // Aplicar posiciones solo a ventanas visibles
    let visibleIndex = 0;
    return windowsList.map((window) => {
      // Si la ventana está minimizada, no cambiar su configuración
      if (window.isMinimized) {
        return window;
      }
      
      // Aplicar nueva posición y tamaño a ventanas visibles
      const newConfig = {
        ...window,
        position: positions[visibleIndex]?.position || window.position,
        size: positions[visibleIndex]?.size || window.size,
        // Solo maximizar si hay una sola ventana visible
        isMaximized: visibleWindows.length === 1 ? true : false
      };
      
      visibleIndex++;
      return newConfig;
    });
  };

  // Reorganizar ventanas en mosaico
  const arrangeWindows = useCallback((arrangement = 'tile') => {
    if (windows.length === 0) return;

    console.log('🎨 [useWindows] Reorganizando ventanas:', arrangement);

    if (arrangement === 'auto') {
      setWindows(prev => autoOrganizeWindows(prev));
      return;
    }

    const containerWidth = window.innerWidth - 280; // Sidebar + padding
    const containerHeight = window.innerHeight - 100; // Header + padding
    const startX = 280;
    const startY = 80;
    
    let positions = [];
    
    switch (arrangement) {
      case 'tile':
        positions = autoOrganizeWindows(windows);
        setWindows(positions);
        return;
        
      case 'cascade':
        positions = getCascadePositions(windows.length, startX, startY);
        break;
        
      default:
        return;
    }

    if (arrangement !== 'tile') {
      setWindows(prev => prev.map((w, index) => ({
        ...w,
        position: positions[index]?.position || w.position,
        size: positions[index]?.size || w.size,
        isMaximized: false,
        isMinimized: false
      })));
    }
  }, [windows]);

  // Calcular posiciones en cascada
  const getCascadePositions = (count, startX, startY) => {
    const positions = [];
    const offset = 40;

    for (let i = 0; i < count; i++) {
      positions.push({
        position: {
          x: startX + (i * offset),
          y: startY + (i * offset)
        },
        size: {
          width: 800,
          height: 600
        }
      });
    }

    return positions;
  };

  // Cerrar todas las ventanas
  const closeAllWindows = useCallback(() => {
    console.log('🗑️ [useWindows] Cerrando todas las ventanas');
    setWindows([]);
  }, []);

  // Minimizar todas las ventanas
  const minimizeAllWindows = useCallback(() => {
    console.log('🔽 [useWindows] Minimizando todas las ventanas');
    setWindows(prev => prev.map(w => ({ ...w, isMinimized: true })));
  }, []);

  // 🆕 Función para maximizar y traer al frente una ventana existente por componente
  const maximizeWindowByComponent = useCallback((componentName) => {
    const existingWindow = windows.find(w => w.componentName === componentName);
    if (existingWindow) {
      console.log('🔼 [useWindows] Maximizando ventana por componente:', componentName);
      
      setWindows(prev => {
        const maxZIndex = Math.max(...prev.map(w => w.zIndex || 1000));
        
        return prev.map(w => {
          if (w.id === existingWindow.id) {
            return {
              ...w,
              isMaximized: true,
              isMinimized: false,
              zIndex: Math.max(maxZIndex + 10, 10000)
            };
          }
          return w;
        });
      });
      
      setZIndexCounter(prev => prev + 11);
      return existingWindow.id;
    }
    return null;
  }, [windows]);

  // 🆕 Función para abrir o maximizar ventana (combinada)
  const openOrFocusWindow = useCallback((windowConfig) => {
    console.log('🎯 [useWindows] OpenOrFocus para componente:', windowConfig.componentName);
    
    // Buscar ventana existente (incluyendo minimizadas)
    const existingWindow = windows.find(w => 
      w.componentName === windowConfig.componentName || 
      w.title === windowConfig.title
    );

    if (existingWindow) {
      console.log('🔄 [useWindows] Ventana existe, maximizando y trayendo al frente:', existingWindow.title);
      
      setWindows(prev => {
        const maxZIndex = Math.max(...prev.map(w => w.zIndex || 1000));
        
        return prev.map(w => {
          if (w.id === existingWindow.id) {
            return {
              ...w,
              isMaximized: true,
              isMinimized: false,
              zIndex: Math.max(maxZIndex + 10, 10000)
            };
          }
          return w;
        });
      });
      
      setZIndexCounter(prev => prev + 11);
      return existingWindow.id;
    } else {
      // Si no existe, crear nueva ventana usando la función original
      console.log('✨ [useWindows] Ventana no existe, creando nueva:', windowConfig.title);
      return openWindow(windowConfig);
    }
  }, [windows, openWindow]);

  return {
    windows,
    openWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
    arrangeWindows,
    closeAllWindows,
    minimizeAllWindows,
    windowCount: windows.length,
    // 🆕 Nuevas funciones para manejo de duplicados
    windowExists,
    focusWindowByComponent,
    maximizeWindowByComponent,
    openOrFocusWindow,
    restoreAndMaximizeWindow
  };
};

export default useWindows;