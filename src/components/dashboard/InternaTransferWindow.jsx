import React, { useState, useEffect, useMemo } from 'react';
import apiService from '../../services/apiService';
import apiServiceTransfer from '../../services/apiserviceTransfer';
import NewContact from './NewContact';
import SameAccounts from './SameAccounts';
import TransferCoopint from './TransferCoopint';
import TransferExt from './TransferExt';
import AddAccountToBeneficiary from './AddAccountToBeneficiary';

const InternaTransferWindow = ({ openWindow }) => {
  const [currentView, setCurrentView] = useState('main'); // 'main', 'newContact', 'sameAccounts', 'transferCoop', 'transferExt', 'addAccount'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContactForTransfer, setSelectedContactForTransfer] = useState(null);
  const [selectedBeneficiaryForAccount, setSelectedBeneficiaryForAccount] = useState(null);

  // Estados para beneficiarios de la API
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para menú contextual
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [deletingContactId, setDeletingContactId] = useState(null);

  // Configuración de paginación simplificada
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  // Usar useMemo para filtros y paginación
  const filteredBeneficiaries = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) {
      return beneficiaries;
    }

    const term = searchTerm.toLowerCase().trim();

    return beneficiaries.filter(beneficiario =>
      beneficiario.name.toLowerCase().includes(term) ||
      beneficiario.bank.toLowerCase().includes(term) ||
      beneficiario.cedula?.includes(term) ||
      beneficiario.accountNumber?.includes(term) ||
      beneficiario.email?.toLowerCase().includes(term) ||
      beneficiario.phone?.includes(term)
    );
  }, [beneficiaries, searchTerm]);

  // Paginación calculada con useMemo para evitar duplicaciones
  const paginationData = useMemo(() => {
    const totalItems = filteredBeneficiaries.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    // Calcular índices correctamente
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    // Crear nueva instancia del array usando slice
    const currentItems = filteredBeneficiaries.slice(startIndex, endIndex);

    return {
      items: currentItems,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        startIndex: totalItems > 0 ? startIndex + 1 : 0,
        endIndex: Math.min(endIndex, totalItems)
      }
    };
  }, [filteredBeneficiaries, currentPage]);

  // Resetear página cuando cambie la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Cerrar menú contextual al hacer click fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenuId(null);
    };

    if (activeMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeMenuId]);

  const loadBeneficiaries = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 [TRANSFER] Cargando beneficiarios...');
      // Llamar en paralelo a la API de beneficiarios externos (2330)
      // y a la API de beneficiarios cooperativa (2325)
      const [extRes, coopRes] = await Promise.allSettled([
        apiService.getCurrentUserBeneficiaries(),
        apiServiceTransfer.getCurrentUserCoopBeneficiaries()
      ]);

      const externalList = (extRes.status === 'fulfilled' && extRes.value.success)
        ? (extRes.value.data.beneficiarios || [])
        : [];

      const coopList = (coopRes.status === 'fulfilled' && coopRes.value.success)
        ? (coopRes.value.data.beneficiarios || [])
        : [];

      // Verificar si HUBO ERRORES REALES (no solo listas vacías)
      const extHadError = extRes.status === 'rejected' || (extRes.status === 'fulfilled' && !extRes.value.success && extRes.value.error?.code !== 'NO_BENEFICIARIES_FOUND');
      const coopHadError = coopRes.status === 'rejected' || (coopRes.status === 'fulfilled' && !coopRes.value.success && coopRes.value.error?.code !== 'NO_COOP_BENEFICIARIES_FOUND');

      // Solo mostrar error si AMBAS APIs fallaron con errores reales (no solo sin datos)
      if (extHadError && coopHadError) {
        const extErr = extRes.status === 'fulfilled' ? extRes.value?.error?.message : extRes.reason;
        const coopErr = coopRes.status === 'fulfilled' ? coopRes.value?.error?.message : coopRes.reason;
        console.error('❌ [TRANSFER] Fallaron ambas llamadas de beneficiarios con errores reales', { extErr, coopErr });
        setError('No se pudieron cargar los beneficiarios. Intenta más tarde.');
        setBeneficiaries([]);
        return;
      }

      console.log(`✅ [TRANSFER] Beneficiarios cargados - Externos: ${externalList.length}, Cooperativa: ${coopList.length}`);

      // Función para detectar si es CACVIL (Cooperativa Vilcabamba)
      const isCoopVilcabamba = (beneficiario) => {
        const bankCode = beneficiario.bankCode || '';
        const bankName = (beneficiario.bank || '').toUpperCase();
        
        // Solo CACVIL/Vilcabamba es cooperativa interna
        // Las Naves (código 136) ahora es EXTERNA
        return bankCode === 'CACVIL' || 
               bankCode === '999' ||
               bankName.includes('CACVIL') ||
               bankName.includes('VILCABAMBA') ||
               bankName.includes('COOPERATIVA VILCABAMBA');
      };

      // Normalizar y RE-VALIDAR beneficiarios cooperativa
      // Solo marcar como internos si realmente son CACVIL
      const normalizedCoop = (coopList || []).map(b => {
        const isReallyInternal = isCoopVilcabamba(b);
        console.log(`🔍 [TRANSFER] Beneficiario cooperativo: ${b.name} (${b.bank}) - ¿Es CACVIL?: ${isReallyInternal}`);
        return {
          ...b,
          isCoopMember: isReallyInternal,
          isInternal: isReallyInternal
        };
      });

      // Para beneficiarios externos, RECALCULAR si son realmente de CACVIL
      // (no confiar en el isCoopMember que viene de la API)
      const normalizedExternal = (externalList || []).map(b => {
        const isReallyInternal = isCoopVilcabamba(b);
        console.log(`🔍 [TRANSFER] Beneficiario externo: ${b.name} (${b.bank}) - ¿Es CACVIL?: ${isReallyInternal}`);
        return {
          ...b,
          isCoopMember: isReallyInternal,
          isInternal: isReallyInternal
        };
      });

      // Merge y dedupe por accountNumber+bankCode o por cedula
      const mergedMap = new Map();

      const pushToMap = (item) => {
        const key = (item.accountNumber ? item.accountNumber : (item.cedula || item.id || Math.random().toString(36))) + '::' + (item.bankCode || item.bank || '');
        if (!mergedMap.has(key)) mergedMap.set(key, item);
        else {
          // Preferir la versión interna si hay conflicto
          const existing = mergedMap.get(key);
          if (!existing.isInternal && item.isInternal) mergedMap.set(key, item);
        }
      };

      normalizedCoop.forEach(pushToMap);
      normalizedExternal.forEach(pushToMap);

      const merged = Array.from(mergedMap.values());

      console.log('✅ [TRANSFER] Beneficiarios combinados. externos:', normalizedExternal.length, 'internos:', normalizedCoop.length, 'total:', merged.length);
      setBeneficiaries(merged);
    } catch (error) {
      console.error('💥 [TRANSFER] Error inesperado:', error);
      setError('Error inesperado al cargar los beneficiarios');
      setBeneficiaries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setSelectedContactForTransfer(null); // ✅ LIMPIAR contacto seleccionado
    setSelectedBeneficiaryForAccount(null);
  };

  const handleShowAddAccount = (beneficiary) => {
    console.log('🔄 [INTERNA-TRANSFER] Mostrando agregar cuenta para:', beneficiary.name);
    setSelectedBeneficiaryForAccount(beneficiary);
    setCurrentView('addAccount');
  };

  const handleBackFromAddAccount = () => {
    console.log('🔄 [INTERNA-TRANSFER] Regresando de agregar cuenta');
    setCurrentView('transferCoop'); // Volver a la vista de transferencia
    setSelectedBeneficiaryForAccount(null);
  };

  const handleAccountCreated = (accountData) => {
    console.log('✅ [INTERNA-TRANSFER] Cuenta creada exitosamente:', accountData);
    // Recargar beneficiarios para incluir la nueva cuenta
    loadBeneficiaries();
    // Volver a la vista principal
    setCurrentView('main');
    setSelectedBeneficiaryForAccount(null);
  };

  const handleTransferToAccount = (accountData, isInternal) => {
    console.log('🔄 [INTERNA-TRANSFER] Iniciando transferencia a cuenta:', {
      account: accountData.accountNumber,
      bank: accountData.bank,
      isInternal: isInternal
    });

    // Preparar contacto para transferencia
    const contactForTransfer = {
      id: `new_${Date.now()}`,
      name: accountData.name,
      cedula: accountData.cedula,
      identificationNumber: accountData.cedula,
      accountNumber: accountData.accountNumber,
      bank: accountData.bank,
      bankCode: accountData.bankCode, // ✅ AGREGAR bankCode para transferencias externas
      accountType: accountData.accountType,
      accountTypeCode: accountData.accountTypeCode, // ✅ AGREGAR accountTypeCode
      email: accountData.email,
      phone: accountData.phone,
      avatar: accountData.avatar || accountData.name?.charAt(0).toUpperCase(),
      isNewAccount: true,
      isInternalAccount: isInternal,
      // Campos adicionales para transferencias externas (API 2380)
      documentType: '1', // Tipo documento por defecto (cédula)
      codigoBanco: accountData.bankCode, // ✅ CAMPO ESPECÍFICO que falta en el error
      tipoDocumentoReceptor: '1', // Cédula por defecto
      cedulaReceptor: accountData.cedula,
      nombreReceptor: accountData.name,
      tipoCuentaReceptor: accountData.accountTypeCode
    };

    setSelectedContactForTransfer(contactForTransfer);
    
    // Redirigir según el tipo de cuenta
    if (isInternal) {
      setCurrentView('transferCoop');
    } else {
      setCurrentView('transferExt');
    }
    
    setSelectedBeneficiaryForAccount(null);
  };
  const handleContactSelect = (contact) => {
    console.log('Contacto seleccionado:', contact);
    // Aquí podrías abrir un formulario de transferencia con los datos precargados
  };

  // Función de cambio de página simplificada
  const handlePageChange = (newPage) => {
    const { totalPages } = paginationData.pagination;

    if (newPage >= 1 && newPage <= totalPages) {
      console.log(`📄 Cambiando de página ${currentPage} a ${newPage}`);
      setCurrentPage(newPage);
    }
  };

  const handleRetry = () => {
    loadBeneficiaries();
  };

  const handleMenuToggle = (contactId, event) => {
    event.stopPropagation();
    setActiveMenuId(activeMenuId === contactId ? null : contactId);
  };

  const handleDeleteContact = async (contact) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar a ${contact.name}?`)) {
      return;
    }

    try {
      setDeletingContactId(contact.id);
      setActiveMenuId(null);

      console.log('🗑️ [TRANSFER] Eliminando contacto:', contact.name);

      const deleteData = {
        codifi: contact.bankCode,
        codtidr: contact.documentType || '1',
        ideclr: contact.cedula,
        codtcur: contact.accountTypeCode,
        codctac: contact.accountNumber
      };

      const result = await apiService.deleteBeneficiaryForCurrentUser(deleteData);

      if (result.success) {
        console.log('✅ [TRANSFER] Contacto eliminado exitosamente');
        setBeneficiaries(prev => prev.filter(b => b.id !== contact.id));
        alert('Beneficiario eliminado correctamente');
      } else {
        console.error('❌ [TRANSFER] Error al eliminar contacto:', result.error.message);
        alert('Error al eliminar el beneficiario: ' + result.error.message);
      }
    } catch (error) {
      console.error('💥 [TRANSFER] Error inesperado al eliminar:', error);
      alert('Error inesperado al eliminar el beneficiario');
    } finally {
      setDeletingContactId(null);
    }
  };

  // FUNCIÓN: Determinar si el beneficiario es de CACVIL (Cooperativa Vilcabamba) o externo
  const isCoopVilcabamba = (contact) => {
    // Verificar por código de banco CACVIL
    // Nota: Actualizar este código según el código oficial de CACVIL en el sistema bancario
    if (contact.bankCode === 'CACVIL' || contact.bankCode === '999') {
      return true;
    }

    // Verificar por nombre del banco
    const bankName = contact.bank || contact.bankName || '';
    const upperBankName = bankName.toUpperCase();
    
    return upperBankName.includes('CACVIL') ||
      upperBankName.includes('VILCABAMBA') ||
      upperBankName.includes('COOPERATIVA VILCABAMBA') ||
      upperBankName.includes('COOP VILCABAMBA') ||
      upperBankName.includes('COOPERATIVA DE AHORRO Y CREDITO VILCABAMBA') ||
      upperBankName.includes('COAC VILCABAMBA');
  };

  // FUNCIÓN: Manejar transferencia según tipo de banco
  const handleTransferToContact = (contact) => {
    setActiveMenuId(null);

    console.log('🔄 [TRANSFER-ROUTE] Analizando tipo de transferencia para:', contact.name);
    console.log('🏦 [TRANSFER-ROUTE] Banco:', contact.bank, 'Código:', contact.bankCode);

    // ✅ GUARDAR el contacto seleccionado
    setSelectedContactForTransfer(contact);

    if (isCoopVilcabamba(contact)) {
      console.log('✅ [TRANSFER-ROUTE] Es miembro de CACVIL (Cooperativa Vilcabamba), redirigiendo a TransferCoopint');
      setCurrentView('transferCoop');
    } else {
      console.log('🌐 [TRANSFER-ROUTE] Es banco externo, redirigiendo a TransferExt');
      setCurrentView('transferExt');
    }
  };

  const handleEditContact = (contact) => {
    setActiveMenuId(null);
    console.log('Editar contacto:', contact);
  };

  const handleAddAccount = (contact) => {
    setActiveMenuId(null);
    console.log('Agregar cuenta para:', contact);
  };

  const handleViewHistory = (contact) => {
    setActiveMenuId(null);
    console.log('Ver historial de:', contact);
  };

  // Manejar cuando se crea un nuevo contacto
  const handleContactCreated = (newContact) => {
    console.log('✅ [TRANSFER] Nuevo contacto creado:', newContact);
    // Recargar la lista de beneficiarios
    loadBeneficiaries();
    // NO regresar automáticamente, esperar decisión del usuario
  };

  // Manejar cuando el usuario elige proceder con transferencia después de crear contacto
  const handleProceedToTransfer = (transferData) => {
    console.log('🚀 [TRANSFER] Procediendo con transferencia:', transferData);

    const { contactData, isInternal } = transferData;

    console.log('👤 [TRANSFER-DEBUG] Datos del contacto recibido:', contactData);
    console.log('🏦 [TRANSFER-DEBUG] Es interno:', isInternal);

    // Establecer el contacto seleccionado para la transferencia
    setSelectedContactForTransfer(contactData);
    console.log('✅ [TRANSFER-DEBUG] Contacto establecido para transferencia:', contactData);

    // Dirigir al formulario correspondiente según el tipo de banco
    if (isInternal) {
      console.log('🏦 [TRANSFER] Dirigiendo a transferencia cooperativa (CACVIL - Vilcabamba)');
      setCurrentView('transferCoop');
    } else {
      console.log('🏛️ [TRANSFER] Dirigiendo a transferencia externa');
      setCurrentView('transferExt');
    }
  };

  // Función para generar números de página visible
  const getVisiblePageNumbers = () => {
    const { totalPages } = paginationData.pagination;
    const maxVisible = 3; // Mostrar máximo 3 números de página

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    // Ajustar si llegamos al final
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  // Renderizar componentes según la vista actual
  if (currentView === 'newContact') {
    return (
      <NewContact
        onBack={handleBackToMain}
        onContactCreated={handleContactCreated}
        onProceedToTransfer={handleProceedToTransfer}
      />
    );
  }

  if (currentView === 'sameAccounts') {
    return <SameAccounts onBack={handleBackToMain} openWindow={openWindow} />;
  }

  // NUEVAS RUTAS para transferencias cooperativa y externas
  if (currentView === 'transferCoop') {
    return (
      <TransferCoopint
        onBack={handleBackToMain}
        preselectedContact={selectedContactForTransfer} // ✅ PASAR CONTACTO
        onShowAddAccount={handleShowAddAccount}
      />
    );
  }

  if (currentView === 'transferExt') {
    return (
      <TransferExt
        onBack={handleBackToMain}
        preselectedContact={selectedContactForTransfer} // ✅ PASAR CONTACTO
        onShowAddAccount={handleShowAddAccount}
      />
    );
  }

  if (currentView === 'addAccount' && selectedBeneficiaryForAccount) {
    return (
      <AddAccountToBeneficiary
        beneficiary={selectedBeneficiaryForAccount}
        onBack={handleBackFromAddAccount}
        onSuccess={handleAccountCreated}
        onTransferToAccount={handleTransferToAccount}
      />
    );
  }

  // Vista principal optimizada para modal con fondos elegantes
  return (
    <div className="min-h-full bg-sky-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11,8C11,9.66 9.66,11 8,11C6.34,11 5,9.66 5,8C5,6.34 6.34,5 8,5C9.66,5 11,6.34 11,8M14,20H2V18C2,15.79 4.69,14 8,14C11.31,14 14,15.79 14,18V20M22,12V14H13V12H22M22,8V10H13V8H22M22,4V6H13V4H22Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Transferencias</h1>
        </div>

        {/* Opciones principales */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setCurrentView('newContact')}
            className="flex items-center gap-3 px-5 py-2.5 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:border-sky-400 transition-all duration-300"
          >
            <div className="w-9 h-9 bg-gradient-to-r from-sky-500 to-sky-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15,14C12.33,14 7,15.33 7,18V20H23V18C23,15.33 17.67,14 15,14M6,10V7H4V10H1V12H4V15H6V12H9V10M15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Nuevo Contacto</h3>
              <p className="text-xs text-gray-500">Añadir un beneficiario</p>
            </div>
          </button>

          <button
            onClick={() => setCurrentView('sameAccounts')}
            className="flex items-center gap-3 px-5 py-2.5 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:border-sky-400 transition-all duration-300"
          >
            <div className="w-9 h-9 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5,6H23V18H5V6M14,9A3,3 0 0,1 17,12A3,3 0 0,1 14,15A3,3 0 0,1 11,12A3,3 0 0,1 14,9M9,8A2,2 0 0,1 7,10V14A2,2 0 0,1 9,16H19A2,2 0 0,1 21,14V10A2,2 0 0,1 19,8H9Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Mis Cuentas</h3>
              <p className="text-xs text-gray-500">Transferir entre propias</p>
            </div>
          </button>
        </div>

        {/* Área de contenido principal */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
          {/* Header de la lista y búsqueda */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Mis Beneficiarios</h2>
            <div className="w-1/3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar contacto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1">
            {loading ? (
              // Estado de carga
              <div className="p-10 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm">Cargando beneficiarios...</p>
              </div>
            ) : error ? (
              // Estado de error
              <div className="p-10 text-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                  <div className="text-red-600 mb-2 text-sm">⚠️ Error al cargar</div>
                  <p className="text-red-700 mb-4 text-sm">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            ) : paginationData.items.length > 0 ? (
              // Lista de beneficiarios
              <div className="divide-y divide-gray-200">
                {paginationData.items.map((contact, index) => (
                  <div
                    key={contact.id}
                    className="px-6 py-3 hover:bg-gray-50 transition-colors duration-200 relative group"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-md flex-shrink-0 shadow-md ${isCoopVilcabamba(contact)
                          ? 'bg-gradient-to-r from-sky-500 to-sky-600'
                          : 'bg-gradient-to-r from-gray-600 to-gray-700'
                        }`}>
                        {contact.avatar}
                      </div>

                      {/* Información del contacto */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-sky-600 transition-colors">
                            {contact.name}
                          </p>
                          <span className="text-xs text-gray-500 ml-4 flex-shrink-0 font-mono">
                            CI: {contact.cedula || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-600">{contact.bank}</span>
                          <span className="text-gray-400 text-xs">•</span>
                          <span className="text-xs text-gray-500">{contact.accountType} ({contact.accountNumber})</span>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleTransferToContact(contact); }}
                          className="px-3 py-1.5 bg-sky-600 text-white text-xs font-medium rounded-md hover:bg-sky-700 transition-colors shadow-sm"
                          title="Transferir"
                        >
                          Transferir
                        </button>
                        <div className="relative">
                          <button
                            onClick={(e) => handleMenuToggle(contact.id, e)}
                            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                            disabled={deletingContactId === contact.id}
                          >
                            {deletingContactId === contact.id ? (
                              <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z" />
                              </svg>
                            )}
                          </button>
                          {activeMenuId === contact.id && (
                            <div className={`absolute right-0 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-10 ${index >= paginationData.items.length - 2 ? 'bottom-full mb-2' : 'top-full mt-2'
                              }`}>
                              <div className="py-1">
                                <button
                                  onClick={() => handleEditContact(contact)}
                                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                                >
                                  <svg className="w-4 h-4 text-sky-600" viewBox="0 0 24 24" fill="currentColor"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" /></svg>
                                  <span>Editar</span>
                                </button>
                                <button
                                  onClick={() => handleViewHistory(contact)}
                                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 flex items-center space-x-3"
                                >
                                  <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3" /></svg>
                                  <span>Historial</span>
                                </button>
                                <div className="border-t border-gray-200 my-1"></div>
                                <button
                                  onClick={() => handleDeleteContact(contact)}
                                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center space-x-3"
                                  disabled={deletingContactId === contact.id}
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Sin resultados
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  {searchTerm ? 'No se encontraron beneficiarios' : 'No tienes beneficiarios registrados'}
                </h3>
                <p className="text-sm text-gray-500">
                  {searchTerm ? 'Intenta con otro término de búsqueda.' : 'Agrega un nuevo contacto para empezar.'}
                </p>
              </div>
            )}
          </div>

          {/* Controles de paginación */}
          {paginationData.pagination.totalPages > 1 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  Mostrando {paginationData.pagination.startIndex} - {paginationData.pagination.endIndex} de {paginationData.pagination.totalItems} beneficiarios
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!paginationData.pagination.hasPreviousPage}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Anterior
                  </button>

                  <div className="flex items-center space-x-1">
                    {getVisiblePageNumbers().map(page => (
                      <button
                        key={`page-${page}`}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${page === currentPage
                            ? 'bg-sky-600 text-white font-semibold'
                            : 'border border-gray-300 text-gray-600 hover:bg-gray-100'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!paginationData.pagination.hasNextPage}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { InternaTransferWindow as default };
