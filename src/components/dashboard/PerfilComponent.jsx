import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';
import { decrypt } from '../../utils/crypto/encryptionService';

const PerfilComponent = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clienteInfo, setClienteInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    loadClientProfile();
  }, []);

  const loadClientProfile = async () => {
    console.log('👤 [PERFIL] Cargando información del perfil...');
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.getCurrentUserProfile();
      
      if (result.success && result.data.cliente) {
        console.log('✅ [PERFIL] Información cargada exitosamente');
        console.log('📊 [PERFIL] Datos del cliente:', result.data.cliente);
        
        // Desencriptar campos si vienen encriptados
        const cliente = { ...result.data.cliente };
        
        // Desencriptar cédula si está encriptada
        if (cliente.idecli && cliente.idecli.includes('==')) {
          try {
            cliente.idecli_decrypted = decrypt(cliente.idecli);
            console.log('🔓 [PERFIL] Cédula desencriptada');
          } catch (err) {
            console.warn('⚠️ [PERFIL] Error desencriptando cédula:', err);
          }
        }
        
        // Desencriptar teléfono celular si está encriptado
        if (cliente.tlfcel && cliente.tlfcel.includes('==')) {
          try {
            cliente.tlfcel_decrypted = decrypt(cliente.tlfcel);
            console.log('🔓 [PERFIL] Teléfono desencriptado');
          } catch (err) {
            console.warn('⚠️ [PERFIL] Error desencriptando teléfono:', err);
          }
        }
        
        // Desencriptar email si está encriptado (puede venir con caracteres especiales de Base64)
        if (cliente.direma && (cliente.direma.includes('==') || cliente.direma.includes('+') || cliente.direma.includes('/'))) {
          try {
            // Verificar si parece ser Base64 (sin @ y con caracteres típicos de Base64)
            const looksLikeBase64 = !cliente.direma.includes('@') && /^[A-Za-z0-9+/=]+$/.test(cliente.direma);
            if (looksLikeBase64) {
              cliente.direma_decrypted = decrypt(cliente.direma);
              console.log('🔓 [PERFIL] Email desencriptado:', cliente.direma_decrypted);
            } else {
              cliente.direma_decrypted = cliente.direma; // Ya está en texto plano
            }
          } catch (err) {
            console.warn('⚠️ [PERFIL] Error desencriptando email:', err);
            cliente.direma_decrypted = cliente.direma; // Usar el valor original si falla
          }
        } else {
          cliente.direma_decrypted = cliente.direma; // No está encriptado
        }
        
        setClienteInfo(cliente);
      } else {
        console.error('❌ [PERFIL] Error cargando perfil:', result.error);
        setError(result.error?.message || 'Error al cargar el perfil');
      }
    } catch (error) {
      console.error('💥 [PERFIL] Error inesperado:', error);
      setError('Error inesperado al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const downloadProfilePDF = () => {
    alert('Funcionalidad de descarga PDF próximamente...');
  };

  const tabs = [
    { id: 'personal', label: 'Datos Personales', icon: '👤' },
    { id: 'contacto', label: 'Contacto', icon: '📞' }
  ];

  // Estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-sky-50">
        <div className="text-center p-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Cargando Perfil</h3>
          <p className="text-gray-500">Obteniendo información del cliente...</p>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Error al Cargar Perfil</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadClientProfile}
            className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors duration-200"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Vista principal con información del cliente
  return (
    <div className="p-6 h-full bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 overflow-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-sky-200 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">👤</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Mi Perfil</h1>
                <p className="text-gray-600">Información personal y datos de contacto</p>
              </div>
            </div>
            
{/* Botón PDF removido por solicitud */}
          </div>

          {/* Cliente Info Card */}
          <div className="bg-sky-50 rounded-xl p-4 border border-sky-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Institución</p>
                <p className="font-bold text-gray-800">{clienteInfo?.nomemp || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Oficina</p>
                <p className="font-bold text-gray-800">{clienteInfo?.nomofi || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <span className="inline-flex px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  ACTIVO
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-xl border border-sky-200 overflow-hidden">
          <div className="flex overflow-x-auto bg-sky-50 border-b border-sky-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-sky-600 text-white border-b-2 border-sky-600'
                    : 'text-gray-600 hover:text-sky-600 hover:bg-white'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Datos Personales */}
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cédula / RUC</label>
                  <div className="text-gray-800 font-medium bg-sky-50 px-4 py-2 rounded-lg border border-sky-200">
                    {clienteInfo?.idecli_decrypted || clienteInfo?.idecli || 'N/A'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
                  <div className="text-gray-800 font-medium bg-sky-50 px-4 py-2 rounded-lg border border-sky-200">
                    {clienteInfo?.apecli && clienteInfo?.nomcli 
                      ? `${clienteInfo.apecli} ${clienteInfo.nomcli}` 
                      : 'N/A'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos</label>
                  <div className="text-gray-800 font-medium bg-sky-50 px-4 py-2 rounded-lg border border-sky-200">
                    {clienteInfo?.apecli || 'N/A'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombres</label>
                  <div className="text-gray-800 font-medium bg-sky-50 px-4 py-2 rounded-lg border border-sky-200">
                    {clienteInfo?.nomcli || 'N/A'}
                  </div>
                </div>
              </div>
            )}

            {/* Contacto */}
            {activeTab === 'contacto' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono Celular</label>
                  <div className="text-gray-800 font-medium bg-sky-50 px-4 py-2 rounded-lg border border-sky-200 flex items-center">
                    <svg className="w-5 h-5 text-sky-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {clienteInfo?.tlfcel_decrypted || clienteInfo?.tlfcel || 'N/A'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
                  <div className="text-gray-800 font-medium bg-sky-50 px-4 py-2 rounded-lg border border-sky-200 flex items-center">
                    <svg className="w-5 h-5 text-sky-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {clienteInfo?.direma_decrypted || clienteInfo?.direma || 'N/A'}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Oficina Asignada</label>
                  <div className="text-gray-800 font-medium bg-sky-50 px-4 py-2 rounded-lg border border-sky-200">
                    {clienteInfo?.nomofi || 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Información Adicional */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-sky-200 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Información Institucional</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-sky-600 text-2xl">🏢</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Institución</h3>
              <p className="text-gray-600 text-sm">{clienteInfo?.nomemp || 'N/A'}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-2xl">✅</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Estado de Cuenta</h3>
              <p className="text-green-600 text-sm font-medium">ACTIVO</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfilComponent;