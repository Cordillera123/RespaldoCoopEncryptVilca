import React from 'react';
import { MdAccountBalance, MdSecurity, MdInfo, MdWarning } from 'react-icons/md';
import InvestmentAccountSelector from './InvestmentAccountSelector';
import SecurityQuestionModal from './SecurityQuestionModal';
import InvestmentConfirmationModal from './InvestmentConfirmationModal';

const InvestmentInvestor = ({
  // Datos de simulación (solo lectura)
  simulationData,
  simulationResult,
  
  // Estados para el proceso de inversión
  investmentAccounts,
  accountsLoading,
  accountsError,
  selectedAccount,
  showAccountSelector,
  investmentProcess,
  securityQuestion,
  investmentResult,
  
  // Handlers
  onBack,
  onAccountSelect,
  onRetryAccounts,
  onStartInvestmentProcess,
  onValidateAnswer,
  onFinishInvestmentProcess,
  onCancelInvestmentProcess
}) => {

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const canStartInvestment = () => {
    return (
      selectedAccount &&
      simulationResult &&
      !investmentProcess.isActive
    );
  };

  return (
    <div className="min-h-full bg-blue-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-3 text-gray-500 hover:text-gray-700 transition-colors group"
          >
            <div className="p-2 rounded-full bg-white/10 shadow-sm group-hover:shadow-md transition-all">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
              </svg>
            </div>
            <span className="font-medium">Volver al Simulador</span>
          </button>

          <div className="flex items-center space-x-2">
            <MdSecurity className="text-indigo-600 text-xl" />
            <h1 className="text-xl font-bold text-gray-800">Proceso de Inversión</h1>
          </div>
        </div>

        {/* Resumen de Simulación */}
        {simulationResult && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-300 mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
              <div className="text-center text-white">
                <svg className="w-8 h-8 mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                </svg>
                <h2 className="text-xl font-bold">Resumen de tu Simulación</h2>
                <p className="text-green-100 text-sm">Confirma los detalles antes de proceder</p>
              </div>
            </div>

            <div className="px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-500 font-medium mb-1">Monto a Invertir</p>
                  <p className="font-bold text-xl text-gray-800">
                    {formatCurrency(parseFloat(simulationData.amount) || 0)}
                  </p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-500 font-medium mb-1">Plazo</p>
                  <p className="font-bold text-xl text-gray-800">
                    {simulationData.selectedDays} días
                  </p>
                  <p className="text-xs text-gray-500">
                    ({Math.round(parseInt(simulationData.selectedDays) / 30)} meses aprox.)
                  </p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-500 font-medium mb-1">Tasa de Interés</p>
                  <p className="font-bold text-xl text-gray-800">
                    {simulationResult.rate}% anual
                  </p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-500 font-medium mb-1">Total a Recibir</p>
                  <p className="font-bold text-xl text-green-600">
                    {formatCurrency(simulationResult.total || 0)}
                  </p>
                </div>
              </div>

              {/* Desglose de ganancias */}
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7,10L12,15L17,10H7Z" />
                  </svg>
                  Proyección de ganancias
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Intereses brutos:</span>
                    <span className="font-semibold text-green-800">
                      +{formatCurrency(simulationResult.interes || simulationResult.interest || 0)}
                    </span>
                  </div>
                  {simulationResult.retencion && parseFloat(simulationResult.retencion) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-green-700">Retención:</span>
                      <span className="font-semibold text-red-600">
                        -{formatCurrency(simulationResult.retencion || 0)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-green-700">Ganancia neta:</span>
                    <span className="font-semibold text-green-800">
                      +{formatCurrency(
                        (simulationResult.interes || simulationResult.interest || 0) - 
                        (simulationResult.retencion || 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selector de Cuenta */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-300 mb-8 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-white/5 to-white/10 border-b border-gray-300">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <MdAccountBalance className="text-indigo-600 text-xl mr-2" />
              Seleccionar Cuenta para Débito
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Elige la cuenta desde donde se debitará el monto de la inversión
            </p>
          </div>

          <div className="px-8 py-6">
            <InvestmentAccountSelector
              investmentAccounts={investmentAccounts}
              accountsLoading={accountsLoading}
              accountsError={accountsError}
              selectedAccount={selectedAccount}
              showAccountSelector={showAccountSelector}
              onAccountSelect={onAccountSelect}
              investmentAmount={simulationData.amount}
              onRetry={onRetryAccounts}
            />
          </div>
        </div>

        {/* Botón de Confirmación */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-300 overflow-hidden">
          <div className="px-8 py-6">
            {/* Información importante */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <MdWarning className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Antes de continuar:</p>
                  <ul className="space-y-1 text-xs text-yellow-700">
                    <li>• Verifica que todos los datos sean correctos</li>
                    <li>• Una vez confirmado, el monto será debitado inmediatamente</li>
                    <li>• La inversión no podrá ser cancelada antes del vencimiento</li>
                    <li>• Necesitarás responder una pregunta de seguridad</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Estado del proceso */}
            {investmentProcess.isActive && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-blue-700 font-medium">
                      {investmentProcess.currentPhase === 'security' && 'Validando identidad...'}
                      {investmentProcess.currentPhase === 'processing' && 'Procesando inversión...'}
                      {investmentProcess.currentPhase === 'confirmation' && 'Inversión completada'}
                      {investmentProcess.currentPhase === 'error' && 'Error en el proceso'}
                    </span>
                  </div>

                  {investmentProcess.currentPhase === 'security' && (
                    <button
                      onClick={onCancelInvestmentProcess}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Botón principal */}
            <div className="space-y-4">
              <button
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  canStartInvestment()
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
                disabled={!canStartInvestment()}
                onClick={onStartInvestmentProcess}
              >
                {investmentProcess.isActive ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Procesando...</span>
                  </div>
                ) : selectedAccount ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.41,10.09L6,11.5L11,16.5Z" />
                    </svg>
                    <span>Confirmar e Invertir</span>
                  </div>
                ) : (
                  'Selecciona una cuenta para continuar'
                )}
              </button>

              {!selectedAccount && (
                <p className="text-center text-sm text-gray-500">
                  Para continuar, selecciona la cuenta desde donde se debitará tu inversión
                </p>
              )}
            </div>

            {/* Información de seguridad */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                </svg>
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Proceso seguro</p>
                  <ul className="space-y-1 text-xs text-blue-600">
                    <li>• Tu información está protegida con encriptación bancaria</li>
                    <li>• Validación de identidad mediante pregunta de seguridad</li>
                    <li>• Confirmación inmediata del registro de inversión</li>
                    <li>• Respaldo completo de la transacción</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer informativo */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <MdInfo className="text-gray-400" />
              <span className="font-medium">Proceso de Inversión Real</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-medium">API 2374:</span> Validación de seguridad
              </div>
              <div>
                <span className="font-medium">API 2375:</span> Registro de inversión
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Este proceso registrará una inversión real en el sistema
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Pregunta de Seguridad */}
      <SecurityQuestionModal
        isOpen={investmentProcess.isActive && investmentProcess.currentPhase === 'security'}
        securityQuestion={securityQuestion}
        onValidateAnswer={onValidateAnswer}
        onCancel={onCancelInvestmentProcess}
        investmentData={investmentProcess.data}
      />

      {/* Modal de Confirmación de Inversión */}
      <InvestmentConfirmationModal
        isOpen={investmentProcess.isActive && (
          investmentProcess.currentPhase === 'confirmation' ||
          investmentProcess.currentPhase === 'error'
        )}
        investmentResult={investmentResult}
        onClose={onFinishInvestmentProcess}
      />
    </div>
  );
};

export default InvestmentInvestor;