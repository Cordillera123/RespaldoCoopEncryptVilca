import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';
import CodeSecurityInternalTransfer from './CodeSecurityInternalTransfer.jsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const SameAccounts = ({ onBack, openWindow }) => {
  // Estados principales
  const [currentStep, setCurrentStep] = useState('form'); // 'form', 'otp', 'success'
  const [transferType, setTransferType] = useState('same-bank'); // 'same-bank' o 'other-banks'
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados del formulario
  const [formData, setFormData] = useState({
    transferType: 'internal',
    fromAccount: '',
    toAccount: '',
    amount: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [validatingFunds, setValidatingFunds] = useState(false);
  const [transferData, setTransferData] = useState(null);
  const [transferResult, setTransferResult] = useState(null);

  useEffect(() => {
    // Cargar cuentas solo para transferencias del mismo banco
    if (transferType === 'same-bank') {
      loadUserAccounts();
    }
  }, [transferType]);

  const handleTransferTypeChange = (type) => {
    setTransferType(type);
    // Limpiar formulario al cambiar tipo
    setFormData({
      transferType: 'internal',
      fromAccount: '',
      toAccount: '',
      amount: '',
      description: ''
    });
    setErrors({});
    setError(null);
  };

  const loadUserAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🏦 [SAME-ACCOUNTS] Cargando cuentas del usuario...');

      const result = await apiService.getCurrentUserAccountsForTransfer();

      if (result.success) {
        console.log('✅ [SAME-ACCOUNTS] Cuentas cargadas:', result.data.cuentas.length);
        setAccounts(result.data.cuentas);

        if (result.data.cuentas.length < 2) {
          setError('Necesitas al menos 2 cuentas activas para realizar transferencias internas');
        }
      } else {
        console.error('❌ [SAME-ACCOUNTS] Error cargando cuentas:', result.error.message);
        setError(result.error.message);
      }
    } catch (error) {
      console.error('💥 [SAME-ACCOUNTS] Error inesperado:', error);
      setError('Error inesperado al cargar las cuentas');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'amount') {
      // Solo permitir números y punto decimal
      const numericValue = value.replace(/[^0-9.]/g, '');

      // Evitar múltiples puntos decimales
      const parts = numericValue.split('.');
      const cleanValue = parts.length > 2
        ? parts[0] + '.' + parts.slice(1).join('')
        : numericValue;

      // Limitar a 2 decimales
      const finalValue = parts[1] && parts[1].length > 2
        ? parts[0] + '.' + parts[1].substring(0, 2)
        : cleanValue;

      console.log('💰 [AMOUNT] Valor ingresado:', value, '→ Valor procesado:', finalValue);

      setFormData(prev => ({
        ...prev,
        [name]: finalValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Limpiar errores del campo que se está editando
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Validación en tiempo real para cuentas
    if (name === 'fromAccount' || name === 'toAccount') {
      if (name === 'fromAccount' && value === formData.toAccount) {
        setErrors(prev => ({
          ...prev,
          toAccount: 'La cuenta destino debe ser diferente a la cuenta origen'
        }));
      } else if (name === 'toAccount' && value === formData.fromAccount) {
        setErrors(prev => ({
          ...prev,
          toAccount: 'La cuenta destino debe ser diferente a la cuenta origen'
        }));
      } else if (errors.toAccount && formData.fromAccount !== formData.toAccount) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.toAccount;
          return newErrors;
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fromAccount) {
      newErrors.fromAccount = 'Selecciona la cuenta de origen';
    }

    if (!formData.toAccount) {
      newErrors.toAccount = 'Selecciona la cuenta de destino';
    }

    if (formData.fromAccount === formData.toAccount) {
      newErrors.toAccount = 'La cuenta de destino debe ser diferente a la de origen';
    }

    if (!formData.amount) {
      newErrors.amount = 'Ingresa el monto a transferir';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'El monto debe ser mayor a cero';
      } else if (amount < 1) {
        newErrors.amount = 'El monto mínimo es $1.00';
      } else {
        const selectedAccount = accounts.find(acc => acc.codigo === formData.fromAccount);
        if (selectedAccount && amount > selectedAccount.saldoDisponible) {
          newErrors.amount = `Fondos insuficientes. Saldo disponible: ${formatCurrency(selectedAccount.saldoDisponible)}`;
        }
      }
    }

    if (!formData.description || formData.description.trim().length < 3) {
      newErrors.description = 'La descripción debe tener al menos 3 caracteres';
    } else if (formData.description.trim().length > 40) {
      newErrors.description = 'La descripción no puede exceder 40 caracteres';
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
      setValidatingFunds(true);
      setError(null);

      console.log('💰 [SAME-ACCOUNTS] Validando disponibilidad de fondos...');

      const result = await apiService.validateCurrentUserTransferAvailability(
        formData.fromAccount,
        formData.amount
      );

      if (result.success) {
        console.log('✅ [SAME-ACCOUNTS] Fondos validados, procediendo con OTP');

        setTransferData({
          cuentaOrigen: formData.fromAccount,
          cuentaDestino: formData.toAccount,
          monto: parseFloat(formData.amount),
          descripcion: formData.description.trim()
        });

        setCurrentStep('otp');
      } else {
        console.error('❌ [SAME-ACCOUNTS] Error validando fondos:', result.error.message);
        setErrors({
          amount: result.error.message
        });
      }
    } catch (error) {
      console.error('💥 [SAME-ACCOUNTS] Error inesperado validando fondos:', error);
      setError('Error inesperado al validar la transferencia');
    } finally {
      setValidatingFunds(false);
    }
  };

  const handleTransferSuccess = (result) => {
    console.log('🎉 [SAME-ACCOUNTS] Transferencia exitosa:', result);
    setTransferResult(result);
    setCurrentStep('success');
  };

  const handleTransferError = (error) => {
    console.error('❌ [SAME-ACCOUNTS] Error en transferencia:', error);
    
    // ✅ SI EL ERROR ES POR INTENTOS MÁXIMOS, REGRESAR A INTERNA TRANSFER WINDOW
    if (error.code === 'MAX_ATTEMPTS_REACHED') {
      console.log('🔙 [SAME-ACCOUNTS] Máximo de intentos alcanzado, regresando a InternaTransferWindow...');
      onBack(); // Regresar a InternaTransferWindow
    } else {
      setError(error.message);
      setCurrentStep('form');
    }
  };

  const handleBackFromOTP = () => {
    setCurrentStep('form');
    setTransferData(null);
  };

  const handleNewTransfer = () => {
    setCurrentStep('form');
    setTransferData(null);
    setTransferResult(null);
    setFormData({
      transferType: 'internal',
      fromAccount: '',
      toAccount: '',
      amount: '',
      description: ''
    });
    setErrors({});
    setError(null);
  };

  const handlePrintReceipt = async () => {
    try {
      console.log('📄 [SAME-ACCOUNTS] Generando PDF del comprobante');
      const data = transferResult?.transferencia || {};

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

      // Sección: Cuentas
      doc.setFillColor(240, 248, 255);
      doc.rect(20, yPos, pageWidth - 40, 8, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.text('CUENTAS', 25, yPos + 5.5);

      yPos += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);

      const accountsData = [
        ['Cuenta Origen:', transferData?.cuentaOrigen || data.cuentaOrigen || 'N/A'],
        ['Cuenta Destino:', transferData?.cuentaDestino || data.cuentaDestino || 'N/A']
      ];

      accountsData.forEach(([label, value]) => {
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

      const amount = parseFloat(data.monto || transferData?.monto || 0);
      const formattedAmount = `$${amount.toLocaleString('es-EC', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;

      const transactionData = [
        ['Monto:', formattedAmount],
        ['Referencia:', data.numeroReferencia || 'N/A'],
        ['Descripción:', data.descripcion || transferData?.descripcion || 'N/A']
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
      const fileName = `Comprobante_Transferencia_Propia_${data.numeroReferencia || Date.now()}.pdf`;
      doc.save(fileName);

      console.log('✅ [SAME-ACCOUNTS] PDF generado exitosamente:', fileName);
    } catch (error) {
      console.error('❌ [SAME-ACCOUNTS] Error al generar PDF:', error);
      alert('Error al generar el comprobante. Por favor intenta nuevamente.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatAccountDisplay = (account) => {
    return `${account.descripcion} - ${account.numeroFormateado || account.numeroDesencriptado || account.codigo} | ${formatCurrency(account.saldoDisponible)}`;
  };

  const formatAccountDisplayDestination = (account) => {
    return `${account.descripcion} - ${account.numeroFormateado || account.numeroDesencriptado || account.codigo}`;
  };

  const getAvailableDestinationAccounts = () => {
    return accounts.filter(account => account.codigo !== formData.fromAccount);
  };

  const selectedFromAccount = accounts.find(acc => acc.codigo === formData.fromAccount);
  const selectedToAccount = accounts.find(acc => acc.codigo === formData.toAccount);

  const hasInsufficientFundsError = () => {
    return errors.amount && errors.amount.includes('Fondos insuficientes');
  };

  // Renderizar paso de OTP
  if (currentStep === 'otp') {
    return (
      <CodeSecurityInternalTransfer
        transferData={transferData}
        onBack={handleBackFromOTP}
        onTransferSuccess={handleTransferSuccess}
        onTransferError={handleTransferError}
      />
    );
  }

  // Renderizar pantalla de éxito con colores coherentes
  if (currentStep === 'success') {
    return (
      <div className="p-6 h-full bg-gradient-to-br from-slate-50 via-blue-50 to-sky-100 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/90 border border-emerald-200/60 rounded-2xl p-8 text-center shadow-lg backdrop-blur-sm">
            {/* Logo de Cooperativa Vilcabamba sobre el comprobante */}
            <div className="mb-6">
              <img src="/assets/images/isocoaclasnaves.png" alt="Cooperativa Vilcabamba" className="mx-auto h-16" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">¡Transferencia Exitosa!</h2>
            <p className="text-slate-600 mb-6">Tu transferencia entre cuentas propias se ha procesado correctamente</p>

            {transferResult && (
              <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-xl p-4 mb-6 backdrop-blur-sm">
                <h3 className="font-semibold text-slate-800 mb-3">Detalles de la transferencia</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-emerald-700 font-medium">Monto:</span>
                    <span className="text-emerald-700 font-bold">
                      {formatCurrency(transferResult.transferencia?.monto)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700 font-medium">De:</span>
                    <span className="text-emerald-700">
                      {transferResult.transferencia?.cuentaOrigen}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700 font-medium">Para:</span>
                    <span className="text-emerald-700">
                      {transferResult.transferencia?.cuentaDestino}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700 font-medium">Descripción:</span>
                    <span className="text-emerald-700">
                      {transferResult.transferencia?.descripcion}
                    </span>
                  </div>
                  {transferResult.transferencia?.numeroReferencia && (
                    <div className="flex justify-between">
                      <span className="text-emerald-700 font-medium">Referencia:</span>
                      <span className="text-emerald-700 font-mono text-xs">
                        {transferResult.transferencia.numeroReferencia}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handlePrintReceipt}
                className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-medium py-3 px-6 rounded-xl transition-colors duration-200"
              >
                Imprimir comprobante
              </button>
              <button
                onClick={onBack}
                className="w-full bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 shadow-md shadow-sky-500/20"
              >
                Regresar al Menú
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar formulario principal con diseño compacto
  return (
    <div className="p-4 md:p-6 h-full bg-gray-50 overflow-auto">
      <div className="max-w-2xl mx-auto">
        {/* Header con botón de regreso */}
        <div className="flex items-center mb-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-500 hover:text-slate-700 transition-colors duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
            </svg>
            <span className="hidden md:inline">Transferencias</span>
          </button>
        </div>

        {/* Título y Stepper */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Transferencias entre Cuentas Propias</h1>
          <p className="text-slate-500 mb-4">Transfiere dinero entre tus cuentas</p>

          {/* Stepper */}
          <div className="flex items-center">
            {/* Paso 1 - ACTIVO */}
            <div className="flex items-center text-sky-600">
              <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-sm">1</div>
              <span className="ml-2 text-sm font-medium text-sky-600">Formulario</span>
            </div>

            {/* Línea conectora 1-2 */}
            <div className="flex-1 h-px bg-gray-300 mx-4"></div>

            {/* Paso 2 - INACTIVO */}
            <div className="flex items-center text-gray-400">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-sm">2</div>
              <span className="ml-2 text-sm font-medium text-gray-400">Código Seguridad</span>
            </div>

            {/* Línea conectora 2-3 */}
            <div className="flex-1 h-px bg-gray-300 mx-4"></div>

            {/* Paso 3 - INACTIVO */}
            <div className="flex items-center text-gray-400">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-sm">3</div>
              <span className="ml-2 text-sm font-medium text-gray-400">Completado</span>
            </div>
          </div>
        </div>

        {/* Selector de tipo de transferencia */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="transferType"
                value="same-bank"
                checked={transferType === 'same-bank'}
                onChange={(e) => handleTransferTypeChange(e.target.value)}
                className="w-4 h-4 text-sky-600 border-slate-300 focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-2 text-sm text-slate-800 font-medium">Cuentas prestatadas</span>
            </label>

            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="transferType"
                value="other-banks"
                checked={transferType === 'other-banks'}
                onChange={(e) => handleTransferTypeChange(e.target.value)}
                className="w-4 h-4 text-sky-600 border-slate-300 focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-2 text-sm text-slate-800 font-medium">Cuentas en otros bancos</span>
            </label>
          </div>
        </div>

        {/* Error general */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Estado de carga */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
              <svg className="animate-spin h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            </div>
            <p className="text-slate-600">Cargando cuentas...</p>
          </div>
        )}

        {/* Formulario para cuentas prestatadas */}
        {transferType === 'same-bank' && !loading && !error && accounts.length >= 2 && (
          <div className="space-y-4">
            {/* Card de Cuentas Seleccionadas */}
            {selectedFromAccount && selectedToAccount && (
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-sky-600 flex items-center justify-center text-lg font-bold text-white mr-4">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5,6H23V18H5V6M14,9A3,3 0 0,1 17,12A3,3 0 0,1 14,15A3,3 0 0,1 11,12A3,3 0 0,1 14,9M9,8A2,2 0 0,1 7,10V14A2,2 0 0,1 9,16H19A2,2 0 0,1 21,14V10A2,2 0 0,1 19,8H9Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Transferencia Entre Cuentas Propias</p>
                    <p className="text-sm text-gray-500">De: {selectedFromAccount.codigo} → Para: {selectedToAccount.codigo}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Ingresa los datos */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Ingresa los datos</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cuenta de origen */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Cuenta de origen
                      </label>
                      
                      {/* Mostrar campo de solo lectura cuando hay cuenta seleccionada */}
                      {selectedFromAccount ? (
                        <div className="relative">
                          <div className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-800 min-h-[50px] flex items-center justify-between hover:border-sky-400 transition-colors cursor-pointer group"
                               onClick={() => setFormData(prev => ({ ...prev, fromAccount: '', toAccount: '' }))}
                               title="Click para cambiar">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">
                                {selectedFromAccount.descripcion}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Nro. {selectedFromAccount.numeroFormateado || selectedFromAccount.numeroDesencriptado || selectedFromAccount.codigo} | Saldo {formatCurrency(selectedFromAccount.saldoDisponible)}
                              </p>
                            </div>
                            <svg className="w-5 h-5 text-slate-400 group-hover:text-sky-500 transition-colors flex-shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <select
                          name="fromAccount"
                          value={formData.fromAccount}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-2 bg-white border rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-sky-400/50 transition-all duration-300 ${errors.fromAccount ? 'border-red-500' : 'border-slate-300'
                            }`}
                        >
                          <option value="">Selecciona una opción</option>
                          {accounts.map((account) => (
                            <option key={account.codigo} value={account.codigo}>
                              {formatAccountDisplay(account)}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      {errors.fromAccount && (
                        <p className="text-red-500 text-sm mt-1">{errors.fromAccount}</p>
                      )}
                    </div>

                    {/* Cuenta de destino */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Cuenta de destino
                      </label>
                      
                      {/* Mostrar campo de solo lectura cuando hay cuenta seleccionada */}
                      {selectedToAccount ? (
                        <div className="relative">
                          <div className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-800 min-h-[50px] flex items-center justify-between hover:border-sky-400 transition-colors cursor-pointer group"
                               onClick={() => setFormData(prev => ({ ...prev, toAccount: '' }))}
                               title="Click para cambiar">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">
                                {selectedToAccount.descripcion}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Nro. {selectedToAccount.numeroFormateado || selectedToAccount.numeroDesencriptado || selectedToAccount.codigo} | Saldo {formatCurrency(selectedToAccount.saldoDisponible)}
                              </p>
                            </div>
                            <svg className="w-5 h-5 text-slate-400 group-hover:text-sky-500 transition-colors flex-shrink-0 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <select
                          name="toAccount"
                          value={formData.toAccount}
                          onChange={handleInputChange}
                          disabled={!formData.fromAccount}
                          className={`w-full px-4 py-2 bg-white border rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-sky-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${errors.toAccount ? 'border-red-500' : 'border-slate-300'
                            }`}
                        >
                          <option value="">
                            {formData.fromAccount ? 'Selecciona una opción' : 'Primero selecciona cuenta de origen'}
                          </option>
                          {getAvailableDestinationAccounts().map((account) => (
                            <option key={account.codigo} value={account.codigo}>
                              {formatAccountDisplayDestination(account)}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      {errors.toAccount && (
                        <p className="text-red-500 text-sm mt-1">{errors.toAccount}</p>
                      )}
                    </div>
                  </div>

                  {/* Monto */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Monto a transferir
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                      <input
                        type="text"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        disabled={!formData.fromAccount || !formData.toAccount}
                        className={`w-full pl-7 pr-4 py-2 bg-white border rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-sky-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${errors.amount ? 'border-red-500' : 'border-slate-300'
                          }`}
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                    )}
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Descripción
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Transferencia entre cuentas propias"
                      maxLength="40"
                      className={`w-full px-4 py-2 bg-white border rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-sky-400/50 transition-all duration-300 ${errors.description ? 'border-red-500' : 'border-slate-300'
                        }`}
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                    )}
                  </div>
                </div>

                {/* Botones */}
                <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={
                      validatingFunds ||
                      !formData.fromAccount ||
                      !formData.toAccount ||
                      !formData.amount ||
                      !formData.description ||
                      hasInsufficientFundsError()
                    }
                    className="w-full md:w-auto flex-1 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-md transition-all duration-300 flex items-center justify-center"
                  >
                    {validatingFunds ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Validando...
                      </>
                    ) : (
                      'Continuar'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full md:w-auto flex-1 bg-transparent border border-gray-300 hover:bg-gray-100 text-slate-800 font-medium py-2 px-6 rounded-md transition-colors duration-300"
                    disabled={validatingFunds}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Formulario para otros bancos */}
        {transferType === 'other-banks' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-amber-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  Funcionalidad en desarrollo
                </h3>
                <p className="text-slate-600 mb-4">
                  Las transferencias entre cuentas de diferentes bancos estarán disponibles próximamente.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left">
                  <p className="text-xs text-amber-700">
                    <strong>Próximamente:</strong> Podrás transferir entre tus cuentas de Cooperativa Vilcabamba y otros bancos del sistema financiero.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SameAccounts;
