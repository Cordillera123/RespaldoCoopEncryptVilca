import React, { useState, useEffect } from 'react';
import apiServiceTransfer from '../../services/apiserviceTransfer.js';
import AccountCreatedSuccess from './AccountCreatedSuccess.jsx';

const AddAccountToBeneficiary = ({ beneficiary, onBack, onSuccess, onTransferToAccount }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdAccountData, setCreatedAccountData] = useState(null);

  // Estados para catálogos
  const [institutions, setInstitutions] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);

  // Estados para búsqueda de instituciones (como en NewContact)
  const [institutionSearch, setInstitutionSearch] = useState('');
  const [showInstitutionDropdown, setShowInstitutionDropdown] = useState(false);
  const [filteredInstitutions, setFilteredInstitutions] = useState([]);

  // Estados del formulario
  const [formData, setFormData] = useState({
    accountNumber: '',
    institutionCode: '',
    accountTypeCode: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCatalogs();
  }, []);

  // Filtrar instituciones según búsqueda (como en NewContact)
  useEffect(() => {
    if (institutionSearch.trim()) {
      const filtered = institutions.filter(institution =>
        institution.name.toLowerCase().includes(institutionSearch.toLowerCase()) ||
        institution.code.toLowerCase().includes(institutionSearch.toLowerCase())
      );
      setFilteredInstitutions(filtered);
    } else {
      setFilteredInstitutions(institutions);
    }
  }, [institutionSearch, institutions]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.institution-selector')) {
        setShowInstitutionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCatalogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar instituciones financieras (API 2310)
      const institutionsResult = await apiServiceTransfer.getFinancialInstitutions();
      
      // Cargar tipos de cuenta (API 2320)
      const accountTypesResult = await apiServiceTransfer.getAccountTypes();

      if (institutionsResult.success && accountTypesResult.success) {
        setInstitutions(institutionsResult.data.instituciones || []);
        setAccountTypes(accountTypesResult.data.tiposCuenta || []);
      } else {
        setError('Error al cargar los catálogos necesarios');
      }
    } catch (error) {
      console.error('Error cargando catálogos:', error);
      setError('Error inesperado al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Manejar selección de institución (como en NewContact)
  const handleInstitutionSelect = (institution) => {
    setFormData(prev => ({
      ...prev,
      institutionCode: institution.code
    }));
    setInstitutionSearch(institution.name);
    setShowInstitutionDropdown(false);

    // Limpiar error si existe
    if (errors.institutionCode) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.institutionCode;
        return newErrors;
      });
    }
  };

  // Manejar cambio en búsqueda de institución (como en NewContact)
  const handleInstitutionSearchChange = (e) => {
    const value = e.target.value;
    setInstitutionSearch(value);
    setShowInstitutionDropdown(true);

    // Si se borra la búsqueda, limpiar selección
    if (!value.trim()) {
      setFormData(prev => ({
        ...prev,
        institutionCode: ''
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Validación especial para número de cuenta (solo números)
    if (name === 'accountNumber') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.institutionCode) {
      newErrors.institutionCode = 'Selecciona la institución financiera';
    }

    if (!formData.accountTypeCode) {
      newErrors.accountTypeCode = 'Selecciona el tipo de cuenta';
    }

    if (!formData.accountNumber || formData.accountNumber.trim().length === 0) {
      newErrors.accountNumber = 'Ingresa el número de cuenta';
    } else if (formData.accountNumber.trim().length < 10) {
      newErrors.accountNumber = 'El número de cuenta debe tener al menos 10 dígitos';
    } else if (formData.accountNumber.trim().length > 20) {
      newErrors.accountNumber = 'El número de cuenta no puede tener más de 20 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      console.log('💾 [ADD-ACCOUNT] Agregando nueva cuenta al beneficiario:', beneficiary.name);

      // 🚀 NUEVA LÓGICA: En lugar de crear un beneficiario duplicado,
      // solo creamos los datos de la nueva cuenta y los pasamos al flujo
      
      // Preparar datos de la cuenta creada (SIN llamar a la API 2365)
      const accountData = {
        ...beneficiary,
        accountNumber: formData.accountNumber.trim(),
        bankCode: formData.institutionCode,
        accountTypeCode: formData.accountTypeCode,
        bank: institutions.find(i => i.code === formData.institutionCode)?.name || 'Banco',
        accountType: accountTypes.find(t => t.code === formData.accountTypeCode)?.name || 'Cuenta',
        // Marcar como cuenta adicional del beneficiario existente
        isAdditionalAccount: true,
        originalBeneficiaryId: beneficiary.id
      };

      console.log('✅ [ADD-ACCOUNT] Nueva cuenta preparada (sin duplicar beneficiario):', accountData);
      
      setCreatedAccountData(accountData);
      setShowSuccess(true);

      // 📝 NOTA: La cuenta se registrará en el servidor solo cuando se haga la primera
      // transferencia, evitando así crear beneficiarios duplicados innecesariamente
      
    } catch (error) {
      console.error('💥 [ADD-ACCOUNT] Error inesperado:', error);
      setError('Error inesperado al agregar la cuenta');
    } finally {
      setSaving(false);
    }
  };

  const handleTransferToAccount = (accountData, isInternal) => {
    if (onTransferToAccount) {
      onTransferToAccount(accountData, isInternal);
    }
  };

  const handleBackToContacts = () => {
    if (onSuccess) {
      onSuccess(createdAccountData);
    } else {
      onBack();
    }
  };

  // Mostrar vista de éxito si se creó la cuenta exitosamente
  if (showSuccess && createdAccountData) {
    return (
      <AccountCreatedSuccess 
        beneficiaryData={createdAccountData}
        onTransferToAccount={handleTransferToAccount}
        onBackToContacts={handleBackToContacts}
      />
    );
  }

  if (loading) {
    return (
      <div className="p-6 h-full bg-gray-50 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
              <svg className="animate-spin h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            </div>
            <p className="text-slate-600">Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 h-full bg-gray-50 overflow-auto">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-500 hover:text-slate-700 transition-colors duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
            </svg>
            <span>Volver</span>
          </button>
        </div>

        {/* Título */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Agregar Cuenta Bancaria</h1>
          <p className="text-sm text-slate-600 mt-1">
            Agrega una nueva cuenta para el beneficiario
          </p>
        </div>

        {/* Información del beneficiario (precargada) */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-lg font-bold text-sky-600 mr-4">
              {beneficiary.avatar || beneficiary.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-800">{beneficiary.name}</p>
              <p className="text-sm text-gray-500">Cédula: {beneficiary.cedula}</p>
              {beneficiary.email && (
                <p className="text-sm text-gray-500">Email: {beneficiary.email}</p>
              )}
              {beneficiary.phone && (
                <p className="text-sm text-gray-500">Teléfono: {beneficiary.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Error general */}
        {error && (
          <div className="bg-red-50/80 border border-red-200/60 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Formulario */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Datos de la cuenta</h3>

            {/* Institución Financiera con búsqueda (como en NewContact) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Institución Financiera *
              </label>

              {/* Contenedor con clase para detectar clics fuera */}
              <div className="relative institution-selector">
                <input
                  type="text"
                  value={institutionSearch}
                  onChange={handleInstitutionSearchChange}
                  onFocus={() => setShowInstitutionDropdown(true)}
                  placeholder="Buscar institución (ej: Las Naves, Pichincha)..."
                  disabled={institutions.length === 0}
                  className={`w-full px-4 py-2 bg-white border rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-sky-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.institutionCode ? 'border-red-500' : 'border-slate-300'
                  }`}
                />

                {/* Dropdown de resultados */}
                {showInstitutionDropdown && filteredInstitutions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredInstitutions.map((institution) => (
                      <button
                        key={institution.code}
                        type="button"
                        onClick={() => handleInstitutionSelect(institution)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors duration-200 first:rounded-t-md last:rounded-b-md"
                      >
                        <div className="font-medium text-slate-800">{institution.name}</div>
                        <div className="text-sm text-slate-500">Código: {institution.code}</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Mensaje si no hay resultados */}
                {showInstitutionDropdown && institutionSearch.trim() && filteredInstitutions.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg p-4">
                    <p className="text-slate-500 text-center">
                      No se encontraron instituciones que coincidan con "{institutionSearch}"
                    </p>
                  </div>
                )}

                {/* Spinner de carga */}
                {institutions.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg p-4">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-4 w-4 text-sky-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      <span className="text-slate-500 text-sm">Cargando instituciones...</span>
                    </div>
                  </div>
                )}
              </div>

              {errors.institutionCode && (
                <p className="text-red-500 text-sm mt-1 font-medium">{errors.institutionCode}</p>
              )}

              {/* Indicador de selección actual */}
              {formData.institutionCode && (
                <p className="text-emerald-600 text-sm mt-1">
                  ✓ Institución seleccionada: {institutions.find(i => i.code === formData.institutionCode)?.name}
                </p>
              )}
            </div>

            {/* Tipo de Cuenta */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo de Cuenta
              </label>
              <select
                name="accountTypeCode"
                value={formData.accountTypeCode}
                onChange={handleInputChange}
                disabled={accountTypes.length === 0}
                className={`w-full px-4 py-2 bg-white border rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-sky-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.accountTypeCode ? 'border-red-500' : 'border-slate-300'
                }`}
              >
                <option value="">
                  {accountTypes.length === 0 ? 'Cargando tipos de cuenta...' : 'Selecciona un tipo'}
                </option>
                {accountTypes.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.accountTypeCode && (
                <p className="text-red-500 text-sm mt-1 font-medium">{errors.accountTypeCode}</p>
              )}
            </div>

            {/* Número de Cuenta */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Número de Cuenta
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                placeholder="Ingresa el número de cuenta"
                maxLength="20"
                className={`w-full px-4 py-2 bg-white border rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-sky-400/50 transition-all duration-300 ${
                  errors.accountNumber ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.accountNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                Solo números, entre 10 y 20 dígitos
              </p>
            </div>

            {/* Botones */}
            <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving || institutions.length === 0 || accountTypes.length === 0}
                className="w-full md:w-auto flex-1 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-md transition-all duration-300 flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  'Agregar Cuenta'
                )}
              </button>
              <button
                type="button"
                onClick={onBack}
                disabled={saving}
                className="w-full md:w-auto flex-1 bg-transparent border border-gray-300 hover:bg-gray-100 text-slate-800 font-medium py-2 px-6 rounded-md transition-colors duration-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAccountToBeneficiary;
