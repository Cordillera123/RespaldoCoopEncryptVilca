import React, { useState, useEffect } from 'react';
import apiServiceTransfer from '../../services/apiserviceTransfer';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import SecurityquestionCoopint from './SecurityCodeCoopint.jsx';
import useBeneficiaryAccounts from '../../hooks/useBeneficiaryAccounts.js';
import MultipleBeneficiaryAccounts from './MultipleBeneficiaryAccounts.jsx';

const TransferCoopint = ({ onBack, preselectedContact = null, onShowAddAccount }) => {
  // Estados principales
  const [currentStep, setCurrentStep] = useState('form'); // 'form', 'otp', 'success'
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hook para manejar beneficiarios con múltiples cuentas
  const {
    beneficiaries,
    groupedBeneficiaries,
    setBeneficiaries,
    addAccountToBeneficiary,
    getBeneficiaryAccounts,
    getAccountById,
    hasMultipleAccounts,
    stats
  } = useBeneficiaryAccounts([]);

  // Estados del formulario
  const [formData, setFormData] = useState({
    fromAccount: '',
    beneficiary: '',
    selectedAccountId: '', // Nueva propiedad para manejar cuenta específica
    amount: '',
    description: ''
  });
  const [lockedBeneficiaryId, setLockedBeneficiaryId] = useState(null);
  const [errors, setErrors] = useState({});
  const [validatingFunds, setValidatingFunds] = useState(false);
  const [transferData, setTransferData] = useState(null);
  const [transferResult, setTransferResult] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Efecto para manejar preselección cuando los beneficiarios estén disponibles
  useEffect(() => {
    if (preselectedContact && !loading) {
      console.log('🎯 [TRANSFER-COOP] Contacto preseleccionado recibido:', preselectedContact);
      console.log('🔍 [TRANSFER-COOP-DEBUG] Datos completos del contacto:', JSON.stringify(preselectedContact, null, 2));
      console.log('🔍 [TRANSFER-COOP-DEBUG] Beneficiarios disponibles:', beneficiaries.length);

      // ✅ CORREGIDO: No esperar a que haya beneficiarios, siempre procesar el contacto
      // Si no hay beneficiarios previos (común en usuarios CACVIL), agregar el contacto directamente

      // 🚀 Buscar beneficiario existente por cédula (no por cuenta)
      const existingBeneficiaryGroup = groupedBeneficiaries.find(group => 
        group.cedula === preselectedContact.identificationNumber || 
        group.cedula === preselectedContact.cedula
      );

      if (existingBeneficiaryGroup) {
        console.log('� [TRANSFER-COOP] Beneficiario existente encontrado:', existingBeneficiaryGroup.name);
        
        // Verificar si la cuenta específica ya existe
        const existingAccount = existingBeneficiaryGroup.accounts.find(acc => 
          acc.accountNumber === preselectedContact.accountNumber &&
          acc.bankCode === preselectedContact.bankCode
        );

        if (existingAccount) {
          console.log('✅ [TRANSFER-COOP] Cuenta específica encontrada:', existingAccount.accountNumber);
          setFormData(prev => ({ 
            ...prev, 
            beneficiary: existingBeneficiaryGroup.cedula,
            selectedAccountId: existingAccount.id
          }));
          setLockedBeneficiaryId(existingBeneficiaryGroup.cedula);
        } else if (preselectedContact.isAdditionalAccount) {
          console.log('🔄 [TRANSFER-COOP] Agregando cuenta adicional al beneficiario existente');
          
          // Agregar la nueva cuenta al beneficiario existente
          const newAccountData = {
            accountNumber: preselectedContact.accountNumber,
            bank: preselectedContact.bank,
            bankCode: preselectedContact.bankCode,
            accountType: preselectedContact.accountType,
            accountTypeCode: preselectedContact.accountTypeCode
          };

          const newAccountEntry = addAccountToBeneficiary(existingBeneficiaryGroup, newAccountData);
          
          setFormData(prev => ({ 
            ...prev, 
            beneficiary: existingBeneficiaryGroup.cedula,
            selectedAccountId: newAccountEntry.id
          }));
          setLockedBeneficiaryId(existingBeneficiaryGroup.cedula);
          
          console.log('✅ [TRANSFER-COOP] Cuenta adicional agregada y preseleccionada');
        }
      } else {
        console.log('🆕 [TRANSFER-COOP] Beneficiario completamente nuevo, agregándolo');

        const newBeneficiary = {
          id: preselectedContact.id || `temp-${Date.now()}`,
          name: preselectedContact.name || preselectedContact.beneficiaryName,
          cedula: preselectedContact.identificationNumber || preselectedContact.cedula,
          identificationNumber: preselectedContact.identificationNumber || preselectedContact.cedula,
          accountNumber: preselectedContact.accountNumber,
          accountType: preselectedContact.accountTypeName || preselectedContact.accountType,
          bank: preselectedContact.bank,
          bankCode: preselectedContact.bankCode,
          accountTypeCode: preselectedContact.accountTypeCode,
          email: preselectedContact.email || '',
          phone: preselectedContact.phone || '',
          avatar: (preselectedContact.name || preselectedContact.beneficiaryName || 'N').charAt(0).toUpperCase(),
          isNewlyCreated: true
        };

        console.log('📝 [TRANSFER-COOP] Nuevo beneficiario creado:', newBeneficiary);

        setBeneficiaries(prev => [newBeneficiary, ...prev]);
        setFormData(prev => ({ 
          ...prev, 
          beneficiary: newBeneficiary.cedula || newBeneficiary.identificationNumber,
          selectedAccountId: newBeneficiary.id
        }));
        setLockedBeneficiaryId(newBeneficiary.cedula || newBeneficiary.identificationNumber);

        console.log('✅ [TRANSFER-COOP] Nuevo beneficiario agregado y preseleccionado:', newBeneficiary.name);
      }
    }
  }, [preselectedContact, beneficiaries, loading]);

  // Validación cliente-side en tiempo real: si hay cuenta seleccionada, verificar monto contra saldo
  useEffect(() => {
    const selectedAccount = accounts.find(acc => acc.codigo === formData.fromAccount);
    if (formData.amount && selectedAccount) {
      const amount = parseFloat(formData.amount);
      if (!isNaN(amount) && amount > selectedAccount.saldoDisponible) {
        setErrors(prev => ({
          ...prev,
          amount: `Fondos insuficientes: saldo disponible ${formatCurrency(selectedAccount.saldoDisponible)}`
        }));
      } else {
        setErrors(prev => {
          const copy = { ...prev };
          if (copy.amount && copy.amount.includes('Fondos insuficientes')) delete copy.amount;
          return copy;
        });
      }
    }
  }, [formData.amount, formData.fromAccount, accounts]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🏦 [COOP-TRANSFER] Cargando datos iniciales...');

      // Cargar cuentas origen y beneficiarios en paralelo
      const [accountsResult, beneficiariesResult] = await Promise.all([
        apiServiceTransfer.getCurrentUserCoopAccountsOrigin(),
        apiServiceTransfer.getCurrentUserCoopBeneficiaries()
      ]);

      if (accountsResult.success) {
        console.log('✅ [COOP-TRANSFER] Cuentas cargadas:', accountsResult.data.cuentas.length);
        setAccounts(accountsResult.data.cuentas);

        if (accountsResult.data.cuentas.length === 0) {
          setError('No tienes cuentas activas disponibles para transferencias');
          return;
        }
      } else {
        console.error('❌ [COOP-TRANSFER] Error cargando cuentas:', accountsResult.error.message);
        setError(accountsResult.error.message);
        return;
      }

      if (beneficiariesResult.success) {
        console.log('✅ [COOP-TRANSFER] Beneficiarios cargados:', beneficiariesResult.data.beneficiarios.length);
        setBeneficiaries(beneficiariesResult.data.beneficiarios);
        console.log('📊 [BENEFICIARIES] Estadísticas después de carga:', stats);
      } else {
        console.error('❌ [COOP-TRANSFER] Error cargando beneficiarios:', beneficiariesResult.error.message);
        // No es error crítico, se puede continuar sin beneficiarios
        setBeneficiaries([]);
      }

    } catch (error) {
      console.error('💥 [COOP-TRANSFER] Error inesperado:', error);
      setError('Error inesperado al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Manejo especial para el campo amount
    if (name === 'amount') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      const parts = numericValue.split('.');
      const cleanValue = parts.length > 2
        ? parts[0] + '.' + parts.slice(1).join('')
        : numericValue;

      const finalValue = parts[1] && parts[1].length > 2
        ? parts[0] + '.' + parts[1].substring(0, 2)
        : cleanValue;

      setFormData(prev => ({
        ...prev,
        [name]: finalValue
      }));
    } else {
      setFormData(prev => {
        const updatedData = { ...prev, [name]: value };
        
        // Si cambió el beneficiario, limpiar la cuenta seleccionada
        if (name === 'beneficiary') {
          updatedData.selectedAccountId = '';
        }
        
        return updatedData;
      });
    }

    // Limpiar errores del campo que se está editando
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        
        // Si cambió el beneficiario, también limpiar error de cuenta seleccionada
        if (name === 'beneficiary') {
          delete newErrors.selectedAccountId;
        }
        
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fromAccount) {
      newErrors.fromAccount = 'Selecciona la cuenta de origen';
    }

    if (!formData.beneficiary) {
      newErrors.beneficiary = 'Selecciona un beneficiario';
    }

    // Validar cuenta específica si el beneficiario tiene múltiples cuentas
    if (formData.beneficiary) {
      const beneficiaryAccounts = getBeneficiaryAccounts(formData.beneficiary);
      if (beneficiaryAccounts.length > 1 && !formData.selectedAccountId) {
        newErrors.selectedAccountId = 'Selecciona una cuenta específica';
      }
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

      console.log('💰 [COOP-TRANSFER] Validando disponibilidad de fondos...');

      const result = await apiServiceTransfer.validateCurrentUserCoopTransfer(
        formData.fromAccount,
        formData.amount
      );

      if (result.success) {
        console.log('✅ [COOP-TRANSFER] Fondos validados, procediendo con OTP');

        // Obtener beneficiario y cuenta específica seleccionados
        const selectedBeneficiaryGroup = groupedBeneficiaries.find(g => g.cedula === formData.beneficiary);
        const selectedAccount = formData.selectedAccountId ? 
          getAccountById(formData.selectedAccountId) : 
          selectedBeneficiaryGroup?.accounts[0]; // Si solo hay una cuenta, usar esa
        
        // ✅ IMPORTANTE: Construir beneficiario con todos los campos necesarios para SecurityCodeCoopint
        const selectedBeneficiary = {
          // Datos del beneficiario (nombre, cédula, etc.)
          name: selectedBeneficiaryGroup?.name,
          cedula: selectedBeneficiaryGroup?.cedula,
          identificationNumber: selectedBeneficiaryGroup?.identificationNumber,
          email: selectedBeneficiaryGroup?.email,
          phone: selectedBeneficiaryGroup?.phone,
          avatar: selectedBeneficiaryGroup?.avatar,
          // Datos de la cuenta específica seleccionada
          accountNumber: selectedAccount?.accountNumber,
          bank: selectedAccount?.bank,
          bankCode: selectedAccount?.bankCode,
          accountType: selectedAccount?.accountType,
          accountTypeCode: selectedAccount?.accountTypeCode,
          id: selectedAccount?.id
        };

        console.log('📋 [COOP-TRANSFER] Beneficiario construido para transferData:', selectedBeneficiary);

        setTransferData({
          cuentaOrigen: formData.fromAccount,
          cuentaDestino: selectedBeneficiary.accountNumber,
          monto: parseFloat(formData.amount),
          descripcion: formData.description.trim(),
          beneficiario: selectedBeneficiary
        });

        setCurrentStep('otp');
      } else {
        console.error('❌ [COOP-TRANSFER] Error validando fondos:', result.error.message);
        setErrors({
          amount: result.error.message
        });
      }
    } catch (error) {
      console.error('💥 [COOP-TRANSFER] Error inesperado validando fondos:', error);
      setError('Error inesperado al validar la transferencia');
    } finally {
      setValidatingFunds(false);
    }
  };

  const handleTransferSuccess = (result) => {
    console.log('🎉 [COOP-TRANSFER] Transferencia exitosa:', result);
    setTransferResult(result);
    setCurrentStep('success');
  };

  const handleTransferError = (error) => {
    console.error('❌ [COOP-TRANSFER] Error en transferencia:', error);
    
    // ✅ SI EL ERROR ES POR INTENTOS MÁXIMOS, REGRESAR A INTERNA TRANSFER WINDOW
    if (error.code === 'MAX_ATTEMPTS_REACHED') {
      console.log('🔙 [COOP-TRANSFER] Máximo de intentos alcanzado, regresando a InternaTransferWindow...');
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
      fromAccount: '',
      beneficiary: '',
      selectedAccountId: '',
      amount: '',
      description: ''
    });
    setErrors({});
    setError(null);
  };

  const handleAddAccount = () => {
    // Buscar beneficiario seleccionado: puede estar en formData.beneficiary o en lockedBeneficiaryId
    let selectedBeneficiary = null;
    
    if (formData.beneficiary) {
      selectedBeneficiary = groupedBeneficiaries.find(g => g.cedula === formData.beneficiary);
    } else if (lockedBeneficiaryId) {
      selectedBeneficiary = groupedBeneficiaries.find(g => g.cedula === lockedBeneficiaryId);
    }
    
    console.log('🔍 [ADD-ACCOUNT-DEBUG] Buscando beneficiario:', {
      formDataBeneficiary: formData.beneficiary,
      lockedBeneficiaryId: lockedBeneficiaryId,
      selectedBeneficiary: selectedBeneficiary?.name
    });
    
    if (selectedBeneficiary && onShowAddAccount) {
      console.log('✅ [ADD-ACCOUNT] Mostrando formulario para beneficiario:', selectedBeneficiary.name);
      onShowAddAccount(selectedBeneficiary);
    } else {
      console.log('❌ [ADD-ACCOUNT] No hay beneficiario seleccionado');
      setError('Selecciona un beneficiario primero para agregarle una nueva cuenta');
    }
  };

  // Función estandarizada para generar PDF del comprobante
  const handlePrintReceipt = async () => {
    try {
      const data = transferResult?.transferencia || {};
      const beneficiario = transferData?.beneficiario || {};

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Cargar logo
      const logoPath = '/assets/images/isocoaclasnaves.png';
      let logoImg = null;

      try {
        const response = await fetch(logoPath);
        if (response.ok) {
          const blob = await response.blob();
          logoImg = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        }
      } catch (logoError) {
        console.warn('No se pudo cargar el logo:', logoError);
      }

      // Logo centrado (30x30)
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', pageWidth / 2 - 15, 10, 30, 30);
      }

      // Título principal
      let yPos = 45;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('COMPROBANTE DE TRANSFERENCIA', pageWidth / 2, yPos, { align: 'center' });

      // Subtítulo cooperativa
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('COOPERATIVA DE AHORRO Y CREDITO VILCABAMBA', pageWidth / 2, yPos, { align: 'center' });

      // Fecha de generación
      yPos += 5;
      doc.setFontSize(9);
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentDate = `${year}/${month}/${day} ${hours}:${minutes}`;
      doc.text(`Generado: ${currentDate}`, pageWidth / 2, yPos, { align: 'center' });

      yPos += 12;

      // Determinar el tipo de transferencia
      const isCoopTransfer = transferData?.beneficiario?.bankCode === undefined;

      // SECCIÓN: INFORMACIÓN DEL BENEFICIARIO
      doc.setFillColor(240, 248, 255);
      doc.rect(20, yPos, pageWidth - 40, 8, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.text('INFORMACIÓN DEL BENEFICIARIO', 25, yPos + 5.5);

      yPos += 12;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Beneficiario:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(beneficiario.name || 'N/A', 70, yPos);

      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Cuenta Destino:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(data.cuentaDestino || transferData?.cuentaDestino || 'N/A', 70, yPos);

      if (!isCoopTransfer) {
        yPos += 7;
        doc.setFont('helvetica', 'bold');
        doc.text('Banco Destino:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(beneficiario.bank || 'N/A', 70, yPos);
      }

      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Tipo:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(isCoopTransfer ? 'Transferencia Cooperativa' : 'Transferencia Interbancaria', 70, yPos);

      yPos += 12;

      // SECCIÓN: CUENTA DE ORIGEN
      doc.setFillColor(240, 248, 255);
      doc.rect(20, yPos, pageWidth - 40, 8, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.text('CUENTA DE ORIGEN', 25, yPos + 5.5);

      yPos += 12;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Cuenta Origen:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(transferData?.cuentaOrigen || 'N/A', 70, yPos);

      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Institución:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text('COOPERATIVA DE AHORRO Y CREDITO VILCABAMBA', 70, yPos);

      yPos += 12;

      // SECCIÓN: DETALLES DE LA TRANSACCIÓN
      doc.setFillColor(240, 248, 255);
      doc.rect(20, yPos, pageWidth - 40, 8, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 204);
      doc.text('DETALLES DE LA TRANSACCIÓN', 25, yPos + 5.5);

      yPos += 12;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Referencia:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(data.numeroReferencia || 'N/A', 70, yPos);

      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Fecha:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(currentDate, 70, yPos);

      yPos += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Descripción:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      const descripcion = data.descripcion || transferData?.descripcion || 'Sin descripción';
      doc.text(descripcion, 70, yPos);

      yPos += 12;

      // CAJA DEL MONTO (verde con borde redondeado)
      const boxHeight = 20;
      doc.setFillColor(34, 197, 94);
      doc.roundedRect(20, yPos, pageWidth - 40, boxHeight, 3, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('MONTO TRANSFERIDO', pageWidth / 2, yPos + 8, { align: 'center' });

      const formattedAmount = new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(data.monto ?? transferData?.monto ?? 0);

      doc.setFontSize(18);
      doc.text(formattedAmount, pageWidth / 2, yPos + 16, { align: 'center' });

      // Footer
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      const footerY = pageHeight - 20;
      doc.text(
        'Este es un comprobante informativo de su transacción.',
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );
      doc.text(
        'COOPERATIVA DE AHORRO Y CREDITO VILCABAMBA - Vilcabamba, Loja',
        pageWidth / 2,
        footerY + 5,
        { align: 'center' }
      );

      // Guardar PDF
      const fileName = `Comprobante_Transferencia_Cooperativa_${data.numeroReferencia || Date.now()}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el comprobante PDF');
    }
  };

  // Función auxiliar para formatear moneda (debe estar disponible en el componente)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatAccountDisplay = (account) => {
    return `${account.descripcion} - ${account.numeroFormateado || account.numeroDesencriptado || account.codigo} | ${formatCurrency(account.saldoDisponible)}`;
  };

  const formatBeneficiaryDisplay = (beneficiary) => {
    return `${beneficiary.name} - ${beneficiary.accountNumber}`;
  };

  const hasInsufficientFundsError = () => {
    return errors.amount && errors.amount.includes('Fondos insuficientes');
  };

  const selectedFromAccount = accounts.find(acc => acc.codigo === formData.fromAccount);
  const selectedBeneficiaryGroup = groupedBeneficiaries.find(g => g.cedula === formData.beneficiary);
  const selectedAccount = formData.selectedAccountId ? 
    getAccountById(formData.selectedAccountId) : 
    selectedBeneficiaryGroup?.accounts[0];
  
  const selectedBeneficiary = selectedAccount ? {
    ...selectedBeneficiaryGroup,
    ...selectedAccount,
    beneficiary: selectedBeneficiaryGroup
  } : selectedBeneficiaryGroup;

  // Renderizar paso de OTP
  if (currentStep === 'otp') {
    return (
      <SecurityquestionCoopint
        transferData={transferData}
        onBack={handleBackFromOTP}
        onTransferSuccess={handleTransferSuccess}
        onTransferError={handleTransferError}
      />
    );
  }

  // Renderizar pantalla de éxito
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
            <p className="text-slate-600 mb-6">Tu transferencia se ha procesado correctamente</p>

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
                    <span className="text-emerald-700 font-medium">Para:</span>
                    <span className="text-emerald-700">
                      {transferData?.beneficiario?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700 font-medium">Cuenta destino:</span>
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

  // Renderizar formulario principal
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
          <h1 className="text-2xl font-bold text-slate-800">Transferencia Local</h1>
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

        {/* Error general */}
        {error && (
          <div className="bg-red-50/80 border border-red-200/60 rounded-xl p-4 mb-6 backdrop-blur-sm">
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
            <p className="text-slate-600">Cargando datos...</p>
          </div>
        )}

        {/* Formulario */}
        {!loading && !error && (
          <div className="space-y-4">
            {/* Card de Beneficiario Preseleccionado */}
            {selectedBeneficiary && (
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 mr-4">
                    {selectedBeneficiary.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{selectedBeneficiary.name}</p>
                    <p className="text-sm text-gray-500">Cédula Nro. {selectedBeneficiary.cedula || selectedBeneficiary.identificationNumber}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Cuenta de destino */}
                {/* Selector de Beneficiario */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Beneficiario
                  </label>
                  <select
                    name="beneficiary"
                    value={formData.beneficiary}
                    onChange={handleInputChange}
                    disabled={groupedBeneficiaries.length === 0 || Boolean(lockedBeneficiaryId)}
                    className={`w-full px-4 py-2 bg-white border rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${errors.beneficiary ? 'border-red-500' : 'border-slate-300'
                      } ${preselectedContact || lockedBeneficiaryId ? 'border-sky-400 bg-sky-50/20' : ''}`}
                  >
                    <option value="">
                      {groupedBeneficiaries.length === 0
                        ? 'No tienes beneficiarios registrados'
                        : 'Selecciona un beneficiario'
                      }
                    </option>
                    {groupedBeneficiaries.map((group) => (
                      <option key={group.cedula} value={group.cedula}>
                        {group.name} - {group.cedula} 
                        {group.accountCount > 1 && ` (${group.accountCount} cuentas)`}
                      </option>
                    ))}
                  </select>
                  {errors.beneficiary && (
                    <p className="text-red-500 text-sm mt-1 font-medium">{errors.beneficiary}</p>
                  )}
                  {groupedBeneficiaries.length === 0 && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-700">
                        💡 Necesitas tener beneficiarios registrados para realizar transferencias
                      </p>
                    </div>
                  )}
                </div>

                {/* Selector de Cuenta Específica (cuando el beneficiario tiene múltiples cuentas) */}
                {formData.beneficiary && (() => {
                  const selectedBeneficiaryAccounts = getBeneficiaryAccounts(formData.beneficiary);
                  return selectedBeneficiaryAccounts.length > 1 && (
                    <MultipleBeneficiaryAccounts
                      beneficiary={groupedBeneficiaries.find(g => g.cedula === formData.beneficiary)}
                      accounts={selectedBeneficiaryAccounts}
                      selectedAccountId={formData.selectedAccountId}
                      onAccountSelect={(account) => {
                        setFormData(prev => ({ ...prev, selectedAccountId: account.id }));
                        // Limpiar error si existe
                        if (errors.selectedAccountId) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.selectedAccountId;
                            return newErrors;
                          });
                        }
                      }}
                      showLabel={true}
                    />
                  );
                })()}

                <div>
                  <button
                    type="button"
                    onClick={handleAddAccount}
                    className="flex items-center text-sky-600 hover:text-sky-700 text-sm font-medium transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9Z" />
                    </svg>
                    Agregar cuenta de destino
                  </button>
                  {formData.beneficiary === '' && !lockedBeneficiaryId && (
                    <p className="text-xs text-amber-600 mt-1">
                      💡 Selecciona un beneficiario primero para agregarle una nueva cuenta
                    </p>
                  )}
                </div>

                {/* Ingresa los datos */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Ingresa los datos</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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
                          disabled={!formData.beneficiary}
                          className={`w-full pl-7 pr-4 py-2 bg-white border rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${errors.amount ? 'border-red-500' : 'border-slate-300'}`}
                        />
                      </div>
                      {errors.amount && (
                        <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                      )}
                    </div>

                    {/* Cuenta de origen */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Cuenta de origen
                      </label>
                      
                      {/* Mostrar campo de solo lectura cuando hay cuenta seleccionada */}
                      {selectedFromAccount ? (
                        <div className="relative">
                          <div className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-800 min-h-[50px] flex items-center justify-between hover:border-sky-400 transition-colors cursor-pointer group"
                               onClick={() => setFormData(prev => ({ ...prev, fromAccount: '' }))}
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
                          className={`w-full px-4 py-2 bg-white border rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400/50 transition-all duration-300 ${errors.fromAccount ? 'border-red-500' : 'border-slate-300'}`}
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
                      placeholder="Transferencia Local"
                      maxLength="40"
                      className={`w-full px-4 py-2 bg-white border rounded-md text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400/50 transition-all duration-300 ${errors.description ? 'border-red-500' : 'border-slate-300'}`}
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
                      !formData.beneficiary ||
                      !formData.amount ||
                      !formData.description ||
                      hasInsufficientFundsError() ||
                      beneficiaries.length === 0
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
      </div>
    </div>
  );
};

export default TransferCoopint;