import React, { useState, useEffect } from "react";
import { MdSavings } from "react-icons/md";
import apiService from "../../services/apiService"; // Ajustar ruta según tu estructura

// Importar jsPDF para generar PDFs
import jsPDF from "jspdf";
import "jspdf-autotable";

const SavingsProductForm = () => {
  // Estados para datos reales
  const [savingsAccounts, setSavingsAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clienteInfo, setClienteInfo] = useState(null);
  const [userCedula, setUserCedula] = useState(""); // Para almacenar la cédula del usuario logueado

  // Estados para estado de cuenta
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showStatement, setShowStatement] = useState(false);
  const [accountStatement, setAccountStatement] = useState([]);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [statementError, setStatementError] = useState(null);

  // ============================================
  // 🔥 ESTADO SIMPLIFICADO PARA FECHAS YYYY/MM/DD
  // ============================================
  
  // Solo un estado para fechas en formato YYYY/MM/DD
  const [dateFilters, setDateFilters] = useState({
    fechaDesde: "", // YYYY/MM/DD
    fechaHasta: "", // YYYY/MM/DD
  });

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const accountsPerPage = 4;

  // ============================================
  // 🔥 FUNCIONES DE CONVERSIÓN DE FECHAS YYYY/MM/DD
  // ============================================
  
  // Convertir YYYY/MM/DD a YYYY-MM-DD para input HTML
  const formatDateForHtmlInput = (yyyymmddDate) => {
    if (!yyyymmddDate) return "";
    
    try {
      // Si viene en formato YYYY/MM/DD, convertir a YYYY-MM-DD para input HTML
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
      // Convertir YYYY-MM-DD a YYYY/MM/DD
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
  console.log('🔧 [API-DATE] Tipo de entrada:', typeof yyyymmddDate);
  
  if (!yyyymmddDate) {
    console.warn('⚠️ [API-DATE] Fecha vacía recibida');
    return "";
  }
  
  try {
    // Verificar formato
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
    console.log('🔧 [API-DATE] Desglose:', { year, month, day });
    
    // Validar que sean números
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      console.error('❌ [API-DATE] Alguna parte no es número:', { year, month, day });
      return "";
    }

    const result = `${month}/${day}/${year}`;
    console.log('🔧 [API-DATE] Resultado MM/DD/YYYY:', result);
    console.log('🔧 [API-DATE] ===== FIN CONVERSIÓN =====');
    
    return result;
  } catch (error) {
    console.error("❌ [API-DATE] Error en conversión:", error);
    return "";
  }
};

  // Convertir de formato API (MM/DD/YYYY) a nuestro formato (YYYY/MM/DD)
  const convertApiDateToYYYYMMDD = (apiDate) => {
    if (!apiDate) return "";
    
    try {
      // Convertir MM/DD/YYYY a YYYY/MM/DD
      const [month, day, year] = apiDate.split("/");
      return `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
    } catch (error) {
      console.warn("Error al convertir fecha de API:", error);
      return "";
    }
  };

  // Formatear fecha para mostrar al usuario (YYYY/MM/DD)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    
    try {
      // Si viene de un movimiento en formato YYYY-MM-DD, convertir primero
      if (dateString.includes('-')) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
      }
      
      // Ya está en formato YYYY/MM/DD
      return dateString;
    } catch (error) {
      console.warn("Error al formatear fecha para display:", error);
      return dateString;
    }
  };

  // Cargar cuentas de ahorro al montar el componente
  useEffect(() => {
    loadUserDataAndAccounts();
  }, []);

  // Función para obtener datos del usuario y cargar cuentas
  const loadUserDataAndAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("🔍 [USER] Obteniendo datos del usuario logueado...");

      // Obtener sesión del usuario
      const session = apiService.getUserSession();
      console.log("📊 [USER] Sesión obtenida:", session);

      if (!session || !session.userData) {
        throw new Error(
          "No hay sesión activa. Por favor, inicie sesión nuevamente."
        );
      }

      // Extraer cédula del usuario logueado
      let cedula = null;

      // Buscar en la estructura: userData.cliente[0].idecli
      if (
        session.userData.cliente &&
        Array.isArray(session.userData.cliente) &&
        session.userData.cliente[0]?.idecli
      ) {
        cedula = session.userData.cliente[0].idecli;
        console.log(
          "✅ [USER] Cédula encontrada en cliente[0].idecli:",
          cedula
        );
      }
      // Fallback: buscar en userData.cliente.idecli (por si no es array)
      else if (session.userData.cliente?.idecli) {
        cedula = session.userData.cliente.idecli;
        console.log("✅ [USER] Cédula encontrada en cliente.idecli:", cedula);
      }
      // Fallback: buscar directamente en userData
      else if (session.userData.idecli) {
        cedula = session.userData.idecli;
        console.log("✅ [USER] Cédula encontrada en userData.idecli:", cedula);
      }

      if (!cedula) {
        console.error("❌ [USER] No se encontró la cédula en la sesión");
        console.log(
          "🔍 [USER] Estructura de userData:",
          Object.keys(session.userData)
        );
        throw new Error(
          "No se pudo obtener la cédula del usuario. Estructura de sesión inesperada."
        );
      }

      // Guardar cédula del usuario
      setUserCedula(cedula);

      // Cargar cuentas de ahorro con la cédula obtenida
      await loadSavingsAccounts(cedula);
    } catch (err) {
      console.error("💥 [USER] Error al obtener datos del usuario:", err);
      setError(err.message || "Error al obtener los datos del usuario");
      setLoading(false);
    }
  };

  // Función para cargar cuentas de ahorro con cédula específica
  const loadSavingsAccounts = async (cedulaParam) => {
    const cedulaToUse = cedulaParam || userCedula;

    if (!cedulaToUse) {
      setError("Debe tener una cédula válida para consultar");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(
        "🔄 [SAVINGS] Cargando cuentas de ahorro para cédula:",
        cedulaToUse
      );

      // Llamar directamente con la cédula
      const result = await apiService.getSavingsAccounts(cedulaToUse);

      if (result.success) {
        console.log(
          "✅ [SAVINGS] Cuentas cargadas exitosamente:",
          result.data.cuentas
        );

        // Mapear datos de API a formato del componente
        const mappedAccounts = result.data.cuentas.map((cuenta) => ({
          id: cuenta.codcta,
          type: cuenta.desdep,
          balance: parseFloat(cuenta.saldis || cuenta.salcnt || 0),
          availableBalance: parseFloat(cuenta.saldis || 0),
          totalBalance: parseFloat(cuenta.salcnt || 0),
          status: cuenta.desect,
          accountNumber: formatAccountNumber(cuenta.codcta),
          currency: "USD",
          interestRate: getInterestRateByType(cuenta.desdep),
          lastMovement: new Date().toISOString().split("T")[0], // Fecha actual como placeholder
        }));

        setSavingsAccounts(mappedAccounts);
        setClienteInfo(result.data.cliente);
      } else {
        console.error("❌ [SAVINGS] Error al cargar cuentas:", result.error);
        setError(
          result.error.message || "Error al cargar las cuentas de ahorro"
        );
      }
    } catch (err) {
      console.error("💥 [SAVINGS] Error inesperado:", err);
      setError("Error inesperado al cargar las cuentas. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear número de cuenta
  const formatAccountNumber = (accountCode) => {
    if (!accountCode) return "****";
    const str = accountCode.toString();
    return `**** **** **** ${str.slice(-4)}`;
  };

  // Función para obtener tasa de interés según tipo de cuenta
  const getInterestRateByType = (tipoCuenta) => {
    const rates = {
      "AHORROS A LA VISTA": 2.5,
      "AHORRO JUNIOR": 2.8,
      "AHORRO PROGRAMADO": 4.0,
      "AHORRO NAVIDEÑO": 4.5,
      "AHORRO PREMIUM": 3.8,
    };
    return rates[tipoCuenta] || 2.0;
  };

  // ============================================
  // 🔥 FUNCIÓN handleAccountClick ACTUALIZADA
  // ============================================
  
  // Función para manejar click en cuenta
  const handleAccountClick = async (account) => {
  try {
    setSelectedAccount(account);
    setShowStatement(true);
    setLoadingStatement(true);
    setStatementError(null);
    setAccountStatement([]);

    console.log("🔄 [STATEMENT] ===== INICIANDO CARGA =====");
    console.log("🔄 [STATEMENT] Cuenta seleccionada:", account.id);
    console.log("🔄 [STATEMENT] Estado dateFilters:", dateFilters);

    // Obtener fechas para la API
    let fechaDesdeApi, fechaHastaApi;

    if (dateFilters.fechaDesde && dateFilters.fechaHasta) {
      // Usar fechas del filtro si están disponibles
      fechaDesdeApi = formatDateForApi(dateFilters.fechaDesde);
      fechaHastaApi = formatDateForApi(dateFilters.fechaHasta);
      
      console.log("📅 [STATEMENT] Usando fechas del filtro:");
      console.log("📅 [STATEMENT] Desde (YYYY/MM/DD):", dateFilters.fechaDesde, "-> API:", fechaDesdeApi);
      console.log("📅 [STATEMENT] Hasta (YYYY/MM/DD):", dateFilters.fechaHasta, "-> API:", fechaHastaApi);
    } else {
      // Usar rango por defecto
      console.log("📅 [STATEMENT] No hay filtros, usando rango por defecto");
      const defaultRange = apiService.getDefaultDateRange();
      fechaDesdeApi = defaultRange.fechaDesde;
      fechaHastaApi = defaultRange.fechaHasta;

      console.log("📅 [STATEMENT] Rango por defecto de API:", { fechaDesdeApi, fechaHastaApi });

      // Convertir a nuestro formato YYYY/MM/DD para mostrar
      const fechaDesdeYYYYMMDD = convertApiDateToYYYYMMDD(fechaDesdeApi);
      const fechaHastaYYYYMMDD = convertApiDateToYYYYMMDD(fechaHastaApi);

      console.log("📅 [STATEMENT] Convertido a YYYY/MM/DD:", { fechaDesdeYYYYMMDD, fechaHastaYYYYMMDD });

      setDateFilters({
        fechaDesde: fechaDesdeYYYYMMDD,
        fechaHasta: fechaHastaYYYYMMDD,
      });
    }

    console.log("📤 [STATEMENT] FECHAS FINALES QUE SE ENVÍAN A LA API:");
    console.log("📤 [STATEMENT] fecdes:", fechaDesdeApi);
    console.log("📤 [STATEMENT] fechas:", fechaHastaApi);

    const cedulaUsuario = userCedula || apiService.getUserCedula();
    if (!cedulaUsuario) {
      throw new Error("No se pudo obtener la información del usuario");
    }

    // LOGGING DEL PAYLOAD COMPLETO
    console.log("📦 [STATEMENT] Payload completo para API:");
    console.log({
      cedula: cedulaUsuario,
      cuenta: account.id,
      fechaDesde: fechaDesdeApi,
      fechaHasta: fechaHastaApi
    });

    // Llamar API para estado de cuenta
    const result = await apiService.getAccountStatement(
      cedulaUsuario,
      account.id,
      fechaDesdeApi,
      fechaHastaApi
    );

    console.log("📊 [STATEMENT] Respuesta completa de la API:", result);

    if (result.success) {
      console.log("✅ [STATEMENT] Estado de cuenta cargado:", result.data.movimientos.length, "movimientos");
      console.log("📊 [STATEMENT] Período consultado:", fechaDesdeApi, "a", fechaHastaApi);

      // DEBUGGING: Mostrar todos los movimientos recibidos
      console.log("📋 [STATEMENT] Movimientos recibidos de la API:");
      result.data.movimientos.forEach((mov, index) => {
        console.log(`   ${index + 1}. Fecha: ${mov.fectrn}, Descripción: ${mov.tiptrn}, Referencia: ${mov.docnum}`);
      });

      // Mapear movimientos de API a formato del componente
      const mappedMovements = result.data.movimientos.map((mov, index) => ({
        id: index + 1,
        date: formatDateForDisplay(mov.fectrn),
        description: getMovementDescription(mov.tiptrn, mov.docnum),
        reference: mov.docnum,
        debit: parseFloat(mov.valdeb || 0),
        credit: parseFloat(mov.valcre || 0),
        balance: parseFloat(mov.saldos || 0),
        type: parseFloat(mov.valcre || 0) > 0 ? "credit" : "debit",
        channel: getChannelName(mov.codcaj, mov.tiptrn),
      }));

      console.log("📋 [STATEMENT] Movimientos mapeados:");
      mappedMovements.forEach((mov, index) => {
        console.log(`   ${index + 1}. Fecha formateada: ${mov.date}, Descripción: ${mov.description}`);
      });

      setAccountStatement(mappedMovements);

      if (result.data.cuenta) {
        setSelectedAccount((prev) => ({
          ...prev,
          balance: parseFloat(result.data.cuenta.saldis || prev.balance),
          totalBalance: parseFloat(result.data.cuenta.salcnt || prev.totalBalance),
        }));
      }
    } else {
      console.error("❌ [STATEMENT] Error al cargar estado de cuenta:", result.error);
      setStatementError(result.error.message || "Error al cargar el estado de cuenta");
    }
  } catch (err) {
    console.error("💥 [STATEMENT] Error inesperado:", err);
    setStatementError("Error inesperado. Intente nuevamente.");
  } finally {
    setLoadingStatement(false);
  }
};

  // ============================================
  // 🔥 FUNCIÓN applyDateFilters SIMPLIFICADA
  // ============================================
  
  // Función para aplicar filtros de fecha
 const applyDateFilters = async () => {
  if (!selectedAccount) return;

  console.log('🔍 [DEBUG] ===== INICIANDO FILTROS =====');
  console.log('📅 [DEBUG] Estado dateFilters completo:', dateFilters);
  console.log('📅 [DEBUG] fechaDesde original:', dateFilters.fechaDesde);
  console.log('📅 [DEBUG] fechaHasta original:', dateFilters.fechaHasta);

  // Validar que ambas fechas estén presentes
  if (!dateFilters.fechaDesde || !dateFilters.fechaHasta) {
    setStatementError("Debe seleccionar ambas fechas");
    return;
  }

  // DEBUGGING: Convertir fechas paso a paso
  const fechaDesdeApi = formatDateForApi(dateFilters.fechaDesde);
  const fechaHastaApi = formatDateForApi(dateFilters.fechaHasta);

  console.log('🔄 [DEBUG] Conversión paso a paso:');
  console.log('   📤 fechaDesde YYYY/MM/DD:', dateFilters.fechaDesde);
  console.log('   📤 fechaDesde para API:', fechaDesdeApi);
  console.log('   📤 fechaHasta YYYY/MM/DD:', dateFilters.fechaHasta);
  console.log('   📤 fechaHasta para API:', fechaHastaApi);

  // Validar fechas convertidas
  if (!fechaDesdeApi || !fechaHastaApi) {
    console.error('❌ [DEBUG] Error en conversión de fechas');
    setStatementError("Error al procesar las fechas seleccionadas");
    return;
  }

  // Verificar que las fechas sean válidas
  const fechaDesdeDate = new Date(dateFilters.fechaDesde);
  const fechaHastaDate = new Date(dateFilters.fechaHasta);
  
  console.log('📅 [DEBUG] Fechas como objetos Date:');
  console.log('   📅 fechaDesdeDate:', fechaDesdeDate);
  console.log('   📅 fechaHastaDate:', fechaHastaDate);
  console.log('   📅 fechaDesdeDate válida:', !isNaN(fechaDesdeDate.getTime()));
  console.log('   📅 fechaHastaDate válida:', !isNaN(fechaHastaDate.getTime()));

  if (fechaDesdeDate > fechaHastaDate) {
    setStatementError("La fecha 'Desde' debe ser anterior a la fecha 'Hasta'");
    return;
  }

  const diffTime = Math.abs(fechaHastaDate - fechaDesdeDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  console.log('📊 [DEBUG] Validaciones:');
  console.log('   📊 Diferencia en días:', diffDays);
  console.log('   📊 Rango válido (<=365):', diffDays <= 365);

  if (diffDays > 365) {
    setStatementError("El rango de fechas no puede ser mayor a 1 año");
    return;
  }

  console.log('✅ [DEBUG] Todas las validaciones pasaron');
  console.log('🚀 [DEBUG] Llamando a handleAccountClick con cuenta:', selectedAccount.id);

  // Limpiar error anterior
  setStatementError(null);

  // Recargar estado de cuenta con las nuevas fechas
  await handleAccountClick(selectedAccount);
};
  // Funciones de utilidad para formateo (mantenidas)
  const getMovementDescription = (tiptrn, docnum) => {
    const descriptions = {
      Efect: "Efectivo",
      Trans: "Transferencia",
      Depos: "Depósito",
      Retir: "Retiro",
    };

    if (docnum?.includes("DPMVL")) return "Depósito en efectivo";
    if (docnum?.includes("RTMVL")) return "Retiro en efectivo";
    if (docnum?.includes("TRF")) return "Transferencia";
    if (docnum?.includes("INT")) return "Intereses ganados";
    if (docnum?.includes("SALANT")) return "Saldo anterior";

    return descriptions[tiptrn] || "Movimiento bancario";
  };

  const getChannelName = (codcaj, tiptrn) => {
    if (codcaj === "000") return "Sistema";
    if (codcaj === "001") return "Sucursal";
    if (tiptrn === "Efect") return "Cajero ATM";
    return "Online";
  };

  // Función para descargar PDF (mantenida igual)
  const downloadStatementPDF = async () => {
    try {
      console.log("📄 [PDF] Generando estado de cuenta PDF...");

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

      // HEADER - Logo y título (OPTIMIZADO)
      if (logoDataUrl) {
        // Logo más pequeño: 18x18 en lugar de 25x25
        doc.addImage(logoDataUrl, "PNG", 15, 13, 12, 12);
      }

      // Título principal (reducido de 16 a 14)
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("COOPERATIVA DE AHORRO Y CREDITO VILCABAMBA", pageWidth / 2, 18, {
        align: "center",
      });

      // Subtítulo (reducido de 14 a 11)
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("VILCABAMBA - LOJA", pageWidth / 2, 24, { align: "center" });

      // Línea separadora (más arriba para optimizar espacio)
      doc.setLineWidth(0.3);
      doc.line(15, 32, pageWidth - 15, 32);

      // ESTADO DE CUENTA título (reducido de 12 a 10 para mayor compactación)
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("ESTADO DE CUENTA", pageWidth / 2, 30, { align: "center" });

      // Información de la cuenta (reducido de 9 a 7 para mayor compactación)
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(
        `CUENTA: ${selectedAccount.id} - ${selectedAccount.type}`,
        15,
        38
      );

      if (clienteInfo) {
        doc.text(
          `CLIENTE: ${clienteInfo.apecli} ${clienteInfo.nomcli}`,
          15,
          42
        );
      }

      // El período ahora se muestra en la línea de información del header

      // Preparar datos para la tabla
      const tableData = accountStatement.map((mov) => [
        mov.date,
        mov.description,
        mov.type === "credit"
          ? `+ ${mov.credit.toFixed(2)}`
          : `- ${mov.debit.toFixed(2)}`,
        mov.balance.toLocaleString("es-EC", { minimumFractionDigits: 2 }),
      ]);

      // Configurar tabla (ULTRA COMPACTA CON BORDES SUTILES Y ANCHO COMPLETO)
      const tableConfig = {
        startY: 58, // Ajustado a 60 para dar espacio a la línea de información en header
        head: [["FECHA", "DETALLE", "TRANSACCION", "SALDO"]],
        body: tableData,
        theme: "striped", // Cambiado a "striped" para tener estructura con bordes
        styles: {
          fontSize: 7, // Reducido de 8 a 7 para más densidad
          cellPadding: 0.3, // Reducido drásticamente de 0.8 a 0.3
          lineColor: [200, 200, 200], // Líneas grises sutiles
          lineWidth: 0.3, // Líneas finas pero visibles
          minCellHeight: 6, // Reducido de 8 a 6 para máxima compactación
          valign: 'middle', // Centrado vertical
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          fontSize: 7, // Consistente con el body
          halign: "center",
          minCellHeight: 6, // Header ultra-compacto
          cellPadding: 0.3, // Padding ultra-mínimo en header
          valign: 'middle',
          lineColor: [200, 200, 200], // Bordes del header
          lineWidth: 0.3,
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 24, cellPadding: 0.2 }, // FECHA - aumentado ligeramente
          1: { halign: "left", cellWidth: 90, cellPadding: 0.3 }, // DETALLE - aumentado
          2: { halign: "right", cellWidth: 28, cellPadding: 0.2 }, // TRANSACCION - aumentado
          3: { halign: "right", cellWidth: 38, cellPadding: 0.2 }, // SALDO - aumentado para usar todo el espacio
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248], // Color alternado muy sutil
        },
        margin: { left: 15, right: 15,top:50 },
        // Configuración optimizada para máxima densidad con bordes y ancho completo
        pageBreak: 'auto',
        showHead: 'everyPage',
        tableLineColor: [200, 200, 200], // Líneas de tabla sutiles
        tableLineWidth: 0.3, // Grosor de línea visible pero fino
        // Configuraciones adicionales para compactación extrema
        rowPageBreak: 'avoid',
        tableWidth: pageWidth - 30, // Usar todo el ancho disponible menos márgenes
        // Mantener bordes externos de la tabla
        drawHeaderRow: true,
        drawRow: true,
        // ===== CONFIGURACIÓN DE PAGINACIÓN EN HEADER =====
        didDrawPage: function(data) {
          const currentPage = data.pageNumber;
          const totalPages = data.pageCount;
          
          // Solo agregar header completo si no es la primera página
          if (currentPage > 1) {
            // Logo en páginas adicionales (más pequeño)
            if (logoDataUrl) {
              doc.addImage(logoDataUrl, "PNG", 15, 13, 12, 12);
            }
            
            // Título compacto en páginas adicionales (SIN "Continuación")
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("COOPERATIVA DE AHORRO Y CREDITO VILCABAMBA", pageWidth / 2, 18, { align: "center" });
            
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text("ESTADO DE CUENTA", pageWidth / 2, 24, { align: "center" });
            
            // Información de la cuenta en páginas adicionales
            doc.setFontSize(6);
            doc.setFont("helvetica", "bold");
            doc.text(`CUENTA: ${selectedAccount.id} - ${selectedAccount.type}`, 15, 30);
            
            // Línea separadora
            doc.setLineWidth(0.2);
            doc.line(15, 32, pageWidth - 15, 32);
            
            // Línea de información en páginas adicionales (más abajo)
            doc.setFontSize(6);
            doc.setFont("helvetica", "normal");
            
            const headerInfoY = 38; // Posición más baja para páginas adicionales
            
            // Lado izquierdo: Período
            const periodoHeader = `${dateFilters.fechaDesde || "N/A"} - ${dateFilters.fechaHasta || "N/A"}`;
            doc.text(`Período: ${periodoHeader}`, 15, headerInfoY);
            
            // Centro: Total movimientos
            doc.text(`Movimientos: ${accountStatement.length}`, pageWidth / 2, headerInfoY, { align: "center" });
            
            // Lado derecho: Paginación
            doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - 15, headerInfoY, { align: "right" });
            
            // Ajustar startY para páginas adicionales para evitar sobreposición (MÁS ABAJO)
            data.settings.startY = 58;
          } else {
            // Paginación y datos en header (PRIMERA PÁGINA)
            doc.setFontSize(6);
            doc.setFont("helvetica", "normal");
            
            const headerInfoY = 56; // Posición para primera página
            
            // Lado izquierdo: Período
            const periodoHeader = `${dateFilters.fechaDesde || "N/A"} - ${dateFilters.fechaHasta || "N/A"}`;
            doc.text(`Período: ${periodoHeader}`, 15, headerInfoY);
            
            // Centro: Total movimientos
            doc.text(`Movimientos: ${accountStatement.length}`, pageWidth / 2, headerInfoY, { align: "center" });
            
            // Lado derecho: Paginación
            doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - 15, headerInfoY, { align: "right" });
          }
        }
      };

      // Generar tabla con paginación en header
      doc.autoTable(tableConfig);

      // Footer simple solo en la primera página (saldo final y fecha de generación)
      const finalY = doc.lastAutoTable.finalY + 5;

      if (finalY < pageHeight - 20) {
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        
        // Saldo final alineado a la izquierda
        const saldoFinalText = `Saldo final: $${selectedAccount.balance.toLocaleString("es-EC", { minimumFractionDigits: 2 })}`;
        doc.text(saldoFinalText, 15, finalY);

        // Fecha de generación alineada a la derecha
        const fechaGeneracion = new Date().toLocaleString("es-EC", {
          day: "2-digit",
          month: "2-digit", 
          year: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        doc.text(`Generado: ${fechaGeneracion}`, pageWidth - 15, finalY, {
          align: "right",
        });
      }

      // Generar nombre del archivo
      const fechaActual = new Date().toISOString().split("T")[0];
      const nombreArchivo = `estado_cuenta_${selectedAccount.id}_${fechaActual}.pdf`;

      // Descargar PDF
      doc.save(nombreArchivo);

      console.log("✅ [PDF] Estado de cuenta generado exitosamente");

      // Mostrar mensaje de éxito
      alert("Estado de cuenta descargado exitosamente");
    } catch (error) {
      console.error("❌ [PDF] Error al generar PDF:", error);
      alert("Error al generar el PDF. Intente nuevamente.");
    }
  };

  // Cálculos de paginación
  const totalPages = Math.ceil(savingsAccounts.length / accountsPerPage);
  const startIndex = (currentPage - 1) * accountsPerPage;
  const endIndex = startIndex + accountsPerPage;
  const currentAccounts = savingsAccounts.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Función para recargar datos
  const refreshData = () => {
    loadUserDataAndAccounts();
  };

  // ============================================
  // 🔥 COMPONENTE DE FILTROS DE FECHA ACTUALIZADO
  // ============================================
  
  const DateFiltersComponent = () => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Filtrar por fechas (YYYY/MM/DD)
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-600">
              Desde:
            </label>
            <input
              type="date"
              value={formatDateForHtmlInput(dateFilters.fechaDesde)}
              onChange={(e) => {
                const yyyymmddDate = formatDateFromHtmlInput(e.target.value);
                setDateFilters((prev) => ({
                  ...prev,
                  fechaDesde: yyyymmddDate,
                }));
                console.log("📅 [INPUT] Fecha desde cambiada:", e.target.value, "->", yyyymmddDate);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-600">
              Hasta:
            </label>
            <input
              type="date"
              value={formatDateForHtmlInput(dateFilters.fechaHasta)}
              onChange={(e) => {
                const yyyymmddDate = formatDateFromHtmlInput(e.target.value);
                setDateFilters((prev) => ({
                  ...prev,
                  fechaHasta: yyyymmddDate,
                }));
                console.log("📅 [INPUT] Fecha hasta cambiada:", e.target.value, "->", yyyymmddDate);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <button
            onClick={applyDateFilters}
            disabled={loadingStatement}
            className="bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {loadingStatement ? "Cargando..." : "Aplicar"}
          </button>
          <button
            onClick={() => {
              // Limpiar filtros y volver al rango por defecto
              setDateFilters({ fechaDesde: "", fechaHasta: "" });
              if (selectedAccount) {
                handleAccountClick(selectedAccount);
              }
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>
      
      {/* Mostrar período actual en formato YYYY/MM/DD */}
      {dateFilters.fechaDesde && dateFilters.fechaHasta && (
        <div className="mt-4 p-3 bg-sky-50 rounded-lg">
          <p className="text-sm text-sky-700">
            <strong>Período consultado:</strong> {dateFilters.fechaDesde} al {dateFilters.fechaHasta}
          </p>
        </div>
      )}
    </div>
  );

  // Renderizar estado de carga inicial
  if (loading) {
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
                    window.location.href = "/login"; // Ajustar según tu ruta de login
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

  // Renderizar estado de cuenta
  if (showStatement && selectedAccount) {
    return (
      <div className="min-h-full bg-sky-50">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => {
                setShowStatement(false);
                setSelectedAccount(null);
                setAccountStatement([]);
                setStatementError(null);
                // Limpiar filtros al volver
                setDateFilters({ fechaDesde: "", fechaHasta: "" });
              }}
              className="flex items-center space-x-3 text-gray-500 hover:text-gray-700 transition-colors group"
            >
              <div className="p-2 rounded-full bg-white shadow-sm group-hover:shadow-md transition-all">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
                </svg>
              </div>
              <span className="font-medium">Volver a Ahorros</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={downloadStatementPDF}
                className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                <span>Exportar PDF</span>
              </button>
            </div>
          </div>

          {/* Account Summary Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-8 py-6">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h1 className="text-2xl font-bold mb-1">
                    {selectedAccount.type}
                  </h1>
                  <p className="text-blue-100 font-mono text-lg">
                    {selectedAccount.accountNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sky-100 text-sm font-medium mb-1">
                    Saldo Disponible
                  </p>
                  <p className="text-4xl font-bold">
                    $
                    {selectedAccount.balance.toLocaleString("es-EC", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 font-medium mb-1">
                    Número de Cuenta
                  </p>
                  <p className="font-bold text-gray-800">
                    {selectedAccount.id}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 font-medium mb-1">
                    Tasa de Interés
                  </p>
                  <p className="font-bold text-gray-800">
                    {selectedAccount.interestRate}% anual
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 font-medium mb-1">
                    Saldo Total
                  </p>
                  <p className="font-bold text-gray-800">
                    $
                    {selectedAccount.totalBalance.toLocaleString("es-EC", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 font-medium mb-1">
                    Estado
                  </p>
                  <span className="inline-flex px-3 py-1 bg-sky-100 text-sky-800 rounded-full text-sm font-semibold">
                    {selectedAccount.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* 🔥 USAR EL NUEVO COMPONENTE DE FILTROS */}
          {/* ============================================ */}
          {DateFiltersComponent()}

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">
                    Estado de Cuenta
                  </h2>
                  <p className="text-gray-600">Movimientos y transacciones</p>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loadingStatement && (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando movimientos...</p>
              </div>
            )}

            {/* Error State */}
            {statementError && (
              <div className="p-8 text-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-red-700">{statementError}</p>
                  <button
                    onClick={() => handleAccountClick(selectedAccount)}
                    className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {/* Transactions Table */}
            {!loadingStatement && !statementError && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Descripción
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Referencia
                        </th>
                       
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Débito
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Crédito
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Saldo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {/* ============================================ */}
                      {/* 🔥 MENSAJE MEJORADO CUANDO NO HAY DATOS */}
                      {/* ============================================ */}
                      {accountStatement.length === 0 ? (
                        <tr>
                          <td
                            colSpan="7"
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            {dateFilters.fechaDesde || dateFilters.fechaHasta 
                              ? `No se encontraron movimientos entre ${dateFilters.fechaDesde || 'fecha inicio'} y ${dateFilters.fechaHasta || 'fecha fin'}`
                              : "No se encontraron movimientos en el período seleccionado"
                            }
                          </td>
                        </tr>
                      ) : (
                        accountStatement.map((movement) => (
                          <tr
                            key={movement.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-800">
                                {movement.date}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-2 h-2 rounded-full ${movement.type === "credit" ? "bg-sky-400" : "bg-red-400"}`}
                                ></div>
                                <div className="text-sm font-medium text-gray-800">
                                  {movement.description}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600 font-mono">
                                {movement.reference}
                              </div>
                            </td>
                           
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {movement.debit > 0 ? (
                                <span className="text-sm font-semibold text-red-600">
                                  -${movement.debit.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {movement.credit > 0 ? (
                                <span className="text-sm font-semibold text-sky-600">
                                  +${movement.credit.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-sm font-bold text-gray-800">
                                $
                                {movement.balance.toLocaleString("es-EC", {
                                  minimumFractionDigits: 2,
                                })}
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
                      Mostrando {accountStatement.length} movimientos
                      {dateFilters.fechaDesde && dateFilters.fechaHasta && (
                        <span className="ml-2 text-sky-600">
                          ({dateFilters.fechaDesde} - {dateFilters.fechaHasta})
                        </span>
                      )}
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

  // Renderizar listado principal de cuentas
  return (
    <div className="min-h-full bg-sky-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">$</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Mis Ahorros</h1>
          

          
        </div>

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {currentAccounts.map((account) => (
            <div
              key={account.id}
              onClick={() => handleAccountClick(account)}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200 cursor-pointer group hover:scale-105"
            >
              {/* Account Icon */}
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MdSavings className="text-white text-3xl" />
                </div>
              </div>

              {/* Account Type */}
              <h3 className="text-lg font-bold text-gray-800 text-center mb-2 group-hover:text-sky-600 transition-colors">
                {account.type}
              </h3>

              {/* Account Number */}
              <p className="text-gray-500 text-center font-mono text-sm mb-4">
                {account.accountNumber}
              </p>

              {/* Balance */}
              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-sky-600">
                  $
                  {account.balance.toLocaleString("es-EC", {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-gray-500">{account.currency}</p>
              </div>

              {/* Account Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Tasa:</span>
                  <span className="text-xs font-semibold text-sky-600">
                    {account.interestRate}% anual
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Estado:</span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      account.status === "ACTIVA"
                        ? "bg-sky-100 text-sky-800 border border-sky-200"
                        : "bg-red-100 text-red-800 border border-red-200"
                    }`}
                  >
                    {account.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Saldo Total:</span>
                  <span className="text-xs font-semibold text-gray-700">
                    $
                    {account.totalBalance.toLocaleString("es-EC", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {savingsAccounts.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdSavings className="text-gray-400 text-4xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No se encontraron cuentas
            </h3>
            <p className="text-gray-500 mb-4">
              No tienes cuentas de ahorro registradas en este momento.
            </p>
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
              Mostrando {startIndex + 1}-
              {Math.min(endIndex, savingsAccounts.length)} de{" "}
              {savingsAccounts.length} cuentas
            </p>
          </div>
        )}

        {/* Floating Action Button para actualizar */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={refreshData}
            disabled={loading}
            className="bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
            title="Actualizar cuentas"
          >
            <svg
              className={`w-6 h-6 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavingsProductForm