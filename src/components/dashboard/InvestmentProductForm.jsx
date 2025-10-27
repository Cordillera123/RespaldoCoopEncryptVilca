import React, { useMemo } from 'react';
import { MdTrendingUp, MdCalculate } from 'react-icons/md';
import { useInvestment } from '../../hooks/useInvestment';

// Componentes separados importados desde barrel export
import {
  InvestmentDetail,
  InvestmentCalculator, // Mantenemos temporalmente
  InvestmentSimulator,
  InvestmentInvestor,
  LoadingSpinner,
  ErrorMessage,
  InvestmentSummaryStats,
  InvestmentGrid,
  InvestmentTypesSection,
  Pagination
} from './investment';

const InvestmentProductForm = () => {
  // Usar el hook personalizado
  const {
    // Estados principales
    investments,
    loading,
    error,
    selectedInvestment,
    showDetail,
    showCalculator, // Mantener temporalmente para compatibilidad
    
    // NUEVOS: Estados de navegación
    showSimulator,
    showInvestor,
    
    // Estados de tipos
    investmentTypes,
    typesLoading,
    showInvestmentTypes,
    typesError,
    
    // Estados de calculadora
    plazos,
    plazosLoading,
    calculatorData,
    
    // Estados de parámetros
    investmentParams,
    paramsLoading,
    paymentTypes,
    paymentTypesLoading,
    selectedPaymentType,
    amountValidation,
    periodValidation,
    calculationLoading,
    
    // Estados de paginación
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    currentInvestments,
    
    // Estados de detalle
    investmentDetail,
    detailLoading,
    dateFilters,
    searchFilter,
    
    // Estados de cuentas de inversión
    investmentAccounts,
    accountsLoading,
    accountsError,
    selectedAccount,
    showAccountSelector,
    
    // Estados de proceso de inversión
    investmentProcess,
    securityQuestion,
    investmentResult,
    
    // Setters
    setSearchFilter,
    setCalculatorData,
    setSelectedPaymentType,
    setPaymentTypes,
    
    // Funciones
    loadInvestmentTypes,
    loadInvestmentTerms,
    calculateInvestment,
    validateInvestmentParameters,
    loadInvestmentDetail,
    loadInvestmentAccounts,
    
    // Handlers existentes
    handleInvestmentClick,
    handleRetry,
    handlePageChange,
    handleBackToList,
    handleBackToMain,
    handleAccountSelect,
    
    // NUEVOS: Handlers de navegación
    handleProceedToInvest,
    handleBackToSimulator,
    handleStartSimulator,
    
    // Funciones de proceso de inversión
    handleStartInvestmentProcess,
    validateSecurityAnswer,
    finishInvestmentProcess,
    cancelInvestmentProcess
  } = useInvestment();

  // ✅ PROPS MEMOIZADAS PARA EVITAR RE-RENDERS

  // Props para detalle de inversión
  const investmentDetailProps = useMemo(() => ({
    selectedInvestment,
    investmentDetail,
    detailLoading,
    dateFilters,
    searchFilter,
    setSearchFilter,
    onBack: handleBackToList,
    loadInvestmentDetail
  }), [
    selectedInvestment,
    investmentDetail,
    detailLoading,
    dateFilters,
    searchFilter,
    handleBackToList,
    loadInvestmentDetail
  ]);

  // Props para el simulador
  const simulatorProps = useMemo(() => ({
    calculatorData,
    setCalculatorData,
    plazos,
    paymentTypes,
    paymentTypesLoading,
    selectedPaymentType,
    setSelectedPaymentType,
    amountValidation,
    periodValidation,
    investmentParams,
    paramsLoading,
    calculateInvestment,
    validateInvestmentParameters,
    onBack: handleBackToMain,
    setPaymentTypes,
    calculationLoading,
    onProceedToInvest: handleProceedToInvest
  }), [
    calculatorData,
    setCalculatorData,
    plazos,
    paymentTypes,
    paymentTypesLoading,
    selectedPaymentType,
    setSelectedPaymentType,
    amountValidation,
    periodValidation,
    investmentParams,
    paramsLoading,
    calculateInvestment,
    validateInvestmentParameters,
    handleBackToMain,
    setPaymentTypes,
    calculationLoading,
    handleProceedToInvest
  ]);

  // Props para el proceso de inversión
  const investorProps = useMemo(() => ({
    // Datos de la simulación (solo lectura)
    simulationData: calculatorData,
    simulationResult: calculatorData.result,
    
    // Estados para el proceso
    investmentAccounts,
    accountsLoading,
    accountsError,
    selectedAccount,
    showAccountSelector,
    investmentProcess,
    securityQuestion,
    investmentResult,
    
    // Handlers
    onBack: handleBackToSimulator,
    onAccountSelect: handleAccountSelect,
    onRetryAccounts: () => loadInvestmentAccounts(calculatorData.amount),
    onStartInvestmentProcess: handleStartInvestmentProcess,
    onValidateAnswer: validateSecurityAnswer,
    onFinishInvestmentProcess: finishInvestmentProcess,
    onCancelInvestmentProcess: cancelInvestmentProcess
  }), [
    calculatorData,
    investmentAccounts,
    accountsLoading,
    accountsError,
    selectedAccount,
    showAccountSelector,
    investmentProcess,
    securityQuestion,
    investmentResult,
    handleBackToSimulator,
    handleAccountSelect,
    loadInvestmentAccounts,
    handleStartInvestmentProcess,
    validateSecurityAnswer,
    finishInvestmentProcess,
    cancelInvestmentProcess
  ]);

  // Props para el grid de inversiones
  const investmentGridProps = useMemo(() => ({
    currentInvestments,
    handleInvestmentClick
  }), [currentInvestments, handleInvestmentClick]);

  // Props para tipos de inversión
  const typesProps = useMemo(() => ({
    investmentTypes,
    typesLoading,
    showInvestmentTypes,
    typesError,
    loadInvestmentTypes,
    loadInvestmentTerms,
    plazosLoading
  }), [
    investmentTypes,
    typesLoading,
    showInvestmentTypes,
    typesError,
    loadInvestmentTypes,
    loadInvestmentTerms,
    plazosLoading
  ]);

  // Props para calculadora (compatibilidad temporal)
  const calculatorProps = useMemo(() => ({
    calculatorData,
    setCalculatorData,
    plazos,
    paymentTypes,
    paymentTypesLoading,
    selectedPaymentType,
    setSelectedPaymentType,
    amountValidation,
    periodValidation,
    investmentParams,
    paramsLoading,
    calculateInvestment,
    validateInvestmentParameters,
    onBack: handleBackToMain,
    setPaymentTypes,
    calculationLoading,
    investmentAccounts,
    accountsLoading,
    accountsError,
    selectedAccount,
    showAccountSelector,
    onAccountSelect: handleAccountSelect,
    onRetryAccounts: () => loadInvestmentAccounts(calculatorData.amount),
    investmentProcess,
    securityQuestion,
    investmentResult,
    onStartInvestmentProcess: handleStartInvestmentProcess,
    onValidateAnswer: validateSecurityAnswer,
    onFinishInvestmentProcess: finishInvestmentProcess,
    onCancelInvestmentProcess: cancelInvestmentProcess
  }), [
    calculatorData,
    setCalculatorData,
    plazos,
    paymentTypes,
    paymentTypesLoading,
    selectedPaymentType,
    setSelectedPaymentType,
    amountValidation,
    periodValidation,
    investmentParams,
    paramsLoading,
    calculateInvestment,
    validateInvestmentParameters,
    handleBackToMain,
    setPaymentTypes,
    calculationLoading,
    investmentAccounts,
    accountsLoading,
    accountsError,
    selectedAccount,
    showAccountSelector,
    handleAccountSelect,
    loadInvestmentAccounts,
    investmentProcess,
    securityQuestion,
    investmentResult,
    handleStartInvestmentProcess,
    validateSecurityAnswer,
    finishInvestmentProcess,
    cancelInvestmentProcess
  ]);

  // ===== RENDERIZADO CONDICIONAL =====

  // Vista de detalle de inversión
  if (showDetail && selectedInvestment) {
    return <InvestmentDetail {...investmentDetailProps} />;
  }

  // Vista del simulador
  if (showSimulator) {
    return <InvestmentSimulator {...simulatorProps} />;
  }

  // Vista del proceso de inversión
  if (showInvestor) {
    return <InvestmentInvestor {...investorProps} />;
  }

  // Mantener compatibilidad con calculadora actual (TEMPORAL)
  if (showCalculator) {
    return <InvestmentCalculator {...calculatorProps} />;
  }

  // Vista principal (lista de inversiones)
  return (
    <div className="min-h-full bg-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">📈</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3"> Mis Inversiones</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {loading ? 'Cargando tus inversiones...' : 
             error ? 'Hubo un problema al cargar las inversiones' :
             investments.length > 0 ? 'Selecciona una inversión para ver su detalle y rendimientos' :
             'No tienes inversiones registradas en este momento'}
          </p>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={handleRetry} />
        ) : investments.length === 0 ? (
          // Vista cuando no hay inversiones
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <MdTrendingUp className="text-gray-400 text-4xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No tienes inversiones</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Comienza a hacer crecer tu dinero con nuestras opciones de inversión
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={handleStartSimulator}
                disabled={plazosLoading}
                className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                <MdCalculate className="text-lg" />
                <span>{plazosLoading ? 'Cargando...' : 'Simulador de Inversión'}</span>
              </button>
              <button 
                onClick={loadInvestmentTypes}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
              >
                {typesLoading ? 'Cargando...' : 'Explorar Opciones de Inversión'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <InvestmentSummaryStats investments={investments} />
            
            <InvestmentGrid {...investmentGridProps} />

            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={investments.length}
              investmentsPerPage={4}
            />
          </>
        )}

        <InvestmentTypesSection {...typesProps} />
      </div>
    </div>
  );
};

export default InvestmentProductForm;