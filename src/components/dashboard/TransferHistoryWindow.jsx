// src/components/dashboard/TransferHistoryWindow.jsx
import React, { useState, useEffect } from 'react';
import { MdHistory, MdSearch, MdFilterList, MdRefresh, MdExpandMore, MdExpandLess, MdPictureAsPdf } from 'react-icons/md';
import apiService from '../../services/apiService';
import { decrypt } from '../../utils/crypto';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TransferHistoryWindow = () => {
  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [userCedula, setUserCedula] = useState(''); // Cédula SIN ENCRIPTAR (el sistema la encripta automáticamente)
  const [expandedRows, setExpandedRows] = useState([]); // Filas expandidas
  
  // Estados para filtros de fecha (formato interno YYYY/MM/DD)
  const [dateFilters, setDateFilters] = useState({
    fechaDesde: '', // YYYY/MM/DD
    fechaHasta: ''  // YYYY/MM/DD
  });

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const transfersPerPage = 15;

  // ============================================
  // 🔥 FUNCIONES DE CONVERSIÓN DE FECHAS
  // ============================================
  
  // Convertir YYYY/MM/DD a YYYY-MM-DD para input HTML
  const formatDateForHtmlInput = (yyyymmddDate) => {
    if (!yyyymmddDate) return "";
    
    try {
      if (yyyymmddDate.includes("/")) {
        return yyyymmddDate.replace(/\//g, "-");
      }
      return yyyymmddDate;
    } catch (error) {
      console.warn("Error al formatear fecha para HTML:", error);
      return "";
    }
  };

  // Convertir de HTML input (YYYY-MM-DD) a nuestro formato (YYYY/MM/DD)
  const formatDateFromHtmlInput = (htmlDate) => {
    if (!htmlDate) return "";
    
    try {
      return htmlDate.replace(/-/g, "/");
    } catch (error) {
      console.warn("Error al formatear fecha desde HTML:", error);
      return "";
    }
  };

  // Convertir de nuestro formato (YYYY/MM/DD) a formato API (MM/DD/YYYY)
  const formatDateForApi = (yyyymmddDate) => {
    console.log('🔧 [API-DATE] ===== CONVERSIÓN A API =====');
    console.log('🔧 [API-DATE] Entrada YYYY/MM/DD:', yyyymmddDate);
    
    if (!yyyymmddDate) {
      console.warn('⚠️ [API-DATE] Fecha vacía recibida');
      return "";
    }
    
    try {
      if (!yyyymmddDate.includes("/")) {
        console.error('❌ [API-DATE] Formato incorrecto, no contiene "/"');
        return "";
      }

      const parts = yyyymmddDate.split("/");
      console.log('🔧 [API-DATE] Partes separadas:', parts);
      
      if (parts.length !== 3) {
        console.error('❌ [API-DATE] No tiene 3 partes:', parts.length);
        return "";
      }

      const [year, month, day] = parts;
      const apiDate = `${month}/${day}/${year}`; // MM/DD/YYYY - Formato servidor
      
      console.log('✅ [API-DATE] Fecha convertida a MM/DD/YYYY:', apiDate);
      return apiDate;
    } catch (error) {
      console.error('❌ [API-DATE] Error al formatear fecha:', error);
      return "";
    }
  };

  // Formatear fecha para mostrar (YYYY/MM/DD sin hora)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      // Si viene formato timestamp YYYY-MM-DD HH:MM:SS
      if (dateString.includes('-')) {
        const [datePart] = dateString.split(' '); // Separar fecha de hora
        const [year, month, day] = datePart.split('-');
        return `${year}/${month}/${day}`;
      }
      // Si viene en formato YYYY/MM/DD (ya está en el formato correcto)
      if (dateString.includes('/')) {
        const [datePart] = dateString.split(' '); // Separar fecha de hora si existe
        return datePart; // Ya está en formato YYYY/MM/DD
      }
      return dateString;
    } catch (error) {
      return dateString;
    }
  };

  // ============================================
  // 🔥 INICIALIZACIÓN DEL COMPONENTE
  // ============================================
  
  useEffect(() => {
    initializeComponent();
  }, []);

  const initializeComponent = async () => {
    try {
      console.log('🔄 [TRANSFER-HISTORY] Iniciando componente...');
      
      // Obtener cédula del usuario (SIN ENCRIPTAR - igual que SavingsProductForm)
      const session = apiService.getUserSession();
      console.log('📦 [TRANSFER-HISTORY] Sesión completa:', session);

      if (!session || !session.userData) {
        throw new Error('No se encontró sesión de usuario');
      }

      // ⚠️ IMPORTANTE: Buscar idecli (cédula SIN ENCRIPTAR)
      // El sistema la encriptará automáticamente en makeRequest
      let cedula = null;

      // Buscar en userData.cliente[0].idecli
      if (
        session.userData.cliente &&
        Array.isArray(session.userData.cliente) &&
        session.userData.cliente[0]?.idecli
      ) {
        cedula = session.userData.cliente[0].idecli;
        console.log('✅ [TRANSFER-HISTORY] Cédula encontrada en cliente[0].idecli:', cedula);
      }
      // Fallback: buscar en userData.cliente.idecli
      else if (session.userData.cliente?.idecli) {
        cedula = session.userData.cliente.idecli;
        console.log('✅ [TRANSFER-HISTORY] Cédula encontrada en cliente.idecli:', cedula);
      }
      // Fallback: buscar en userData.idecli
      else if (session.userData.idecli) {
        cedula = session.userData.idecli;
        console.log('✅ [TRANSFER-HISTORY] Cédula encontrada en userData.idecli:', cedula);
      }
      
      if (!cedula) {
        console.error('❌ [TRANSFER-HISTORY] No se encontró cédula en sesión');
        console.log('🔍 [TRANSFER-HISTORY] userData keys:', Object.keys(session.userData));
        throw new Error('No se pudo obtener la cédula del usuario');
      }
      
      console.log('👤 [TRANSFER-HISTORY] Cédula SIN ENCRIPTAR obtenida:', cedula);
      console.log('🔐 [TRANSFER-HISTORY] El sistema la encriptará automáticamente');
      
      // Guardar cédula SIN ENCRIPTAR
      setUserCedula(cedula);
      
      // Establecer rango de fechas por defecto (últimos 7 días)
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      
      const toDate = formatDateToYYYYMMDD(today);
      const fromDate = formatDateToYYYYMMDD(sevenDaysAgo);
      
      console.log('📅 [TRANSFER-HISTORY] Rango por defecto:', { from: fromDate, to: toDate });
      
      setDateFilters({
        fechaDesde: fromDate,
        fechaHasta: toDate
      });
      
      // Cargar historial con el rango por defecto
      await loadTransferHistory(cedula, fromDate, toDate);
      
    } catch (err) {
      console.error('❌ [TRANSFER-HISTORY] Error en inicialización:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Función auxiliar para convertir Date a YYYY/MM/DD
  const formatDateToYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  // ============================================
  // 🔥 CARGAR HISTORIAL DE TRANSFERENCIAS
  // ============================================
  
  const loadTransferHistory = async (cedula, fromDate, toDate) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 [TRANSFER-HISTORY] Cargando historial...');
      console.log('👤 [TRANSFER-HISTORY] Cédula (sin encriptar):', cedula);
      console.log('🔐 [TRANSFER-HISTORY] El sistema la encriptará automáticamente');
      console.log('📅 [TRANSFER-HISTORY] Rango:', { from: fromDate, to: toDate });
      
      // Convertir fechas al formato de la API (DD/MM/YYYY)
      const fechaDesdeApi = formatDateForApi(fromDate);
      const fechaHastaApi = formatDateForApi(toDate);
      
      console.log('🔧 [TRANSFER-HISTORY] Fechas para API:', {
        desde: fechaDesdeApi,
        hasta: fechaHastaApi
      });
      
     
      // Llamar a la API con cédula SIN ENCRIPTAR (makeRequest la encriptará)
      const result = await apiService.getTransferHistory(
        cedula, // ⚠️ Cédula SIN ENCRIPTAR (se encripta automáticamente)
        fechaDesdeApi,
        fechaHastaApi
      );
      
      console.log('📦 [TRANSFER-HISTORY] Respuesta de API:', result);
      
      if (result.success && result.data && result.data.listado) {
        console.log('✅ [TRANSFER-HISTORY] Total transferencias:', result.data.totalTransferencias);
        
        // Procesar las transferencias para desencriptar campos
        const processedTransfers = result.data.listado.map((transfer, index) => {
          console.log(`🔍 [TRANSFER-HISTORY] Transfer #${index + 1} RAW:`, transfer);
          
          return {
            id: index,
            fecha: transfer.fhotrf || '', // ⚠️ Corregido: fhotrf (no fhotif)
            monto: tryDecrypt(transfer.valtrn),
            // Cuenta destino = Cuenta del beneficiario (a donde se transfirió)
            cuentaDestino: tryDecrypt(transfer.ctaipo), // ✅ Cuenta completa del beneficiario
            institucion: transfer.ifiipo || '',
            // Datos adicionales para el detalle expandible
            tipoCuentaDestino: transfer.dtcipo || '',
            codigoBancoDestino: transfer.bceipo || '', // Código del banco destino
            // Cuenta origen (remitente)
            cuentaOrigen: tryDecrypt(transfer.ctaipr),
            institucionOrigen: transfer.ifiipr || '',
            tipoCuentaOrigen: transfer.dtcipr || '',
            // Beneficiario
            cedulaBeneficiario: tryDecrypt(transfer.ideipr),
            nombreBeneficiario: transfer.nomipr || '',
            // Detalle
            detalle: tryDecrypt(transfer.dettrn)
          };
        });
        
        console.log('✅ [TRANSFER-HISTORY] Transferencias procesadas:', processedTransfers);
        setTransfers(processedTransfers);
      } else {
        console.warn('⚠️ [TRANSFER-HISTORY] Sin datos en respuesta');
        setTransfers([]);
      }
      
    } catch (err) {
      console.error('❌ [TRANSFER-HISTORY] Error al cargar historial:', err);
      setError(err.message || 'Error al cargar el historial de transferencias');
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para intentar desencriptar un valor
  const tryDecrypt = (value) => {
    if (!value) return '';
    
    try {
      // Si el valor parece estar encriptado (Base64), intentar desencriptar
      if (typeof value === 'string' && value.length > 20 && /^[A-Za-z0-9+/=]+$/.test(value)) {
        const decrypted = decrypt(value);
        return decrypted || value;
      }
      return value;
    } catch (error) {
      console.warn('⚠️ Error al desencriptar valor:', error);
      return value;
    }
  };

  // ============================================
  // 🔥 APLICAR FILTROS DE FECHA
  // ============================================
  
  const applyDateFilters = async () => {
    const { fechaDesde, fechaHasta } = dateFilters;
    
    if (!fechaDesde || !fechaHasta) {
      setError('Por favor seleccione ambas fechas');
      return;
    }
    
    // Validar que la fecha desde sea menor o igual a la fecha hasta
    const fromDate = new Date(fechaDesde.replace(/\//g, '-'));
    const toDate = new Date(fechaHasta.replace(/\//g, '-'));
    
    if (fromDate > toDate) {
      setError('La fecha desde no puede ser mayor a la fecha hasta');
      return;
    }
    
    // Validar que el rango no supere los 365 días
    const diffTime = Math.abs(toDate - fromDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      setError('El rango de fechas no puede superar los 365 días');
      return;
    }
    
    console.log('🔍 [TRANSFER-HISTORY] Aplicando filtros:', dateFilters);
    
    // Recargar historial con las nuevas fechas
    await loadTransferHistory(userCedula, fechaDesde, fechaHasta);
    setCurrentPage(1); // Resetear a la primera página
  };

  // Limpiar filtros y volver al rango por defecto
  const clearFilters = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const toDate = formatDateToYYYYMMDD(today);
    const fromDate = formatDateToYYYYMMDD(sevenDaysAgo);
    
    setDateFilters({
      fechaDesde: fromDate,
      fechaHasta: toDate
    });
    
    loadTransferHistory(userCedula, fromDate, toDate);
    setCurrentPage(1);
  };

  // ============================================
  // 🔥 PAGINACIÓN
  // ============================================
  
  // Calcular índices para paginación
  const indexOfLastTransfer = currentPage * transfersPerPage;
  const indexOfFirstTransfer = indexOfLastTransfer - transfersPerPage;
  const currentTransfers = transfers.slice(indexOfFirstTransfer, indexOfLastTransfer);
  const totalPages = Math.ceil(transfers.length / transfersPerPage);

  // Cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Toggle expansión de fila
  const toggleRowExpansion = (transferId) => {
    setExpandedRows(prev => {
      if (prev.includes(transferId)) {
        return prev.filter(id => id !== transferId);
      } else {
        return [...prev, transferId];
      }
    });
  };

  // Función para generar PDF del comprobante de transferencia
  const handleDownloadReceipt = async (transfer) => {
    try {
      console.log('📄 [TRANSFER-HISTORY] Generando PDF para transferencia:', transfer);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Logo y encabezado
      try {
        const logoImg = await fetch('/assets/images/isocoaclasnaves.png').then(res => res.blob()).then(blob => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        });
        doc.addImage(logoImg, 'PNG', pageWidth / 2 - 15, 10, 30, 30);
      } catch (error) {
        console.warn('⚠️ No se pudo cargar el logo:', error);
      }

      // Título
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('COMPROBANTE DE TRANSFERENCIA', pageWidth / 2, 50, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Cooperativa de Ahorro y Crédito Las Naves', pageWidth / 2, 57, { align: 'center' });

      // Fecha y hora actual
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateStr = `${year}/${month}/${day}`;
      const timeStr = now.toLocaleTimeString('es-EC');
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Generado el ${dateStr} a las ${timeStr}`, pageWidth / 2, 63, { align: 'center' });

      // Línea separadora
      doc.setDrawColor(0, 102, 204);
      doc.setLineWidth(0.5);
      doc.line(20, 68, pageWidth - 20, 68);

      // Información de la transferencia
      let yPos = 80;

      // Sección: Información del Beneficiario
      doc.setFillColor(240, 248, 255);
      doc.rect(20, yPos, pageWidth - 40, 8, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.text('INFORMACIÓN DEL BENEFICIARIO', 25, yPos + 5.5);

      yPos += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);

      const beneficiaryData = [
        ['Nombre:', transfer.nombreBeneficiario || 'N/A'],
        ['Cédula/RUC:', transfer.cedulaBeneficiario || 'N/A'],
        ['Cuenta Destino:', transfer.cuentaDestino || 'N/A'],
        ['Tipo de Cuenta:', transfer.tipoCuentaDestino || 'N/A'],
        ['Institución:', transfer.institucion || 'N/A']
      ];

      beneficiaryData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 70, yPos);
        yPos += 7;
      });

      // Sección: Cuenta de Origen
      yPos += 5;
      doc.setFillColor(240, 248, 255);
      doc.rect(20, yPos, pageWidth - 40, 8, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.text('CUENTA DE ORIGEN', 25, yPos + 5.5);

      yPos += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);

      const originData = [
        ['Número de Cuenta:', transfer.cuentaOrigen || 'N/A'],
        ['Institución:', transfer.institucionOrigen || 'N/A'],
        ['Tipo de Cuenta:', transfer.tipoCuentaOrigen || 'N/A']
      ];

      originData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 70, yPos);
        yPos += 7;
      });

      // Sección: Detalles de la Transacción
      yPos += 5;
      doc.setFillColor(240, 248, 255);
      doc.rect(20, yPos, pageWidth - 40, 8, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.text('DETALLES DE LA TRANSACCIÓN', 25, yPos + 5.5);

      yPos += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);

      const amount = parseFloat(transfer.monto || 0);
      const formattedAmount = `$${amount.toLocaleString('es-EC', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;

      const transactionData = [
        ['Monto:', formattedAmount],
        ['Fecha:', formatDateForDisplay(transfer.fecha)],
        ['Descripción:', transfer.detalle || 'N/A']
      ];

      transactionData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 70, yPos);
        yPos += 7;
      });

      // Cuadro de monto destacado
      yPos += 10;
      doc.setFillColor(34, 197, 94);
      doc.roundedRect(20, yPos, pageWidth - 40, 20, 3, 3, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('MONTO TRANSFERIDO', pageWidth / 2, yPos + 8, { align: 'center' });
      doc.setFontSize(18);
      doc.text(formattedAmount, pageWidth / 2, yPos + 16, { align: 'center' });

      // Nota al pie
      yPos = pageHeight - 30;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100);
      doc.text('Este es un comprobante informativo generado electrónicamente.', pageWidth / 2, yPos, { align: 'center' });
      doc.text('Para consultas o reclamos, comuníquese con nuestra institución.', pageWidth / 2, yPos + 5, { align: 'center' });

      // Línea final
      doc.setDrawColor(0, 102, 204);
      doc.setLineWidth(0.3);
      doc.line(20, yPos - 5, pageWidth - 20, yPos - 5);

      // Guardar PDF
      const fileName = `Comprobante_Transferencia_${transfer.fecha.replace(/[/:]/g, '-')}.pdf`;
      doc.save(fileName);

      console.log('✅ [TRANSFER-HISTORY] PDF generado exitosamente:', fileName);
    } catch (error) {
      console.error('❌ [TRANSFER-HISTORY] Error al generar PDF:', error);
      alert('Error al generar el comprobante. Por favor intenta nuevamente.');
    }
  };

  // ============================================
  // 🎨 RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header - Igual que SavingsProductForm */}
      <div className="bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl shadow-xl p-8 mb-6">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
            <MdHistory className="text-4xl text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Historial de Transferencias
            </h1>
            <p className="text-sky-100">
              Consulta el detalle de tus transferencias realizadas
            </p>
          </div>
        </div>
      </div>

      {/* Filtros de Fecha */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <MdFilterList className="text-2xl text-sky-600" />
          <h2 className="text-xl font-semibold text-gray-800">Filtros de Búsqueda</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fecha Desde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Desde
            </label>
            <div className="relative">
              <input
                type="text"
                value={dateFilters.fechaDesde}
                onChange={(e) => setDateFilters({ ...dateFilters, fechaDesde: e.target.value })}
                placeholder="YYYY/MM/DD"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Hasta
            </label>
            <div className="relative">
              <input
                type="text"
                value={dateFilters.fechaHasta}
                onChange={(e) => setDateFilters({ ...dateFilters, fechaHasta: e.target.value })}
                placeholder="YYYY/MM/DD"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-end space-x-2">
            <button
              onClick={applyDateFilters}
              disabled={loading}
              className="flex-1 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <MdSearch className="text-lg" />
              <span>Buscar</span>
            </button>
            <button
              onClick={clearFilters}
              disabled={loading}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <MdRefresh className="text-lg" />
              <span>Limpiar</span>
            </button>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Tabla de Transferencias */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando historial de transferencias...</p>
          </div>
        )}

        {/* Tabla */}
        {!loading && transfers.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-sky-200">
                    <th className="px-6 py-4 text-right text-xs font-bold text-sky-700 uppercase tracking-wider w-32">
                      Monto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-sky-700 uppercase tracking-wider w-40">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-sky-700 uppercase tracking-wider">
                      Cuenta Destino
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-sky-700 uppercase tracking-wider">
                      Institución
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-sky-700 uppercase tracking-wider w-32">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentTransfers.map((transfer, index) => (
                    <React.Fragment key={transfer.id}>
                      {/* Fila principal */}
                      <tr 
                        className={`hover:bg-sky-50 transition-all duration-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } ${expandedRows.includes(transfer.id) ? 'bg-sky-50' : ''}`}
                      >
                        <td className="px-6 py-5 text-base text-right font-bold text-green-600">
                          ${parseFloat(transfer.monto || 0).toLocaleString('es-EC', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </td>
                        <td className="px-6 py-5 text-sm text-gray-700 font-medium">
                          {formatDateForDisplay(transfer.fecha)}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 text-sky-600 text-xs font-semibold">
                              💳
                            </span>
                            <span className="text-sm font-semibold text-gray-900">
                              {transfer.cuentaDestino}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {transfer.institucion}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => toggleRowExpansion(transfer.id)}
                              className={`inline-flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                                expandedRows.includes(transfer.id)
                                  ? 'bg-sky-600 text-white shadow-md'
                                  : 'bg-sky-100 text-sky-600 hover:bg-sky-200'
                              }`}
                              title={expandedRows.includes(transfer.id) ? "Ocultar detalles" : "Ver detalles"}
                            >
                              {expandedRows.includes(transfer.id) ? (
                                <MdExpandLess className="text-2xl" />
                              ) : (
                                <MdExpandMore className="text-2xl" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDownloadReceipt(transfer)}
                              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Descargar comprobante PDF"
                            >
                              <MdPictureAsPdf className="text-xl" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Fila expandible con detalles */}
                      {expandedRows.includes(transfer.id) && (
                        <tr className="bg-gradient-to-br from-sky-50 to-blue-50 border-l-4 border-sky-500">
                          <td colSpan="5" className="px-8 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Información del Beneficiario */}
                              <div className="bg-white rounded-xl p-5 shadow-lg border-l-4 border-sky-500 hover:shadow-xl transition-shadow duration-200">
                                <h4 className="text-base font-bold text-sky-800 mb-4 flex items-center">
                                  <span className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-lg p-2 mr-3 text-white">
                                    👤
                                  </span>
                                  Información del Beneficiario
                                </h4>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-500 font-medium">Nombre Completo</span>
                                    <span className="text-sm font-bold text-gray-900">{transfer.nombreBeneficiario}</span>
                                  </div>
                                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-500 font-medium">Cédula/RUC</span>
                                    <span className="text-sm font-bold text-gray-900">{transfer.cedulaBeneficiario}</span>
                                  </div>
                                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-500 font-medium">Cuenta Destino</span>
                                    <span className="text-sm font-bold text-gray-900">{transfer.cuentaDestino}</span>
                                  </div>
                                  <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-gray-500 font-medium">Tipo de Cuenta</span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                      {transfer.tipoCuentaDestino}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Información de la Cuenta Origen */}
                              <div className="bg-white rounded-xl p-5 shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-200">
                                <h4 className="text-base font-bold text-blue-800 mb-4 flex items-center">
                                  <span className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2 mr-3 text-white">
                                    🏦
                                  </span>
                                  Cuenta de Origen
                                </h4>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-500 font-medium">Número de Cuenta</span>
                                    <span className="text-sm font-bold text-gray-900">{transfer.cuentaOrigen}</span>
                                  </div>
                                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-500 font-medium">Institución</span>
                                    <span className="text-sm font-bold text-gray-900">{transfer.institucionOrigen}</span>
                                  </div>
                                  <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-gray-500 font-medium">Tipo de Cuenta</span>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                      {transfer.tipoCuentaOrigen}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-t-2 border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600 font-medium">
                    Mostrando <span className="font-bold text-sky-600">{indexOfFirstTransfer + 1}</span> a{' '}
                    <span className="font-bold text-sky-600">{Math.min(indexOfLastTransfer, transfers.length)}</span> de{' '}
                    <span className="font-bold text-sky-600">{transfers.length}</span> transferencias
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white border-2 border-sky-200 rounded-lg text-sm font-semibold text-sky-700 hover:bg-sky-50 hover:border-sky-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                    >
                      ← Anterior
                    </button>
                    
                    <div className="flex space-x-1">
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => paginate(pageNumber)}
                              className={`w-10 h-10 rounded-lg text-sm font-bold transition-all duration-200 ${
                                currentPage === pageNumber
                                  ? 'bg-gradient-to-br from-sky-600 to-sky-700 text-white shadow-lg scale-110'
                                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-sky-50 hover:border-sky-400 hover:text-sky-700 shadow-sm'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        } else if (
                          pageNumber === currentPage - 2 ||
                          pageNumber === currentPage + 2
                        ) {
                          return <span key={pageNumber} className="px-2 py-2 text-gray-400 font-bold">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white border-2 border-sky-200 rounded-lg text-sm font-semibold text-sky-700 hover:bg-sky-50 hover:border-sky-400 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                    >
                      Siguiente →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Estado vacío */}
        {!loading && transfers.length === 0 && (
          <div className="p-16 text-center bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="max-w-md mx-auto">
              <div className="bg-sky-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <MdHistory className="text-6xl text-sky-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                No se encontraron transferencias
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                No hay transferencias registradas en el periodo seleccionado.<br />
                Intenta ajustar el rango de fechas para ver más resultados.
              </p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-sky-600 to-sky-700 text-white rounded-lg font-semibold hover:from-sky-700 hover:to-sky-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <MdRefresh className="mr-2 text-lg" />
                Restablecer Filtros
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferHistoryWindow;
