import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

/**
 * Hook personalizado para manejar toda la lógica de estado de inversiones
 * Integra las APIs 2369, 2371, 2372 y 2373 para funcionalidad completa
 */
export const useInvestment = () => {
  // Estados principales
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  
  // Estados para tipos de inversión
  const [investmentTypes, setInvestmentTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [showInvestmentTypes, setShowInvestmentTypes] = useState(false);
  const [typesError, setTypesError] = useState(null);
  const [showSimulator, setShowSimulator] = useState(false);
const [showInvestor, setShowInvestor] = useState(false);

  // Estados para calculadora
  const [plazos, setPlazos] = useState([]);
  const [plazosLoading, setPlazosLoading] = useState(false);
  const [calculatorData, setCalculatorData] = useState({
    amount: '',
    selectedDays: '',
    selectedDaysLabel: '',
    interestRate: null, // Se obtendrá de parámetros
    result: null
  });

  // Estados para parámetros y validaciones (API 2369)
  const [investmentParams, setInvestmentParams] = useState(null);
  const [paramsLoading, setParamsLoading] = useState(false);
  
  // Estados para tipos de pago (API 2372)
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [paymentTypesLoading, setPaymentTypesLoading] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState('2');
  
  // Estados de validaciones
  const [amountValidation, setAmountValidation] = useState({ isValid: true, message: '' });
  const [periodValidation, setPeriodValidation] = useState({ isValid: true, message: '' });

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const investmentsPerPage = 4;

  // Estados para filtros de fecha y detalle de inversión
  const [investmentDetail, setInvestmentDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dateFilters, setDateFilters] = useState({
    fechaDesde: '',
    fechaHasta: '',
    showCustomDates: false
  });
  const [searchFilter, setSearchFilter] = useState('');

  // Estados para cuentas de inversión
  const [investmentAccounts, setInvestmentAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  // Estados para cálculo en tiempo real
  const [calculationLoading, setCalculationLoading] = useState(false);
  
  // Estado para modal de fondos insuficientes
  const [showInsufficientFundsModal, setShowInsufficientFundsModal] = useState(false);
  const [insufficientFundsAmount, setInsufficientFundsAmount] = useState(0);

// AGREGAR ESTOS NUEVOS ESTADOS DESPUÉS DE LA LÍNEA ANTERIOR:
// Estados para proceso de inversión (FASE 1)
const [investmentProcess, setInvestmentProcess] = useState({
  isActive: false,
  currentPhase: null, // 'security' | 'processing' | 'confirmation'
  data: null
});

const [securityQuestion, setSecurityQuestion] = useState({
  data: null,
  loading: false,
  answer: '',
  error: null,
  attempts: 0,
  maxAttempts: 3
});

const [investmentResult, setInvestmentResult] = useState(null);
  // Efectos
  useEffect(() => {
    loadInvestments();
    initializeDateFilters();
  }, []);

  // Cargar parámetros cuando se abre la calculadora
  useEffect(() => {
    if (showCalculator && !investmentParams) {
      loadInvestmentParameters();
    }
  }, [showCalculator]);

  // Validar parámetros cuando cambian los valores o se cargan parámetros
  useEffect(() => {
    const isCustomMode = calculatorData.selectedDays === '9999';
    
    if (investmentParams && 
        calculatorData.amount && 
        calculatorData.selectedDays && 
        !isCustomMode && 
        calculatorData.selectedDays !== '' &&
        parseInt(calculatorData.selectedDays) >= 31) { // NUEVO: mínimo 31 días
      console.log('🔍 [VALIDATION] Ejecutando validación automática');
      validateInvestmentParameters(calculatorData.amount, calculatorData.selectedDays);
    } else if (isCustomMode) {
      console.log('⏸️ [VALIDATION] Modo personalizado activo - saltando validación automática');
    }
  }, [calculatorData.amount, calculatorData.selectedDays, investmentParams]);

  // Cargar tipos de pago cuando cambian monto y plazo
  useEffect(() => {
    const isCustomMode = calculatorData.selectedDays === '9999';
    
    if (calculatorData.amount && calculatorData.selectedDays && 
        !isCustomMode && 
        parseFloat(calculatorData.amount) > 0 && 
        parseInt(calculatorData.selectedDays) >= 31) { // CAMBIO: mínimo 31 días para cargar tipos
      console.log('💰 [PAYMENT-TYPES] Cargando tipos de pago...');
      loadPaymentTypes(calculatorData.amount, calculatorData.selectedDays);
    } else {
      if (isCustomMode) {
        console.log('⏸️ [PAYMENT-TYPES] Modo personalizado activo - no cargar tipos de pago aún');
      }
      setPaymentTypes([]);
    }
  }, [calculatorData.amount, calculatorData.selectedDays]);

  // ===== FUNCIONES PRINCIPALES =====

  const initializeDateFilters = () => {
    const { fechaDesde, fechaHasta } = apiService.getDefaultDateRange();
    setDateFilters({
      fechaDesde,
      fechaHasta,
      showCustomDates: false
    });
  };

  /**
   * Cargar parámetros de inversión desde API 2369
   */
  const loadInvestmentParameters = async () => {
    try {
      setParamsLoading(true);
      console.log('📋 [PARAMS] Cargando parámetros de inversión (API 2369)...');
      
      const result = await apiService.getCurrentUserInvestmentParameters();
      
      if (result.success && result.data.parametros && result.data.parametros.length > 0) {
        const params = result.data.parametros[0];
        
        // Procesar parámetros para uso interno
        const processedParams = {
          codigoEmpresa: params.cod_empre,
          codigoOficina: params.cod_ofici,
          codigoTipoInversion: params.cod_tinve,
          descripcionTipoInversion: params.des_tinve,
          plazoMinimo: parseInt(params.plz_minim),
          plazoMaximo: parseInt(params.plz_maxim),
          montoMinimo: parseFloat(params.mnt_minim),
          montoMaximo: parseFloat(params.mnt_maxim),
          tasaMinima: parseFloat(params.tas_minim),
          tasaMaxima: parseFloat(params.tas_maxim),
          controlAcapitalizable: params.ctr_acapi,
          controlHabilitado: params.ctr_habil,
          // Datos originales
          _original: params
        };
        
        setInvestmentParams(processedParams);
        
        // Actualizar tasa por defecto en calculadora
        if (!calculatorData.interestRate) {
          setCalculatorData(prev => ({
            ...prev,
            interestRate: processedParams.tasaMinima
          }));
        }
        
        console.log('✅ [PARAMS] Parámetros procesados:', processedParams);
      } else {
        console.error('❌ [PARAMS] Error o datos vacíos:', result.error);
        setInvestmentParams(null);
      }
    } catch (error) {
      console.error('💥 [PARAMS] Error inesperado:', error);
      setInvestmentParams(null);
    } finally {
      setParamsLoading(false);
    }
  };

  /**
   * Cargar tipos de pago desde API 2372
   */
  const loadPaymentTypes = async (amount, days) => {
    if (!amount || !days || parseFloat(amount) <= 0 || parseInt(days) <= 0) {
      setPaymentTypes([]);
      return;
    }

    try {
      setPaymentTypesLoading(true);
      console.log('💰 [PAYMENT-TYPES] Cargando tipos de pago (API 2372)...', { amount, days });
      
      const result = await apiService.getInterestPaymentTypes(amount, days);
      
      if (result.success && result.data.listado) {
        // Procesar tipos de pago para uso interno
        const processedTypes = result.data.listado.map(tipo => ({
          code: tipo.codigo,
          description: tipo.descri,
          _original: tipo
        }));
        
        setPaymentTypes(processedTypes);
        
        // Establecer tipo por defecto si no hay uno seleccionado
        if (!selectedPaymentType || !processedTypes.find(t => t.code === selectedPaymentType)) {
          const defaultType = processedTypes.find(t => t.code === '2') || processedTypes[0];
          if (defaultType) {
            setSelectedPaymentType(defaultType.code);
          }
        }
        
        console.log('✅ [PAYMENT-TYPES] Tipos procesados:', processedTypes);
      } else {
        console.error('❌ [PAYMENT-TYPES] Error:', result.error);
        setPaymentTypes([]);
      }
    } catch (error) {
      console.error('💥 [PAYMENT-TYPES] Error inesperado:', error);
      setPaymentTypes([]);
    } finally {
      setPaymentTypesLoading(false);
    }
  };

  /**
   * Validar parámetros de inversión usando datos de API 2369
   */
  const validateInvestmentParameters = (amount, days) => {
    let amountValid = { isValid: true, message: '' };
    let periodValid = { isValid: true, message: '' };

    if (investmentParams && amount) {
      const numAmount = parseFloat(amount);
      
      if (isNaN(numAmount) || numAmount <= 0) {
        amountValid = {
          isValid: false,
          message: 'Ingrese un monto válido'
        };
      } else if (numAmount < investmentParams.montoMinimo) {
        amountValid = {
          isValid: false,
          message: `El monto mínimo es $${investmentParams.montoMinimo.toLocaleString()}`
        };
      } else if (numAmount > investmentParams.montoMaximo) {
        amountValid = {
          isValid: false,
          message: `El monto máximo es $${investmentParams.montoMaximo.toLocaleString()}`
        };
      }
    }

    if (investmentParams && days) {
      const numDays = parseInt(days);
      
      if (isNaN(numDays) || numDays <= 0) {
        periodValid = {
          isValid: false,
          message: 'Ingrese un plazo válido'
        };
      } else if (numDays < investmentParams.plazoMinimo) {
        periodValid = {
          isValid: false,
          message: `El plazo mínimo es ${investmentParams.plazoMinimo} días`
        };
      } else if (numDays > investmentParams.plazoMaximo && investmentParams.plazoMaximo !== 9999) {
        periodValid = {
          isValid: false,
          message: `El plazo máximo es ${investmentParams.plazoMaximo} días`
        };
      }
    }

    setAmountValidation(amountValid);
    setPeriodValidation(periodValid);

    return amountValid.isValid && periodValid.isValid;
  };

  /**
   * Cargar plazos desde API 2371
   */
/**
 * Cargar plazos desde API 2371 y mostrar simulador
 */
const loadInvestmentTerms = async () => {
  try {
    setPlazosLoading(true);
    console.log('🔄 [CALCULATOR] Cargando plazos de inversión (API 2371)...');
    
    const result = await apiService.getCurrentUserInvestmentTerms();
    
    if (result.success && result.data.plazos) {
      console.log('✅ [CALCULATOR] Plazos cargados:', result.data.plazos);
      setPlazos(result.data.plazos);
      
      // CAMBIO PRINCIPAL: Mostrar simulador en lugar de calculadora
      setShowSimulator(true);
      
      // Cargar parámetros automáticamente
      if (!investmentParams) {
        loadInvestmentParameters();
      }
    } else {
      console.error('❌ [CALCULATOR] Error cargando plazos:', result.error);
      alert('Error al cargar los plazos de inversión');
    }
  } catch (error) {
    console.error('💥 [CALCULATOR] Error inesperado:', error);
    alert('Error inesperado al cargar la calculadora');
  } finally {
    setPlazosLoading(false);
  }
};
  /**
   * Calcular inversión usando API 2373
   */
  const calculateInvestment = async () => {
    const { amount, selectedDays } = calculatorData;
    
    // Validaciones básicas
    if (!amount || parseFloat(amount) <= 0) {
      alert('Por favor ingrese un monto válido mayor a $0');
      return;
    }

    if (!selectedDays) {
      alert('Por favor seleccione un plazo para la inversión');
      return;
    }

    if (!selectedPaymentType) {
      alert('Por favor seleccione un tipo de pago de interés');
      return;
    }

    // Validar con parámetros
    const isValid = validateInvestmentParameters(amount, selectedDays);
    if (!isValid) {
      alert('Por favor corrija los valores antes de calcular');
      return;
    }

    if (!investmentParams) {
      alert('Cargando parámetros de inversión... Intente nuevamente en un momento');
      return;
    }

    try {
      setCalculationLoading(true);
      console.log('🧮 [CALC] Calculando con API real (2373)...');
      console.log('📊 [CALC] Parámetros:', {
        amount,
        selectedDays,
        selectedPaymentType,
        interestRate: investmentParams.tasaMinima
      });
      
      // Llamar API 2373 con parámetros correctos
      const result = await apiService.calculateRealInvestmentSimulation(
        selectedPaymentType,    // codtpgin
        amount,                // valinver
        selectedDays,          // plzinver
        investmentParams.tasaMinima // tasinver
      );
      
      if (result.success && result.data.calculo && result.data.calculo.length > 0) {
        const calculo = result.data.calculo[0];
        
        // Procesar resultado para compatibilidad con UI existente
        const processedResult = {
          // Datos directos de la API
          capital: parseFloat(calculo.capital) || 0,
          interes: parseFloat(calculo.interes) || 0,
          retencion: parseFloat(calculo.retencion) || 0,
          total: parseFloat(calculo.recibe) || 0,
          
          // Campos de compatibilidad con UI existente
          principal: parseFloat(calculo.capital) || 0,
          interest: parseFloat(calculo.interes) || 0,
          days: parseInt(selectedDays),
          rate: investmentParams.tasaMinima,
          
          // Cálculos adicionales
          effectiveRate: parseFloat(calculo.capital) > 0 ? 
            (parseFloat(calculo.interes) / parseFloat(calculo.capital)) * 100 : 0,
          effectiveAnnualRate: parseFloat(calculo.capital) > 0 ? 
            Math.pow(parseFloat(calculo.recibe) / parseFloat(calculo.capital), 365 / parseInt(selectedDays)) * 100 - 100 : 0,
          monthlyReturn: parseFloat(calculo.interes) / (parseInt(selectedDays) / 30),
          
          // Metadatos
          calculationSource: 'api_real_2373',
          paymentType: selectedPaymentType,
          paymentTypeDescription: paymentTypes.find(pt => pt.code === selectedPaymentType)?.description || '',
          
          // Datos originales
          _originalCalculation: calculo,
          _parameters: investmentParams
        };
        
        setCalculatorData(prev => ({
          ...prev,
          result: processedResult
        }));
        
        console.log('📊 [CALC] Resultado procesado:', processedResult);
        
        // Cargar cuentas después del cálculo exitoso
        await loadInvestmentAccounts(amount);
        
      } else {
        console.error('❌ [CALC] Error en respuesta de cálculo:', result);
        alert('Error al calcular la simulación: ' + (result.error?.message || 'Respuesta inválida del servidor'));
      }
    } catch (error) {
      console.error('💥 [CALC] Error inesperado:', error);
      alert('Error inesperado al calcular: ' + error.message);
    } finally {
      setCalculationLoading(false);
    }
  };

  // ===== FUNCIONES EXISTENTES (sin cambios significativos) =====

  const loadInvestments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 [INVESTMENTS] Cargando inversiones...');
      const result = await apiService.getCurrentUserInvestments();
      
      if (result.success) {
        console.log('✅ [INVESTMENTS] Inversiones cargadas:', result.data.inversiones);
        setInvestments(result.data.inversiones);
      } else {
        console.error('❌ [INVESTMENTS] Error cargando inversiones:', result.error);
        setError(result.error.message);
        setInvestments([]);
      }
    } catch (error) {
      console.error('💥 [INVESTMENTS] Error inesperado:', error);
      setError('Error inesperado al cargar las inversiones');
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadInvestmentDetail = async (investment, customDateFrom = null, customDateTo = null) => {
    try {
      setDetailLoading(true);
      console.log('🔄 [INVESTMENT-DETAIL] Cargando detalle para:', investment.code);
      
      const fechaDesde = customDateFrom || dateFilters.fechaDesde;
      const fechaHasta = customDateTo || dateFilters.fechaHasta;
      
      console.log('📅 [INVESTMENT-DETAIL] Fechas:', { fechaDesde, fechaHasta });
      
      const result = await apiService.getCurrentUserInvestmentDetail(
        investment.code,
        fechaDesde,
        fechaHasta
      );
      
      if (result.success) {
        console.log('✅ [INVESTMENT-DETAIL] Detalle cargado:', result.data);
        setInvestmentDetail(result.data);
      } else {
        console.error('❌ [INVESTMENT-DETAIL] Error:', result.error);
        setInvestmentDetail(null);
      }
    } catch (error) {
      console.error('💥 [INVESTMENT-DETAIL] Error inesperado:', error);
      setInvestmentDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const loadInvestmentTypes = async () => {
    try {
      setTypesLoading(true);
      setTypesError(null);
      console.log('🔄 [TYPES] Cargando tipos de inversión...');
      
      const result = await apiService.getCurrentUserInvestmentTypes();
      
      if (result.success) {
        console.log('✅ [TYPES] Tipos cargados:', result.data.tiposInversion);
        setInvestmentTypes(result.data.tiposInversion);
        setShowInvestmentTypes(true);
      } else {
        console.error('❌ [TYPES] Error:', result.error);
        setTypesError(result.error.message);
        setInvestmentTypes([]);
      }
    } catch (error) {
      console.error('💥 [TYPES] Error inesperado:', error);
      setTypesError('Error inesperado al cargar los tipos de inversión');
      setInvestmentTypes([]);
    } finally {
      setTypesLoading(false);
    }
  };

  const loadInvestmentAccounts = async (investmentAmount) => {
    if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
      console.log('❌ [ACCOUNTS] Monto inválido para cargar cuentas:', investmentAmount);
      return [];
    }

    try {
      setAccountsLoading(true);
      setAccountsError(null);
      console.log('🔄 [ACCOUNTS] Cargando cuentas para inversión, monto:', investmentAmount);
      
      const result = await apiService.getCurrentUserAccountsForInvestment(investmentAmount);
      
      if (result.success) {
        console.log('✅ [ACCOUNTS] Cuentas cargadas:', result.data.cuentas.length);
        
        // ✅ Si no hay cuentas, NO mostrar el selector (para evitar sección vacía)
        if (result.data.cuentas.length === 0) {
          console.log('⚠️ [ACCOUNTS] No hay cuentas con fondos suficientes');
          setInvestmentAccounts([]);
          setShowAccountSelector(false);
          setAccountsError(null); // No mostrar error aquí, se manejará con el modal
          return [];
        }
        
        setInvestmentAccounts(result.data.cuentas);
        setShowAccountSelector(true);
        
        if (result.data.cuentas.length === 1) {
          setSelectedAccount(result.data.cuentas[0].codigo);
        }
        
        return result.data.cuentas;
      } else {
        console.error('❌ [ACCOUNTS] Error:', result.error.message);
        setAccountsError(result.error.message);
        setInvestmentAccounts([]);
        setShowAccountSelector(false);
        return [];
      }
    } catch (error) {
      console.error('💥 [ACCOUNTS] Error inesperado:', error);
      setAccountsError('Error inesperado al cargar las cuentas disponibles');
      setInvestmentAccounts([]);
      setShowAccountSelector(false);
      return [];
    } finally {
      setAccountsLoading(false);
    }
  };
  /**
 * Iniciar proceso de inversión - FASE 1
 */
/**
 * Iniciar proceso de inversión - FASE 1
 */
const handleStartInvestmentProcess = () => {
  console.log('🚀 [INVESTMENT] Iniciando proceso de inversión');
  
  // Validaciones previas
  const validationResult = validateInvestmentData();
  if (!validationResult.isValid) {
    alert(validationResult.message);
    return;
  }

  const cedula = getUserCedula();
  
  // ✅ VALIDAR QUE getUserCedula() NO SEA NULL O UNDEFINED
  if (!cedula) {
    alert('No se pudo obtener la información del usuario. Inicie sesión nuevamente.');
    return;
  }

  // ✅ VALIDAR QUE selectedAccount EXISTA
  if (!selectedAccount) {
    alert('Debe seleccionar una cuenta para debitar la inversión.');
    return;
  }

  // Preparar datos para el proceso
  const processData = {
    cedula: cedula,
    codtpgin: selectedPaymentType,
    valinver: parseFloat(calculatorData.amount).toFixed(2),
    plzinver: calculatorData.selectedDays,
    tasinver: parseFloat(calculatorData.interestRate || investmentParams?.tasaMinima).toFixed(2),
    codctadp: selectedAccount
  };

  // ✅ LOGS SEGUROS - Solo después de validar que existen
  console.log('📋 [INVESTMENT] Datos preparados para inversión:', {
    ...processData,
    cedula: cedula ? '***' + cedula.slice(-4) : 'UNDEFINED',
    codctadp: selectedAccount ? '***' + selectedAccount.slice(-4) : 'UNDEFINED'
  });

  // ✅ VALIDACIONES ADICIONALES DE LOS DATOS PREPARADOS
  if (!processData.cedula || !processData.codctadp) {
    alert('Error preparando los datos de inversión. Intente nuevamente.');
    return;
  }

  // Iniciar proceso con pregunta de seguridaad
  setInvestmentProcess({
    isActive: true,
    currentPhase: 'security',
    data: processData
  });

  // Cargar pregunta de seguridad
  loadSecurityQuestion();
};

/**
 * Validar datos antes de inversión
 */
const validateInvestmentData = () => {
  if (!calculatorData.amount || parseFloat(calculatorData.amount) <= 0) {
    return { isValid: false, message: 'El monto de inversión es requerido' };
  }

  if (!calculatorData.selectedDays) {
    return { isValid: false, message: 'Debe seleccionar un plazo de inversión' };
  }

  if (!selectedPaymentType) {
    return { isValid: false, message: 'Debe seleccionar un tipo de pago de interés' };
  }

  if (!selectedAccount) {
    return { isValid: false, message: 'Debe seleccionar una cuenta para debitar' };
  }

  if (!amountValidation.isValid) {
    return { isValid: false, message: amountValidation.message };
  }

  if (!periodValidation.isValid) {
    return { isValid: false, message: periodValidation.message };
  }

  if (!calculatorData.result) {
    return { isValid: false, message: 'Debe calcular la inversión antes de proceder' };
  }

  return { isValid: true, message: 'Datos válidos' };
};

/**
 * Cargar pregunta de seguridad
 */
/**
 * Cargar pregunta de seguridad
 */
const loadSecurityQuestion = async () => {
  setSecurityQuestion(prev => ({ ...prev, loading: true, error: null }));
  
  try {
    const cedula = getUserCedula();
    console.log('❓ [INVESTMENT] Cargando pregunta de seguridad para:', '***' + cedula.slice(-4));
    
    const result = await apiService.getSecurityQuestion(cedula);
    
    // ✅ USAR result.questions (como corregimos en el apiService)
    if (result.success && result.questions && result.questions.length > 0) {
      const question = result.questions[0];
      console.log('✅ [INVESTMENT] Pregunta de seguridad cargada:', question.detprg);
      
      setSecurityQuestion(prev => ({
        ...prev,
        data: question,
        loading: false,
        answer: '',
        error: null
      }));
    } else {
      throw new Error(result.error?.message || 'No se pudo obtener la pregunta de seguridad');
    }
  } catch (error) {
    console.error('❌ [INVESTMENT] Error cargando pregunta de seguridad:', error);
    setSecurityQuestion(prev => ({
      ...prev,
      loading: false,
      error: error.message || 'Error al cargar pregunta de seguridad'
    }));
    
    setInvestmentProcess(prev => ({ ...prev, isActive: false }));
  }
};
/**
 * Validar respuesta de pregunta de seguridad
 */
/**
 * Validar respuesta de pregunta de seguridad
 */
const validateSecurityAnswer = async (answer, validationType = 'question') => {
  // Si la validación es por OTP, solo proceder con el registro
  if (validationType === 'otp') {
    console.log('✅ [INVESTMENT] Validación OTP completada exitosamente');
    
    // Pasar a la siguiente fase: procesamiento
    setInvestmentProcess(prev => ({
      ...prev,
      currentPhase: 'processing'
    }));
    
    // Limpiar datos de pregunta de seguridad
    setSecurityQuestion({
      data: null,
      loading: false,
      answer: '',
      error: null,
      attempts: 0,
      maxAttempts: 3
    });
    
    // Proceder con el registro de inversión
    setTimeout(() => {
      registerInvestment();
    }, 1000);
    
    return { success: true };
  }

  // Validación por pregunta de seguridad (flujo original)
  if (!answer || !answer.trim()) {
    return {
      success: false,
      error: { message: 'La respuesta es requerida' }
    };
  }

  if (!securityQuestion.data || !investmentProcess.data) {
    return {
      success: false,
      error: { message: 'Datos de validación no disponibles' }
    };
  }

  try {
    console.log('🔒 [INVESTMENT] Validando respuesta de seguridad...');
    
    const result = await apiService.validateSecurityAnswer(
      investmentProcess.data.cedula,
      securityQuestion.data.codprg,  // ✅ Usar codprg del JSON
      answer.trim()
    );
    
    if (result.success) {
      console.log('✅ [INVESTMENT] Respuesta de seguridad validada correctamente');
      
      // Pasar a la siguiente fase: procesamiento
      setInvestmentProcess(prev => ({
        ...prev,
        currentPhase: 'processing'
      }));
      
      // Limpiar datos de pregunta de seguridad
      setSecurityQuestion({
        data: null,
        loading: false,
        answer: '',
        error: null,
        attempts: 0,
        maxAttempts: 3
      });
      
      // Proceder con el registro de inversión
      setTimeout(() => {
        registerInvestment();
      }, 1000);
      
      return { success: true };
    } else {
      console.error('❌ [INVESTMENT] Respuesta de seguridad incorrecta:', result.error);
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error('💥 [INVESTMENT] Error validando respuesta de seguridad:', error);
    return {
      success: false,
      error: { message: 'Error inesperado al validar respuesta' }
    };
  }
};
/**
 * Registrar la inversión usando API 2375
 */
const registerInvestment = async () => {
  if (!investmentProcess.data) {
    console.error('❌ [INVESTMENT] No hay datos de inversión para procesar');
    return;
  }

  try {
    console.log('💰 [INVESTMENT] Iniciando registro de inversión...');
    
    const result = await apiService.registerInvestment(investmentProcess.data);
    
    if (result.success) {
      console.log('✅ [INVESTMENT] Inversión registrada exitosamente:', result.data.inversion);
      
      // Guardar resultado y cambiar a fase de confirmación
      setInvestmentResult(result);
      setInvestmentProcess(prev => ({
        ...prev,
        currentPhase: 'confirmation'
      }));
      
    } else {
      console.error('❌ [INVESTMENT] Error registrando inversión:', result.error);
      
      // Mostrar error y cancelar proceso
      setInvestmentResult({
        success: false,
        error: result.error
      });
      
      setInvestmentProcess(prev => ({
        ...prev,
        currentPhase: 'error'
      }));
    }
  } catch (error) {
    console.error('💥 [INVESTMENT] Error inesperado registrando inversión:', error);
    
    setInvestmentResult({
      success: false,
      error: {
        message: 'Error inesperado al procesar la inversión',
        code: 'UNEXPECTED_ERROR'
      }
    });
    
    setInvestmentProcess(prev => ({
      ...prev,
      currentPhase: 'error'
    }));
  }
};

/**
 * Finalizar proceso de inversión (éxito o error) - RESET COMPLETO
 */
const finishInvestmentProcess = () => {
  console.log('🏁 [INVESTMENT] Finalizando proceso de inversión');
  
  const wasSuccessful = investmentResult && investmentResult.success;
  
  // Limpiar todos los estados del proceso
  setInvestmentProcess({
    isActive: false,
    currentPhase: null,
    data: null
  });
  
  setSecurityQuestion({
    data: null,
    loading: false,
    answer: '',
    error: null,
    attempts: 0,
    maxAttempts: 3
  });
  
  setInvestmentResult(null);
  
  // RESET COMPLETO: Limpiar completamente el simulador
  console.log('🧹 [INVESTMENT] Reset completo del simulador');
  
  // Resetear calculadora completamente
  setCalculatorData({
    amount: '',
    selectedDays: '',
    selectedDaysLabel: '',
    interestRate: investmentParams?.tasaMinima || null,
    result: null
  });
  
  // Limpiar tipos de pago
  setPaymentTypes([]);
  setSelectedPaymentType('2');
  
  // Limpiar selección de cuenta
  clearAccountSelection();
  
  // Navegar de vuelta al simulador limpio
  setShowInvestor(false);
  setShowSimulator(true);
  
  // Mostrar mensaje de éxito si la inversión fue exitosa
  if (wasSuccessful) {
    console.log('✅ [INVESTMENT] Inversión exitosa - Recargando lista');
    loadInvestments();
    
    // Opcional: Mostrar toast/notificación de éxito
    // alert('¡Inversión registrada exitosamente! Puedes realizar una nueva simulación.');
  }
};
/**
 * Cancelar proceso de inversión
 */
const cancelInvestmentProcess = () => {
  console.log('❌ [INVESTMENT] Proceso de inversión cancelado por usuario');
  
  setInvestmentProcess({
    isActive: false,
    currentPhase: null,
    data: null
  });
  
  setSecurityQuestion({
    data: null,
    loading: false,
    answer: '',
    error: null,
    attempts: 0,
    maxAttempts: 3
  });
  
  setInvestmentResult(null);
};

/**
 * Obtener cédula del usuario
 */
const getUserCedula = () => {
  return apiService.getUserCedula();
};

  const clearAccountSelection = () => {
    setInvestmentAccounts([]);
    setSelectedAccount('');
    setShowAccountSelector(false);
    setAccountsError(null);
  };

  const handleAccountSelect = (accountCode) => {
    console.log('🎯 [ACCOUNTS] Cuenta seleccionada:', accountCode);
    setSelectedAccount(accountCode);
  };

  // ===== HANDLERS =====

  const handleInvestmentClick = async (investment) => {
    console.log('🔄 [INVESTMENT-CLICK] Inversión seleccionada:', investment);
    setSelectedInvestment(investment);
    setShowDetail(true);
    setSearchFilter('');
    
    const codigoInversion = investment.code || investment.codinv || investment.numero;
    console.log('💰 [INVESTMENT-CLICK] Código de inversión a consultar:', codigoInversion);
    
    if (codigoInversion) {
      await loadInvestmentDetail({ ...investment, code: codigoInversion });
    } else {
      console.error('❌ [INVESTMENT-CLICK] No se encontró código de inversión en:', investment);
      setInvestmentDetail(null);
    }
  };

  const handleRetry = () => {
    loadInvestments();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDateFilterChange = (field, value) => {
    setDateFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBackToList = () => {
    setShowDetail(false);
    setSelectedInvestment(null);
    setInvestmentDetail(null);
    setSearchFilter('');
  };

 const handleBackToMain = () => {
  // Limpiar todo y volver a la vista principal
  setShowCalculator(false);
  setShowSimulator(false); // NUEVO
  setShowInvestor(false);  // NUEVO
  
  setCalculatorData({
    amount: '',
    selectedDays: '',
    selectedDaysLabel: '',
    interestRate: null,
    result: null
  });
  setPaymentTypes([]);
  setSelectedPaymentType('2');
  setInvestmentParams(null);
  clearAccountSelection();
};
/**
 * Ir desde simulador a proceso de inversión
 * ✅ CON VALIDACIÓN DE FONDOS
 */
const handleProceedToInvest = async () => {
  console.log('🚀 [NAV] Procediendo del simulador al proceso de inversión');
  
  // Validar que hay resultado de simulación
  if (!calculatorData.result) {
    alert('Debe calcular la simulación antes de proceder a invertir');
    return;
  }
  
  // ✅ VALIDAR FONDOS ANTES DE AVANZAR
  console.log('💰 [VALIDATION] Verificando cuentas disponibles para:', calculatorData.amount);
  
  const availableAccounts = await loadInvestmentAccounts(calculatorData.amount);
  
  if (!availableAccounts || availableAccounts.length === 0) {
    console.log('⚠️ [VALIDATION] No hay fondos suficientes');
    setInsufficientFundsAmount(parseFloat(calculatorData.amount));
    setShowInsufficientFundsModal(true);
    return;
  }
  
  console.log('✅ [VALIDATION] Fondos disponibles, avanzando al proceso de inversión');
  setShowSimulator(false);
  setShowInvestor(true);
};

/**
 * Volver del proceso de inversión al simulador
 */
const handleBackToSimulator = () => {
  console.log('↩️ [NAV] Volviendo del proceso de inversión al simulador');
  
  setShowInvestor(false);
  setShowSimulator(true);
  
  // Limpiar datos del proceso de inversión
  clearAccountSelection();
  cancelInvestmentProcess();
};

/**
 * Iniciar simulador (desde vista principal)
 */
const handleStartSimulator = async () => {
  console.log('🧮 [NAV] Iniciando simulador de inversiones');
  
  // Cargar datos necesarios
  setPlazosLoading(true);
  
  try {
    const result = await apiService.getCurrentUserInvestmentTerms();
    
    if (result.success && result.data.plazos) {
      setPlazos(result.data.plazos);
      setShowSimulator(true);
      
      // Cargar parámetros automáticamente
      if (!investmentParams) {
        loadInvestmentParameters();
      }
    } else {
      console.error('❌ [NAV] Error cargando plazos:', result.error);
      alert('Error al cargar los plazos de inversión');
    }
  } catch (error) {
    console.error('💥 [NAV] Error inesperado:', error);
    alert('Error inesperado al cargar la calculadora');
  } finally {
    setPlazosLoading(false);
  }
};

  const handleCloseInvestmentTypes = () => {
    setShowInvestmentTypes(false);
  };

  // ===== FUNCIONES AUXILIARES =====

  // Calcular paginación
  const totalPages = Math.ceil(investments.length / investmentsPerPage);
  const startIndex = (currentPage - 1) * investmentsPerPage;
  const endIndex = startIndex + investmentsPerPage;
  const currentInvestments = investments.slice(startIndex, endIndex);

  // Filtrar movimientos en detalle
  const getFilteredMovements = () => {
    if (!investmentDetail?.movimientos) return [];
    
    if (!searchFilter.trim()) return investmentDetail.movimientos;
    
    const filter = searchFilter.toLowerCase().trim();
    return investmentDetail.movimientos.filter(mov => 
      mov.descripcion?.toLowerCase().includes(filter) ||
      mov.numeroDocumento?.toLowerCase().includes(filter) ||
      mov.fechaFormateada?.toLowerCase().includes(filter) ||
      mov.valorCredito?.toString().includes(filter) ||
      mov.valorDebito?.toString().includes(filter) ||
      mov.saldo?.toString().includes(filter)
    );
  };

  // Limpiar filtros de búsqueda
  const clearSearchFilter = () => {
    setSearchFilter('');
  };

  // Aplicar filtros de fecha
  const applyDateFilters = async () => {
    if (selectedInvestment) {
      await loadInvestmentDetail(
        selectedInvestment,
        dateFilters.fechaDesde,
        dateFilters.fechaHasta
      );
    }
  };

  // Establecer rango de fechas predefinido
  const setDateRange = (days) => {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);
    
    const fechaHasta = today.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    
    const fechaDesde = pastDate.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    
    setDateFilters({
      fechaDesde,
      fechaHasta,
      showCustomDates: false
    });
  };

  // ===== RETURN DEL HOOK =====
  return {
    // Estados principales
    investments,
    loading,
    error,
    selectedInvestment,
    showDetail,
    showCalculator,
    
    // Estados de tipos de inversión
    investmentTypes,
    typesLoading,
    showInvestmentTypes,
    typesError,
    
    // Estados de calculadora
    plazos,
    plazosLoading,
    calculatorData,
    
    // Estados de parámetros (NUEVOS)
    investmentParams,
    paramsLoading,
    
    // Estados de tipos de pago (ACTUALIZADOS)
    paymentTypes,
    paymentTypesLoading,
    selectedPaymentType,
    
    // Estados de validaciones (ACTUALIZADOS)
    amountValidation,
    periodValidation,
    
    // Estados de cálculo
    calculationLoading,
    
    // Estados de fondos insuficientes (NUEVO)
    showInsufficientFundsModal,
    insufficientFundsAmount,
    setShowInsufficientFundsModal,
    
    // Estados de navegación (NUEVO)
    showSimulator,
    showInvestor,
    
    // Estados de paginación
    currentPage,
    investmentsPerPage,
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
    
    // Setters necesarios
    setSelectedInvestment,
    setShowDetail,
    setShowCalculator,
    setCalculatorData,
    setSelectedPaymentType,
    setSearchFilter,
    setPaymentTypes,
    setInvestmentDetail,
    setSelectedAccount,
    setShowAccountSelector,
    
    // Funciones principales (ACTUALIZADAS)
    loadInvestments,
    loadInvestmentDetail,
    loadInvestmentTypes,
    loadInvestmentTerms,
    calculateInvestment, // Usa API 2373
    validateInvestmentParameters, // Usa parámetros de API 2369
    loadInvestmentAccounts,
    loadInvestmentParameters, // NUEVA - API 2369
    loadPaymentTypes, // NUEVA - API 2372
    
    // Handlers
    handleInvestmentClick,
    handleRetry,
    handlePageChange,
    handleDateFilterChange,
    handleBackToList,
    handleBackToMain,
    handleCloseInvestmentTypes,
    handleAccountSelect,
    
    // Funciones auxiliares
    getFilteredMovements,
    clearSearchFilter,
    applyDateFilters,
    setDateRange,
    initializeDateFilters,
    clearAccountSelection,
     // Estados de navegación (NUEVOS)
  showSimulator,
  showInvestor,
  
  // Funciones de navegación (NUEVAS)
  handleProceedToInvest,
  handleBackToSimulator,
  handleStartSimulator,

    // Estados de proceso de inversión (NUEVOS)
    investmentProcess,
    securityQuestion,
    investmentResult,
  
  // Funciones de proceso de inversión (NUEVAS)
    handleStartInvestmentProcess,
    cancelInvestmentProcess,
    loadSecurityQuestion,
    validateInvestmentData,
    getUserCedula,
    validateSecurityAnswer,
    // AGREGAR ESTOS NUEVOS:
  registerInvestment,
  finishInvestmentProcess
  };
};