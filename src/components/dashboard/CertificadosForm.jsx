import React, { useState, useEffect } from 'react';
import { 
  MdArrowBack, 
  MdDescription, 
  MdCheckCircle, 
  MdWarning, 
  MdDownload, 
  MdEmail,
  MdPictureAsPdf 
} from 'react-icons/md';

// Componente principal del formulario de certificados
const CertificadosForm = () => {
  const [activeTab, setActiveTab] = useState('consolidado');
  const [currentView, setCurrentView] = useState('form'); // 'form' | 'confirmation'
  const [formData, setFormData] = useState({
    // Datos del consolidado
    consolidado: {
      tipoVisualizacion: 'saldo', // 'saldo' | 'cifras'
      conoceTipos: false,
      metodoPago: 'cuenta',
      cuentaPago: '0010000903111',
      saldoPago: '50.00'
    },
    // Datos de cuentas específicas
    cuentas: {
      tipoVisualizacion: 'saldo',
      conoceTipos: false,
      cuentaSeleccionada: '0010000903111',
      metodoPago: 'cuenta',
      cuentaPago: '0010000903111',
      saldoPago: '50.00'
    }
  });

  const [userInfo, setUserInfo] = useState({
    nombre: 'Alejandro Fernando Morales',
    email: 'alejandro@hotmail.com'
  });

  // Datos mock de cuentas del usuario
  const cuentasDisponibles = [
    { numero: '0010000903111', tipo: 'Cuenta De Ahorros Nacional', saldo: '1,245.50' },
    { numero: '0010000903112', tipo: 'Cuenta Corriente', saldo: '2,850.75' },
    { numero: '0010000903113', tipo: 'Cuenta De Ahorros Premium', saldo: '5,120.00' }
  ];

  const handleInputChange = (tab, field, value) => {
    setFormData(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [field]: value
      }
    }));
  };

  const handleContinue = () => {
    setCurrentView('confirmation');
  };

  const handleBack = () => {
    setCurrentView('form');
  };

  const handleConfirm = () => {
    // Aquí iría la lógica para procesar el certificado
    alert('Certificado solicitado exitosamente. Se enviará a su correo electrónico.');
    setCurrentView('form');
  };

  const handleCancel = () => {
    setCurrentView('form');
  };

  // Vista de confirmación para consolidado
  const ConsolidadoConfirmation = () => (
    <div className="min-h-full bg-blue-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Certificado Bancario</h1>
            <p className="text-emerald-100">Confirmar detalles del certificado</p>
          </div>

          <div className="p-8">
            {/* Información del costo */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
              <MdWarning className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-blue-800">
                Este documento tiene un costo de <strong>$2.59</strong> incluido IVA.
              </p>
            </div>

            <div className="space-y-6">
              {/* Detalles del certificado */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles del certificado</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-sm text-gray-600">Tipo</label>
                    <p className="font-semibold text-gray-800">Consolidado</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-sm text-gray-600">Visualización</label>
                    <p className="font-semibold text-gray-800">
                      {formData.consolidado.tipoVisualizacion === 'saldo' ? 'En saldo' : 'En cifras'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-sm text-gray-600">Costo</label>
                    <p className="font-semibold text-gray-800">$2.59</p>
                  </div>
                </div>
              </div>

              {/* Información de pago */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de pago</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">{userInfo.nombre}</p>
                  <p className="font-semibold text-gray-800">
                    Cuenta De Ahorros Nacional Nro. {formData.consolidado.cuentaPago}
                  </p>
                </div>
              </div>

              {/* Información de envío */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                <MdEmail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-800">
                    El documento se enviará al correo electrónico:
                  </p>
                  <p className="font-semibold text-blue-900">{userInfo.email}</p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handleCancel}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Vista de confirmación para cuentas
  const CuentasConfirmation = () => (
    <div className="min-h-full bg-blue-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Certificado Bancario</h1>
            <p className="text-emerald-100">Confirmar detalles del certificado</p>
          </div>

          <div className="p-8">
            {/* Información del costo */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
              <MdWarning className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-blue-800">
                Este documento tiene un costo de <strong>$2.59</strong> incluido IVA.
              </p>
            </div>

            <div className="space-y-6">
              {/* Detalles del certificado */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles del certificado</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-sm text-gray-600">Tipo</label>
                    <p className="font-semibold text-gray-800">Cuentas o Tarjetas</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-sm text-gray-600">Visualización</label>
                    <p className="font-semibold text-gray-800">
                      {formData.cuentas.tipoVisualizacion === 'saldo' ? 'En saldo' : 'En cifras'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <label className="text-sm text-gray-600">Cuenta seleccionada</label>
                  <p className="font-semibold text-gray-800">
                    Cuenta De Ahorros Nacional Nro. {formData.cuentas.cuentaSeleccionada}
                  </p>
                </div>
              </div>

              {/* Información de pago */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de pago</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">{userInfo.nombre}</p>
                  <p className="font-semibold text-gray-800">
                    Cuenta De Ahorros Nacional Nro. {formData.cuentas.cuentaPago}
                  </p>
                </div>
              </div>

              {/* Información de envío */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                <MdEmail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-800">
                    El documento se enviará al correo electrónico:
                  </p>
                  <p className="font-semibold text-blue-900">{userInfo.email}</p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handleCancel}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Vista del formulario principal
  const FormView = () => (
    <div className="min-h-full bg-blue-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <MdDescription className="text-white text-3xl" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Certificados Bancarios</h1>
          <p className="text-lg text-gray-600">
            Solicita tus certificados bancarios de forma rápida y segura
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Pestañas */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('consolidado')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'consolidado'
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Consolidado
              </button>
              <button
                onClick={() => setActiveTab('cuentas')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'cuentas'
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Cuentas o Tarjetas
              </button>
            </nav>
          </div>

          <div className="p-8">
            {/* Información del costo */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start space-x-3">
              <MdWarning className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-blue-800">
                Este documento tiene un costo de <strong>$2.59</strong> incluido IVA.
              </p>
            </div>

            {/* Contenido del consolidado */}
            {activeTab === 'consolidado' && (
              <div className="space-y-8">
                {/* Información del certificado */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">Información del certificado</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Tipo de visualización
                      </label>
                      <div className="flex space-x-6">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="saldo"
                            checked={formData.consolidado.tipoVisualizacion === 'saldo'}
                            onChange={(e) => handleInputChange('consolidado', 'tipoVisualizacion', e.target.value)}
                            className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                          />
                          <span className="ml-2 text-gray-700">En saldo</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="cifras"
                            checked={formData.consolidado.tipoVisualizacion === 'cifras'}
                            onChange={(e) => handleInputChange('consolidado', 'tipoVisualizacion', e.target.value)}
                            className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                          />
                          <span className="ml-2 text-gray-700">En cifras</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.consolidado.conoceTipos}
                          onChange={(e) => handleInputChange('consolidado', 'conoceTipos', e.target.checked)}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Conoce sobre los tipos de visualización
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Información de pago */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">Información de pago</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Método de pago
                      </label>
                      <select
                        value={formData.consolidado.metodoPago}
                        onChange={(e) => handleInputChange('consolidado', 'metodoPago', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="cuenta">Cuenta De Ahorros Nacional</option>
                        <option value="tarjeta">Tarjeta de Crédito</option>
                      </select>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Cuenta seleccionada</p>
                      <p className="font-semibold text-gray-800">
                        Cuenta De Ahorros Nacional Nro. {formData.consolidado.cuentaPago} | Saldo {formData.consolidado.saldoPago}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contenido de cuentas */}
            {activeTab === 'cuentas' && (
              <div className="space-y-8">
                {/* Información del certificado */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">Información del certificado</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Tipo de visualización
                      </label>
                      <div className="flex space-x-6">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="saldo"
                            checked={formData.cuentas.tipoVisualizacion === 'saldo'}
                            onChange={(e) => handleInputChange('cuentas', 'tipoVisualizacion', e.target.value)}
                            className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                          />
                          <span className="ml-2 text-gray-700">En saldo</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="cifras"
                            checked={formData.cuentas.tipoVisualizacion === 'cifras'}
                            onChange={(e) => handleInputChange('cuentas', 'tipoVisualizacion', e.target.value)}
                            className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                          />
                          <span className="ml-2 text-gray-700">En cifras</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.cuentas.conoceTipos}
                          onChange={(e) => handleInputChange('cuentas', 'conoceTipos', e.target.checked)}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Conoce sobre los tipos de visualización
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seleccione la Cuenta o Tarjeta
                      </label>
                      <select
                        value={formData.cuentas.cuentaSeleccionada}
                        onChange={(e) => handleInputChange('cuentas', 'cuentaSeleccionada', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        {cuentasDisponibles.map((cuenta) => (
                          <option key={cuenta.numero} value={cuenta.numero}>
                            {cuenta.tipo} Nro. {cuenta.numero}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Información de pago */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">Información de pago</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Método de pago
                      </label>
                      <select
                        value={formData.cuentas.metodoPago}
                        onChange={(e) => handleInputChange('cuentas', 'metodoPago', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="cuenta">Cuenta De Ahorros Nacional</option>
                        <option value="tarjeta">Tarjeta de Crédito</option>
                      </select>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Cuenta seleccionada para pago</p>
                      <p className="font-semibold text-gray-800">
                        Cuenta De Ahorros Nacional Nro. {formData.cuentas.cuentaPago} | Saldo {formData.cuentas.saldoPago}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botón continuar */}
            <div className="flex justify-end mt-8">
              <button
                onClick={handleContinue}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizado principal
  if (currentView === 'confirmation') {
    return activeTab === 'consolidado' ? <ConsolidadoConfirmation /> : <CuentasConfirmation />;
  }

  return <FormView />;
};

export default CertificadosForm;