import React, { useEffect, useRef } from 'react';

const PageSucces = ({ onComplete, transferType = 'internal' }) => {
  const timerRef = useRef(null);
  const hasCalledOnComplete = useRef(false);

  useEffect(() => {
    console.log('🎬 [PAGE-SUCCESS] Iniciando animación de éxito...');
    
    // Prevenir múltiples llamadas
    if (hasCalledOnComplete.current) {
      console.log('⚠️ [PAGE-SUCCESS] onComplete ya fue llamado, evitando duplicado');
      return;
    }
    
    // Limpiar timer anterior si existe
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Después de 4 segundos, llamar a onComplete para mostrar el comprobante
    timerRef.current = setTimeout(() => {
      if (!hasCalledOnComplete.current) {
        console.log('⏰ [PAGE-SUCCESS] Terminando animación, llamando onComplete...');
        hasCalledOnComplete.current = true;
        onComplete();
      }
    }, 4000); // 4 segundos

    return () => {
      console.log('🧹 [PAGE-SUCCESS] Limpiando timer de animación');
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []); // ← Dependencias vacías para evitar re-ejecutar

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 via-gray-50 to-white flex items-center justify-center relative overflow-hidden pl-8">
      {/* Partículas de fondo animadas */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-sky-200/40 rounded-full animate-pulse"
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
        {/* Círculo principal con check animado */}
        <div className="relative mx-auto mb-8 flex justify-center">
          {/* Círculo de fondo que crece */}
          <div className="w-32 h-32 bg-sky-100 rounded-full animate-ping absolute inset-0"></div>
          <div className="w-32 h-32 bg-sky-200/50 rounded-full animate-pulse absolute inset-0 animation-delay-500"></div>
          
          {/* Círculo principal */}
          <div className="relative w-32 h-32 bg-white rounded-full shadow-2xl animate-bounce-slow border-4 border-green-200">
            {/* Check mark animado - PERFECTAMENTE CENTRADO */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg 
                className="w-14 h-14 text-sky-500" 
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
                  className="check-path"
                  d="M9 12l2 2 4-4"
                  strokeDasharray="20"
                  strokeDashoffset="20"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Animación de transferencia de dinero */}
        <div className="relative mb-8 h-16 w-full max-w-md mx-auto">
          {/* Línea de transferencia */}
          <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2">
            <div className="h-1 bg-gray-200 rounded-full mx-8 relative overflow-hidden">
              {/* Línea de progreso animada */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-slide-right"></div>
            </div>
          </div>

          {/* Íconos de cuentas */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center animate-pulse shadow-lg">
              <svg className="w-6 h-6 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5,6H23V18H5V6M14,9A3,3 0 0,1 17,12A3,3 0 0,1 14,15A3,3 0 0,1 11,12A3,3 0 0,1 14,9"/>
              </svg>
            </div>
          </div>

          <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
            <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center animate-pulse animation-delay-300 shadow-lg">
              <svg className="w-6 h-6 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5,6H23V18H5V6M14,9A3,3 0 0,1 17,12A3,3 0 0,1 14,15A3,3 0 0,1 11,12A3,3 0 0,1 14,9"/>
              </svg>
            </div>
          </div>

          {/* Moneda animada que se mueve */}
          <div className="absolute top-1/2 transform -translate-y-1/2 animate-money-transfer">
            <div className="w-8 h-8 bg-sky-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <span className="text-white font-bold text-xs">$</span>
            </div>
          </div>
        </div>

        {/* Texto animado */}
        <div className="space-y-2 animate-fade-in-up animation-delay-800">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            ¡Transferencia Exitosa!
          </h2>
          <p className="text-gray-600 text-lg">
            {transferType === 'internal' ? 'Fondos transferidos entre tus cuentas' : 
             transferType === 'coop' ? 'Transferencia cooperativa realizada' :
             'Transferencia interbancaria procesada'}
          </p>
          
          {/* Indicador de progreso */}
          <div className="flex items-center justify-center mt-6 space-x-2">
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
            <span className="text-gray-500 text-sm ml-3">Procesando comprobante...</span>
          </div>
        </div>
      </div>

      {/* Estilos CSS personalizados */}
      <style jsx>{`
        @keyframes check-draw {
          0% {
            stroke-dashoffset: 20;
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

        @keyframes slide-right {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes money-transfer {
          0% {
            left: 3rem;
            opacity: 0;
            transform: translateY(-50%) scale(0.5);
          }
          20% {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
          80% {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
          100% {
            right: 3rem;
            left: auto;
            opacity: 0;
            transform: translateY(-50%) scale(0.5);
          }
        }

        @keyframes bounce-slow {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0, 0, 0);
          }
          40%, 43% {
            transform: translate3d(0, -8px, 0);
          }
          70% {
            transform: translate3d(0, -4px, 0);
          }
          90% {
            transform: translate3d(0, -2px, 0);
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

        .check-path {
          animation: check-draw 1.2s ease-in-out 0.3s forwards;
        }

        .animate-slide-right {
          animation: slide-right 1.5s ease-in-out infinite;
        }

        .animate-money-transfer {
          animation: money-transfer 1.2s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 1.5s infinite;
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

export default PageSucces;
