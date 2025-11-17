import React from 'react';
import { MdError, MdRefresh } from 'react-icons/md';

const ErrorMessage = ({ message, onRetry, context }) => (
  <div className="flex items-center justify-center min-h-[400px] p-4">
    <div className="text-center bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-lg w-full shadow-lg">
      {/* Ícono de error */}
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
        <MdError className="w-12 h-12 text-red-500" />
      </div>
      
      {/* Título */}
      <h3 className="text-xl font-bold text-gray-800 mb-3">
        {context ? `Error al cargar ${context}` : 'Error al cargar inversiones'}
      </h3>
      
      {/* Mensaje de error */}
      <p className="text-gray-600 mb-6 leading-relaxed">
        {message || 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'}
      </p>
      
      {/* Botón de reintentar */}
      {onRetry && (
        <button 
          onClick={onRetry}
          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
        >
          <MdRefresh className="w-5 h-5" />
          <span>Reintentar</span>
        </button>
      )}
      
      {/* Nota adicional */}
      <p className="text-xs text-gray-500 mt-4">
        Si el problema persiste, contacta con soporte técnico
      </p>
    </div>
  </div>
);

export default ErrorMessage;