import React, { useState } from 'react';
import { MdCalculate, MdAttachMoney, MdDateRange, MdInfo, MdWarning } from 'react-icons/md';

const InvestmentSimulator = ({
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
  onBack,
  setPaymentTypes,
  calculationLoading,
  onProceedToInvest
}) => {

  // Estado para el input personalizado de días
  const [customDaysInput, setCustomDaysInput] = useState('');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatAmountInput = (value) => {
    const cleanValue = value.replace(/[^\d.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleanValue;
  };

  const handleAmountChange = (value) => {
    const formattedValue = formatAmountInput(value);
    handleCalculatorChange('amount', formattedValue);
  };

  const handleCalculatorChange = (field, value) => {
    if (field === 'selectedDays') {
      if (value === '9999') {
        // Activar modo de input personalizado
        console.log('🔧 [CUSTOM-DAYS] Activando modo personalizado');
        setCalculatorData(prev => ({
          ...prev,
          selectedDays: '9999',
          selectedDaysLabel: '',
          result: null
        }));
        // NO limpiar customDaysInput aquí para mantener lo que el usuario ya escribió
      } else {
        // Selección de plazo predefinido
        const selectedPlazo = plazos.find(p => p.dias.toString() === value);
        console.log('📅 [DAYS] Seleccionando plazo predefinido:', value);
        setCalculatorData(prev => ({
          ...prev,
          selectedDays: value,
          selectedDaysLabel: selectedPlazo ? `${selectedPlazo.dias} días` : '',
          result: null
        }));
        
        // Limpiar el input personalizado cuando se selecciona un plazo predefinido
        setCustomDaysInput('');
      }
    } else {
      setCalculatorData(prev => ({
        ...prev,
        [field]: value,
        result: null
      }));
    }
  };

  // Función para manejar el input personalizado de días
  const handleCustomDaysChange = (value) => {
    // Solo permitir números
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // SOLO actualizar el estado local del input - NO tocar calculatorData hasta que termine de escribir
    setCustomDaysInput(numericValue);
    
    console.log('📝 [CUSTOM-DAYS] Usuario escribiendo:', numericValue);
    
    // NO actualizar calculatorData aquí para evitar efectos no deseados
    // Solo mantener el selectedDays en '9999' para que el input siga visible
  };

  // Función para confirmar la entrada de días personalizados
  const confirmCustomDays = () => {
    if (customDaysInput && parseInt(customDaysInput) >= 31) {
      console.log('✅ [CUSTOM-DAYS] Confirmando plazo personalizado:', customDaysInput);
      setCalculatorData(prev => ({
        ...prev,
        selectedDays: customDaysInput,
        selectedDaysLabel: `${customDaysInput} días`,
        result: null
      }));
    }
  };

  // Función para manejar cuando el input pierde el foco
  const handleCustomDaysBlur = () => {
    console.log('👁️ [CUSTOM-DAYS] Input perdió foco, valor actual:', customDaysInput);
    if (customDaysInput && parseInt(customDaysInput) >= 31) {
      confirmCustomDays();
    }
  };

  // Función para manejar Enter en el input personalizado
  const handleCustomDaysKeyPress = (e) => {
    if (e.key === 'Enter' && customDaysInput && parseInt(customDaysInput) >= 31) {
      console.log('⌨️ [CUSTOM-DAYS] Enter presionado, confirmando:', customDaysInput);
      confirmCustomDays();
    }
  };

  const handleCloseCalculator = () => {
    if (onBack) {
      onBack();
    }
  };

  const handleClearCalculator = () => {
    console.log('🧹 [CLEAR] Limpiando calculadora');
    setCalculatorData({
      amount: '',
      selectedDays: '',
      selectedDaysLabel: '',
      interestRate: investmentParams?.tasaMinima || null,
      result: null
    });
    setPaymentTypes([]);
    setSelectedPaymentType('2');
    setCustomDaysInput(''); // Limpiar también el input personalizado
  };

  // Verificar si el botón calcular debe estar habilitado
  const canCalculate = () => {
    const isCustomMode = calculatorData.selectedDays === '9999';
    const hasValidDays = isCustomMode 
      ? (customDaysInput && parseInt(customDaysInput) >= 31) 
      : (calculatorData.selectedDays && parseInt(calculatorData.selectedDays) >= 31);
    
    return (
      calculatorData.amount &&
      parseFloat(calculatorData.amount) > 0 &&
      hasValidDays &&
      selectedPaymentType &&
      amountValidation.isValid &&
      periodValidation.isValid &&
      investmentParams &&
      !calculationLoading
    );
  };

  // Verificar si se puede proceder a invertir
  const canProceedToInvest = () => {
    return calculatorData.result && !calculationLoading;
  };

  return (
    <div className="min-h-full bg-blue-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleCloseCalculator}
            className="flex items-center space-x-3 text-gray-500 hover:text-gray-700 transition-colors group"
          >
            <div className="p-2 rounded-full bg-white/10 shadow-sm group-hover:shadow-md transition-all">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
              </svg>
            </div>
            <span className="font-medium">Volver a Inversiones</span>
          </button>

          <div className="flex items-center space-x-2">
            <MdCalculate className="text-indigo-600 text-xl" />
            <h1 className="text-xl font-bold text-gray-800">Simulador de Inversión</h1>
          </div>
        </div>

        {/* Estado de carga de parámetros */}
        {paramsLoading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-700 text-sm font-medium">
                Cargando parámetros de inversión...
              </span>
            </div>
          </div>
        )}

        {/* Simulator Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-300 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
            <div className="text-center text-white">
              <MdAttachMoney className="text-4xl mx-auto mb-2" />
              <h2 className="text-2xl font-bold">Simula tu Inversión</h2>
              <p className="text-green-100">Calcula rendimientos con datos reales del sistema</p>
            </div>
          </div>

          <div className="px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Formulario de Entrada */}
              <div className="space-y-6">
                {/* Monto a Invertir */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿Cuánto deseas invertir?
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl font-semibold">$</span>
                    <input
                      type="text"
                      value={calculatorData.amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="2500.00"
                      className={`w-full pl-10 pr-4 py-4 text-xl font-semibold border-2 rounded-lg focus:outline-none transition-colors ${!amountValidation.isValid
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-300 focus:border-indigo-500'
                        }`}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && canCalculate()) {
                          calculateInvestment();
                        }
                      }}
                    />
                    {calculatorData.amount && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="text-xs text-gray-400">USD</span>
                      </div>
                    )}
                  </div>

                  {/* Preview del monto */}
                  {calculatorData.amount && parseFloat(calculatorData.amount) > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Monto: {formatCurrency(parseFloat(calculatorData.amount))}
                    </div>
                  )}

                  {/* Mensaje de validación */}
                  {!amountValidation.isValid && (
                    <div className="mt-2 flex items-start space-x-2">
                      <MdWarning className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-red-600">{amountValidation.message}</span>
                    </div>
                  )}

                  {/* Mostrar límites de parámetros */}
                  {investmentParams && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border">
                      <span className="font-medium">Rango permitido:</span> ${investmentParams.montoMinimo.toLocaleString()} - ${investmentParams.montoMaximo.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Plazo de Inversión */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ¿A cuántos días deseas tu inversión?
                  </label>

                  {/* Grid de plazos predefinidos */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {plazos.filter(plazo => plazo.dias !== 9999).map((plazo) => (
                      <button
                        key={plazo.cod}
                        onClick={() => handleCalculatorChange('selectedDays', plazo.dias.toString())}
                        className={`py-3 px-4 rounded-lg font-medium text-center transition-all transform hover:scale-105 ${calculatorData.selectedDays === plazo.dias.toString()
                            ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                          }`}
                      >
                        <div className="text-lg font-bold">{plazo.dias}</div>
                        <div className="text-xs opacity-75">días</div>
                      </button>
                    ))}
                  </div>

                  {/* Opción "Otro" para plazos personalizados */}
                  {plazos.some(plazo => plazo.dias === 9999) && (
                    <div className="space-y-3">
                      <button
                        onClick={() => handleCalculatorChange('selectedDays', '9999')}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${calculatorData.selectedDays === '9999'
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-indigo-300'
                          }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <span>Otro plazo</span>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                          </svg>
                        </div>
                      </button>

                      {calculatorData.selectedDays === '9999' && (
                        <div className="space-y-2">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Ingresa los días (ej: 360)"
                              value={customDaysInput}
                              className={`w-full py-3 px-4 border-2 rounded-lg focus:outline-none text-center ${!periodValidation.isValid && calculatorData.selectedDays !== '9999'
                                  ? 'border-red-300 focus:border-red-500'
                                  : 'border-indigo-300 focus:border-indigo-500'
                                }`}
                              onChange={(e) => handleCustomDaysChange(e.target.value)}
                              onBlur={handleCustomDaysBlur}
                              onKeyPress={handleCustomDaysKeyPress}
                              autoFocus
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                              días
                            </div>
                          </div>
                          
                          {/* Indicador de validez mientras escribe */}
                          {customDaysInput && (
                            <div className="text-xs text-center">
                              {parseInt(customDaysInput) >= 31 ? (
                                <span className="text-green-600 flex items-center justify-center">
                                  <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                                  </svg>
                                  Plazo válido - Presiona Enter para confirmar
                                </span>
                              ) : (
                                <span className="text-gray-500 flex items-center justify-center">
                                  <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                                  </svg>
                                  Mínimo 31 días
                                </span>
                              )}
                            </div>
                          )}

                          {/* Botón de confirmar si ha escrito algo válido */}
                          {customDaysInput && parseInt(customDaysInput) >= 31 && (
                            <button
                              onClick={confirmCustomDays}
                              className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                            >
                              Confirmar {customDaysInput} días
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mensaje de validación del plazo */}
                  {!periodValidation.isValid && (
                    <div className="mt-2 flex items-start space-x-2">
                      <MdWarning className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-red-600">{periodValidation.message}</span>
                    </div>
                  )}

                  {/* Mostrar límites de parámetros */}
                  {investmentParams && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded border">
                      <span className="font-medium">Rango permitido:</span> {investmentParams.plazoMinimo} - {investmentParams.plazoMaximo === 9999 ? 'sin límite' : investmentParams.plazoMaximo} días
                    </div>
                  )}

                  {/* Información del plazo seleccionado */}
                  {calculatorData.selectedDays && calculatorData.selectedDays !== '9999' && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-700">Plazo seleccionado:</span>
                        <span className="font-semibold text-blue-800">
                          {calculatorData.selectedDays} días ({Math.round(parseInt(calculatorData.selectedDays) / 30)} meses aprox.)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selector de Tipo de Pago de Interés */}
                {(paymentTypes.length > 0 || paymentTypesLoading) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Pago de Interés
                    </label>

                    {paymentTypesLoading ? (
                      <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-center space-x-3">
                          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-gray-600 text-sm">Cargando tipos de pago...</span>
                        </div>
                      </div>
                    ) : paymentTypes.length > 0 ? (
                      <div className="space-y-2">
                        {paymentTypes.map((tipo) => (
                          <label
                            key={tipo.code}
                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${selectedPaymentType === tipo.code
                                ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200'
                                : 'border-gray-300 hover:bg-gray-50 hover:border-indigo-300'
                              }`}
                          >
                            <input
                              type="radio"
                              name="paymentType"
                              value={tipo.code}
                              checked={selectedPaymentType === tipo.code}
                              onChange={(e) => setSelectedPaymentType(e.target.value)}
                              className="mr-3 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="flex-1">
                              <div className={`font-medium ${selectedPaymentType === tipo.code ? 'text-indigo-800' : 'text-gray-800'
                                }`}>
                                {tipo.description}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Código: {tipo.code}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Información de tasa actual */}
                {investmentParams && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <MdInfo className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 text-sm">Información de Tasa</h4>
                        <p className="text-yellow-700 text-xs mt-1">
                          Tasa aplicable: <strong>{investmentParams.tasaMinima}%</strong> anual
                        </p>
                        <p className="text-yellow-600 text-xs mt-1">
                          Rango disponible: {investmentParams.tasaMinima}% - {investmentParams.tasaMaxima}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones de Acción */}
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      // Si está en modo personalizado, confirmar primero el valor
                      if (calculatorData.selectedDays === '9999' && customDaysInput && parseInt(customDaysInput) >= 31) {
                        confirmCustomDays();
                        // Pequeño delay para que se actualice el estado antes de calcular
                        setTimeout(() => calculateInvestment(), 100);
                      } else {
                        calculateInvestment();
                      }
                    }}
                    disabled={!canCalculate()}
                    className={`w-full py-4 rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none ${canCalculate()
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {calculationLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Calculando...</span>
                        </>
                      ) : (
                        <>
                          <MdCalculate className="text-xl" />
                          <span>
                            {calculatorData.selectedDays === '9999' && customDaysInput 
                              ? `Simular ${customDaysInput} días` 
                              : 'Simular Inversión'
                            }
                          </span>
                        </>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={handleClearCalculator}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-all"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.5,8C13.3,8 14,7.3 14,6.5V5.5C14,4.7 13.3,4 12.5,4S11,4.7 11,5.5V6.5C11,7.3 11.7,8 12.5,8M6.5,12C7.3,12 8,11.3 8,10.5V9.5C8,8.7 7.3,8 6.5,8S5,8.7 5,9.5V10.5C5,11.3 5.7,12 6.5,12M17.5,12C18.3,12 19,11.3 19,10.5V9.5C19,8.7 18.3,8 17.5,8S16,8.7 16,9.5V10.5C16,11.3 16.7,12 17.5,12M12.5,16C13.3,16 14,15.3 14,14.5V13.5C14,12.7 13.3,12 12.5,12S11,12.7 11,13.5V14.5C11,15.3 11.7,16 12.5,16M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                      </svg>
                      <span>Limpiar</span>
                    </div>
                  </button>

                  {/* Información de estado */}
                  {!investmentParams && !paramsLoading && (
                    <div className="text-center text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                      Cargando configuración de inversión...
                    </div>
                  )}
                </div>
              </div>

              {/* Resultado de Simulación */}
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Resultado de Simulación</h3>

                {calculatorData.result ? (
                  <div className="space-y-6">
                    {/* Resultado Principal */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-center">
                      <div className="flex items-center justify-center mb-3">
                        <svg className="w-8 h-8 text-green-600 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                        </svg>
                        <span className="text-green-800 font-semibold text-lg">Total al vencimiento</span>
                      </div>
                      <div className="text-4xl font-bold text-green-800 mb-2">
                        {formatCurrency(calculatorData.result.total || 0)}
                      </div>
                      <div className="text-green-700">
                        En {calculatorData.result.days || calculatorData.result.dias || 0} días ({Math.round((calculatorData.result.days || calculatorData.result.dias || 0) / 30)} meses)
                      </div>
                      <div className="text-sm text-green-600 mt-1">
                        Tasa anual: {calculatorData.result.rate || calculatorData.result.tasaAnual || 0}%
                      </div>
                    </div>

                    {/* Desglose Detallado */}
                    <div className="bg-gray-50 rounded-xl p-5">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                        Desglose de la simulación
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-gray-600 flex items-center">
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
                            </svg>
                            Capital inicial:
                          </span>
                          <span className="font-semibold text-lg">{formatCurrency(calculatorData.result.capital || calculatorData.result.principal || 0)}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-gray-600 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M7,10L12,15L17,10H7Z" />
                            </svg>
                            Intereses brutos:
                          </span>
                          <span className="font-semibold text-green-600 text-lg">+{formatCurrency(calculatorData.result.interes || calculatorData.result.interest || 0)}</span>
                        </div>

                        {calculatorData.result.retencion && parseFloat(calculatorData.result.retencion) > 0 && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-200">
                            <span className="text-gray-600 flex items-center">
                              <svg className="w-4 h-4 mr-2 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z" />
                              </svg>
                              Retención (impuestos):
                            </span>
                            <span className="font-semibold text-red-600">-{formatCurrency(calculatorData.result.retencion || 0)}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Tasa efectiva del período:</span>
                          <span className="font-semibold text-blue-600">{(calculatorData.result.effectiveRate || 0).toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Botón para proceder a invertir */}
                    <div className="pt-4">
                      <button
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${canProceedToInvest()
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
                            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          }`}
                        disabled={!canProceedToInvest()}
                        onClick={onProceedToInvest}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M4,6H2V20A2,2 0 0,0 4,22H18V20H4V6M20,2H8A2,2 0 0,0 6,4V16A2,2 0 0,0 8,18H20A2,2 0 0,0 22,16V4A2,2 0 0,0 20,2M20,16H8V4H20V16M16,6V14L12,11.5L8,14V6H16Z"/>
                          </svg>
                          <span>Proceder a Invertir</span>
                        </div>
                      </button>
                    </div>

                    {/* Información de la simulación */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="w-6 h-6 text-blue-600 mt-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-blue-800 mb-2">Esta es una simulación</h4>
                          <p className="text-blue-700 text-sm mb-2">
                            Los cálculos se basan en datos reales del sistema, pero no constituyen una inversión hasta que proceda al siguiente paso.
                          </p>
                          <p className="text-blue-600 text-xs">
                            Para hacer efectiva la inversión, deberá seleccionar una cuenta y completar la validación de seguridad.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MdCalculate className="text-6xl text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">¿Listo para simular?</h4>
                    <div className="space-y-2">
                      <p className="text-gray-500">Ingresa el monto y selecciona un plazo para ver tu simulación con datos reales</p>
                      {investmentParams && (
                        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                          Sistema configurado: {investmentParams.descripcionTipoInversion}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer informativo */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <MdInfo className="text-gray-400" />
              <span className="font-medium">Simulador de Inversiones</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="font-medium">API 2369:</span> Parámetros de inversión
              </div>
              <div>
                <span className="font-medium">API 2372:</span> Tipos de pago de interés
              </div>
              <div>
                <span className="font-medium">API 2373:</span> Cálculo real de inversión
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Esta es una simulación. Para invertir realmente, use el botón "Proceder a Invertir"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentSimulator;