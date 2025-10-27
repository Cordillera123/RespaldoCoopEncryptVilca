// src/components/dashboard/empresa/PayrollProcessingForm.jsx
import React, { useState } from 'react';

const PayrollProcessingForm = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessPayroll = () => {
    setIsProcessing(true);
    // Simular procesamiento
    setTimeout(() => {
      setIsProcessing(false);
      alert('Nómina procesada exitosamente');
    }, 3000);
  };

  return (
    <div className="p-8 h-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">💰</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Procesamiento de Nómina</h2>
          <p className="text-gray-600">Procesa el pago de nómina para todos los empleados</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de Control */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Panel de Control</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">156</div>
                <div className="text-sm text-green-700">Empleados Activos</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">$45,780.50</div>
                <div className="text-sm text-blue-700">Total Nómina</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">15</div>
                <div className="text-sm text-orange-700">Días Trabajados</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período de Nómina
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue="2024-11-01"
                  />
                  <input
                    type="date"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue="2024-11-30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Procesamiento
                </label>
                <input
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nómina Noviembre 2024"
                />
              </div>

              <button
                onClick={handleProcessPayroll}
                disabled={isProcessing}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </span>
                ) : (
                  'Procesar Nómina'
                )}
              </button>
            </div>
          </div>

          {/* Información */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Estado del Sistema</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm">Conexión a Banco</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm">Base de Datos</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm">Servicios Activos</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Próximos Eventos</h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">Fin de Mes</div>
                  <div className="text-gray-500">30 Nov 2024</div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Pago Quincena</div>
                  <div className="text-gray-500">15 Dic 2024</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollProcessingForm;