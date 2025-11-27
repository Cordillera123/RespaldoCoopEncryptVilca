import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const InvestmentConfirmationModal = ({
  isOpen,
  investmentResult,
  onClose
}) => {
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [clienteInfo, setClienteInfo] = useState(null);

  // Obtener datos del cliente cuando se abra el modal
  useEffect(() => {
    if (isOpen && investmentResult?.success) {
      loadClientData();
    }
  }, [isOpen, investmentResult]);

  const loadClientData = async () => {
    try {
      // Importar dinámicamente apiService
      const { default: apiService } = await import('../../../services/apiService');
      
      const cedula = apiService.getUserCedula();
      if (cedula) {
        console.log('📋 [INVESTMENT-PDF] Obteniendo datos del cliente para PDF:', '***' + cedula.slice(-4));
        
        // Usar el método que obtiene cuentas de ahorro para obtener datos del cliente
        const result = await apiService.getSavingsAccounts(cedula);
        
        if (result.success && result.data.cliente) {
          setClienteInfo(result.data.cliente);
          console.log('✅ [INVESTMENT-PDF] Datos del cliente obtenidos exitosamente');
        } else {
          console.warn('⚠️ [INVESTMENT-PDF] No se pudieron obtener datos del cliente');
        }
      }
    } catch (error) {
      console.error('❌ [INVESTMENT-PDF] Error al obtener datos del cliente:', error);
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    } catch (error) {
      return dateString;
    }
  };

  // Función para generar PDF del comprobante de inversión
  const generateInvestmentPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      console.log("📄 [PDF] Generando comprobante de inversión...");

      // Crear nuevo documento PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // Cargar logo
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
      doc.text("CACVIL - LOJA ", pageWidth / 2, 24, { align: "center" });

      // Línea separadora
      doc.setLineWidth(0.3);
      doc.line(15, 32, pageWidth - 15, 32);

      // COMPROBANTE DE INVERSIÓN título (fontSize 8)
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("COMPROBANTE DE INVERSIÓN", pageWidth / 2, 30, { align: "center" });

      // Información de la inversión
      const investment = investmentResult?.data?.inversion;
      if (!investment) {
        throw new Error("No se encontraron datos de la inversión");
      }

      let currentY = 40; // Ajustado para el nuevo header

      // Sección: Datos del Inversionista (CON DATOS REALES) - fontSize 7
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("DATOS DEL INVERSIONISTA", 15, currentY);
      
      currentY += 8; // Espaciado reducido
      doc.setFontSize(6); // Tamaño más pequeño para consistencia
      doc.setFont("helvetica", "normal");
      
      // Usar datos reales del cliente si están disponibles
      if (clienteInfo) {
        // Importar decrypt para desencriptar la cédula
        const { decrypt } = await import('../../../utils/crypto/encryptionService');
        
        // Desencriptar cédula si está encriptada (Base64 con =)
        let cedulaDesencriptada = clienteInfo.idecli || '';
        if (cedulaDesencriptada.includes('=') && cedulaDesencriptada.length > 15) {
          try {
            cedulaDesencriptada = decrypt(clienteInfo.idecli);
            console.log('🔓 [PDF] Cédula desencriptada para PDF:', '***' + cedulaDesencriptada.slice(-4));
          } catch (error) {
            console.error('❌ [PDF] Error al desencriptar cédula:', error);
          }
        }
        
        doc.text(`Cliente: ${clienteInfo.nomcli || ''} ${clienteInfo.apecli || ''}`, 15, currentY);
        currentY += 6; // Espaciado reducido
        doc.text(`Cédula: ${cedulaDesencriptada}`, 15, currentY);
        currentY += 6;
      } else {
        doc.text("Cliente: [Datos del cliente]", 15, currentY);
        currentY += 6;
        doc.text("Cédula: [Número de cédula]", 15, currentY);
        currentY += 6;
      }
      
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const emissionDate = `${year}/${month}/${day}`;
      doc.text(`Fecha de emisión: ${emissionDate}`, 15, currentY);
      currentY += 12; // Espaciado reducido

      // Sección: Detalles de la Inversión - fontSize 7
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("DETALLES DE LA INVERSIÓN", 15, currentY);
      
      currentY += 8; // Espaciado reducido

      // Preparar datos para la tabla principal con mejor espaciado
      const mainTableData = [
        ["Código de Inversión", investment.codigo || "N/A"],
        ["Monto Invertido", formatCurrency(investment.capital || 0)],
        ["Plazo", `${investment.plazoEnDias || 0} días`],
        ["Fecha de Inicio", formatDateShort(investment.fechaInicio)],
        ["Fecha de Vencimiento", formatDateShort(investment.fechaVencimiento)],
        ["Tasa de Interés", investment.tasaInteres ? `${investment.tasaInteres}% anual` : "N/A"]
      ];

      // Configurar tabla principal (EXACTAMENTE IGUAL A SAVINGS)
      doc.autoTable({
        startY: currentY,
        body: mainTableData,
        theme: "striped", // IGUAL A SAVINGS
        styles: {
          fontSize: 7, // IGUAL A SAVINGS
          cellPadding: 0.3, // IGUAL A SAVINGS
          lineColor: [200, 200, 200], // IGUAL A SAVINGS
          lineWidth: 0.3, // IGUAL A SAVINGS
          minCellHeight: 6, // IGUAL A SAVINGS
          valign: 'middle', // IGUAL A SAVINGS
        },
        columnStyles: {
          0: { 
            fontStyle: 'bold', 
            fillColor: [240, 240, 240], // IGUAL A SAVINGS
            halign: 'left', 
            cellWidth: 65,
            cellPadding: 0.2 // IGUAL A SAVINGS
          },
          1: { 
            halign: 'left', 
            cellWidth: 75,
            cellPadding: 0.3 // IGUAL A SAVINGS
          }
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248], // IGUAL A SAVINGS
        },
        margin: { left: 15, right: 15, top: 50 }, // IGUAL A SAVINGS
        tableWidth: pageWidth - 30 // IGUAL A SAVINGS
      });

      currentY = doc.lastAutoTable.finalY + 12; // Espaciado reducido

      // Sección: Proyección Financiera - fontSize 7
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text("PROYECCIÓN FINANCIERA", 15, currentY);
      
      currentY += 8; // Espaciado reducido

      // Preparar datos para la tabla financiera
      const financialTableData = [
        ["Capital Invertido", formatCurrency(investment.capital || 0)],
        ["Intereses Brutos", "+" + formatCurrency(investment.interes || 0)],
      ];

      // Agregar retención si existe
      if (investment.retencion && investment.retencion > 0) {
        financialTableData.push(["Retención de Impuestos", "-" + formatCurrency(investment.retencion)]);
      }

      financialTableData.push(["TOTAL A RECIBIR", formatCurrency(investment.montoRecibir || 0)]);

      // Configurar tabla financiera (EXACTAMENTE IGUAL A SAVINGS)
      doc.autoTable({
        startY: currentY,
        body: financialTableData,
        theme: "striped", // IGUAL A SAVINGS
        styles: {
          fontSize: 7, // IGUAL A SAVINGS
          cellPadding: 0.3, // IGUAL A SAVINGS
          lineColor: [200, 200, 200], // IGUAL A SAVINGS
          lineWidth: 0.3, // IGUAL A SAVINGS
          minCellHeight: 6, // IGUAL A SAVINGS
          valign: 'middle'
        },
        columnStyles: {
          0: { 
            fontStyle: 'bold', 
            fillColor: [240, 240, 240], // IGUAL A SAVINGS
            halign: 'left', 
            cellWidth: 80,
            cellPadding: 0.2 // IGUAL A SAVINGS
          },
          1: { 
            halign: 'right', 
            cellWidth: 60, 
            fontStyle: 'bold',
            cellPadding: 0.2 // IGUAL A SAVINGS
          }
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248], // IGUAL A SAVINGS
        },
        // Estilo especial para la última fila (total)
        didParseCell: function(data) {
          if (data.row.index === financialTableData.length - 1) {
            data.cell.styles.fillColor = [34, 197, 94]; // Verde
            data.cell.styles.textColor = [255, 255, 255]; // Blanco
            data.cell.styles.fontSize = 8; // Tamaño consistente
            data.cell.styles.fontStyle = 'bold';
          }
        },
        margin: { left: 15, right: 15, top: 50 }, // IGUAL A SAVINGS
        tableWidth: pageWidth - 30 // IGUAL A SAVINGS
      });

      currentY = doc.lastAutoTable.finalY + 12; // Espaciado reducido

      // Términos y condiciones con formato estándar
      if (currentY < pageHeight - 60) {
        doc.setFontSize(7); // Tamaño estándar
        doc.setFont("helvetica", "bold");
        doc.text("TÉRMINOS Y CONDICIONES:", 15, currentY);
        
        currentY += 6; // Espaciado reducido
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6); // Tamaño más pequeño para términos
        
        const terms = [
          "• Esta inversión está sujeta a los términos y condiciones de la cooperativa",
          "• Los fondos han sido debitados de su cuenta de ahorros",
          "• Al vencimiento recibirá el capital más los intereses calculados",
          "• Para renovaciones o consultas, contacte con nuestras oficinas"
        ];
        
        terms.forEach(term => {
          doc.text(term, 15, currentY);
          currentY += 4; // Espaciado más compacto
        });
      }

      // Footer (EXACTAMENTE IGUAL A SAVINGS)
      const footerY = pageHeight - 25;
      doc.setFontSize(6); // IGUAL A SAVINGS
      doc.setFont("helvetica", "normal");
      
      const fechaGeneracion = new Date().toLocaleString("es-EC", {
        day: "2-digit",
        month: "2-digit", 
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
      
      doc.text(`Generado: ${fechaGeneracion}`, 15, footerY);
      doc.text("COOPERATIVA DE AHORRO Y CREDITO VILCABAMBA - Sistema de Inversiones", pageWidth - 15, footerY, { align: "right" });

      // No hay línea de pie para mantener simplicidad del formato estándar

      // Generar nombre del archivo
      const fechaActual = new Date().toISOString().split("T")[0];
      const nombreArchivo = `comprobante_inversion_${investment.codigo || 'INV'}_${fechaActual}.pdf`;

      // Descargar PDF
      doc.save(nombreArchivo);

      console.log("✅ [PDF] Comprobante de inversión generado exitosamente");

    } catch (error) {
      console.error("❌ [PDF] Error al generar PDF:", error);
      alert("Error al generar el PDF. Intente nuevamente.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-screen overflow-y-auto">
        
        {investmentResult?.success ? (
          // MODAL DE ÉXITO
          <>
            {/* Header de éxito */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-6 rounded-t-2xl text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.41,10.09L6,11.5L11,16.5Z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">¡Inversión Exitosa!</h2>
              <p className="text-green-100">Su inversión ha sido registrada correctamente</p>
            </div>

            {/* Contenido de éxito */}
            <div className="p-6">
              
              {/* Información principal */}
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                <h3 className="font-bold text-green-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  Detalles de su inversión
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">Código de inversión:</span>
                    <span className="font-bold text-green-800 font-mono">
                      {investmentResult?.data?.inversion?.codigo}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">Monto invertido:</span>
                    <span className="font-bold text-green-800 text-lg">
                      {formatCurrency(investmentResult?.data?.inversion?.capital || 0)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">Plazo:</span>
                    <span className="font-semibold text-green-800">
                      {investmentResult?.data?.inversion?.plazoEnDias} días
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">Fecha de inicio:</span>
                    <span className="font-semibold text-green-800">
                      {formatDate(investmentResult?.data?.inversion?.fechaInicio)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">Fecha de vencimiento:</span>
                    <span className="font-semibold text-green-800">
                      {formatDate(investmentResult?.data?.inversion?.fechaVencimiento)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Proyección de ganancias */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7,10L12,15L17,10H7Z"/>
                  </svg>
                  Proyección de ganancias
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Intereses brutos:</span>
                    <span className="font-semibold text-blue-800">
                      +{formatCurrency(investmentResult?.data?.inversion?.interes || 0)}
                    </span>
                  </div>
                  
                  {investmentResult?.data?.inversion?.retencion > 0 && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Retención:</span>
                      <span className="font-semibold text-red-600">
                        -{formatCurrency(investmentResult?.data?.inversion?.retencion || 0)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="text-blue-700 font-semibold">Total a recibir:</span>
                    <span className="font-bold text-blue-900 text-lg">
                      {formatCurrency(investmentResult?.data?.inversion?.montoRecibir || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información importante */}
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Importante:</p>
                    <ul className="space-y-1 text-xs text-yellow-700">
                      <li>• Su inversión está registrada y activa</li>
                      <li>• Los fondos han sido debitados de su cuenta</li>
                      <li>• Al vencimiento recibirá el capital más intereses</li>
                      <li>• Puede consultar el detalle en su historial de inversiones</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Botón de PDF únicamente */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={generateInvestmentPDF}
                  disabled={isGeneratingPdf}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {isGeneratingPdf ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
                      </svg>
                      <span>Generando PDF...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      </svg>
                      <span>Descargar Comprobante PDF</span>
                    </>
                  )}
                </button>
              </div>

              {/* Botón de cierre */}
              <button
                onClick={onClose}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                  </svg>
                  <span>Finalizar</span>
                </div>
              </button>
            </div>
          </>
        ) : (
          // MODAL DE ERROR
          <>
            {/* Header de error */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-6 rounded-t-2xl text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Error en la Inversión</h2>
              <p className="text-red-100">No se pudo completar el registro</p>
            </div>

            {/* Contenido de error */}
            <div className="p-6">
              
              {/* Mensaje de error */}
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <h3 className="font-bold text-red-800 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  Motivo del error
                </h3>
                <p className="text-red-700">
                  {investmentResult?.error?.message || 'Error desconocido al procesar la inversión'}
                </p>
                
                {investmentResult?.error?.code && (
                  <p className="text-red-600 text-sm mt-2">
                    Código de error: {investmentResult.error.code}
                  </p>
                )}
              </div>

              {/* Información de ayuda */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">¿Qué puede hacer?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Verifique que su cuenta tenga fondos suficientes</li>
                  <li>• Intente nuevamente en unos minutos</li>
                  <li>• Contacte a soporte si el problema persiste</li>
                  <li>• Sus fondos no fueron debitados</li>
                </ul>
              </div>

              {/* Botones */}
              <div className="space-y-3">
                <button
                  onClick={onClose}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InvestmentConfirmationModal;