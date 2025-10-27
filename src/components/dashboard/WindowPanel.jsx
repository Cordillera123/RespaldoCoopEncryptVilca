// components/dashboard/WindowPanel.jsx
import React, { useState, useRef, useEffect } from 'react';

const WindowPanel = ({
  window,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onPositionChange,
  onSizeChange,
  children
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const windowRef = useRef(null);

  // Manejar inicio de arrastre
  const handleMouseDown = (e) => {
    if (e.target.closest('.window-controls') || e.target.closest('.resize-handle')) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - window.position.x,
      y: e.clientY - window.position.y
    });
    onFocus(window.id);
  };

  // Manejar inicio de redimensionamiento
  const handleResizeStart = (e, direction) => {
    e.stopPropagation();
    setIsResizing(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: window.size.width,
      height: window.size.height
    });
  };

  // Manejar movimiento del mouse
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && !window.isMaximized) {
        const newX = Math.max(0, Math.min(e.clientX - dragStart.x, window.innerWidth - window.size.width));
        const newY = Math.max(0, Math.min(e.clientY - dragStart.y, window.innerHeight - window.size.height));
        
        onPositionChange(window.id, { x: newX, y: newY });
      }

      if (isResizing && !window.isMaximized) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;

        if (isResizing.includes('right')) {
          newWidth = Math.max(window.minSize.width, resizeStart.width + deltaX);
        }
        if (isResizing.includes('left')) {
          newWidth = Math.max(window.minSize.width, resizeStart.width - deltaX);
        }
        if (isResizing.includes('bottom')) {
          newHeight = Math.max(window.minSize.height, resizeStart.height + deltaY);
        }
        if (isResizing.includes('top')) {
          newHeight = Math.max(window.minSize.height, resizeStart.height - deltaY);
        }

        onSizeChange(window.id, { width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, window, onPositionChange, onSizeChange]);

  // Calcular estilos de la ventana
  const getWindowStyles = () => {
    if (window.isMinimized) {
      return {
        transform: 'scale(0)',
        opacity: 0,
        pointerEvents: 'none'
      };
    }

    if (window.isMaximized) {
      // Ocupar todo el espacio disponible menos el sidebar
      return {
        left: 0,  // Sin margen izquierdo - el contenedor padre ya maneja el sidebar
        top: 0,   // Sin margen superior - el contenedor padre ya maneja el header
        width: '100%',  // Ancho completo del contenedor
        height: '100%', // Alto completo del contenedor
        zIndex: window.zIndex || 10000 // Usar el z-index de la ventana
      };
    }

    return {
      left: window.position.x,
      top: window.position.y,
      width: window.size.width,
      height: window.size.height,
      zIndex: window.zIndex
    };
  };

  return (
    <div
      ref={windowRef}
      className={`${window.isMaximized ? 'absolute' : 'fixed'} bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden transition-all duration-200 ${
        window.isMinimized ? 'pointer-events-none' : ''
      } ${window.isMaximized ? 'rounded-none' : ''}`}
      style={getWindowStyles()}
      onClick={() => onFocus(window.id)}
    >
      {/* Barra de título */}
      <div
        className="bg-gray-50 border-b border-gray-200 px-4 py-3 cursor-move select-none flex items-center justify-between"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
          </div>
          <span className="font-semibold text-gray-800 text-sm">{window.title}</span>
        </div>

        {/* Controles de ventana */}
        <div className="window-controls flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize(window.id);
            }}
            className="w-8 h-8 rounded-md hover:bg-gray-200 flex items-center justify-center transition-colors duration-150"
            title="Minimizar"
          >
            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20,14H4V10H20"/>
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMaximize(window.id);
            }}
            className="w-8 h-8 rounded-md hover:bg-gray-200 flex items-center justify-center transition-colors duration-150"
            title={window.isMaximized ? "Restaurar" : "Maximizar"}
          >
            {window.isMaximized ? (
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4,8H8V4H20V16H16V20H4V8M16,8V14H18V6H10V8H16M6,12V18H14V12H6Z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4,4H20V20H4V4M6,8V18H18V8H6Z"/>
              </svg>
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(window.id);
            }}
            className="w-8 h-8 rounded-md hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors duration-150"
            title="Cerrar"
          >
            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Contenido de la ventana */}
      <div className="flex-1 overflow-auto bg-white" style={{ height: 'calc(100% - 52px)' }}>
        {children}
      </div>

      {/* Handles de redimensionamiento */}
      {!window.isMaximized && (
        <>
          {/* Esquinas */}
          <div
            className="absolute top-0 left-0 w-2 h-2 cursor-nw-resize resize-handle"
            onMouseDown={(e) => handleResizeStart(e, 'top-left')}
          />
          <div
            className="absolute top-0 right-0 w-2 h-2 cursor-ne-resize resize-handle"
            onMouseDown={(e) => handleResizeStart(e, 'top-right')}
          />
          <div
            className="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize resize-handle"
            onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
          />
          <div
            className="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize resize-handle bg-gray-300 opacity-50 hover:opacity-100"
            onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
          />

          {/* Bordes */}
          <div
            className="absolute top-0 left-2 right-2 h-1 cursor-n-resize resize-handle"
            onMouseDown={(e) => handleResizeStart(e, 'top')}
          />
          <div
            className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize resize-handle"
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          />
          <div
            className="absolute left-0 top-2 bottom-2 w-1 cursor-w-resize resize-handle"
            onMouseDown={(e) => handleResizeStart(e, 'left')}
          />
          <div
            className="absolute right-0 top-2 bottom-2 w-1 cursor-e-resize resize-handle"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          />
        </>
      )}
    </div>
  );
};

export default WindowPanel;