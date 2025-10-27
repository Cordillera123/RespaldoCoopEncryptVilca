// src/components/InactivityWarningModal.jsx
import React, { useEffect, useState } from 'react';

/**
 * 🚨 Modal de Advertencia de Inactividad
 * 
 * Características:
 * - Modal overlay con glassmorphism
 * - Countdown circular animado
 * - Botones de acción (Continuar/Cerrar Sesión)
 * - Responsive design
 * - Animaciones suaves
 * - Estados visuales progresivos
 */

const InactivityWarningModal = ({
  isVisible = false,
  timeRemaining = 120000,
  onContinueSession = () => {},
  onLogout = () => {},
  formatTime = (ms) => `${Math.ceil(ms / 1000)}s`,
  totalCountdownTime = 2 * 60 * 1000
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayTime, setDisplayTime] = useState(timeRemaining);
  
  // Actualizar displayTime cuando timeRemaining cambie
  useEffect(() => {
    setDisplayTime(timeRemaining);
  }, [timeRemaining]);

  // Calcular progreso del countdown
  const progress = totalCountdownTime > 0 ? (displayTime / totalCountdownTime) * 100 : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Determinar estado de urgencia
  const isUrgent = displayTime <= 60000; // Último minuto
  const isCritical = displayTime <= 30000; // Últimos 30 segundos

  // Manejar animaciones de entrada
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // No renderizar si no es visible
  if (!isVisible && !isAnimating) return null;

  return (
    <div 
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div 
        className={`
          relative max-w-md w-full mx-auto
          transform transition-all duration-300 ease-out
          ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
        `}
      >
        <div 
          className={`
            relative p-6 rounded-2xl shadow-2xl
            border border-white/20
            transition-all duration-300
            ${isCritical 
              ? 'bg-red-500/90 border-red-400/30' 
              : isUrgent 
                ? 'bg-amber-500/90 border-amber-400/30'
                : 'bg-white/90 border-white/30'
            }
          `}
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}
        >
          {/* ICONO DE ADVERTENCIA CON CÍRCULO ANIMADO */}
          <div className="flex justify-center mb-4">
            <div 
              className={`
                relative w-20 h-20 rounded-full flex items-center justify-center
                transition-all duration-300
                ${isCritical 
                  ? 'bg-red-600/20 animate-pulse' 
                  : isUrgent 
                    ? 'bg-amber-600/20'
                    : 'bg-amber-500/20'
                }
              `}
            >
              {/* SVG COUNTDOWN CIRCULAR */}
              <svg 
                className="absolute inset-0 w-20 h-20 transform -rotate-90"
                viewBox="0 0 100 100"
              >
                {/* Círculo de fondo */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="4"
                />
                {/* Círculo de progreso */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={isCritical ? '#ef4444' : isUrgent ? '#f59e0b' : '#06b6d4'}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  style={{
                    transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease'
                  }}
                />
              </svg>

              {/* Icono del reloj */}
              <div className={`
                text-2xl z-10 transition-colors duration-300
                ${isCritical 
                  ? 'text-red-100' 
                  : isUrgent 
                    ? 'text-amber-100'
                    : 'text-gray-700'
                }
              `}>
                ⏰
              </div>
            </div>
          </div>

          {/* TÍTULO */}
          <h2 className={`
            text-xl font-bold text-center mb-2 transition-colors duration-300
            ${isCritical 
              ? 'text-red-100' 
              : isUrgent 
                ? 'text-amber-100'
                : 'text-gray-800'
            }
          `}>
            {isCritical 
              ? '🚨 ¡Sesión Expirando!'
              : '⚠️ Sesión Inactiva'
            }
          </h2>

          {/* MENSAJE */}
          <p className={`
            text-center mb-4 leading-relaxed transition-colors duration-300
            ${isCritical 
              ? 'text-red-100' 
              : isUrgent 
                ? 'text-amber-100'
                : 'text-gray-700'
            }
          `}>
            {isCritical 
              ? 'Tu sesión se cerrará muy pronto por seguridad.'
              : 'Has estado inactivo por 2 minutos. Tu sesión se cerrará automáticamente en:'
            }
          </p>

          {/* COUNTDOWN GRANDE */}
          <div className="text-center mb-6">
            <div 
              className={`
                text-4xl font-mono font-bold transition-all duration-300
                ${isCritical 
                  ? 'text-red-100 animate-pulse' 
                  : isUrgent 
                    ? 'text-amber-100'
                    : 'text-gray-800'
                }
              `}
            >
              {formatTime(displayTime)}
            </div>
            <div className={`
              text-sm mt-1 transition-colors duration-300
              ${isCritical 
                ? 'text-red-200' 
                : isUrgent 
                  ? 'text-amber-200'
                  : 'text-gray-600'
              }
            `}>
              {isCritical ? 'segundos restantes' : 'para cerrar sesión'}
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Botón Continuar Sesión */}
            <button
              onClick={onContinueSession}
              className={`
                flex-1 px-6 py-3 rounded-xl font-semibold
                transform transition-all duration-200
                hover:scale-105 active:scale-95
                focus:outline-none focus:ring-4
                ${isCritical || isUrgent
                  ? 'bg-white text-gray-800 hover:bg-gray-100 focus:ring-white/50 shadow-lg'
                  : 'bg-cyan-600 text-white hover:bg-cyan-700 focus:ring-cyan-500/50 shadow-md'
                }
              `}
            >
              <span className="flex items-center justify-center gap-2">
                <span>✅</span>
                <span>Continuar Sesión</span>
              </span>
            </button>

            {/* Botón Cerrar Sesión */}
            <button
              onClick={onLogout}
              className={`
                flex-1 px-6 py-3 rounded-xl font-semibold
                transform transition-all duration-200
                hover:scale-105 active:scale-95
                focus:outline-none focus:ring-4
                ${isCritical || isUrgent
                  ? 'bg-red-600/20 text-red-100 hover:bg-red-600/30 focus:ring-red-500/50 border border-red-400/30'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400/50'
                }
              `}
            >
              <span className="flex items-center justify-center gap-2">
                <span>🚪</span>
                <span>Cerrar Sesión</span>
              </span>
            </button>
          </div>

          {/* MENSAJE DE SEGURIDAD */}
          <div className={`
            text-xs text-center mt-4 opacity-75 transition-colors duration-300
            ${isCritical 
              ? 'text-red-200' 
              : isUrgent 
                ? 'text-amber-200'
                : 'text-gray-600'
            }
          `}>
            🔒 Esta medida protege la seguridad de tu cuenta
          </div>
        </div>

        {/* EFECTO VISUAL DE PING EN ESTADO CRÍTICO */}
        {isCritical && (
          <div className="absolute inset-0 rounded-2xl animate-ping pointer-events-none opacity-50">
            <div className="w-full h-full bg-red-500/20 rounded-2xl"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InactivityWarningModal;