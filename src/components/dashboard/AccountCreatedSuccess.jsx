import React from 'react';

const AccountCreatedSuccess = ({ 
  beneficiaryData, 
  onTransferToAccount, 
  onBackToContacts 
}) => {
  // Determinar si es una cuenta interna (CACVIL - Cooperativa Vilcabamba) o externa
  const isInternalAccount = beneficiaryData.bankCode === 'CACVIL' || 
    beneficiaryData.bankCode === '999' ||
    beneficiaryData.bank?.toUpperCase().includes('CACVIL') || 
    beneficiaryData.bank?.toUpperCase().includes('VILCABAMBA') ||
    beneficiaryData.bank?.toUpperCase().includes('COOPERATIVA VILCABAMBA');

  const handleTransfer = () => {
    console.log('🔄 [ACCOUNT-SUCCESS] Iniciando transferencia con datos:', {
      beneficiaryData: beneficiaryData,
      isInternalAccount: isInternalAccount,
      bankCode: beneficiaryData.bankCode,
      bank: beneficiaryData.bank
    });
    
    if (onTransferToAccount) {
      onTransferToAccount(beneficiaryData, isInternalAccount);
    }
  };

  return (
    <div className="p-4 md:p-6 h-full bg-gray-50 overflow-auto">
      <div className="max-w-2xl mx-auto">
        
        {/* Header con icono de éxito */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">¡Cuenta Agregada Exitosamente!</h1>
          <p className="text-slate-600">
            La nueva cuenta bancaria se ha agregado correctamente al beneficiario
          </p>
        </div>

        {/* Información del beneficiario y nueva cuenta */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="p-6">
            {/* Información del beneficiario */}
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-600 mr-4">
                {beneficiaryData.avatar || beneficiaryData.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">{beneficiaryData.name}</h3>
                <p className="text-sm text-gray-500">Cédula: {beneficiaryData.cedula}</p>
                {beneficiaryData.email && (
                  <p className="text-sm text-gray-500">Email: {beneficiaryData.email}</p>
                )}
                {beneficiaryData.phone && (
                  <p className="text-sm text-gray-500">Teléfono: {beneficiaryData.phone}</p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Datos de la nueva cuenta */}
            <div>
              <h4 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
                Nueva Cuenta Agregada
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 mb-1">Institución Financiera</p>
                  <p className="text-gray-800 font-semibold">{beneficiaryData.bank}</p>
                  {isInternalAccount && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      Cuenta Interna
                    </span>
                  )}
                  {!isInternalAccount && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Cuenta Externa
                    </span>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 mb-1">Tipo de Cuenta</p>
                  <p className="text-gray-800 font-semibold">{beneficiaryData.accountType}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                  <p className="text-sm font-medium text-gray-600 mb-1">Número de Cuenta</p>
                  <p className="text-gray-800 font-bold text-lg tracking-wider">{beneficiaryData.accountNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Opciones de acción */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <h4 className="text-base font-semibold text-slate-800 mb-4">¿Qué deseas hacer ahora?</h4>
            
            <div className="space-y-4">
              {/* Botón principal: Transferir a esta cuenta */}
              <button
                onClick={handleTransfer}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-sm hover:shadow-md"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
                <span className="text-lg">
                  Transferir a esta cuenta
                  {isInternalAccount ? ' (Cooperativa CACVIL)' : ' (Transferencia Externa)'}
                </span>
              </button>

              {/* Información adicional sobre el tipo de transferencia */}
              <div className={`p-4 rounded-lg border-l-4 ${
                isInternalAccount 
                  ? 'bg-green-50 border-green-400' 
                  : 'bg-blue-50 border-blue-400'
              }`}>
                <div className="flex items-start">
                  <svg className={`w-5 h-5 mt-0.5 mr-3 ${
                    isInternalAccount ? 'text-green-600' : 'text-blue-600'
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  </svg>
                  <div>
                    <p className={`text-sm font-medium ${
                      isInternalAccount ? 'text-green-800' : 'text-blue-800'
                    }`}>
                      {isInternalAccount 
                        ? 'Transferencia Interna - CACVIL' 
                        : 'Transferencia Externa - Otros Bancos'
                      }
                    </p>
                    <p className={`text-xs mt-1 ${
                      isInternalAccount ? 'text-green-700' : 'text-blue-700'
                    }`}>
                      {isInternalAccount 
                        ? 'Procesamiento inmediato, sin comisiones adicionales'
                        : 'Sujeto a horarios y comisiones del banco destino'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón secundario: Regresar a contactos */}
              <button
                onClick={onBackToContacts}
                className="w-full bg-transparent border-2 border-gray-300 hover:bg-gray-50 text-slate-700 font-medium py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <span>Regresar a Contactos</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer informativo */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            La cuenta ha sido agregada exitosamente y está lista para recibir transferencias
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountCreatedSuccess;