import React from 'react';

const ErrorMessage = ({ message, onRetry }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Error al cargar inversiones</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      <button 
        onClick={onRetry}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
      >
        Reintentar
      </button>
    </div>
  </div>
);

export default ErrorMessage;