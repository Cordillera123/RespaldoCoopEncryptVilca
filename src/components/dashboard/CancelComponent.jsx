import React, { useEffect, useRef } from 'react';

const CancelComponent = ({ onComplete, errorMessage = 'Error en la transferencia', transferType = 'internal', countdown = 300 }) => {
  const timerRef = useRef(null);
  const hasCalledOnComplete = useRef(false);

  useEffect(() => {
    console.log('🚨 [CANCEL-COMPONENT] Iniciando animación de error...');
    
    // Prevenir múltiples llamadas
    if (hasCalledOnComplete.current) {
      console.log('⚠️ [CANCEL-COMPONENT] onComplete ya fue llamado, evitando duplicado');
      return;
    }
    
    // Limpiar timer anterior si existe
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Usar el countdown recibido por props (en segundos)
    const countdownMs = countdown * 1000;
    timerRef.current = setTimeout(() => {
      if (!hasCalledOnComplete.current) {
        console.log(`⏰ [CANCEL-COMPONENT] Tiempo de espera agotado (${countdown}s), cancelando transferencia...`);
        hasCalledOnComplete.current = true;
        onComplete();
      }
    }, countdownMs);

    return () => {
      console.log('🧹 [CANCEL-COMPONENT] Limpiando timer de animación de error');
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []); // ← Dependencias vacías para evitar re-ejecutar

  const handleRetry = () => {
    if (!hasCalledOnComplete.current) {
      console.log('🔄 [CANCEL-COMPONENT] Usuario decidió reintentar...');
      hasCalledOnComplete.current = true;
      onComplete();
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center relative overflow-hidden pl-8">
      {/* Partículas de fondo animadas */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-red-200/40 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Contenedor principal */}
      <div className="relative z-10 text-center flex flex-col items-center justify-center w-full">
        {/* Círculo principal con X animado */}
        <div className="relative mx-auto mb-8 flex justify-center">
          {/* Círculo de fondo que pulsa */}
          <div className="w-32 h-32 bg-red-100 rounded-full animate-ping absolute inset-0"></div>
          <div className="w-32 h-32 bg-red-200/50 rounded-full animate-pulse absolute inset-0 animation-delay-500"></div>
          
          {/* Círculo principal */}
          <div className="relative w-32 h-32 bg-white rounded-full shadow-2xl animate-shake border-4 border-red-200">
            {/* X mark animado - PERFECTAMENTE CENTRADO */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg 
                className="w-14 h-14 text-red-500" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ 
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <path 
                  className="error-path"
                  d="M18 6L6 18M6 6l12 12"
                  strokeDasharray="30"
                  strokeDashoffset="30"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Animación de transferencia fallida */}
        <div className="relative mb-8 h-16 w-full max-w-md mx-auto">
          {/* Línea de transferencia rota */}
          <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2">
            <div className="h-1 bg-gray-200 rounded-full mx-8 relative overflow-hidden">
              {/* Línea de error animada */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-400 to-transparent animate-error-slide"></div>
            </div>
          </div>

          {/* Íconos de cuentas con error */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center animate-pulse shadow-lg">
              <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5,6H23V18H5V6M14,9A3,3 0 0,1 17,12A3,3 0 0,1 14,15A3,3 0 0,1 11,12A3,3 0 0,1 14,9"/>
              </svg>
            </div>
          </div>

          <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center animate-pulse animation-delay-300 shadow-lg">
              <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5,6H23V18H5V6M14,9A3,3 0 0,1 17,12A3,3 0 0,1 14,15A3,3 0 0,1 11,12A3,3 0 0,1 14,9"/>
              </svg>
            </div>
          </div>

          {/* Símbolo de error que parpadea */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-blink">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <span className="text-white font-bold text-xs">!</span>
            </div>
          </div>
        </div>

        {/* Texto animado */}
        <div className="space-y-2 animate-fade-in-up animation-delay-800">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Error en Transferencia
          </h2>
          <p className="text-gray-600 text-lg">
            {transferType === 'internal' ? 'Problema con transferencia entre cuentas' : 
             transferType === 'coop' ? 'Error en transferencia cooperativa' :
             'Error en transferencia interbancaria'}
          </p>
          
          {/* Mensaje de error específico */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
              </svg>
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          </div>
          {/* Indicador de tiempo */}
          <div className="flex items-center justify-center mt-6 space-x-2">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-red-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
            <span className="text-gray-500 text-sm ml-3">
              {countdown >= 60 
                ? `Regresando en ${Math.ceil(countdown / 60)} min...`
                : `Regresando en ${countdown} seg...`
              }
            </span>
          </div>
        </div>
      </div>

      {/* Estilos CSS personalizados */}
      <style jsx>{`
        @keyframes error-draw {
          0% {
            stroke-dashoffset: 30;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }

        @keyframes error-slide {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-2px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(2px);
          }
        }

        @keyframes blink {
          0%, 50% {
            opacity: 1;
          }
          25%, 75% {
            opacity: 0.3;
          }
        }

        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .error-path {
          animation: error-draw 1.2s ease-in-out 0.3s forwards;
        }

        .animate-error-slide {
          animation: error-slide 2s ease-in-out infinite;
        }

        .animate-shake {
          animation: shake 0.8s ease-in-out infinite;
        }

        .animate-blink {
          animation: blink 1.5s ease-in-out infinite;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
        }

        .animation-delay-500 {
          animation-delay: 0.5s;
        }

        .animation-delay-800 {
          animation-delay: 0.8s;
        }
      `}</style>
    </div>
  );
};

export default CancelComponent;
