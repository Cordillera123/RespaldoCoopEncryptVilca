import React from 'react';
import { MdAccountBalance, MdCheckCircle, MdErrorOutline, MdInfo } from 'react-icons/md';

const InvestmentAccountSelector = ({
  investmentAccounts,
  accountsLoading,
  accountsError,
  selectedAccount,
  showAccountSelector,
  onAccountSelect,
  investmentAmount,
  onRetry
}) => {

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (!showAccountSelector && !accountsLoading) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Título de la sección */}
      <div className="flex items-center space-x-2 mb-3">
        <MdAccountBalance className="text-indigo-600 text-xl" />
        <label className="block text-sm font-medium text-gray-700">
          Cuenta a debitar
        </label>
        {investmentAmount && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            Inversión: {formatCurrency(parseFloat(investmentAmount))}
          </span>
        )}
      </div>

      {/* Estado: Cargando */}
      {accountsLoading && (
        <div className="border-2 border-gray-300 rounded-lg p-6 bg-gray-50">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600 text-sm">Verificando cuentas disponibles...</span>
          </div>
        </div>
      )}

      {/* Estado: Error */}
      {accountsError && (
        <div className="border-2 border-red-300 rounded-lg p-4 bg-red-50">
          <div className="flex items-start space-x-3">
            <MdErrorOutline className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error al cargar cuentas</p>
              <p className="text-sm text-red-700 mt-1">{accountsError}</p>
              {onRetry && (
                <button 
                  onClick={() => onRetry()}
                  className="text-sm text-red-800 underline hover:no-underline mt-2 font-medium"
                >
                  Intentar nuevamente
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Estado: Sin cuentas disponibles */}
      {!accountsLoading && !accountsError && investmentAccounts.length === 0 && showAccountSelector && (
        <div className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">
          <div className="flex items-start space-x-3">
            <MdInfo className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Sin cuentas disponibles</p>
              <p className="text-sm text-yellow-700 mt-1">
                No tienes cuentas con fondos suficientes para esta inversión de {formatCurrency(parseFloat(investmentAmount) || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estado: Cuentas disponibles */}
      {!accountsLoading && !accountsError && investmentAccounts.length > 0 && (
        <div className="space-y-3">
          {/* Lista de cuentas */}
          {investmentAccounts.map((account) => (
            <label
              key={account.id}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedAccount === account.codigo
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50'
              }`}
            >
              {/* Input radio oculto */}
              <input
                type="radio"
                name="investmentAccount"
                value={account.codigo}
                checked={selectedAccount === account.codigo}
                onChange={(e) => onAccountSelect && onAccountSelect(e.target.value)}
                className="sr-only"
              />
              
              <div className="flex items-center justify-between w-full">
                {/* Información de la cuenta */}
                <div className="flex items-center space-x-3">
                  {/* Radio button personalizado */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedAccount === account.codigo
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedAccount === account.codigo && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                      </svg>
                    )}
                  </div>
                  
                  {/* Icono de cuenta */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedAccount === account.codigo
                      ? 'bg-indigo-100'
                      : 'bg-gray-100'
                  }`}>
                    <MdAccountBalance className={`text-lg ${
                      selectedAccount === account.codigo
                        ? 'text-indigo-600'
                        : 'text-gray-500'
                    }`} />
                  </div>
                  
                  {/* Datos de la cuenta */}
                  <div>
                    <p className={`font-medium ${
                      selectedAccount === account.codigo
                        ? 'text-indigo-800'
                        : 'text-gray-800'
                    }`}>
                      {account.tipoProducto}
                    </p>
                    <p className="text-sm text-gray-500 font-mono">
                      Nro. {account.numeroFormateado}
                    </p>
                  </div>
                </div>
                
                {/* Estado y selección */}
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    account.estado === 'ACTIVA' 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}>
                    {account.estado}
                  </span>
                  
                  {selectedAccount === account.codigo && (
                    <MdCheckCircle className="text-indigo-500 text-lg" />
                  )}
                </div>
              </div>
            </label>
          ))}
          
          {/* Información adicional */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <MdInfo className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-2">Información importante:</p>
                <ul className="space-y-1 text-xs">
                  <li className="flex items-start space-x-1">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Solo se muestran cuentas con fondos suficientes para la inversión</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>El débito se realizará al momento de confirmar la inversión</span>
                  </li>
                  <li className="flex items-start space-x-1">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>Los fondos quedarán comprometidos hasta el vencimiento</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Resumen de selección */}
          {selectedAccount && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <MdCheckCircle className="text-green-600 text-lg" />
                <div className="text-sm">
                  <span className="text-green-700">Cuenta seleccionada:</span>
                  <span className="font-medium text-green-800 ml-2">
                    {investmentAccounts.find(acc => acc.codigo === selectedAccount)?.tipoProducto}
                  </span>
                  <span className="text-green-600 font-mono text-xs ml-2">
                    ({investmentAccounts.find(acc => acc.codigo === selectedAccount)?.numeroFormateado})
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvestmentAccountSelector;