import React, { useState, useEffect, useRef } from 'react';
import apiService from '../../services/apiService';
import NewContactQuestions from './NewContactQuestions';

// Lista de códigos de país más comunes
const COUNTRY_CODES = [
  { code: '+593', country: 'Ecuador', flag: '🇪🇨' },
  { code: '+1', country: 'Estados Unidos', flag: '🇺🇸' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+51', country: 'Perú', flag: '🇵🇪' },
  { code: '+34', country: 'España', flag: '🇪🇸' },
  { code: '+52', country: 'México', flag: '🇲🇽' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
  { code: '+55', country: 'Brasil', flag: '🇧🇷' },
  { code: '+1-CA', country: 'Canadá', flag: '🇨🇦' }, // Clave única para Canadá
  { code: '+33', country: 'Francia', flag: '🇫🇷' },
  { code: '+49', country: 'Alemania', flag: '🇩🇪' },
  { code: '+39', country: 'Italia', flag: '🇮🇹' },
  { code: '+44', country: 'Reino Unido', flag: '🇬🇧' },
  { code: '+81', country: 'Japón', flag: '🇯🇵' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+91', country: 'India', flag: '🇮🇳' }
];

const NewContact = ({ onBack, onContactCreated, onProceedToTransfer }) => {
  const [currentStep, setCurrentStep] = useState('form'); // 'form', 'questions', 'success'

  const [formData, setFormData] = useState({
    // Datos bancarios
    bankDestination: '',
    accountType: '',
    accountNumber: '',
    // Datos identificación
    identificationType: '',
    identificationNumber: '',
    // Datos personales (se habilitan después)
    beneficiaryName: '',
    email: '',
    phone: '',
    // Nuevo campo para código de país
    countryCode: '+593' // Ecuador por defecto
  });

  // Estados para datos dinámicos de las APIs
  const [banks, setBanks] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [identificationTypes, setIdentificationTypes] = useState([]);
  const [bankSearch, setBankSearch] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [filteredCountries, setFilteredCountries] = useState(COUNTRY_CODES);
  const [dropdownPosition, setDropdownPosition] = useState('bottom');

  // Refs para el dropdown de país
  const countrySelectorRef = useRef(null);
  const countryDropdownRef = useRef(null);

  // Estados de control
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isValidatingId, setIsValidatingId] = useState(false);
  const [isIdentificationValid, setIsIdentificationValid] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingClientInfo, setIsLoadingClientInfo] = useState(false); // Nuevo: cargando info del cliente local
  const [isLocalClient, setIsLocalClient] = useState(false); // Nuevo: indica si es cliente local CACVIL
  const [autoFilledFields, setAutoFilledFields] = useState({}); // Nuevo: campos autocompletados

  // Estados de validación
  const [errors, setErrors] = useState({});
  const [verificationResult, setVerificationResult] = useState(null);
  const [identificationError, setIdentificationError] = useState(''); // Nuevo estado para error de cédula
  
  // Nuevo estado para almacenar datos del contacto creado
  const [createdContactData, setCreatedContactData] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);
  useEffect(() => {
    // Filtrar bancos según búsqueda
    if (bankSearch.trim()) {
      const filtered = banks.filter(bank =>
        bank.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
        bank.code.toLowerCase().includes(bankSearch.toLowerCase())
      );
      setFilteredBanks(filtered);
    } else {
      setFilteredBanks(banks);
    }
  }, [bankSearch, banks]);
  useEffect(() => {
    // Filtrar códigos de país según búsqueda
    if (countrySearch.trim()) {
      const filtered = COUNTRY_CODES.filter(country =>
        country.country.toLowerCase().includes(countrySearch.toLowerCase()) ||
        country.code.includes(countrySearch)
      );
      setFilteredCountries(filtered);
    } else {
      setFilteredCountries(COUNTRY_CODES);
    }
  }, [countrySearch]);

  // Lógica para posicionar el dropdown de país
  useEffect(() => {
    if (showCountryDropdown && countrySelectorRef.current && countryDropdownRef.current) {
      const selectorRect = countrySelectorRef.current.getBoundingClientRect();
      const dropdownHeight = countryDropdownRef.current.offsetHeight;
      const spaceBelow = window.innerHeight - selectorRect.bottom;

      if (spaceBelow < dropdownHeight && selectorRect.top > dropdownHeight) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
  }, [showCountryDropdown]);

  // Agregar useEffect para cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.bank-selector')) {
        setShowBankDropdown(false);
      }
      if (!event.target.closest('.country-selector')) {
        setShowCountryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoadingData(true);
      console.log('🔄 [NEW-CONTACT] Cargando datos desde APIs...');

      // Llamadas paralelas a las 3 APIs
      const [banksResult, accountTypesResult, idTypesResult] = await Promise.all([
        apiService.getFinancialInstitutions(),
        apiService.getAccountTypes(),
        apiService.getIdentificationTypes()
      ]);

      // Procesar bancos - DESENCRIPTAR CÓDIGOS
      if (banksResult.success) {
        const { decrypt } = await import('@/utils/crypto/encryptionService');
        
        const processedBanks = banksResult.data.instituciones.map((inst) => {
          let code = inst.code;
          
          // Detectar si el código está encriptado (Base64 de 24 caracteres)
          const isEncrypted = /^[A-Za-z0-9+/]*={0,2}$/.test(String(code)) && String(code).length === 24;
          
          // Si está encriptado, desencriptar
          if (isEncrypted) {
            try {
              code = decrypt(code);
              console.log('🔓 [NEW-CONTACT] Banco desencriptado:', inst.name, '→', code);
            } catch (err) {
              console.error('❌ [NEW-CONTACT] Error desencriptando código banco:', err);
            }
          }
          
          return {
            ...inst,
            code: code  // Código en texto plano
          };
        });
        
        setBanks(processedBanks);
        console.log('✅ [NEW-CONTACT] Bancos cargados:', processedBanks.length);
        console.log('🔍 [NEW-CONTACT] Primer banco como ejemplo:', {
          name: processedBanks[0]?.name,
          code: processedBanks[0]?.code,
          codeType: typeof processedBanks[0]?.code,
          isBase64: /^[A-Za-z0-9+/]*={0,2}$/.test(processedBanks[0]?.code || '')
        });
      } else {
        console.error('❌ [NEW-CONTACT] Error cargando bancos');
        setBanks([{ id: '1', code: '1', name: 'Error - Banco por defecto' }]);
      }

      // Procesar tipos de cuenta - DESENCRIPTAR CÓDIGOS
      if (accountTypesResult.success) {
        const { decrypt } = await import('@/utils/crypto/encryptionService');
        
        const processedAccountTypes = accountTypesResult.data.tiposCuenta.map((tipo) => {
          let code = tipo.code;
          
          // Detectar si el código está encriptado (Base64 de 24 caracteres)
          const isEncrypted = /^[A-Za-z0-9+/]*={0,2}$/.test(String(code)) && String(code).length === 24;
          
          // Si está encriptado, desencriptar
          if (isEncrypted) {
            try {
              code = decrypt(code);
              console.log('🔓 [NEW-CONTACT] Tipo cuenta desencriptado:', tipo.name, '→', code);
            } catch (err) {
              console.error('❌ [NEW-CONTACT] Error desencriptando código tipo cuenta:', err);
            }
          }
          
          return {
            ...tipo,
            code: code  // Código en texto plano
          };
        });
        
        setAccountTypes(processedAccountTypes);
        console.log('✅ [NEW-CONTACT] Tipos de cuenta cargados:', processedAccountTypes.length);
        console.log('🔍 [NEW-CONTACT] Primer tipo de cuenta como ejemplo:', {
          name: processedAccountTypes[0]?.name,
          code: processedAccountTypes[0]?.code,
          codeType: typeof processedAccountTypes[0]?.code,
          isBase64: /^[A-Za-z0-9+/]*={0,2}$/.test(processedAccountTypes[0]?.code || '')
        });
      } else {
        console.error('❌ [NEW-CONTACT] Error cargando tipos de cuenta');
        setAccountTypes([{ id: '1', code: '1', name: 'Cuenta de Ahorros' }]);
      }

      // Procesar tipos de identificación - DESENCRIPTAR CÓDIGOS
      if (idTypesResult.success) {
        const { decrypt } = await import('@/utils/crypto/encryptionService');
        
        const processedIdTypes = idTypesResult.data.tiposIdentificacion.map((tipo) => {
          let code = tipo.code;
          
          // Detectar si el código está encriptado (Base64 de 24 caracteres)
          const isEncrypted = /^[A-Za-z0-9+/]*={0,2}$/.test(String(code)) && String(code).length === 24;
          
          // Si está encriptado, desencriptar
          if (isEncrypted) {
            try {
              code = decrypt(code);
              console.log('🔓 [NEW-CONTACT] Tipo ID desencriptado:', tipo.name, '→', code);
            } catch (err) {
              console.error('❌ [NEW-CONTACT] Error desencriptando código tipo ID:', err);
            }
          }
          
          return {
            ...tipo,
            code: code  // Código en texto plano
          };
        });
        
        setIdentificationTypes(processedIdTypes);
        console.log('✅ [NEW-CONTACT] Tipos de ID cargados:', processedIdTypes.length);

        // Seleccionar primer tipo por defecto
        if (processedIdTypes.length > 0) {
          setFormData(prev => ({
            ...prev,
            identificationType: processedIdTypes[0].code
          }));
        }
      } else {
        console.error('❌ [NEW-CONTACT] Error cargando tipos de identificación');
        const fallbackTypes = [
          { id: '1', code: '1', name: 'CEDULA', validationLength: { min: 10, max: 10, label: '10 dígitos' } },
          { id: '2', code: '2', name: 'RUC', validationLength: { min: 13, max: 13, label: '13 dígitos' } },
          { id: '3', code: '3', name: 'PASAPORTE', validationLength: { min: 6, max: 15, label: '6-15 caracteres' } },
          { id: '4', code: '4', name: 'ANALOGO', validationLength: { min: 5, max: 20, label: '5-20 caracteres' } }
        ];
        setIdentificationTypes(fallbackTypes);
        setFormData(prev => ({ ...prev, identificationType: '1' }));
      }

    } catch (error) {
      console.error('💥 [NEW-CONTACT] Error inesperado:', error);
    } finally {
      setIsLoadingData(false);
    }
  };
  const handleBankSelect = (bank) => {
    console.log('🏦 [NEW-CONTACT] Banco seleccionado:', {
      name: bank.name,
      code: bank.code,
      codeType: typeof bank.code,
      codeLength: bank.code?.length,
      isBase64: /^[A-Za-z0-9+/]*={0,2}$/.test(bank.code)
    });
    
    setFormData(prev => ({
      ...prev,
      bankDestination: bank.code,
      // Limpiar campos personales al cambiar de banco
      beneficiaryName: '',
      email: '',
      phone: ''
    }));
    setBankSearch(bank.name);
    setShowBankDropdown(false);
    
    // Resetear estados de cliente local
    setIsLocalClient(false);
    setAutoFilledFields({});
    setIsIdentificationValid(false);

    // Limpiar error si existe
    if (errors.bankDestination) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.bankDestination;
        return newErrors;
      });
    }
  };

  const handleCountrySelect = (country) => {
    setFormData(prev => ({
      ...prev,
      countryCode: country.code
    }));
    setCountrySearch('');
    setShowCountryDropdown(false);

    // Limpiar error si existe
    if (errors.countryCode) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.countryCode;
        return newErrors;
      });
    }
  };

  // Función para manejar cambio en búsqueda de banco
  const handleBankSearchChange = (e) => {
    const value = e.target.value;
    setBankSearch(value);
    setShowBankDropdown(true);

    // Si se borra la búsqueda, limpiar selección
    if (!value.trim()) {
      setFormData(prev => ({
        ...prev,
        bankDestination: ''
      }));
    }
  };

  // Función para manejar cambio en búsqueda de país
  const handleCountrySearchChange = (e) => {
    const value = e.target.value;
    setCountrySearch(value);
    setShowCountryDropdown(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Aplicar validaciones específicas por campo
    if (name === 'accountNumber') {
      processedValue = value.replace(/[^0-9]/g, '');
    } else if (name === 'phone') {
      const numericValue = value.replace(/[^0-9]/g, '');
      if (numericValue.length > 10) {
        return; // No permite más de 10 dígitos
      }
      processedValue = numericValue;
    } else if (name === 'identificationNumber') {
      const selectedIdType = getSelectedIdTypeInfo();
      if (selectedIdType && selectedIdType.validationLength) {
        const maxLength = selectedIdType.validationLength.max;
        if (value.length > maxLength) {
          return; // No permite escribir más caracteres
        }
        // Para cédula y RUC solo permitir números
        if (['1', '2'].includes(formData.identificationType)) {
          processedValue = value.replace(/[^0-9]/g, '');
        }
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Limpiar errores del campo editado
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Validación automática para identificación
    if (name === 'identificationNumber') {
      setIsIdentificationValid(false);
      if (processedValue.trim() && formData.identificationType) {
        validateIdentificationAuto(formData.identificationType, processedValue.trim());
      }
    }

    // Si cambia tipo de identificación, resetear
    if (name === 'identificationType') {
      setFormData(prev => ({
        ...prev,
        identificationNumber: ''
      }));
      setIsIdentificationValid(false);
    }

    // Limpiar resultado de verificación
    if (verificationResult && ['bankDestination', 'accountType', 'accountNumber', 'identificationNumber'].includes(name)) {
      setVerificationResult(null);
    }
  };

  // Validación automática de identificación MEJORADA
  const validateIdentificationAuto = async (idTypeCode, idNumber) => {
    const selectedIdType = identificationTypes.find(type => type.code === idTypeCode);

    if (!selectedIdType) return;

    // Validar usando apiService
    const validation = apiService.validateIdentificationNumber(selectedIdType, idNumber);

    if (validation.isValid) {
      setIsValidatingId(true);
      setIdentificationError(''); // Limpiar error si el formato es correcto

      // Verificar si es banco CACVIL (transferencia local)
      const isLocalBank = detectIfCoopVilcabamba(formData.bankDestination);
      console.log('🏦 [NEW-CONTACT] ¿Es banco local CACVIL?:', isLocalBank);

      if (isLocalBank) {
        // Si es transferencia local, buscar info del cliente con servicio 2305
        console.log('🔍 [NEW-CONTACT] Banco local detectado - Buscando información del cliente...');
        const clientFound = await fetchLocalClientInfo(idNumber);
        
        setIsIdentificationValid(true);
        setIsValidatingId(false);
        
        if (clientFound) {
          console.log('✅ [NEW-CONTACT] Cliente local encontrado - Campos autocompletados');
        } else {
          console.log('ℹ️ [NEW-CONTACT] Cliente no encontrado en CACVIL - Llenar manualmente');
          // Limpiar campos si no se encontró
          setFormData(prev => ({
            ...prev,
            beneficiaryName: '',
            email: '',
            phone: ''
          }));
          setAutoFilledFields({});
          setIsLocalClient(false);
        }
      } else {
        // Si es transferencia externa, comportamiento normal (campos manuales)
        console.log('🌐 [NEW-CONTACT] Banco externo - Campos manuales habilitados');
        setIsLocalClient(false);
        setAutoFilledFields({});
        
        // Limpiar campos para que el usuario los llene
        setFormData(prev => ({
          ...prev,
          beneficiaryName: '',
          email: '',
          phone: ''
        }));

        setTimeout(() => {
          setIsIdentificationValid(true);
          setIsValidatingId(false);
          console.log('✅ [NEW-CONTACT] Identificación validada - habilitando campos personales (manuales)');
        }, 800);
      }
    } else {
      setIsIdentificationValid(false);
      setIsValidatingId(false);
      setIdentificationError(validation.error || 'Formato de identificación no válido'); // Mostrar error de formato
    }
  };

  // Validar correo electrónico
  const validateEmail = (email) => {
    if (!email || !email.trim()) return { isValid: true }; // Campo opcional

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'El formato del correo no es válido' };
    }

    if (!email.includes('@') || !email.includes('.com')) {
      return { isValid: false, error: 'El correo debe contener @ y .com' };
    }

    return { isValid: true };
  };

  // Validar teléfono
  const validatePhone = (phone) => {
    if (!phone || !phone.trim()) return { isValid: true }; // Campo opcional

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return { isValid: false, error: 'El número de teléfono debe tener exactamente 10 dígitos' };
    }

    return { isValid: true };
  };

  // Validar formulario completo
  const validateForm = () => {
    const newErrors = {};

    // Validar datos bancarios
    if (!formData.bankDestination) {
      newErrors.bankDestination = 'Selecciona el banco de destino';
    }

    if (!formData.accountType) {
      newErrors.accountType = 'Selecciona el tipo de cuenta';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Ingresa el número de cuenta';
    } else if (formData.accountNumber.length < 8) {
      newErrors.accountNumber = 'El número de cuenta debe tener al menos 8 dígitos';
    }

    // Validar identificación
    if (!isIdentificationValid) {
      newErrors.identificationNumber = 'Debes ingresar una identificación válida';
    }

    // Validar datos personales
    if (!formData.beneficiaryName.trim()) {
      newErrors.beneficiaryName = 'Ingresa el nombre del beneficiario';
    } else if (formData.beneficiaryName.trim().length < 3) {
      newErrors.beneficiaryName = 'El nombre debe tener al menos 3 caracteres';
    }

    // Validar email si se proporciona
    if (formData.email && formData.email.trim()) {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.error;
      }
    }

    // Validar teléfono si se proporciona
    if (formData.phone && formData.phone.trim()) {
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validateForm()) {
      return;
    }

    // ⚠️ IMPORTANTE: Asegurar que los códigos de catálogo sean valores SIMPLES (no encriptados)
    // El backend necesita estos códigos en texto plano para buscar en sus catálogos
    console.log('📝 [NEW-CONTACT] Preparando datos para beneficiario...');
    console.log('🔍 [NEW-CONTACT] codifi (banco):', formData.bankDestination);
    console.log('🔍 [NEW-CONTACT] codtidr (tipo ID):', formData.identificationType);
    console.log('🔍 [NEW-CONTACT] codtcur (tipo cuenta):', formData.accountType);

    // Preparar datos para preguntas de seguridad
    const beneficiaryDataForQuestions = {
      beneficiaryName: formData.beneficiaryName,
      identificationNumber: formData.identificationNumber,
      bankName: banks.find(b => b.code === formData.bankDestination)?.name || 'Banco no encontrado',
      accountTypeName: accountTypes.find(t => t.code === formData.accountType)?.name || 'Tipo no encontrado',
      accountNumber: formData.accountNumber,
      email: formData.email?.trim() || '',
      phone: formData.phone?.trim() || '',
      // Datos para el registro final - CÓDIGOS EN TEXTO PLANO
      codifi: formData.bankDestination.toString(), // ✅ Convertir a string por si acaso
      codtidr: formData.identificationType.toString(), // ✅ Convertir a string por si acaso
      ideclr: formData.identificationNumber,
      nomclr: formData.beneficiaryName.trim(),
      codtcur: formData.accountType.toString(), // ✅ Convertir a string por si acaso
      codctac: formData.accountNumber.trim(),
      bnfema: formData.email?.trim() || '',
      bnfcel: formData.phone?.trim() || ''
    };

    console.log('✅ [NEW-CONTACT] Datos preparados (códigos en texto plano):', {
      codifi: beneficiaryDataForQuestions.codifi,
      codtidr: beneficiaryDataForQuestions.codtidr,
      codtcur: beneficiaryDataForQuestions.codtcur
    });

    setVerificationResult(beneficiaryDataForQuestions);
    setCurrentStep('questions');
  };

  const handleSecurityValidated = async (securityData) => {
  try {
    setIsCreating(true);
    console.log('➕ [NEW-CONTACT] Creando beneficiario...');

    const result = await apiService.createBeneficiaryForCurrentUser(securityData.beneficiaryData);

    if (result.success) {
      console.log('✅ [NEW-CONTACT] Beneficiario creado exitosamente:', result.data);
      
      // Almacenar los datos del contacto creado combinando respuesta API + formData
      const completeContactData = {
        // Datos de la respuesta API
        ...result.data,
        
        // Datos del formulario para asegurar completitud
        beneficiaryName: formData.beneficiaryName,
        identificationNumber: formData.identificationNumber,
        accountNumber: formData.accountNumber,
        email: formData.email,
        phone: formData.phone,
        
        // Datos enriquecidos
        bankCode: formData.bankDestination,
        bankName: banks.find(b => b.code === formData.bankDestination)?.name,
        accountTypeCode: formData.accountType,
        accountTypeName: accountTypes.find(t => t.code === formData.accountType)?.name,
        identificationTypeCode: formData.identificationType,
        identificationTypeName: identificationTypes.find(t => t.code === formData.identificationType)?.name
      };
      
      setCreatedContactData(completeContactData);
      setCurrentStep('success');
      
      // Notificar al componente padre
      if (onContactCreated) {
        onContactCreated(completeContactData);
      }

    } else {
      console.error('❌ [NEW-CONTACT] Error:', result.error.message);
      alert('Error al registrar beneficiario: ' + result.error.message);
      setCurrentStep('form');
    }
  } catch (error) {
    console.error('💥 [NEW-CONTACT] Error inesperado:', error);
    alert('Error inesperado al registrar el beneficiario');
    setCurrentStep('form');
  } finally {
    setIsCreating(false);
  }
};

  const handleBackFromQuestions = () => {
    setCurrentStep('form');
    setVerificationResult(null);
  };

  const handleCancelFromQuestions = () => {
    setCurrentStep('form');
    setVerificationResult(null);
  };

  // Funciones para manejar las acciones en la pantalla de éxito
  const handleBackToMenu = () => {
    console.log('🏠 [NEW-CONTACT] Regresando al menú principal');
    onBack();
  };

  const handleProceedToTransfer = () => {
  if (!createdContactData) {
    console.error('❌ [NEW-CONTACT] No hay datos del contacto creado');
    return;
  }

  console.log('💸 [NEW-CONTACT] Procediendo a transferencia con contacto:', createdContactData);
  console.log('🔍 [NEW-CONTACT] FormData actual:', formData);
  
  // Crear objeto con estructura consistente para transferencias
  const contactForTransfer = {
    // IDs y referencias
    id: createdContactData.id || `new-${Date.now()}`,
    
    // Nombres (múltiples propiedades para compatibilidad)
    name: formData.beneficiaryName,
    beneficiaryName: formData.beneficiaryName,
    
    // Identificación (múltiples propiedades para compatibilidad)
    cedula: formData.identificationNumber,
    identificationNumber: formData.identificationNumber,
    identificationTypeCode: formData.identificationType,
    identificationTypeName: identificationTypes.find(t => t.code === formData.identificationType)?.name,
    documentType: formData.identificationType,
    
    // Datos bancarios
    bankCode: formData.bankDestination,
    bank: banks.find(b => b.code === formData.bankDestination)?.name,
    bankName: banks.find(b => b.code === formData.bankDestination)?.name,
    
    // Datos de cuenta
    accountNumber: formData.accountNumber,
    accountType: accountTypes.find(t => t.code === formData.accountType)?.name,
    accountTypeName: accountTypes.find(t => t.code === formData.accountType)?.name,
    accountTypeCode: formData.accountType,
    
    // Contacto
    email: formData.email || '',
    phone: formData.phone || '',
    
    // Metadatos
    isNewlyCreated: true,
    avatar: formData.beneficiaryName.charAt(0).toUpperCase()
  };
  
  // Detectar si es CACVIL (Cooperativa Vilcabamba) o banco externo
  const isCoopVilcabamba = detectIfCoopVilcabamba(contactForTransfer.bankCode);
  
  console.log(`🏦 [NEW-CONTACT] Banco ${contactForTransfer.bankName} (${contactForTransfer.bankCode}) detectado como ${isCoopVilcabamba ? 'CACVIL (interno)' : 'externo'}`);
  console.log('📋 [NEW-CONTACT] Datos completos del contacto:', JSON.stringify(contactForTransfer, null, 2));
  
  // Llamar al callback con los datos y el tipo de transferencia
  if (onProceedToTransfer) {
    onProceedToTransfer({
      contactData: contactForTransfer,
      isInternal: isCoopVilcabamba
    });
  }
};
  // Función para detectar si es CACVIL (Cooperativa Vilcabamba)
  const detectIfCoopVilcabamba = (bankCode) => {
    // Lista de códigos que corresponden a CACVIL - Cooperativa Vilcabamba
    // '136' es el código oficial de CACVIL en el backend
    const cacvilCodes = ['136', 'CACVIL', '999'];
    
    // Obtener información del banco por código
    const bankInfo = banks.find(b => b.code === bankCode);
    const bankName = bankInfo?.name || '';
    
    console.log('🔍 [NEW-CONTACT] Verificando banco:', { bankCode, bankName });
    
    // Verificar por código o por nombre
    const isByCode = cacvilCodes.includes(bankCode) || cacvilCodes.includes(bankCode?.toString());
    const isByName = bankName.toUpperCase().includes('CACVIL') || 
                     bankName.toUpperCase().includes('VILCABAMBA') ||
                     bankName.toUpperCase().includes('COOPERATIVA VILCABAMBA');
    
    console.log('🏦 [NEW-CONTACT] Resultado detección:', { isByCode, isByName, finalResult: isByCode || isByName });
    
    return isByCode || isByName;
  };

  // Nueva función para buscar información del cliente local usando servicio 2305
  const fetchLocalClientInfo = async (cedula) => {
    try {
      setIsLoadingClientInfo(true);
      console.log('🔍 [NEW-CONTACT] Buscando información del cliente local para cédula:', cedula);

      const result = await apiService.getClientProfile(cedula);

      if (result.success && result.data.cliente) {
        const cliente = result.data.cliente;
        console.log('✅ [NEW-CONTACT] Cliente local encontrado:', cliente);

        // Importar función de desencriptación
        const { decrypt } = await import('@/utils/crypto/encryptionService');

        // Desencriptar campos si es necesario
        let nombre = '';
        if (cliente.apecli && cliente.nomcli) {
          nombre = `${cliente.apecli} ${cliente.nomcli}`;
        }

        let telefono = cliente.tlfcel || '';
        if (telefono && (telefono.includes('==') || telefono.includes('+') || telefono.includes('/'))) {
          try {
            const looksLikeBase64 = !telefono.includes('@') && /^[A-Za-z0-9+/=]+$/.test(telefono);
            if (looksLikeBase64) {
              telefono = decrypt(telefono);
            }
          } catch (err) {
            console.warn('⚠️ [NEW-CONTACT] Error desencriptando teléfono:', err);
          }
        }

        let email = cliente.direma || '';
        if (email && (email.includes('==') || email.includes('+') || email.includes('/'))) {
          try {
            const looksLikeBase64 = !email.includes('@') && /^[A-Za-z0-9+/=]+$/.test(email);
            if (looksLikeBase64) {
              email = decrypt(email);
            }
          } catch (err) {
            console.warn('⚠️ [NEW-CONTACT] Error desencriptando email:', err);
          }
        }

        // Limpiar teléfono (quitar código de país si viene)
        let telefonoLimpio = telefono.replace(/^\+593/, '').replace(/^593/, '');
        
        // Si el teléfono tiene 9 dígitos (sin el 0 inicial), agregarlo
        if (telefonoLimpio.length === 9 && !telefonoLimpio.startsWith('0')) {
          telefonoLimpio = '0' + telefonoLimpio;
        }
        
        // Si tiene más de 10 dígitos, tomar los últimos 10
        if (telefonoLimpio.length > 10) {
          telefonoLimpio = telefonoLimpio.slice(-10);
        }

        // Autocompletar los campos
        setFormData(prev => ({
          ...prev,
          beneficiaryName: nombre,
          email: email,
          phone: telefonoLimpio
        }));

        // Marcar qué campos fueron autocompletados
        setAutoFilledFields({
          beneficiaryName: !!nombre,
          email: !!email,
          phone: !!telefonoLimpio
        });

        setIsLocalClient(true);
        console.log('✅ [NEW-CONTACT] Campos autocompletados:', { nombre, email, telefonoLimpio });

        return true;
      } else {
        console.log('ℹ️ [NEW-CONTACT] No se encontró cliente local, campos manuales habilitados');
        setIsLocalClient(false);
        setAutoFilledFields({});
        return false;
      }
    } catch (error) {
      console.error('❌ [NEW-CONTACT] Error buscando cliente local:', error);
      setIsLocalClient(false);
      setAutoFilledFields({});
      return false;
    } finally {
      setIsLoadingClientInfo(false);
    }
  };

  // Obtener info del tipo de identificación seleccionado
  const getSelectedIdTypeInfo = () => {
    return identificationTypes.find(type => type.code === formData.identificationType);
  };

  // Obtener país seleccionado
  const getSelectedCountry = () => {
    return COUNTRY_CODES.find(country => country.code === formData.countryCode);
  };

  // Renderizar pasos
  if (currentStep === 'questions') {
    return (
      <NewContactQuestions
        beneficiaryData={verificationResult}
        beneficiaryCedula={formData.identificationNumber}
        onSecurityValidated={handleSecurityValidated}
        onBack={handleBackFromQuestions}
        onCancel={handleCancelFromQuestions}
      />
    );
  }

  if (currentStep === 'success') {
    return (
      <div className="p-6 h-full bg-gradient-to-br from-slate-50 via-blue-50 to-sky-100 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            {/* Icono de éxito */}
            <div className="w-20 h-20 bg-gradient-to-r from-sky-500 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-sky-500/20">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
              </svg>
            </div>

            {/* Título y mensaje */}
            <h1 className="text-2xl font-bold text-slate-800 mb-2">¡Beneficiario registrado!</h1>
            <p className="text-slate-600 mb-6">El beneficiario se ha guardado correctamente</p>

            {/* Información del contacto creado */}
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-6 mb-8 backdrop-blur-sm text-left">
              <h3 className="text-lg font-semibold text-sky-800 mb-4 text-center">Contacto registrado</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sky-700 font-medium">Nombre:</span>
                  <span className="text-slate-700">{createdContactData?.beneficiaryName || verificationResult?.beneficiaryName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sky-700 font-medium">Identificación:</span>
                  <span className="text-slate-700">{createdContactData?.identificationNumber || formData.identificationNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sky-700 font-medium">Banco:</span>
                  <span className="text-slate-700">{createdContactData?.bankName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sky-700 font-medium">Cuenta:</span>
                  <span className="text-slate-700">{createdContactData?.accountTypeName} - {createdContactData?.accountNumber || formData.accountNumber}</span>
                </div>
                {createdContactData?.email && (
                  <div className="flex justify-between items-center">
                    <span className="text-sky-700 font-medium">Email:</span>
                    <span className="text-slate-700">{createdContactData.email}</span>
                  </div>
                )}
                {createdContactData?.phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-sky-700 font-medium">Teléfono:</span>
                    <span className="text-slate-700">{formData.countryCode} {createdContactData.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pregunta al usuario qué desea hacer */}
            <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-4 mb-6">
              <h3 className="text-sky-800 font-medium mb-2">¿Qué deseas hacer ahora?</h3>
              <p className="text-sky-700 text-sm">
                Puedes regresar al menú principal o proceder directamente a realizar una transferencia a este contacto
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleBackToMenu}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-xl transition-colors duration-300 backdrop-blur-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" />
                </svg>
                <span>Regresar al menú</span>
              </button>

              <button
                onClick={handleProceedToTransfer}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-300 shadow-md shadow-blue-500/20"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2,10H20V8H2V10M2,16H20V14H2V16M4,4V6H22V4H4Z" />
                </svg>
                <span>Proceder con transferencia</span>
              </button>
            </div>

            {/* Información adicional */}
            <div className="mt-6 text-sm text-slate-500">
              <p>El contacto se ha guardado y está disponible en tu lista de beneficiarios</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading inicial
  if (isLoadingData) {
    return (
      <div className="p-6 h-full bg-gradient-to-br from-slate-50 via-blue-50 to-sky-100 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-flex items-center space-x-3">
              <svg className="animate-spin h-8 w-8 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-lg text-slate-700">Cargando formulario...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulario principal
  return (
    <div className="p-6 h-full bg-gradient-to-br from-slate-50 via-blue-50 to-sky-100 overflow-auto">
      <div className="max-w-2xl mx-auto">
        {/* Header mejorado con ícono */}
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-500 hover:text-slate-700 transition-colors duration-200 mr-4"
            disabled={isCreating || isValidatingId}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
            </svg>
            <span>Transferencias</span>
          </button>
        </div>

        {/* Título con ícono consistente */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-sky-500 to-sky-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/20">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15,14C12.33,14 7,15.33 7,18V20H23V18C23,15.33 17.67,14 15,14M6,10V7H4V10H1V12H4V15H6V12H9V10M15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Nuevo beneficiario</h1>
          <p className="text-slate-600">Completa los datos del beneficiario</p>
        </div>

        {/* Información de ayuda con colores actualizados */}
        <div className="bg-sky-50/80 border border-sky-200/60 rounded-xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-sky-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sky-700 font-medium mb-1">Completa los datos bancarios</p>
              <p className="text-sky-600 text-sm">
                Ingresa los datos bancarios y de identificación. Los campos personales se habilitarán automáticamente al ingresar un número de identificación válido.
              </p>
            </div>
          </div>
        </div>

  {/* Formulario con fondo (coherente con la calculadora) */}
  <div className="bg-white/90 border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm backdrop-blur-sm">
          <div className="p-6 space-y-6">

            {/* ========== SECCIÓN 1: DATOS BANCARIOS ========== */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-200/60 pb-2">Datos bancarios</h3>

              {/* Banco de destino con búsqueda */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Banco de destino *
                </label>

                {/* ✅ AGREGAR LA CLASE bank-selector AQUÍ */}
                <div className="relative bank-selector">
                  <input
                    type="text"
                    value={bankSearch}
                    onChange={handleBankSearchChange}
                    onFocus={() => setShowBankDropdown(true)}
                    placeholder="Buscar banco (ej: Pichincha, CACVIL)..."
                    className={`w-full px-4 py-3 bg-white/90 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400/50 transition-all duration-300 backdrop-blur-sm ${errors.bankDestination ? 'border-red-500' : 'border-slate-300'
                      }`}
                  />

                  {/* Dropdown de resultados */}
                  {showBankDropdown && filteredBanks.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredBanks.map((bank) => (
                        <button
                          key={bank.code}
                          type="button"
                          onClick={() => handleBankSelect(bank)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl"
                        >
                          <div className="font-medium text-slate-800">{bank.name}</div>
                          <div className="text-sm text-slate-500">Código: {bank.code}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Mensaje si no hay resultados */}
                  {showBankDropdown && bankSearch.trim() && filteredBanks.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-4">
                      <p className="text-slate-500 text-center">
                        No se encontraron bancos que coincidan con "{bankSearch}"
                      </p>
                    </div>
                  )}
                </div>

                {errors.bankDestination && (
                  <p className="text-red-500 text-sm mt-1">{errors.bankDestination}</p>
                )}

                {/* Indicador de selección actual */}
                {formData.bankDestination && (
                  <p className="text-sky-600 text-sm mt-1">
                    ✓ Banco seleccionado: {banks.find(b => b.code === formData.bankDestination)?.name}
                  </p>
                )}
              </div>

              {/* Tipo de cuenta */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de cuenta *
                </label>
                <select
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-white/90 border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400/50 transition-all duration-300 backdrop-blur-sm ${errors.accountType ? 'border-red-500' : 'border-slate-300'
                    }`}
                >
                  <option value="">Selecciona una opción</option>
                  {accountTypes.map((type) => (
                    <option key={type.code} value={type.code}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {errors.accountType && (
                  <p className="text-red-500 text-sm mt-1">{errors.accountType}</p>
                )}
              </div>

              {/* Número de cuenta */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Número de cuenta *
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  placeholder="Ingresa el número de cuenta"
                  className={`w-full px-4 py-3 bg-white/90 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400/50 transition-all duration-300 backdrop-blur-sm ${errors.accountNumber ? 'border-red-500' : 'border-slate-300'
                    }`}
                />
                {errors.accountNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>
                )}
              </div>
            </div>

            {/* ========== SECCIÓN 2: DATOS DE IDENTIFICACIÓN ========== */}
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-200/60 pb-2">Datos de identificación</h3>

              {/* Tipo de identificación */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Tipo de identificación *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {identificationTypes.map((type) => (
                    <label key={type.code} className="flex items-center p-3 border border-slate-200/60 rounded-xl hover:bg-white/70 cursor-pointer transition-colors duration-200 backdrop-blur-sm">
                      <input
                        type="radio"
                        name="identificationType"
                        value={type.code}
                        checked={formData.identificationType === type.code}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-sky-600 bg-white border-slate-300 focus:ring-sky-500 focus:ring-2"
                      />
                      <span className="ml-2 text-sm text-slate-700">{type.name}</span>
                    </label>
                  ))}
                </div>
                {errors.identificationType && (
                  <p className="text-red-500 text-sm mt-1">{errors.identificationType}</p>
                )}
              </div>

              {/* Número de identificación */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Número de identificación *
                  {getSelectedIdTypeInfo()?.validationLength && (
                    <span className="text-slate-500 font-normal ml-1">
                      ({getSelectedIdTypeInfo().validationLength.label})
                    </span>
                  )}
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    name="identificationNumber"
                    value={formData.identificationNumber}
                    onChange={handleInputChange}
                    placeholder={`Ingresa el ${getSelectedIdTypeInfo()?.name.toLowerCase() || 'número de identificación'}`}
                    disabled={!formData.identificationType}
                    maxLength={getSelectedIdTypeInfo()?.validationLength?.max || 20}
                    className={`flex-1 px-4 py-3 bg-white/90 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm ${errors.identificationNumber ? 'border-red-500' : 'border-slate-300'
                      }`}
                  />
                  {isValidatingId && (
                    <div className="flex items-center px-3">
                      <svg className="animate-spin h-6 w-6 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                  {isIdentificationValid && (
                    <div className="flex items-center px-3">
                      <svg className="w-6 h-6 text-sky-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                      </svg>
                    </div>
                  )}
                </div>
                {errors.identificationNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.identificationNumber}</p>
                )}
                {identificationError && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                    </svg>
                    {identificationError}
                  </p>
                )}
                {
                  isIdentificationValid && !identificationError && (
                    <p className="text-sky-600 text-sm mt-1">✓ Identificación validada correctamente</p>
                  )
                }
              </div>
            </div>

            {/* ========== SECCIÓN 3: DATOS PERSONALES (SOLO SI IDENTIFICACIÓN ES VÁLIDA) ========== */}
            {isIdentificationValid && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-200/60 pb-2">
                  Datos personales del beneficiario
                  {isLoadingClientInfo && (
                    <span className="ml-2 text-sm font-normal text-sky-600">
                      <svg className="animate-spin inline-block h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Buscando información...
                    </span>
                  )}
                </h3>

                {/* Mensaje informativo si es cliente local */}
                {isLocalClient && Object.values(autoFilledFields).some(v => v) && (
                  <div className="bg-sky-50/80 border border-sky-200/60 rounded-xl p-3 mb-4 backdrop-blur-sm">
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                      </svg>
                      <div>
                        <p className="text-sky-700 font-medium text-sm">Cliente de la cooperativa detectado</p>
                        <p className="text-sky-600 text-xs">Los datos se han completado automáticamente desde nuestros registros. Puedes modificarlos si es necesario.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mensaje informativo si es transferencia externa */}
                {!isLocalClient && !isLoadingClientInfo && (
                  <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-3 mb-4 backdrop-blur-sm">
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                      </svg>
                      <div>
                        <p className="text-amber-700 font-medium text-sm">Beneficiario externo</p>
                        <p className="text-amber-600 text-xs">Por favor ingresa los datos del beneficiario manualmente.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nombre del beneficiario */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre completo del beneficiario *
                    {autoFilledFields.beneficiaryName && isLocalClient && (
                      <span className="ml-2 text-xs text-sky-600 font-normal">🔒 Dato del sistema</span>
                    )}
                  </label>
                  <input
                    type="text"
                    name="beneficiaryName"
                    value={formData.beneficiaryName}
                    onChange={handleInputChange}
                    placeholder="Ingresa el nombre completo"
                    readOnly={autoFilledFields.beneficiaryName && isLocalClient}
                    className={`w-full px-4 py-3 border rounded-xl text-slate-800 placeholder-slate-400 transition-all duration-300 backdrop-blur-sm ${
                      autoFilledFields.beneficiaryName && isLocalClient 
                        ? 'bg-slate-100 border-slate-300 cursor-not-allowed' 
                        : 'bg-white/90 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400/50'
                    } ${errors.beneficiaryName ? 'border-red-500' : 'border-slate-300'}`}
                  />
                  {errors.beneficiaryName && (
                    <p className="text-red-500 text-sm mt-1">{errors.beneficiaryName}</p>
                  )}
                </div>

                {/* Correo electrónico */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Correo electrónico (opcional)
                    {autoFilledFields.email && isLocalClient && (
                      <span className="ml-2 text-xs text-sky-600 font-normal">🔒 Dato del sistema</span>
                    )}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="ejemplo@correo.com"
                      readOnly={autoFilledFields.email && isLocalClient}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-slate-800 placeholder-slate-400 transition-all duration-300 backdrop-blur-sm ${
                        autoFilledFields.email && isLocalClient 
                          ? 'bg-slate-100 border-slate-300 cursor-not-allowed' 
                          : 'bg-white/90 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400/50'
                      } ${errors.email ? 'border-red-500' : 'border-slate-300'}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                  {!(autoFilledFields.email && isLocalClient) && (
                    <p className="text-slate-500 text-sm mt-1">Debe contener @ y .com</p>
                  )}
                </div>

                {/* Número de teléfono */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Número de teléfono celular (opcional)
                    {autoFilledFields.phone && isLocalClient && (
                      <span className="ml-2 text-xs text-sky-600 font-normal">🔒 Dato del sistema</span>
                    )}
                  </label>
                  <div className="flex space-x-3">
                    {/* Selector de código de país */}
                    <div className="relative country-selector" ref={countrySelectorRef}>
                      <button
                        type="button"
                        onClick={() => !(autoFilledFields.phone && isLocalClient) && setShowCountryDropdown(!showCountryDropdown)}
                        disabled={autoFilledFields.phone && isLocalClient}
                        className={`flex items-center space-x-2 px-3 py-3 border rounded-xl transition-all duration-300 backdrop-blur-sm min-w-[120px] ${
                          autoFilledFields.phone && isLocalClient
                            ? 'bg-slate-100 border-slate-300 cursor-not-allowed'
                            : 'bg-white/90 border-slate-300 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400/50'
                        }`}
                      >
                        <span className="text-lg">{getSelectedCountry()?.flag || '🌍'}</span>
                        <span className="text-slate-700 font-medium text-sm">{getSelectedCountry()?.country.split(' ')[0]}</span>
                        <span className="text-slate-500 text-sm">{formData.countryCode}</span>
                        <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
                        </svg>
                      </button>

                      {/* Dropdown de países */}
                      {showCountryDropdown && (
                        <div
                          ref={countryDropdownRef}
                          className={`absolute z-50 w-80 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto ${dropdownPosition === 'top' ? 'bottom-full mb-2' : 'mt-1'
                            }`}
                        >
                          {filteredCountries.length === 0 ? (
                            <div className="p-4 text-center text-slate-500">
                              No se encontraron países que coincidan con "{countrySearch}"
                            </div>
                          ) : (
                            filteredCountries.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => handleCountrySelect(country)}
                                className="w-full px-4 py-3 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl"
                              >
                                <div className="flex items-center space-x-3">
                                  <span className="text-lg">{country.flag}</span>
                                  <span className="font-medium text-slate-800">{country.country}</span>
                                  <span className="text-slate-500">{country.code}</span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="999 999 999"
                      readOnly={autoFilledFields.phone && isLocalClient}
                      className={`flex-1 px-4 py-3 border rounded-xl text-slate-800 placeholder-slate-400 transition-all duration-300 backdrop-blur-sm ${
                        autoFilledFields.phone && isLocalClient 
                          ? 'bg-slate-100 border-slate-300 cursor-not-allowed' 
                          : 'bg-white/90 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400/50'
                      } ${errors.phone ? 'border-red-500' : 'border-slate-300'}`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                  {!(autoFilledFields.phone && isLocalClient) && (
                    <p className="text-slate-500 text-sm mt-1">
                      Exactamente 10 dígitos ({formData.phone.length}/10)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ========== BOTONES ========== */}
            <div className="flex space-x-4 pt-6 border-t border-slate-200/60">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 bg-slate-200/80 hover:bg-slate-300/80 text-slate-800 font-medium py-3 px-6 rounded-xl transition-colors duration-300 backdrop-blur-sm"
                disabled={isCreating || isValidatingId}
              >
                Cancelar
              </button>

              {isIdentificationValid && (
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={isCreating}
                  className="flex-1 bg-gradient-to-r from-sky-600 to-sky-600 hover:from-sky-700 hover:to-sky-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center shadow-md shadow-sky-500/20"
                >
                  {isCreating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    'Verificar datos'
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default NewContact;