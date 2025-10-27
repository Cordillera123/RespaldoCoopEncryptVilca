import React from 'react';

const ComprobanteInternoCuentas = ({ transferData, onClose, onNewTransfer }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatAccountNumber = (accountNumber) => {
    if (!accountNumber) return '';
    return accountNumber.toString();
  };

  const formatDate = (date = new Date()) => {
    return new Intl.DateTimeFormat('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const generateTransactionId = () => {
    return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Transferencia Completada</h1>
                <p className="text-gray-600">Comprobante de transferencia entre cuentas propias</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onNewTransfer}
                className="bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
                </svg>
                <span>Nueva Transferencia</span>
              </button>
              
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                </svg>
                <span>Cerrar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comprobante Principal */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Encabezado del comprobante */}
          <div className="text-center mb-8 pb-6 border-b border-gray-200">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5,6H23V18H5V6M14,9A3,3 0 0,1 17,12A3,3 0 0,1 14,15A3,3 0 0,1 11,12A3,3 0 0,1 14,9M9,8A2,2 0 0,1 7,10V14A2,2 0 0,1 9,16H19A2,2 0 0,1 21,14V10A2,2 0 0,1 19,8H9Z"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">COMPROBANTE DE TRANSFERENCIA</h2>
            <p className="text-gray-600">Transferencia entre cuentas del mismo titular</p>
          </div>

          {/* Información de la transferencia */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Detalles de transacción */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 text-sky-600 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  Detalles de la Transacción
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-sm font-medium text-gray-600 block mb-1">ID de Transacción</label>
                    <p className="text-sm font-mono text-gray-800 bg-white p-2 rounded border">
                      {transferData?.transactionId || generateTransactionId()}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-sm font-medium text-gray-600 block mb-1">Fecha y Hora</label>
                    <p className="text-sm text-gray-800">
                      {formatDate()}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-sm font-medium text-gray-600 block mb-1">Estado</label>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-sky-500 rounded-full"></div>
                      <span className="text-sm font-medium text-sky-700">Completada</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles de cuentas */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 text-sky-600 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"/>
                  </svg>
                  Información de Cuentas
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-sky-50 rounded-lg p-4 border border-sky-200">
                    <label className="text-sm font-medium text-sky-800 block mb-2">Cuenta Origen</label>
                    <p className="text-sm font-mono text-sky-900 bg-white p-2 rounded border">
                      {formatAccountNumber(transferData?.cuentaOrigen)}
                    </p>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4,15V9H12L7.5,4.5L9,3L16,10L9,17L7.5,15.5L12,11H4Z"/>
                      </svg>
                    </div>
                  </div>
                  
                  <div className="bg-sky-50 rounded-lg p-4 border border-sky-200">
                    <label className="text-sm font-medium text-sky-800 block mb-2">Cuenta Destino</label>
                    <p className="text-sm font-mono text-sky-900 bg-white p-2 rounded border">
                      {formatAccountNumber(transferData?.cuentaDestino)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monto transferido */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 mb-8 border border-gray-200">
            <div className="text-center">
              <label className="text-sm font-medium text-gray-600 block mb-2">Monto Transferido</label>
              <p className="text-4xl font-bold text-gray-800 mb-2">
                {formatCurrency(transferData?.monto || 0)}
              </p>
              <p className="text-sm text-gray-600">
                {transferData?.descripcion && (
                  <>
                    <span className="font-medium">Descripción:</span> {transferData.descripcion}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-3">Información Importante</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                </svg>
                <span>Esta transferencia se realizó de forma inmediata entre tus cuentas.</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z"/>
                </svg>
                <span>Los fondos están disponibles inmediatamente en la cuenta destino.</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9,12L11,14L15,10L13.5,8.5L11,11L9.5,9.5M7,2V4H17V2H7M19,4V2C19,0.89 18.1,0 17,0H7C5.89,0 5,0.89 5,2V4H3V6H5V19C5,20.1 5.9,21 7,21H17C18.1,21 19,20.1 19,19V6H21V4H19M17,19H7V6H17V19Z"/>
                </svg>
                <span>Guarda este comprobante para tus registros personales.</span>
              </div>
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H5C3.89,1 3,1.89 3,3V21A2,2 0 0,0 5,23H19A2,2 0 0,0 21,21V9M19,9H14V4H5V21H19V9Z"/>
                </svg>
                <span>No se aplicaron comisiones por ser transferencia entre tus cuentas.</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">
              Este comprobante es válido como constancia de la transferencia realizada
            </p>
            <p className="text-xs text-gray-400">
              Generado el {formatDate()} | Sistema de Transferencias Seguras
            </p>
          </div>
        </div>

        {/* Acciones adicionales */}
        <div className="flex justify-center space-x-4 mt-6">
          <button className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-300 transition-colors flex items-center space-x-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            <span>Imprimir Comprobante</span>
          </button>
          
          <button className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-300 transition-colors flex items-center space-x-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComprobanteInternoCuentas;
