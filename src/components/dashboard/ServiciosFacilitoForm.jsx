import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';

const ServiciosFacilitoForm = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviciosInfo, setServiciosInfo] = useState(null);
  const [clienteInfo, setClienteInfo] = useState(null);

  useEffect(() => {
    loadServiciosInfo();
  }, []);

  const loadServiciosInfo = async () => {
    console.log('🏪 [FACILITO-COMPONENT] Cargando información de servicios...');
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.getCurrentUserServiciosFacilito();
      
      if (result.success) {
        console.log('✅ [FACILITO-COMPONENT] Información cargada exitosamente');
        setServiciosInfo(result.data);
        setClienteInfo(result.data.cliente);
      } else {
        console.error('❌ [FACILITO-COMPONENT] Error cargando servicios:', result.error);
        setError(result.error.message);
      }
    } catch (error) {
      console.error('💥 [FACILITO-COMPONENT] Error inesperado:', error);
      setError('Error inesperado al cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  const openFacilito = () => {
    console.log('🚀 [FACILITO-COMPONENT] Abriendo Facilito en nueva ventana');
    const facilito_url = 'https://pagos.facilito.com.ec/aplicacion/coac_las_naves';
    window.open(facilito_url, '_blank', 'noopener,noreferrer,width=1200,height=800');
  };

  const retryLoad = () => {
    console.log('🔄 [FACILITO-COMPONENT] Reintentando carga...');
    loadServiciosInfo();
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center p-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Verificando Servicios</h3>
          <p className="text-gray-500">Conectando con la plataforma de pagos...</p>
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
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Error de Verificación</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={retryLoad}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Reintentar Verificación
            </button>
            <button
              onClick={openFacilito}
              className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              Continuar a Facilito
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista principal - Servicios disponibles
  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white flex-shrink-0">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Pago de Servicios Básicos</h2>
          <p className="text-blue-100">Plataforma Facilito - Pagos en línea</p>
        </div>
      </div>

      {/* Información del cliente */}
      {clienteInfo && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 m-6 flex-shrink-0 rounded-r-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div>
              <p className="text-sm text-blue-700 font-medium">
                Cliente: {clienteInfo.nommatri || 'Cooperativa Las Naves'}
              </p>
              <p className="text-xs text-blue-600">Servicios de pago habilitados</p>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          {/* Card principal */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Imagen/Icono de Facilito */}
            <div className="bg-gradient-to-br from-green-500 to-blue-600 p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Facilito Pagos</h3>
              <p className="text-white/90 text-sm">Plataforma segura para el pago de servicios básicos</p>
            </div>

            {/* Contenido de la card */}
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Luz eléctrica</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Agua potable</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Teléfono</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Internet y TV</span>
                </div>
              </div>

              <button
                onClick={openFacilito}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>Acceder a Facilito</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>

              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-800 text-center">
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <strong>Conexión segura:</strong> La ventana se abrirá en una nueva pestaña para garantizar la seguridad de tus transacciones.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 p-4 flex-shrink-0">
        <div className="text-center">
          <p className="text-xs text-gray-500">
            🔒 Plataforma oficial de pagos Facilito | Cooperativa Las Naves
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServiciosFacilitoForm;