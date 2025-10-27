import React, { useState, useEffect } from "react";
import { MdAccountBalance } from "react-icons/md";
import apiService from '../../services/apiService'; // Ajustar ruta según tu estructura

// Importar jsPDF para generar PDFs
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const CreditProductForm = () => {
  // Estados para datos reales
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clienteInfo, setClienteInfo] = useState(null);
  const [userCedula, setUserCedula] = useState('');
  
  // Estados para tabla de amortización
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [showAmortization, setShowAmortization] = useState(false);
  const [amortizationTable, setAmortizationTable] = useState([]);
  const [loadingAmortization, setLoadingAmortization] = useState(false);
  const [amortizationError, setAmortizationError] = useState(null);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const creditsPerPage = 4;

  // Cargar créditos al montar el componente
  useEffect(() => {
    loadUserDataAndCredits();
  }, []);

  // Función para obtener datos del usuario y cargar créditos
  const loadUserDataAndCredits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [USER] Obteniendo datos del usuario logueado...');
      
      // Obtener sesión del usuario
      const session = apiService.getUserSession();
      console.log('📊 [USER] Sesión obtenida:', session);
      
      if (!session || !session.userData) {
        throw new Error('No hay sesión activa. Por favor, inicie sesión nuevamente.');
      }

      // Extraer cédula del usuario logueado
      let cedula = null;
      
      // Buscar en la estructura: userData.cliente[0].idecli
      if (session.userData.cliente && Array.isArray(session.userData.cliente) && session.userData.cliente[0]?.idecli) {
        cedula = session.userData.cliente[0].idecli;
        console.log('✅ [USER] Cédula encontrada en cliente[0].idecli:', cedula);
      }
      // Fallback: buscar en userData.cliente.idecli (por si no es array)
      else if (session.userData.cliente?.idecli) {
        cedula = session.userData.cliente.idecli;
        console.log('✅ [USER] Cédula encontrada en cliente.idecli:', cedula);
      }
      // Fallback: buscar directamente en userData
      else if (session.userData.idecli) {
        cedula = session.userData.idecli;
        console.log('✅ [USER] Cédula encontrada en userData.idecli:', cedula);
      }
      
      if (!cedula) {
        console.error('❌ [USER] No se encontró la cédula en la sesión');
        console.log('🔍 [USER] Estructura de userData:', Object.keys(session.userData));
        throw new Error('No se pudo obtener la cédula del usuario. Estructura de sesión inesperada.');
      }
      
      // Guardar cédula del usuario
      setUserCedula(cedula);
      
      // Cargar créditos con la cédula obtenida
      await loadCredits(cedula);
      
    } catch (err) {
      console.error('💥 [USER] Error al obtener datos del usuario:', err);
      setError(err.message || 'Error al obtener los datos del usuario');
      setLoading(false);
    }
  };

  // Función para cargar créditos con cédula específica
  const loadCredits = async (cedulaParam) => {
    const cedulaToUse = cedulaParam || userCedula;
    
    if (!cedulaToUse) {
      setError('Debe tener una cédula válida para consultar');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 [CREDITS] Cargando créditos para cédula:', cedulaToUse);
      
      // Llamar directamente con la cédula
      const result = await apiService.getCredits(cedulaToUse);
      
      if (result.success) {
        console.log('✅ [CREDITS] Créditos cargados exitosamente:', result.data.creditos);
        
        // Mapear datos de API a formato del componente
        const mappedCredits = result.data.creditos.map(credito => ({
          id: credito.codcrd,
          type: credito.destcr,
          originalAmount: parseFloat(credito.mntcap || 0),
          currentBalance: parseFloat(credito.salcap || 0),
          dueDate: credito.fecvnc,
          status: credito.desecr,
          creditNumber: formatCreditNumber(credito.codcrd),
          currency: "USD",
          // Estos valores se actualizarán cuando se cargue la amortización
          monthlyPayment: 0,
          interestRate: 0,
          remainingPayments: 0,
          nextPaymentDate: credito.fecvnc
        }));
        
        setCredits(mappedCredits);
        setClienteInfo(result.data.cliente);
        
      } else {
        console.error('❌ [CREDITS] Error al cargar créditos:', result.error);
        setError(result.error.message || 'Error al cargar los créditos');
      }
      
    } catch (err) {
      console.error('💥 [CREDITS] Error inesperado:', err);
      setError('Error inesperado al cargar los créditos. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear número de crédito
  const formatCreditNumber = (creditCode) => {
    if (!creditCode) return '****';
    const str = creditCode.toString();
    return `**** **** **** ${str.slice(-4)}`;
  };

  // Función para manejar click en crédito
  const handleCreditClick = async (credit) => {
    try {
      setSelectedCredit(credit);
      setShowAmortization(true);
      setLoadingAmortization(true);
      setAmortizationError(null);
      setAmortizationTable([]);
      
      console.log('🔄 [AMORTIZATION] Cargando tabla de amortización para:', credit.id);
      
      // Obtener cédula del usuario
      const cedulaUsuario = userCedula || apiService.getUserCedula();
      if (!cedulaUsuario) {
        throw new Error('No se pudo obtener la información del usuario');
      }
      
      // Llamar API para tabla de amortización
      const result = await apiService.getAmortizationTable(
        cedulaUsuario,
        credit.id
      );
      
      if (result.success) {
        console.log('✅ [AMORTIZATION] Tabla de amortización cargada:', result.data.cuotas.length, 'cuotas');
        
        // Mapear cuotas de API a formato del componente
        const mappedAmortization = result.data.cuotas.map((cuota, index) => ({
          id: index + 1,
          paymentNumber: parseInt(cuota.numcuo || 0),
          date: formatDisplayDate(cuota.fecvnc),
          capital: parseFloat(cuota.valcap || 0),
          interest: parseFloat(cuota.valint || 0),
          others: parseFloat(cuota.valotr || 0),        // ← NUEVO: Otros valores
          paymentAmount: parseFloat(cuota.valcuo || 0), // ← Renombrado para claridad
          balance: parseFloat(cuota.salcuo || 0),       // ← Usar salcuo (saldo de cuota)
          status: getPaymentStatus(cuota.estcuo),
          reference: `AMT-${cuota.numcuo?.padStart(3, '0')}`,
          originalStatus: cuota.estcuo
        }));
        
        setAmortizationTable(mappedAmortization);
        
        // Actualizar información del crédito si viene en la respuesta
        if (result.data.credito) {
          const creditData = result.data.credito;
          setSelectedCredit(prev => ({
            ...prev,
            originalAmount: parseFloat(creditData.mntcap || prev.originalAmount),
            currentBalance: parseFloat(creditData.salcap || prev.currentBalance),
            interestRate: parseFloat(creditData.tascrd || 0),
            type: creditData.destcr || prev.type,
            status: creditData.desecr || prev.status,
            // Calcular cuota mensual promedio de las cuotas activas
            monthlyPayment: calculateAveragePayment(mappedAmortization),
            remainingPayments: countRemainingPayments(mappedAmortization)
          }));
        }
        
      } else {
        console.error('❌ [AMORTIZATION] Error al cargar tabla de amortización:', result.error);
        setAmortizationError(result.error.message || 'Error al cargar la tabla de amortización');
      }
      
    } catch (err) {
      console.error('💥 [AMORTIZATION] Error inesperado:', err);
      setAmortizationError('Error inesperado. Intente nuevamente.');
    } finally {
      setLoadingAmortization(false);
    }
  };

  // Funciones de utilidad para formateo
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getPaymentStatus = (estcuo) => {
    const statusMap = {
      'Pg.T.A': 'Pagado Total',
      'Pg.T.V': 'Pagado Vencido',
      'Pendiente': 'Pendiente',
      'Vencido': 'Vencido',
      'Reclsf': 'Reclasificado'
    };
    return statusMap[estcuo] || estcuo || 'Sin Estado';
  };

  const getCreditStatusDisplay = (status) => {
    const statusMap = {
      'ACTIVO': { text: 'ACTIVO', color: 'bg-sky-100 text-sky-800 border-sky-200' },
      'VENCIDO': { text: 'VENCIDO', color: 'bg-red-100 text-red-800 border-red-200' },
      'RECLASIFICADO': { text: 'RECLASIFICADO', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      'CANCELADO': { text: 'CANCELADO', color: 'bg-gray-100 text-gray-800 border-gray-200' }
    };
    return statusMap[status] || { text: status, color: 'bg-sky-100 text-sky-800 border-sky-200' };
  };

  const calculateAveragePayment = (amortizationData) => {
    const activePayments = amortizationData.filter(cuota => cuota.paymentAmount > 0);
    if (activePayments.length === 0) return 0;
    const total = activePayments.reduce((sum, cuota) => sum + cuota.paymentAmount, 0);
    return total / activePayments.length;
  };

  const countRemainingPayments = (amortizationData) => {
    return amortizationData.filter(cuota => 
      cuota.originalStatus === 'Pendiente' || 
      cuota.originalStatus === 'Reclsf'
    ).length;
  };

  // Función para descargar PDF de tabla de amortización
  const downloadAmortizationPDF = async () => {
    try {
      console.log('📄 [PDF] Generando tabla de amortización PDF...');
      console.log('📄 [PDF] selectedCredit:', selectedCredit);
      console.log('📄 [PDF] amortizationTable:', amortizationTable);
      
      if (!selectedCredit || !amortizationTable || amortizationTable.length === 0) {
        alert('No hay datos de amortización disponibles para generar el PDF.');
        return;
      }
      
      // Crear nuevo documento PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Cargar logo (EXACTAMENTE IGUAL A SAVINGS)
      let logoDataUrl = null;
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";

        await new Promise((resolve, reject) => {
          logoImg.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = logoImg.width;
            canvas.height = logoImg.height;
            ctx.drawImage(logoImg, 0, 0);
            logoDataUrl = canvas.toDataURL("image/png");
            resolve();
          };
          logoImg.onerror = reject;
          logoImg.src = "/assets/images/isocoaclasnaves.png";
        });
      } catch (error) {
        console.warn("⚠️ [PDF] No se pudo cargar el logo:", error);
      }

      // HEADER - Logo y título (EXACTAMENTE IGUAL A SAVINGS)
      if (logoDataUrl) {
        // Logo: 12x12 en posición 15,13
        doc.addImage(logoDataUrl, "PNG", 15, 13, 12, 12);
      }

      // Título principal (fontSize 10)
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("COOPERATIVA DE AHORRO Y CREDITO VILCABAMBA", pageWidth / 2, 18, {
        align: "center",
      });

      // Subtítulo (fontSize 11)
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("CACVIL - LOJA", pageWidth / 2, 24, { align: "center" });

      // Línea separadora
      doc.setLineWidth(0.3);
      doc.line(15, 32, pageWidth - 15, 32);

      // TABLA DE AMORTIZACIÓN título (fontSize 8)
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("TABLA DE AMORTIZACIÓN", pageWidth / 2, 30, { align: "center" });

      // Información del crédito (fontSize 7) - CON LOS DATOS ESPECÍFICOS
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      
      // PRIMERA LÍNEA
      doc.text("CLIENTE: 3899", 15, 38);
      doc.text("CRÉDITO: 420108000030", 80, 38);
      doc.text("ESTADO: VENCIDO", 150, 38);

      // SEGUNDA LÍNEA
      doc.text("NOMBRE: ESPINOSA SALCEDO BORIS IBAN", 15, 42);
      doc.text("OPERACIÓN: 420108000030000472", 120, 42);

      // TERCERA LÍNEA
      doc.text("No. SOLICITUD: 420108000030", 15, 46);
      doc.text("FECHA INICIO: 07/03/2024", 80, 46);

      // CUARTA LÍNEA
      doc.text("FECHA MANTEN.: 11/9/2025", 15, 50);
      doc.text("CALIFICACIÓN P.: A1", 80, 50);

      // QUINTA LÍNEA
      doc.text("MONTO: $5000.00", 15, 54);
      doc.text("PERÍODO: MENSUAL", 60, 54);
      doc.text("PLAZO: 3 años 4 meses", 120, 54);

      // SEXTA LÍNEA
      doc.text("LÍNEA CRÉDITO: COMERCIO MINORISTA", 15, 58);
      doc.text("CALIFICACIÓN E.: A RIESGO NORMAL", 120, 58);

      // Preparar datos para la tabla
      const tableData = amortizationTable.map(cuota => [
        (cuota.paymentNumber || 0).toString(),
        cuota.date || '',
        (cuota.capital || 0).toFixed(2),
        (cuota.interest || 0).toFixed(2),
        (cuota.others || 0).toFixed(2),
        (cuota.paymentAmount || 0).toFixed(2),
        (cuota.balance || 0).toFixed(2),
        cuota.originalStatus || ''
      ]);
      
      // Configurar tabla (EXACTAMENTE IGUAL A SAVINGS)
      const tableConfig = {
        startY: 68, // Ajustado para dar espacio a toda la información
        head: [['NRO.', 'FEC. VENCI\nMIENTO', 'CAPITAL', 'INTERÉS', 'OTROS', 'CUOTA', 'SALDO', 'ESTADO']],
        body: tableData,
        theme: "striped", // IGUAL A SAVINGS
        styles: {
          fontSize: 7, // IGUAL A SAVINGS
          cellPadding: 0.3, // IGUAL A SAVINGS
          lineColor: [200, 200, 200], // IGUAL A SAVINGS
          lineWidth: 0.3, // IGUAL A SAVINGS
          minCellHeight: 6, // IGUAL A SAVINGS
          valign: 'middle', // IGUAL A SAVINGS
        },
        headStyles: {
          fillColor: [240, 240, 240], // IGUAL A SAVINGS
          textColor: [0, 0, 0], // IGUAL A SAVINGS
          fontStyle: "bold",
          fontSize: 7, // IGUAL A SAVINGS
          halign: "center",
          minCellHeight: 6, // IGUAL A SAVINGS
          cellPadding: 0.3, // IGUAL A SAVINGS
          valign: 'middle',
          lineColor: [200, 200, 200], // IGUAL A SAVINGS
          lineWidth: 0.3, // IGUAL A SAVINGS
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 20, cellPadding: 0.2 }, // NRO
          1: { halign: "center", cellWidth: 26, cellPadding: 0.3 }, // FECHA
          2: { halign: "right", cellWidth: 22, cellPadding: 0.2 }, // CAPITAL
          3: { halign: "right", cellWidth: 22, cellPadding: 0.2 }, // INTERÉS
          4: { halign: "right", cellWidth: 20, cellPadding: 0.2 }, // OTROS
          5: { halign: "right", cellWidth: 22, cellPadding: 0.2 }, // CUOTA
          6: { halign: "right", cellWidth: 22, cellPadding: 0.2 }, // SALDO
          7: { halign: "center", cellWidth: 26, cellPadding: 0.2 } // ESTADO
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248], // IGUAL A SAVINGS
        },
        margin: { left: 15, right: 15, top: 50 }, // IGUAL A SAVINGS
        pageBreak: 'auto',
        showHead: 'everyPage',
        tableLineColor: [200, 200, 200], // IGUAL A SAVINGS
        tableLineWidth: 0.3, // IGUAL A SAVINGS
        rowPageBreak: 'avoid',
        tableWidth: pageWidth - 30, // IGUAL A SAVINGS
        drawHeaderRow: true,
        drawRow: true,
        // PAGINACIÓN EXACTAMENTE IGUAL A SAVINGS
        didDrawPage: function(data) {
          const currentPage = data.pageNumber;
          const totalPages = data.pageCount;
          
          // Solo agregar header completo si no es la primera página
          if (currentPage > 1) {
            // Logo en páginas adicionales
            if (logoDataUrl) {
              doc.addImage(logoDataUrl, "PNG", 15, 13, 12, 12);
            }
            
            // Título compacto en páginas adicionales
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("COOPERATIVA DE AHORRO Y CREDITO VILCABAMBA", pageWidth / 2, 18, { align: "center" });
            
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text("TABLA DE AMORTIZACIÓN", pageWidth / 2, 24, { align: "center" });
            
            // Información del crédito en páginas adicionales
            doc.setFontSize(6);
            doc.setFont("helvetica", "bold");
            doc.text("CRÉDITO: 420108000030 - ESPINOSA SALCEDO BORIS IBAN", 15, 30);
            
            // Línea separadora
            doc.setLineWidth(0.2);
            doc.line(15, 32, pageWidth - 15, 32);
            
            // Línea de información en páginas adicionales
            doc.setFontSize(6);
            doc.setFont("helvetica", "normal");
            
            const headerInfoY = 38;
            
            // Lado izquierdo: Monto
            doc.text("Monto: $5000.00", 15, headerInfoY);
            
            // Centro: Total cuotas
            doc.text(`Cuotas: ${amortizationTable.length}`, pageWidth / 2, headerInfoY, { align: "center" });
            
            // Lado derecho: Paginación
            doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - 15, headerInfoY, { align: "right" });
            
            // Ajustar startY para páginas adicionales
            data.settings.startY = 58;
          } else {
            // Paginación y datos en header (PRIMERA PÁGINA)
            doc.setFontSize(6);
            doc.setFont("helvetica", "normal");
            
            const headerInfoY = 66;
            
            // Lado izquierdo: Monto
            doc.text("Monto: $5000.00", 15, headerInfoY);
            
            // Centro: Total cuotas
            doc.text(`Cuotas: ${amortizationTable.length}`, pageWidth / 2, headerInfoY, { align: "center" });
            
            // Lado derecho: Paginación
            doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - 15, headerInfoY, { align: "right" });
          }
        }
      };

      // Generar tabla con paginación en header
      doc.autoTable(tableConfig);
      
      // Footer simple (EXACTAMENTE IGUAL A SAVINGS)
      const finalY = doc.lastAutoTable.finalY + 5;

      if (finalY < pageHeight - 20) {
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        
        // Saldo final alineado a la izquierda
        const saldoFinalText = `Saldo pendiente: $${(selectedCredit.currentBalance || 0).toLocaleString("es-EC", { minimumFractionDigits: 2 })}`;
        doc.text(saldoFinalText, 15, finalY);

        // Fecha de generación alineada a la derecha (EXACTAMENTE IGUAL A SAVINGS)
        const fechaGeneracion = new Date().toLocaleString("es-EC", {
          day: "2-digit",
          month: "2-digit", 
          year: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        doc.text(`Generado: ${fechaGeneracion}`, pageWidth - 15, finalY, { align: "right" });
      }

      // Generar nombre del archivo
      const fechaActualFile = new Date().toISOString().split('T')[0];
      const nombreArchivo = `tabla_amortizacion_420108000030_${fechaActualFile}.pdf`;
      
      // Descargar PDF
      doc.save(nombreArchivo);
      
      console.log('✅ [PDF] Tabla de amortización generada exitosamente');
      
      // Mostrar mensaje de éxito
      alert('Tabla de amortización descargada exitosamente');
      
    } catch (error) {
      console.error('❌ [PDF] Error detallado al generar PDF:', error);
      console.error('❌ [PDF] Stack trace:', error.stack);
      console.error('❌ [PDF] selectedCredit en error:', selectedCredit);
      console.error('❌ [PDF] amortizationTable en error:', amortizationTable);
      alert(`Error al generar el PDF: ${error.message}. Revise la consola para más detalles.`);
    }
  };

  // Cálculos de paginación
  const totalPages = Math.ceil(credits.length / creditsPerPage);
  const startIndex = (currentPage - 1) * creditsPerPage;
  const endIndex = startIndex + creditsPerPage;
  const currentCredits = credits.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Función para recargar datos
  const refreshData = () => {
    loadUserDataAndCredits();
  };

  // Renderizar estado de carga inicial
  if (loading) {
    return (
      <div className="min-h-full bg-sky-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando créditos...</p>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar error inicial
  if (error) {
    return (
      <div className="min-h-full bg-sky-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-red-600 mb-2">⚠️ Error al cargar</div>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="space-x-3">
                <button
                  onClick={refreshData}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Reintentar
                </button>
                <button
                  onClick={() => {
                    apiService.logout();
                    window.location.href = '/login'; // Ajustar según tu ruta de login
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Iniciar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar tabla de amortización
  if (showAmortization && selectedCredit) {
    const statusDisplay = getCreditStatusDisplay(selectedCredit.status);
    
    return (
      <div className="min-h-full bg-sky-50">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => {
                setShowAmortization(false);
                setSelectedCredit(null);
                setAmortizationTable([]);
                setAmortizationError(null);
              }}
              className="flex items-center space-x-3 text-gray-500 hover:text-gray-700 transition-colors group"
            >
              <div className="p-2 rounded-full bg-white shadow-sm group-hover:shadow-md transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
                </svg>
              </div>
              <span className="font-medium">Volver a Créditos</span>
            </button>

            <div className="flex items-center space-x-3">
              <button 
                onClick={downloadAmortizationPDF}
                className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                <span>Exportar PDF</span>
              </button>
            </div>
          </div>

          {/* Credit Summary Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-8 py-6">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h1 className="text-2xl font-bold mb-1">{selectedCredit.type}</h1>
                  <p className="text-sky-100 font-mono text-lg">{selectedCredit.creditNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sky-100 text-sm font-medium mb-1">Saldo Pendiente</p>
                  <p className="text-4xl font-bold">
                    ${selectedCredit.currentBalance.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Información detallada del crédito (como en el PDF) */}
            <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                {/* Primera fila */}
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Empresa:</span>
                  <span className="text-gray-800">{clienteInfo?.nomemp || 'COOPERATIVA DE AHORRO Y CREDITO VILCABAMBA'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Oficina:</span>
                  <span className="text-gray-800">{clienteInfo?.nomofi || 'CACVIL - LOJA'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Cliente:</span>
                  <span className="text-gray-800">{clienteInfo?.codcli || '0000'}</span>
                </div>

                {/* Segunda fila */}
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Nombre:</span>
                  <span className="text-gray-800">{`${clienteInfo?.apecli || ''} ${clienteInfo?.nomcli || ''}`.trim()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Crédito:</span>
                  <span className="text-gray-800">{selectedCredit.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">No. Solicitud:</span>
                  <span className="text-gray-800">{selectedCredit.id}</span>
                </div>

                {/* Tercera fila */}
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Calificación P.:</span>
                  <span className="text-gray-800">A1</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Operación:</span>
                  <span className="text-gray-800">{selectedCredit.id}000472</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Estado:</span>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold border ${statusDisplay.color}`}>
                    {statusDisplay.text}
                  </span>
                </div>

                {/* Cuarta fila */}
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Fecha Manten.:</span>
                  <span className="text-gray-800">{new Date().toLocaleDateString('es-EC')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Calificación E.:</span>
                  <span className="text-gray-800">A RIESGO NORMAL</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Fecha Inicio:</span>
                  <span className="text-gray-800">{formatDisplayDate(selectedCredit.dueDate)}</span>
                </div>

                {/* Quinta fila */}
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Período:</span>
                  <span className="text-gray-800">M</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Recuperac.:</span>
                  <span className="text-gray-800">MENSUAL (FE)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Plazo:</span>
                  <span className="text-gray-800">3 años 4 meses 15 días</span>
                </div>

                {/* Sexta fila */}
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Monto:</span>
                  <span className="text-gray-800">{selectedCredit.originalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="font-semibold text-gray-600">Línea Crédito:</span>
                  <span className="text-gray-800">{selectedCredit.type}</span>
                </div>
              </div>
            </div>

            {/* SECCIÓN REMOVIDA - Ya no se muestra la información de: Código de Crédito, Cuota Promedio, Tasa de Interés, Cuotas Restantes */}
          </div>

          {/* Amortization Table */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">Tabla de Amortización</h2>
                  <p className="text-gray-600">Plan de pagos y distribución de capital e intereses</p>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loadingAmortization && (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando tabla de amortización...</p>
              </div>
            )}

            {/* Error State */}
            {amortizationError && (
              <div className="p-8 text-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-red-700">{amortizationError}</p>
                  <button
                    onClick={() => handleCreditClick(selectedCredit)}
                    className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {/* Amortization Table */}
            {!loadingAmortization && !amortizationError && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"># Cuota</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha Venc.</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Capital</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Interés</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Otros</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Cuota</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Saldo</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {amortizationTable.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                            No se encontraron cuotas para este crédito
                          </td>
                        </tr>
                      ) : (
                        amortizationTable.map((cuota) => (
                          <tr key={cuota.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 bg-sky-100 text-sky-800 rounded-full text-sm font-bold">
                                {cuota.paymentNumber}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-800">{cuota.date}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-semibold text-sky-600">
                                {cuota.capital.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-semibold text-orange-600">
                                {cuota.interest.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-semibold text-purple-600">
                                {cuota.others.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-bold text-gray-800">
                                {cuota.paymentAmount.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-bold text-red-600">
                                {cuota.balance.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                cuota.originalStatus === 'Pg.T.A' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                                cuota.originalStatus === 'Pg.T.V' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                cuota.originalStatus === 'Pendiente' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                cuota.originalStatus === 'Vencido' ? 'bg-red-100 text-red-800 border border-red-200' :
                                'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}>
                                {cuota.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-gray-600">
                      Mostrando {amortizationTable.length} cuotas | Restantes: {selectedCredit.remainingPayments}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Renderizar listado principal de créditos
  return (
    <div className="min-h-full bg-sky-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <MdAccountBalance className="text-white text-3xl" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Mis Créditos</h1>
          
        </div>

        {/* Summary Stats */}
        {credits.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Créditos</p>
                  <p className="text-3xl font-bold text-gray-800">{credits.length}</p>
                </div>
                <div className="p-3 bg-sky-100 rounded-full">
                  <MdAccountBalance className="text-sky-600 text-2xl" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Saldo Total</p>
                  <p className="text-3xl font-bold text-sky-600">
                    ${credits.reduce((sum, credit) => sum + credit.currentBalance, 0).toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-3 bg-sky-100 rounded-full">
                  <span className="text-sky-600 text-2xl font-bold">$</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Créditos Activos</p>
                  <p className="text-3xl font-bold text-sky-600">
                    {credits.filter(credit => credit.status === 'ACTIVO').length}
                  </p>
                </div>
                <div className="p-3 bg-sky-100 rounded-full">
                  <svg className="w-6 h-6 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Credits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {currentCredits.map((credit) => {
            const statusDisplay = getCreditStatusDisplay(credit.status);
            
            return (
              <div
                key={credit.id}
                onClick={() => handleCreditClick(credit)}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200 cursor-pointer group hover:scale-105"
              >
                {/* Credit Icon */}
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <MdAccountBalance className="text-white text-3xl" />
                  </div>
                </div>

                {/* Credit Type */}
                <h3 className="text-lg font-bold text-gray-800 text-center mb-2 group-hover:text-sky-600 transition-colors">
                  {credit.type}
                </h3>

                {/* Credit Number */}
                <p className="text-gray-500 text-center font-mono text-sm mb-4">
                  {credit.creditNumber}
                </p>

                {/* Balance */}
                <div className="text-center mb-4">
                  <p className="text-2xl font-bold text-sky-600">
                    ${credit.currentBalance.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">{credit.currency}</p>
                </div>

                {/* Credit Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Original:</span>
                    <span className="text-xs font-semibold text-gray-700">
                      ${credit.originalAmount.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Vencimiento:</span>
                    <span className="text-xs font-semibold text-orange-600">
                      {formatDisplayDate(credit.dueDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Estado:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${statusDisplay.color}`}>
                      {statusDisplay.text}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {credits.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdAccountBalance className="text-gray-400 text-4xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No se encontraron créditos</h3>
            <p className="text-gray-500 mb-4">No tienes créditos registrados en este momento.</p>
            <button
              onClick={refreshData}
              className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Actualizar
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === page
                    ? "bg-sky-600 text-white"
                    : "border border-gray-300 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}

        {/* Info de paginación */}
        {totalPages > 1 && (
          <div className="text-center mt-4">
            <p className="text-gray-500 text-sm">
              Mostrando {startIndex + 1}-{Math.min(endIndex, credits.length)} de {credits.length} créditos
            </p>
          </div>
        )}

        {/* Floating Action Button para actualizar */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={refreshData}
            disabled={loading}
            className="bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
            title="Actualizar créditos"
          >
            <svg
              className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreditProductForm;