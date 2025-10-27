// hooks/useServiciosFacilito.js
import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

const useServiciosFacilito = () => {
  const [serviciosData, setServiciosData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);

  // Verificar acceso a servicios
  const checkAccess = useCallback(async () => {
    console.log('🔍 [HOOK-FACILITO] Verificando acceso a servicios...');
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.validateFacilitoAccess();
      
      if (result.success) {
        setHasAccess(true);
        setServiciosData(result.data);
        console.log('✅ [HOOK-FACILITO] Acceso confirmado');
      } else {
        setHasAccess(false);
        setError(result.error?.message || 'No se pudo verificar el acceso');
        console.log('❌ [HOOK-FACILITO] Acceso denegado:', result.error?.message);
      }
    } catch (err) {
      console.error('💥 [HOOK-FACILITO] Error verificando acceso:', err);
      setHasAccess(false);
      setError('Error inesperado al verificar acceso');
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener datos completos de servicios
  const loadServiciosData = useCallback(async () => {
    console.log('📦 [HOOK-FACILITO] Cargando datos de servicios...');
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.getCurrentUserServiciosFacilito();
      
      if (result.success) {
        setServiciosData(result.data);
        setHasAccess(true);
        console.log('✅ [HOOK-FACILITO] Datos cargados exitosamente');
      } else {
        setError(result.error?.message || 'Error cargando servicios');
        setHasAccess(false);
        console.error('❌ [HOOK-FACILITO] Error cargando datos:', result.error);
      }
    } catch (err) {
      console.error('💥 [HOOK-FACILITO] Error inesperado:', err);
      setError('Error inesperado al cargar servicios');
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto para verificar acceso al montar el componente
  useEffect(() => {
    // Solo verificar si hay una sesión activa
    if (apiService.isAuthenticated()) {
      checkAccess();
    }
  }, [checkAccess]);

  // Reintentar carga de servicios
  const retry = useCallback(() => {
    console.log('🔄 [HOOK-FACILITO] Reintentando carga de servicios...');
    loadServiciosData();
  }, [loadServiciosData]);

  // Obtener URL de Facilito
  const getFacilitoUrl = useCallback(() => {
    return serviciosData?.urlFacilito || null;
  }, [serviciosData]);

  // Obtener información del cliente
  const getClienteInfo = useCallback(() => {
    return serviciosData?.clienteInfo || serviciosData?.cliente || null;
  }, [serviciosData]);

  return {
    // Estados
    serviciosData,
    loading,
    error,
    hasAccess,
    
    // Métodos
    checkAccess,
    loadServiciosData,
    retry,
    getFacilitoUrl,
    getClienteInfo,
    
    // Propiedades derivadas
    isReady: !loading && hasAccess && serviciosData,
    urlFacilito: getFacilitoUrl(),
    clienteInfo: getClienteInfo()
  };
};

export default useServiciosFacilito;