import React, { useState } from 'react';

const ExternaTransferWindow = () => {
  const [formData, setFormData] = useState({
    fromAccount: '',
    bankCode: '',
    accountNumber: '',
    accountType: '',
    beneficiaryName: '',
    beneficiaryDocument: '',
    amount: '',
    description: '',
    email: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Cuentas propias
  const ownAccounts = [
    {
      id: '220102001460',
      type: 'Cuenta de Ahorro Tradicional',
      balance: 15250.80,
      number: '**** 1460'
    },
    {
      id: '220102001461',
      type: 'Ahorro Programado',
      balance: 8500.00,
      number: '**** 1461'
    }
  ];

  // Bancos disponibles
  const banks = [
    { code: '001', name: 'Banco Central del Ecuador' },
    { code: '002', name: 'Banco del Pacífico' },
    { code: '003', name: 'Banco de Guayaquil' },
    { code: '004', name: 'Banco del Pichincha' },
    { code: '005', name: 'Banco Internacional' },
    { code: '006', name: 'Produbanco' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setFormData({
          fromAccount: '',
          bankCode: '',
          accountNumber: '',
          accountType: '',
          beneficiaryName: '',
          beneficiaryDocument: '',
          amount: '',
          description: '',
          email: ''
        });
      }, 3000);
    }, 3000);
  };

  const selectedFromAccount = ownAccounts.find(acc => acc.id === formData.fromAccount);
  const selectedBank = banks.find(bank => bank.code === formData.bankCode);

  if (showSuccess) {
    return (
      <div className="p-6 h-full bg-gradient-to-br from-blue-50 to-blue-100 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-sky-200 text-center">
            <div className="w-20 h-20 bg-sky-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Transferencia Externa Enviada!</h2>
            <p className="text-gray-600 mb-6">Tu transferencia será procesada en las próximas 24 horas</p>
            <div className="bg-sky-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-sky-800">
                <strong>Monto:</strong> ${parseFloat(formData.amount || 0).toFixed(2)}
              </p>
              <p className="text-sm text-sky-800">
                <strong>Beneficiario:</strong> {formData.beneficiaryName}
              </p>
              <p className="text-sm text-sky-800">
                <strong>Banco:</strong> {selectedBank?.name}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full bg-gradient-to-br from-blue-50 to-blue-100 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-3xl">🏛️</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Transferencias Externas</h1>
          <p className="text-gray-600 text-lg">Transfiere dinero a otros bancos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-sky-200 overflow-hidden">
          <div className="bg-sky-50 px-6 py-4 border-b border-sky-200">
            <h2 className="text-xl font-bold text-gray-800">Nueva Transferencia Externa</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Cuenta Origen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cuenta de Origen
              </label>
              <select
                name="fromAccount"
                value={formData.fromAccount}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecciona cuenta de origen</option>
                {ownAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.type} - {account.number} (${account.balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Información del Destinatario */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-800">Información del Destinatario</h3>
              
              {/* Banco */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banco Destino
                </label>
                <select
                  name="bankCode"
                  value={formData.bankCode}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecciona el banco</option>
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Número de cuenta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Cuenta
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="Ingresa el número de cuenta"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Tipo de cuenta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Cuenta
                </label>
                <select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecciona tipo de cuenta</option>
                  <option value="AHORRO">Cuenta de Ahorro</option>
                  <option value="CORRIENTE">Cuenta Corriente</option>
                </select>
              </div>

              {/* Nombre del beneficiario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Beneficiario
                </label>
                <input
                  type="text"
                  name="beneficiaryName"
                  value={formData.beneficiaryName}
                  onChange={handleInputChange}
                  placeholder="Nombre completo del beneficiario"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Cédula del beneficiario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cédula del Beneficiario
                </label>
                <input
                  type="text"
                  name="beneficiaryDocument"
                  value={formData.beneficiaryDocument}
                  onChange={handleInputChange}
                  placeholder="Número de cédula"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto a Transferir
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  max={selectedFromAccount?.balance || 999999}
                  required
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {selectedFromAccount && (
                <p className="text-sm text-gray-500 mt-1">
                  Saldo disponible: ${selectedFromAccount.balance.toLocaleString()}
                </p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Concepto de la transferencia..."
                rows="3"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Email de notificación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de Notificación (Opcional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="correo@ejemplo.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Resumen */}
            {formData.fromAccount && formData.amount && formData.beneficiaryName && (
              <div className="bg-sky-50 rounded-lg p-4 border border-sky-200">
                <h3 className="font-medium text-gray-800 mb-3">Resumen de la Transferencia</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto:</span>
                    <span className="font-bold text-sky-600">${parseFloat(formData.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Comisión:</span>
                    <span className="font-medium">$2.50</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA:</span>
                    <span className="font-medium">$0.30</span>
                  </div>
                  <hr className="border-sky-200"/>
                  <div className="flex justify-between">
                    <span className="text-gray-800 font-medium">Total a debitar:</span>
                    <span className="font-bold text-sky-600">${(parseFloat(formData.amount || 0) + 2.80).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors"
                onClick={() => setFormData({
                  fromAccount: '',
                  bankCode: '',
                  accountNumber: '',
                  accountType: '',
                  beneficiaryName: '',
                  beneficiaryDocument: '',
                  amount: '',
                  description: '',
                  email: ''
                })}
              >
                Limpiar
              </button>
              <button
                type="button"
                disabled={isProcessing || !formData.fromAccount || !formData.bankCode || !formData.accountNumber || !formData.beneficiaryName || !formData.amount}
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  'Enviar Transferencia'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExternaTransferWindow;
