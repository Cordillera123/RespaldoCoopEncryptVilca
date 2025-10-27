import React, { useState } from 'react';

const InternacioTransferWindow = () => {
  const [formData, setFormData] = useState({
    fromAccount: '',
    country: '',
    currency: '',
    bankName: '',
    swiftCode: '',
    accountNumber: '',
    beneficiaryName: '',
    beneficiaryAddress: '',
    amount: '',
    purpose: '',
    email: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(null);

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

  // Países disponibles
  const countries = [
    { code: 'US', name: 'Estados Unidos', currency: 'USD', rate: 1.00 },
    { code: 'CO', name: 'Colombia', currency: 'COP', rate: 0.00025 },
    { code: 'PE', name: 'Perú', currency: 'PEN', rate: 0.27 },
    { code: 'ES', name: 'España', currency: 'EUR', rate: 1.09 },
    { code: 'MX', name: 'México', currency: 'MXN', rate: 0.056 }
  ];

  // Propósitos de transferencia
  const purposes = [
    'Manutención familiar',
    'Estudios',
    'Gastos médicos',
    'Inversión',
    'Compra de bienes',
    'Servicios profesionales',
    'Otros'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Actualizar tasa de cambio cuando se selecciona país
    if (name === 'country') {
      const selectedCountry = countries.find(c => c.code === value);
      if (selectedCountry) {
        setExchangeRate(selectedCountry.rate);
        setFormData(prev => ({
          ...prev,
          currency: selectedCountry.currency
        }));
      }
    }
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
          country: '',
          currency: '',
          bankName: '',
          swiftCode: '',
          accountNumber: '',
          beneficiaryName: '',
          beneficiaryAddress: '',
          amount: '',
          purpose: '',
          email: ''
        });
        setExchangeRate(null);
      }, 3000);
    }, 4000);
  };

  const selectedFromAccount = ownAccounts.find(acc => acc.id === formData.fromAccount);
  const selectedCountry = countries.find(c => c.code === formData.country);

  if (showSuccess) {
    return (
      <div className="p-6 h-full bg-gradient-to-br from-purple-50 to-purple-100 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-purple-200 text-center">
            <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Transferencia Internacional Enviada!</h2>
            <p className="text-gray-600 mb-6">Tu transferencia será procesada en 2-5 días hábiles</p>
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-purple-800">
                <strong>Monto:</strong> ${parseFloat(formData.amount || 0).toFixed(2)} USD
              </p>
              <p className="text-sm text-purple-800">
                <strong>Beneficiario:</strong> {formData.beneficiaryName}
              </p>
              <p className="text-sm text-purple-800">
                <strong>País:</strong> {selectedCountry?.name}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full bg-gradient-to-br from-purple-50 to-purple-100 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-3xl">🌍</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Transferencias Internacionales</h1>
          <p className="text-gray-600 text-lg">Envía dinero al extranjero de forma segura</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-purple-200 overflow-hidden">
          <div className="bg-purple-50 px-6 py-4 border-b border-purple-200">
            <h2 className="text-xl font-bold text-gray-800">Nueva Transferencia Internacional</h2>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Selecciona cuenta de origen</option>
                {ownAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.type} - {account.number} (${account.balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* País de destino */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                País de Destino
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Selecciona el país</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Información del banco */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-800">Información del Banco Destino</h3>
              
              {/* Nombre del banco */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Banco
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder="Nombre completo del banco"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Código SWIFT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código SWIFT/BIC
                </label>
                <input
                  type="text"
                  name="swiftCode"
                  value={formData.swiftCode}
                  onChange={handleInputChange}
                  placeholder="Ej: ABCDUS33XXX"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Información del beneficiario */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-800">Información del Beneficiario</h3>
              
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
                  placeholder="Número de cuenta del beneficiario"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Nombre del beneficiario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo del Beneficiario
                </label>
                <input
                  type="text"
                  name="beneficiaryName"
                  value={formData.beneficiaryName}
                  onChange={handleInputChange}
                  placeholder="Nombre completo tal como aparece en la cuenta"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Dirección del beneficiario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección del Beneficiario
                </label>
                <textarea
                  name="beneficiaryAddress"
                  value={formData.beneficiaryAddress}
                  onChange={handleInputChange}
                  placeholder="Dirección completa del beneficiario"
                  rows="3"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Monto y tasa de cambio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto a Transferir (USD)
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
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              {selectedFromAccount && (
                <p className="text-sm text-gray-500 mt-1">
                  Saldo disponible: ${selectedFromAccount.balance.toLocaleString()}
                </p>
              )}
              {exchangeRate && formData.amount && (
                <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-800">
                    <strong>Tasa de cambio:</strong> 1 USD = {(1/exchangeRate).toFixed(4)} {formData.currency}
                  </p>
                  <p className="text-sm text-purple-800">
                    <strong>El beneficiario recibirá:</strong> {(parseFloat(formData.amount) / exchangeRate).toFixed(2)} {formData.currency}
                  </p>
                </div>
              )}
            </div>

            {/* Propósito de la transferencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Propósito de la Transferencia
              </label>
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Selecciona el propósito</option>
                {purposes.map((purpose, index) => (
                  <option key={index} value={purpose}>
                    {purpose}
                  </option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de Notificación
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="correo@ejemplo.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Aviso importante */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Información Importante</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Las transferencias internacionales pueden tardar de 2 a 5 días hábiles en procesarse. 
                    Se aplicarán las regulaciones de control de cambios vigentes.
                  </p>
                </div>
              </div>
            </div>

            {/* Resumen */}
            {formData.fromAccount && formData.amount && formData.beneficiaryName && selectedCountry && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="font-medium text-gray-800 mb-3">Resumen de la Transferencia</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto a enviar:</span>
                    <span className="font-bold text-purple-600">${parseFloat(formData.amount).toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Comisión:</span>
                    <span className="font-medium">$25.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gastos corresponsal:</span>
                    <span className="font-medium">$15.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA:</span>
                    <span className="font-medium">$4.80</span>
                  </div>
                  <hr className="border-purple-200"/>
                  <div className="flex justify-between">
                    <span className="text-gray-800 font-medium">Total a debitar:</span>
                    <span className="font-bold text-purple-600">${(parseFloat(formData.amount || 0) + 44.80).toFixed(2)} USD</span>
                  </div>
                  {exchangeRate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Beneficiario recibe:</span>
                      <span className="font-bold text-sky-600">{(parseFloat(formData.amount || 0) / exchangeRate).toFixed(2)} {formData.currency}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors"
                onClick={() => {
                  setFormData({
                    fromAccount: '',
                    country: '',
                    currency: '',
                    bankName: '',
                    swiftCode: '',
                    accountNumber: '',
                    beneficiaryName: '',
                    beneficiaryAddress: '',
                    amount: '',
                    purpose: '',
                    email: ''
                  });
                  setExchangeRate(null);
                }}
              >
                Limpiar
              </button>
              <button
                type="button"
                disabled={isProcessing || !formData.fromAccount || !formData.country || !formData.bankName || !formData.swiftCode || !formData.accountNumber || !formData.beneficiaryName || !formData.amount || !formData.purpose}
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
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

export default InternacioTransferWindow;
