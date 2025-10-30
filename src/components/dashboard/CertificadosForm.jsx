import React, { useState, useEffect } from 'react';
import { 
  MdDescription, 
  MdCheckCircle, 
  MdWarning, 
  MdDownload, 
  MdPictureAsPdf 
} from 'react-icons/md';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import apiServiceCertificados from '../../services/apiServiceCertificados';

/**
 * Componente para generación de certificados bancarios consolidados
 * Consume los servicios de apiServiceCertificados:
 * - Servicio 2400: Obtener costo del certificado
 * - Servicio 2374: Listar cuentas para debitar
 * - Servicio 2401: Generar certificado y debitar
 */
const CertificadosForm = () => {
  // Estados principales
  const [activeTab, setActiveTab] = useState('consolidado'); // 'consolidado' | 'cuentas'
  const [currentView, setCurrentView] = useState('form'); // 'form' | 'confirmation' | 'success'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Datos del formulario
  const [formData, setFormData] = useState({
    tipoVisualizacion: 'saldo', // 'saldo' | 'cifras'
    conoceTipos: false,
    cuentaCertificado: '', // Cuenta de la cual se generará el certificado (solo para pestaña "cuentas")
    cuentaPago: '' // Cuenta desde la cual se debitará el costo
  });

  // Datos de la API
  const [costoCertificado, setCostoCertificado] = useState(null);
  const [todasLasCuentas, setTodasLasCuentas] = useState([]); // TODAS las cuentas del usuario
  const [cuentasParaPago, setCuentasParaPago] = useState([]); // Solo cuentas con saldo suficiente para pagar
  const [certificadoGenerado, setCertificadoGenerado] = useState(null);
  const [userInfo, setUserInfo] = useState({
    nombre: '',
    cedula: '',
    email: ''
  });

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    loadInitialData();
  }, []);

  /**
   * Cargar costo del certificado y obtener todas las cuentas del usuario
   */
  const loadInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📋 [CERT-FORM] Cargando datos iniciales...');

      // Obtener información del usuario desde la sesión
      const session = JSON.parse(sessionStorage.getItem('userSession') || '{}');
      if (session.userData?.cliente?.[0]) {
        const cliente = session.userData.cliente[0];
        setUserInfo({
          nombre: cliente.nombre || 'Usuario',
          cedula: cliente.idecli || '',
          email: cliente.email || cliente.correo || ''
        });
      }

      // Servicio 2400: Obtener costo del certificado
      console.log('💰 [CERT-FORM] Obteniendo costo del certificado...');
      const costResult = await apiServiceCertificados.getCertificateCost();
      
      if (!costResult.success) {
        setError(costResult.error?.message || 'No se pudo obtener el costo del certificado');
        return;
      }

      setCostoCertificado(costResult.data.costo || 2.59);
      console.log('✅ [CERT-FORM] Costo obtenido: $', costResult.data.costo);

      // Obtener TODAS las cuentas del usuario (sin filtrar por saldo) - Proceso 2300
      console.log('🏦 [CERT-FORM] Obteniendo todas las cuentas del usuario...');
      const allAccountsResult = await apiServiceCertificados.getAllUserAccounts();
      
      if (!allAccountsResult.success || !allAccountsResult.data.cuentas || allAccountsResult.data.cuentas.length === 0) {
        setError('No se encontraron cuentas asociadas a su usuario.');
        return;
      }

      setTodasLasCuentas(allAccountsResult.data.cuentas);
      console.log('✅ [CERT-FORM] Total de cuentas obtenidas:', allAccountsResult.data.cuentas.length);

      // Servicio 2374: Obtener solo cuentas con saldo suficiente para PAGAR
      console.log('💳 [CERT-FORM] Obteniendo cuentas para pago...');
      console.log('💰 [CERT-FORM] Costo a validar: $', costResult.data.costo);
      
      // ⚠️ IMPORTANTE: Pasar el costo como parámetro para que el backend filtre correctamente
      const paymentAccountsResult = await apiServiceCertificados.getDebitAccounts(null, costResult.data.costo);
      
      if (paymentAccountsResult.success && paymentAccountsResult.data.cuentas && paymentAccountsResult.data.cuentas.length > 0) {
        // ✅ CASO 1: El backend devolvió cuentas con saldo suficiente
        setCuentasParaPago(paymentAccountsResult.data.cuentas);
        console.log('✅ [CERT-FORM] Cuentas para pago (con saldo suficiente):', paymentAccountsResult.data.cuentas.length);

        // Seleccionar la primera cuenta para certificado y pago por defecto
        const primeraCuenta = allAccountsResult.data.cuentas[0];
        const primeraCuentaPago = paymentAccountsResult.data.cuentas[0];
        
        setFormData(prev => ({
          ...prev,
          cuentaCertificado: primeraCuenta.codigo || primeraCuenta.numeroCuenta,
          cuentaPago: primeraCuentaPago.codigo || primeraCuentaPago.numeroCuenta
        }));
      } else {
        // ⚠️ CASO 2: El backend no devolvió cuentas (servicio 2374 retornó "SIN CONTENIDO")
        // FALLBACK: Usar todas las cuentas disponibles y filtrar manualmente por saldo
        console.warn('⚠️ [CERT-FORM] El servicio 2374 no devolvió cuentas. Usando fallback con 2300...');
        
        const cuentasConSaldoSuficiente = allAccountsResult.data.cuentas.filter(cuenta => {
          const saldo = parseFloat(cuenta.saldo || cuenta.saldoDisponible || 0);
          const costoRequerido = costResult.data.costo || 0;
          return saldo >= costoRequerido;
        });
        
        console.log('🔍 [CERT-FORM] Cuentas filtradas manualmente:', cuentasConSaldoSuficiente.length, 'de', allAccountsResult.data.cuentas.length);
        
        if (cuentasConSaldoSuficiente.length > 0) {
          // ✅ Hay al menos una cuenta con saldo suficiente
          setCuentasParaPago(cuentasConSaldoSuficiente);
          console.log('✅ [CERT-FORM] Cuentas para pago (filtradas localmente):', cuentasConSaldoSuficiente.length);
          
          // Seleccionar la primera cuenta para certificado y pago por defecto
          const primeraCuenta = allAccountsResult.data.cuentas[0];
          const primeraCuentaPago = cuentasConSaldoSuficiente[0];
          
          setFormData(prev => ({
            ...prev,
            cuentaCertificado: primeraCuenta.codigo || primeraCuenta.numeroCuenta,
            cuentaPago: primeraCuentaPago.codigo || primeraCuentaPago.numeroCuenta
          }));
        } else {
          // ❌ No hay cuentas con saldo suficiente
          console.error('❌ [CERT-FORM] No hay cuentas con saldo suficiente para pagar $', costResult.data.costo);
          setError('No tiene cuentas con saldo suficiente para pagar el certificado ($' + (costResult.data.costo || 2.59).toFixed(2) + ').');
          
          // Mostrar todas las cuentas de todas formas (para que el usuario vea sus saldos)
          setCuentasParaPago(allAccountsResult.data.cuentas);
        }
      }

    } catch (err) {
      console.error('💥 [CERT-FORM] Error cargando datos:', err);
      setError('Error al cargar los datos iniciales. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manejar cambios en el formulario
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Continuar a la vista de confirmación
   */
  const handleContinue = () => {
    // Validar cuenta solo si es pestaña "cuentas" (individual)
    if (activeTab === 'cuentas' && !formData.cuentaCertificado) {
      setError('Por favor, seleccione la cuenta para la cual desea generar el certificado');
      return;
    }

    if (!formData.cuentaPago) {
      setError('Por favor, seleccione la cuenta desde la cual se debitará el costo del certificado');
      return;
    }

    setError(null);
    setCurrentView('confirmation');
  };

  /**
   * Regresar al formulario
   */
  const handleBack = () => {
    setCurrentView('form');
    setError(null);
  };

  /**
   * Confirmar y solicitar OTP para generar certificado
   */
  /**
   * Confirmar y generar certificado (SIN OTP - versión simplificada)
   */
  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 [CERT-FORM] Generando certificado...');
      console.log('📄 [CERT-FORM] Tipo de certificado:', activeTab);
      console.log('📄 [CERT-FORM] Cuenta del certificado:', formData.cuentaCertificado);
      console.log('💳 [CERT-FORM] Cuenta de pago:', formData.cuentaPago);
      console.log('👁️ [CERT-FORM] Tipo visualización:', formData.tipoVisualizacion);

      // Para consolidado, usamos TODAS las cuentas
      // Para individual, solo la cuenta seleccionada
      let cuentaCertificado = null;
      let cuentasParaCertificado = [];

      if (activeTab === 'consolidado') {
        // Certificado consolidado: incluir TODAS las cuentas
        cuentasParaCertificado = todasLasCuentas;
        console.log('📊 [CERT-FORM] Certificado CONSOLIDADO - Total cuentas:', cuentasParaCertificado.length);
      } else {
        // Certificado individual: solo la cuenta seleccionada
        cuentaCertificado = todasLasCuentas.find(c => 
          c.codigo === formData.cuentaCertificado || c.numeroCuenta === formData.cuentaCertificado
        );
        cuentasParaCertificado = [cuentaCertificado];
        console.log('📄 [CERT-FORM] Certificado INDIVIDUAL - Cuenta:', cuentaCertificado);
      }

      const cuentaPago = cuentasParaPago.find(c => 
        c.codigo === formData.cuentaPago || c.numeroCuenta === formData.cuentaPago
      );

      if ((activeTab === 'cuentas' && !cuentaCertificado) || !cuentaPago) {
        throw new Error('No se encontraron los datos de las cuentas seleccionadas');
      }

      // Proceso 2401: Generar certificado con débito
      // NOTA: Esta es versión simplificada SIN OTP - Usamos makeRequest directamente
      console.log('🔄 [CERT-FORM] Llamando servicio 2401 para generar certificado...');
      
      const dataParaServicio = {
        prccode: '2401', // Proceso de generación de certificado
        codcta: formData.cuentaPago, // Cuenta que se va a debitar
        tpvisu: formData.tipoVisualizacion === 'cifras' ? '2' : '1'
      };

      const result = await apiServiceCertificados.makeRequest(dataParaServicio);

      if (result.success) {
        console.log('✅ [CERT-FORM] Certificado generado exitosamente');
        console.log('📊 [CERT-FORM] Respuesta del servidor:', result.data);
        
        // ⚠️ IMPORTANTE: Mostrar información sobre el débito
        console.log('💰 [CERT-FORM] INFORMACIÓN DEL DÉBITO:');
        console.log('   - Tipo certificado:', activeTab);
        console.log('   - Cuenta certificado:', formData.cuentaCertificado || 'TODAS (Consolidado)');
        console.log('   - Total cuentas incluidas:', cuentasParaCertificado.length);
        console.log('   - Cuenta debitada:', formData.cuentaPago);
        console.log('   - Monto debitado: $', costoCertificado?.toFixed(2));
        console.log('   - Fecha:', new Date().toLocaleString('es-EC'));
        
        // Preparar datos completos para el PDF
        const certificateInfo = {
          ...result.data,
          tipoCertificado: activeTab, // 'consolidado' o 'cuentas'
          cliente: {
            nombre: userInfo.nombre,
            cedula: userInfo.cedula,
            codigo: userInfo.cedula
          },
          // Para consolidado: array de todas las cuentas
          // Para individual: una sola cuenta
          cuentaCertificado: cuentaCertificado, // Solo para individual
          todasLasCuentas: cuentasParaCertificado, // Array de cuentas
          cuentaPago: cuentaPago,
          costo: costoCertificado,
          tipoVisualizacion: formData.tipoVisualizacion,
          fecha: new Date().toLocaleDateString('es-EC', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })
        };
        
        setCertificadoGenerado(certificateInfo);
        
        // Generar PDF automáticamente
        await generatePDF(certificateInfo);
        
        setCurrentView('success');
      } else {
        console.error('❌ [CERT-FORM] Error del servidor:', result.error);
        setError(result.error?.message || 'Error al generar el certificado');
      }

    } catch (err) {
      console.error('💥 [CERT-FORM] Error generando certificado:', err);
      setError(err.message || 'Error al generar el certificado. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  const handleCancel = () => {
    setCurrentView('form');
    setError(null);
  };

  /**
   * Generar otro certificado
   */
  const handleNewCertificate = () => {
    setCurrentView('form');
    setCertificadoGenerado(null);
    setError(null);
    loadInitialData();
  };

  /**
   * Generar PDF del certificado
   */
  const generatePDF = async (certificateData) => {
    try {
      console.log('📄 [PDF] Generando PDF del certificado...');
      console.log('📊 [PDF] Datos recibidos:', certificateData);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Colores de Vilcabamba (azul/verde similar al original)
      const primaryColor = [0, 120, 190]; // Azul Vilcabamba
      const greenColor = [34, 139, 34]; // Verde para acentos
      const textColor = [0, 0, 0]; // Negro puro para texto
      const grayText = [80, 80, 80]; // Gris para textos secundarios

      // === LOGO EN LA ESQUINA SUPERIOR DERECHA ===
      const logoPath = '/assets/images/logolasnaves_c.png';
      try {
        // Logo con mejor proporción (ancho x alto) y posición ajustada
        doc.addImage(logoPath, 'PNG', pageWidth - 55, 10, 40, 30);
      } catch (logoError) {
        console.warn('⚠️ [PDF] No se pudo cargar el logo:', logoError);
      }

      let yPos = 20;

      // === TÍTULO DEL CERTIFICADO ===
      doc.setTextColor(...textColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      
      const tituloDoc = certificateData.tipoCertificado === 'consolidado' 
        ? 'CERTIFICADO BANCARIO ELECTRÓNICO'
        : 'CERTIFICADO DE CUENTA';
      doc.text(tituloDoc, pageWidth / 2, yPos, { align: 'center' });

      yPos += 20;

      // === FECHA (izquierda) ===
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...grayText);
      const fechaCompleta = new Date().toLocaleDateString('es-EC', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      });
      doc.text(fechaCompleta, 15, yPos);

      yPos += 15;

      // === PÁRRAFO INTRODUCTORIO ESTILO PRODUBANCO ===
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);
      
      const nombreCliente = certificateData.cliente?.nombre || userInfo.nombre || 'N/A';
      const cedulaCliente = certificateData.cliente?.cedula || userInfo.cedula || 'N/A';
      
      const parrafoIntro = certificateData.tipoCertificado === 'consolidado'
        ? `Cooperativa de Ahorro y Crédito VILCABAMBA LTDA a petición de nuestro cliente ${nombreCliente.toUpperCase()} con CI/RUC: ${cedulaCliente} certifica que mantiene la siguiente relación con nosotros:`
        : `Cooperativa de Ahorro y Crédito VILCABAMBA LTDA a petición de nuestro cliente ${nombreCliente.toUpperCase()} con identificación No. ${cedulaCliente} certifica que mantiene la CUENTA DE AHORROS en Dólares de los Estados Unidos de América con la siguiente información:`;
      
      const lineasIntro = doc.splitTextToSize(parrafoIntro, pageWidth - 30);
      doc.text(lineasIntro, 15, yPos);
      yPos += lineasIntro.length * 5 + 10;

      // === CONTENIDO SEGÚN TIPO ===
      if (certificateData.tipoCertificado === 'consolidado') {
        // ========== CERTIFICADO CONSOLIDADO CON TABLA ==========
        console.log('📊 [PDF] Generando certificado consolidado tipo Produbanco');
        
        const cuentasData = certificateData.todasLasCuentas.map(cuenta => {
          const saldo = parseFloat(cuenta.saldo || cuenta.saldoDisponible || 0);
          
          // 🔒 SEGURIDAD: Para certificados consolidados, SIEMPRE censurar el monto
          // Solo mostrar el número de cifras (ejemplo: "TRES (3) CIFRAS ALTAS")
          const cifras = Math.floor(saldo).toString().length;
          const saldoTexto = `${convertirNumeroACifrasTexto(cifras).toUpperCase()} (${cifras}) CIFRAS ALTAS`;
          
          return [
            cuenta.tipo || cuenta.descripcion || 'CUENTA DE AHORROS',
            cuenta.numeroCuenta || cuenta.numero || 'N/A',
            cuenta.estado || 'ACTIVA',
            'DÓLARES USA',
            cuenta.fechaApertura || '---',
            saldoTexto,
            'no registra'
          ];
        });

        // Tabla estilo Produbanco
        doc.autoTable({
          startY: yPos,
          head: [[
            'TIPO CUENTA', 
            'NUMERO\nCUENTA', 
            'ESTADO', 
            'MONEDA',
            'FECHA\nAPERTURA',
            'SALDO PROMEDIO\nSEMESTRAL', // Siempre muestra cifras por seguridad
            'PROTESTOS'
          ]],
          body: cuentasData,
          theme: 'grid',
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 7,
            halign: 'center',
            valign: 'middle',
            lineWidth: 0.5,
            lineColor: [0, 0, 0]
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [0, 0, 0],
            halign: 'center',
            valign: 'middle',
            lineWidth: 0.5,
            lineColor: [0, 0, 0]
          },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 25 },
            2: { cellWidth: 18 },
            3: { cellWidth: 25 },
            4: { cellWidth: 20 },
            5: { cellWidth: 30, fontStyle: 'bold' },
            6: { cellWidth: 20 }
          },
          margin: { left: 15, right: 15 }
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Notas adicionales estilo Produbanco
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Inversiones: No mantiene inversiones con la Cooperativa.', 15, yPos);
        yPos += 6;
        doc.text('Riesgos: No mantiene riesgos con la Cooperativa.', 15, yPos);
        yPos += 12;
        
      } else {
        // ========== CERTIFICADO INDIVIDUAL ESTILO LISTA ==========
        console.log('📊 [PDF] Generando certificado individual tipo Produbanco');
        
        const cuentaCert = certificateData.cuentaCertificado;
        
        if (cuentaCert) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...textColor);
          
          // FECHA DE APERTURA
          yPos += 5;
          doc.setFont('helvetica', 'bold');
          doc.text('FECHA DE APERTURA:', 25, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(cuentaCert.fechaApertura || '---', 90, yPos);
          
          yPos += 10;
          
          // SALDO PROMEDIO SEMESTRAL
          const saldo = parseFloat(cuentaCert.saldo || cuentaCert.saldoDisponible || 0);
          doc.setFont('helvetica', 'bold');
          doc.text('SALDO PROMEDIO SEMESTRAL:', 25, yPos);
          doc.setFont('helvetica', 'normal');
          
          // 🔒 SEGURIDAD: Siempre censurar mostrando solo número de cifras
          const cifras = Math.floor(saldo).toString().length;
          const saldoTexto = `${convertirNumeroACifrasTexto(cifras).toUpperCase()} (${cifras}) CIFRAS ALTAS`;
          doc.text(saldoTexto, 90, yPos);
          
          yPos += 10;
          
          // PROTESTOS
          doc.setFont('helvetica', 'bold');
          doc.text('PROTESTOS:', 25, yPos);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(255, 0, 0); // Rojo para "no registra"
          doc.text('no registra', 90, yPos);
          doc.setTextColor(...textColor);
          
          yPos += 10;
          
          // CRÉDITOS
          doc.setFont('helvetica', 'bold');
          doc.text('CRÉDITOS:', 25, yPos);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(255, 0, 0);
          doc.text('no registra.', 90, yPos);
          doc.setTextColor(...textColor);
          
          yPos += 15;
        }
      }

      // === PÁRRAFO DE USO DEL CERTIFICADO ===
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);
      
      const parrafoUso = `Nuestro Cliente ${nombreCliente.toUpperCase()} puede hacer uso del presente certificado de la forma que más convenga a sus intereses y sin responsabilidad para la Cooperativa ni para ninguno de sus funcionarios.`;
      const lineasUso = doc.splitTextToSize(parrafoUso, pageWidth - 30);
      doc.text(lineasUso, 15, yPos);
      yPos += lineasUso.length * 5 + 10;

      // === TEXTO LEGAL ===
      doc.setFontSize(9);
      const textoLegal = `Este Certificado no constituye de manera alguna, una garantía de Cooperativa de Ahorro y Crédito VILCABAMBA LTDA, a favor del cliente y no será válido si existieren indicios de alteración.`;
      const lineasLegal = doc.splitTextToSize(textoLegal, pageWidth - 30);
      doc.text(lineasLegal, 15, yPos);
      yPos += lineasLegal.length * 5 + 10;

      // === ATENTAMENTE ===
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Atentamente,', 15, yPos);
      yPos += 25;

      // === LÍNEA DE FIRMA ===
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(15, yPos, 80, yPos);
      
      yPos += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Gerente General', 15, yPos);
      yPos += 4;
      doc.setFont('helvetica', 'normal');
      doc.text('VILCABAMBA', 15, yPos);

      // === PIE DE PÁGINA ===
      doc.setFontSize(7);
      doc.setTextColor(...grayText);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Documento generado electrónicamente el: ${new Date().toLocaleString('es-EC')}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      // === GUARDAR PDF ===
      const tipoArchivo = certificateData.tipoCertificado === 'consolidado' 
        ? 'Consolidado' 
        : 'Individual';
      
      // 🔒 SEGURIDAD: Siempre "Cifras" para ambos tipos de certificado
      // No se exponen montos reales por seguridad del cliente
      const tipoVisualizacion = 'Cifras';
        
      const fileName = `Certificado_${tipoArchivo}_${tipoVisualizacion}_${certificateData.cliente?.cedula || userInfo.cedula}_${new Date().getTime()}.pdf`;
      doc.save(fileName);

      console.log('✅ [PDF] PDF generado exitosamente:', fileName);

    } catch (error) {
      console.error('💥 [PDF] Error generando PDF:', error);
      throw error;
    }
  };

  /**
   * Convertir número de cifras a texto
   */
  const convertirNumeroACifrasTexto = (numero) => {
    const textos = {
      1: 'UNA',
      2: 'DOS',
      3: 'TRES',
      4: 'CUATRO',
      5: 'CINCO',
      6: 'SEIS',
      7: 'SIETE',
      8: 'OCHO',
      9: 'NUEVE',
      10: 'DIEZ'
    };
    return textos[numero] || `${numero}`;
  };

  /**
   * Convertir número a texto en cifras (español)
   */
  const convertirACifras = (numero) => {
    const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    
    if (numero === 0) return 'Cero dólares';
    
    const entero = Math.floor(numero);
    const centavos = Math.round((numero - entero) * 100);
    
    let texto = '';
    
    if (entero < 10) {
      texto = unidades[entero];
    } else if (entero < 20) {
      texto = especiales[entero - 10];
    } else if (entero < 100) {
      const dec = Math.floor(entero / 10);
      const uni = entero % 10;
      texto = decenas[dec] + (uni > 0 ? ' y ' + unidades[uni] : '');
    } else {
      texto = entero.toString();
    }
    
    texto += entero === 1 ? ' dólar' : ' dólares';
    
    if (centavos > 0) {
      texto += ` con ${centavos}/100`;
    }
    
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  };

  // ==========================================
  // VISTA DE CONFIRMACIÓN
  // ==========================================
  const ConfirmationView = () => {
    const cuentaCertificado = todasLasCuentas.find(c => 
      c.codigo === formData.cuentaCertificado || c.numeroCuenta === formData.cuentaCertificado
    );

    const cuentaPago = cuentasParaPago.find(c => 
      c.codigo === formData.cuentaPago || c.numeroCuenta === formData.cuentaPago
    );

    return (
      <div className="min-h-full bg-gradient-to-br from-blue-50 to-sky-50 p-3 md:p-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-4">
              <h1 className="text-xl font-bold text-white">Certificado Bancario Individual</h1>
              <p className="text-sky-100 text-sm mt-1">Confirmar detalles del certificado</p>
            </div>

            <div className="p-4">
              {/* Información del costo */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start space-x-2">
                <MdWarning className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-blue-800 text-sm">
                  Este documento tiene un costo de <strong className="text-base">${costoCertificado?.toFixed(2) || '0.00'}</strong> incluido IVA.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start space-x-2">
                  <MdWarning className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Detalles del certificado */}
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-3">Detalles del certificado</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-xs text-gray-600 block mb-1">Tipo</label>
                      <p className="text-sm font-semibold text-gray-800">Individual</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-xs text-gray-600 block mb-1">Visualización</label>
                      <p className="text-sm font-semibold text-gray-800">
                        {formData.tipoVisualizacion === 'saldo' ? 'En saldo' : 'En cifras'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <label className="text-xs text-gray-600 block mb-1">Costo</label>
                      <p className="text-sm font-semibold text-gray-800">${costoCertificado?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </div>

                {/* Información del certificado según tipo */}
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-3">
                    {activeTab === 'consolidado' ? '📊 Tipo de Certificado' : '📄 Cuenta del Certificado'}
                  </h3>
                  {activeTab === 'consolidado' ? (
                    <div className="bg-sky-50 rounded-lg p-3 border border-sky-200">
                      <p className="text-xs text-sky-600 mb-1">📊 Certificado Consolidado</p>
                      <p className="font-semibold text-gray-800 text-sm">
                        Incluye el resumen de TODAS tus cuentas
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        Total de cuentas: <span className="font-semibold">{todasLasCuentas.length}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="bg-sky-50 rounded-lg p-3 border border-sky-200">
                      <p className="text-xs text-sky-600 mb-1">📄 Certificado para:</p>
                      <p className="font-semibold text-gray-800 text-sm">
                        {cuentaCertificado?.tipo || 'Cuenta'} - Nro. {formData.cuentaCertificado}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Saldo: <span className="font-semibold">${parseFloat(cuentaCertificado?.saldo || 0).toFixed(2)}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Información de pago */}
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-3">Información de pago</h3>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Cliente</p>
                    <p className="text-sm font-semibold text-gray-800">{userInfo.nombre}</p>
                    <p className="text-sm text-gray-700 mt-2">
                      💳 {cuentaPago?.tipo || 'Cuenta'} - Nro. {formData.cuentaPago}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Saldo disponible: <span className="font-semibold">${parseFloat(cuentaPago?.saldo || 0).toFixed(2)}</span>
                    </p>
                  </div>
                </div>

                {/* Información de generación */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
                  <MdPictureAsPdf className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-blue-800 font-medium">
                      El certificado se generará en formato PDF y se descargará automáticamente.
                    </p>
                    <p className="text-blue-700 mt-1">
                      El monto será debitado de la cuenta de pago seleccionada.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Generando...</span>
                    </>
                  ) : (
                    <span>Generar Certificado</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // VISTA DE ÉXITO
  // ==========================================
  const SuccessView = () => (
    <div className="min-h-full bg-gradient-to-br from-blue-50 to-sky-50 p-3 md:p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-4">
            <div className="flex items-center space-x-3">
              <MdCheckCircle className="w-7 h-7 text-white" />
              <div>
                <h1 className="text-xl font-bold text-white">¡Certificado Generado!</h1>
                <p className="text-sky-100 text-sm mt-1">Tu certificado se ha generado exitosamente</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            {/* Mensaje de éxito */}
            <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <MdDownload className="w-5 h-5 text-sky-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sky-800 font-medium mb-1 text-sm">
                    El certificado bancario individual se ha generado y descargado automáticamente.
                  </p>
                  <p className="text-sky-700 text-sm">
                    Se procesó el débito de <strong>${costoCertificado?.toFixed(2) || '0.00'}</strong> de tu cuenta de pago.
                  </p>
                </div>
              </div>
            </div>

            {/* Alerta sobre el débito */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                </svg>
                <div className="flex-1">
                  <p className="text-amber-800 font-medium text-sm mb-1">
                    ℹ️ Información sobre el débito
                  </p>
                  <p className="text-amber-700 text-xs">
                    El débito fue registrado correctamente. Si no ve el cambio inmediatamente en su saldo, 
                    puede deberse a que la transacción se está procesando. 
                    El saldo se actualizará en los próximos minutos.
                  </p>
                  <button
                    onClick={() => {
                      console.log('🔄 [CERT-FORM] Recargando datos para verificar saldo...');
                      window.location.reload();
                    }}
                    className="mt-2 text-xs text-amber-700 underline hover:text-amber-900 font-medium"
                  >
                    Refrescar página para ver saldo actualizado →
                  </button>
                </div>
              </div>
            </div>

            {/* Información del certificado */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-800">Detalles del certificado</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs text-gray-600 block mb-1">Tipo de certificado</label>
                  <p className="text-sm font-semibold text-gray-800">Individual</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs text-gray-600 block mb-1">Fecha de generación</label>
                  <p className="text-sm font-semibold text-gray-800">
                    {new Date().toLocaleDateString('es-EC', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs text-gray-600 block mb-1">Visualización</label>
                  <p className="text-sm font-semibold text-gray-800">
                    {formData.tipoVisualizacion === 'saldo' ? 'En saldo' : 'En cifras'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs text-gray-600 block mb-1">Costo</label>
                  <p className="text-sm font-semibold text-gray-800">${costoCertificado?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
              <button
                onClick={handleNewCertificate}
                className="px-5 py-2.5 border-2 border-sky-600 text-sky-600 rounded-lg font-medium hover:bg-sky-50 transition-colors text-sm"
              >
                Generar Otro Certificado
              </button>
              <button
                onClick={() => certificadoGenerado && generatePDF(certificadoGenerado)}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <MdDownload className="w-4 h-4" />
                <span>Descargar Nuevamente</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // VISTA DEL FORMULARIO PRINCIPAL
  // ==========================================
  const FormView = () => (
    <div className="min-h-full bg-gradient-to-br from-blue-50 to-sky-50 p-3 md:p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <MdDescription className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Certificado Bancario</h1>
          <p className="text-gray-600 text-sm">
            Genera tu certificado bancario individual de forma rápida y segura
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Sistema de Pestañas */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex">
              <button
                onClick={() => {
                  setActiveTab('consolidado');
                  setError(null);
                  setFormData(prev => ({ ...prev, cuentaCertificado: '' }));
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'consolidado'
                    ? 'bg-white text-sky-600 border-b-2 border-sky-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                📊 Consolidado
              </button>
              <button
                onClick={() => {
                  setActiveTab('cuentas');
                  setError(null);
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  activeTab === 'cuentas'
                    ? 'bg-white text-sky-600 border-b-2 border-sky-600'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                💳 Cuentas o Tarjetas
              </button>
            </div>
          </div>

          <div className="p-4">
            {/* Información del costo */}
            {costoCertificado !== null && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start space-x-2">
                <MdWarning className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-blue-800 text-sm">
                  Este documento tiene un costo de <strong className="text-base">${costoCertificado.toFixed(2)}</strong> incluido IVA.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start space-x-2">
                <MdWarning className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <svg className="animate-spin h-10 w-10 text-sky-600 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-600 text-sm">Cargando información...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Descripción según pestaña activa */}
                {activeTab === 'consolidado' ? (
                  <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 mb-4">
                    <p className="text-sky-800 text-sm">
                      <strong>📊 Certificado Consolidado:</strong> Genera un certificado con el resumen de <strong>todas tus cuentas</strong> registradas en el sistema.
                    </p>
                  </div>
                ) : (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                    <p className="text-purple-800 text-sm">
                      <strong>💳 Certificado Individual:</strong> Genera un certificado para una <strong>cuenta específica</strong>. Selecciona la cuenta de tu preferencia.
                    </p>
                  </div>
                )}

                {/* Información del certificado */}
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-3">Información del certificado</h3>
                  
                  <div className="space-y-3">
                    {/* Tipo de visualización */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de visualización
                      </label>
                      <div className="flex space-x-6">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            value="saldo"
                            checked={formData.tipoVisualizacion === 'saldo'}
                            onChange={(e) => handleInputChange('tipoVisualizacion', e.target.value)}
                            className="w-4 h-4 text-sky-600 border-gray-300 focus:ring-sky-500 cursor-pointer"
                          />
                          <span className="ml-2 text-sm text-gray-700">En saldo</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            value="cifras"
                            checked={formData.tipoVisualizacion === 'cifras'}
                            onChange={(e) => handleInputChange('tipoVisualizacion', e.target.value)}
                            className="w-4 h-4 text-sky-600 border-gray-300 focus:ring-sky-500 cursor-pointer"
                          />
                          <span className="ml-2 text-sm text-gray-700">En cifras</span>
                        </label>
                      </div>
                    </div>

                    {/* Información sobre tipos */}
                    <div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.conoceTipos}
                          onChange={(e) => handleInputChange('conoceTipos', e.target.checked)}
                          className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500 cursor-pointer"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Conoce sobre los tipos de visualización
                        </span>
                      </label>
                      {formData.conoceTipos && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 space-y-1">
                          <p><strong>En saldo:</strong> Muestra los valores en formato numérico (ejemplo: $1,250.00)</p>
                          <p><strong>En cifras:</strong> Muestra los valores escritos en palabras (ejemplo: Mil doscientos cincuenta dólares)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Selección de cuenta del certificado - Solo para certificados individuales */}
                {activeTab === 'cuentas' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">📄 Cuenta del Certificado</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Seleccione la cuenta para la cual desea generar el certificado
                    </p>
                    
                    <div className="space-y-3">
                      {todasLasCuentas.length > 0 ? (
                        <>
                          {todasLasCuentas.map((cuenta) => {
                            const isSelected = formData.cuentaCertificado === (cuenta.codigo || cuenta.numeroCuenta);
                            return (
                              <div
                                key={cuenta.codigo || cuenta.numeroCuenta}
                                onClick={() => handleInputChange('cuentaCertificado', cuenta.codigo || cuenta.numeroCuenta)}
                                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                  isSelected
                                    ? 'border-sky-500 bg-sky-50 shadow-md'
                                    : 'border-gray-200 bg-white hover:border-sky-300 hover:shadow-sm'
                                }`}
                              >
                                <div className="flex items-center space-x-4">
                                  {/* Avatar/Icono */}
                                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-sky-500 to-sky-600'
                                      : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                  }`}>
                                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M5,6H23V18H5V6M14,9A3,3 0 0,1 17,12A3,3 0 0,1 14,15A3,3 0 0,1 11,12A3,3 0 0,1 14,9M9,8A2,2 0 0,1 7,10V14A2,2 0 0,1 9,16H19A2,2 0 0,1 21,14V10A2,2 0 0,1 19,8H9Z" />
                                    </svg>
                                  </div>

                                  {/* Información de la cuenta */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className={`text-sm font-semibold truncate ${
                                        isSelected ? 'text-sky-900' : 'text-gray-800'
                                      }`}>
                                        {cuenta.tipo || cuenta.tipoProducto || 'Cuenta'}
                                      </p>
                                      <span className={`text-xs font-mono ml-2 flex-shrink-0 ${
                                        isSelected ? 'text-sky-600' : 'text-gray-500'
                                      }`}>
                                        {cuenta.numero || cuenta.numeroCuenta}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className={`text-xs ${
                                        isSelected ? 'text-sky-700' : 'text-gray-600'
                                      }`}>
                                        Saldo:
                                      </span>
                                      <span className={`text-sm font-semibold ${
                                        isSelected ? 'text-sky-800' : 'text-gray-700'
                                      }`}>
                                        ${parseFloat(cuenta.saldo || 0).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Checkmark */}
                                  {isSelected && (
                                    <div className="flex-shrink-0">
                                      <div className="w-6 h-6 bg-sky-600 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                                          <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
                                        </svg>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
                          <MdWarning className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <p className="text-yellow-800 text-sm">
                            No se encontraron cuentas asociadas a su usuario.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Selección de cuenta de pago */}
                <div>
                  <h3 className="text-base font-semibold text-gray-800 mb-3">💳 Cuenta de Pago</h3>
                  
                  <div className="space-y-3">
                    <div className="bg-sky-50 border border-sky-200 rounded-lg p-2.5 mb-3">
                      <p className="text-sm text-sky-800">
                        💰 <strong>Costo del certificado:</strong> ${costoCertificado?.toFixed(2) || '0.00'}
                      </p>
                    </div>

                    {cuentasParaPago.length > 0 ? (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Seleccione la cuenta desde la cual se debitará el costo
                        </label>
                        <select
                          value={formData.cuentaPago}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleInputChange('cuentaPago', e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors text-sm"
                        >
                          {cuentasParaPago.map((cuenta) => (
                            <option 
                              key={cuenta.codigo || cuenta.numeroCuenta} 
                              value={cuenta.codigo || cuenta.numeroCuenta}
                            >
                              {cuenta.tipo || cuenta.tipoProducto} - Nro. {cuenta.numero || cuenta.numeroCuenta} - Disponible: ${parseFloat(cuenta.saldo || 0).toFixed(2)}
                            </option>
                          ))}
                        </select>

                        {formData.cuentaPago && (
                          <div className="bg-sky-50 rounded-lg p-3 border border-sky-200">
                            <p className="text-xs text-sky-600 mb-1">✓ Cuenta de pago seleccionada</p>
                            <p className="text-sm font-semibold text-sky-900">
                              {cuentasParaPago.find(c => 
                                (c.codigo === formData.cuentaPago) || 
                                (c.numeroCuenta === formData.cuentaPago)
                              )?.tipo || 'Cuenta'} - Nro. {formData.cuentaPago}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                        <MdWarning className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-red-800 text-sm">
                          No tiene cuentas con saldo suficiente para pagar el certificado (${costoCertificado?.toFixed(2) || '0.00'}).
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Botón continuar */}
            {!loading && todasLasCuentas.length > 0 && cuentasParaPago.length > 0 && (
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleContinue}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg text-sm"
                >
                  Continuar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // RENDERIZADO PRINCIPAL
  // ==========================================
  if (currentView === 'confirmation') {
    return <ConfirmationView />;
  }

  if (currentView === 'success') {
    return <SuccessView />;
  }

  return <FormView />;
};

export default CertificadosForm;