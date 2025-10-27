import React, { useState, useEffect } from 'react';
import apiServiceTransferExt from '../../services/apiServiceTransferExt';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import SecurityquestionExt from './SecurityCodeExt.jsx';

const TransferExt = ({ onBack, preselectedContact = null, onShowAddAccount }) => {
  // Estados principales
  const [currentStep, setCurrentStep] = useState('form');
  const [accounts, setAccounts] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados del formulario
  const [formData, setFormData] = useState({
    fromAccount: '',
    beneficiary: '',
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

  // ✅ EFECTO SEPARADO para manejar preselección
  useEffect(() => {
    if (preselectedContact && !loading) { // Esperar que termine la carga
      console.log('🎯 [TRANSFER-EXT] Contacto preseleccionado recibido:', preselectedContact);
      console.log('🔍 [TRANSFER-EXT-DEBUG] Datos completos del contacto:', JSON.stringify(preselectedContact, null, 2));
      console.log('🔍 [TRANSFER-EXT-DEBUG] Beneficiarios disponibles:', beneficiaries.length);

      if (beneficiaries.length === 0) {
        console.log('⏳ [TRANSFER-EXT] Sin beneficiarios cargados aún, esperando...');
        return;
      }

      // Buscar beneficiario existente por múltiples criterios
      const matchingBeneficiary = beneficiaries.find(b => {
        console.log('🔎 [TRANSFER-EXT] Comparando:', {
          beneficiario: b.name,
          cuentaB: b.accountNumber,
          cuentaP: preselectedContact.accountNumber,
          cedulaB: b.cedula || b.identificationNumber,
          cedulaP: preselectedContact.identificationNumber || preselectedContact.cedula,
          bancoB: b.bankCode,
          bancoP: preselectedContact.bankCode
        });

        // Buscar por ID exacto
        if (preselectedContact.id && b.id === preselectedContact.id) {
          console.log('✅ [TRANSFER-EXT] Match por ID:', b.id);
          return true;
        }

        // Buscar por cuenta + identificación + banco
        if (preselectedContact.accountNumber &&
          preselectedContact.identificationNumber &&
          preselectedContact.bankCode) {
          const accountMatch = b.accountNumber === preselectedContact.accountNumber;
          const idMatch = (b.cedula === preselectedContact.identificationNumber ||
            b.identificationNumber === preselectedContact.identificationNumber);
          const bankMatch = b.bankCode === preselectedContact.bankCode;

          if (accountMatch && idMatch && bankMatch) {
            console.log('✅ [TRANSFER-EXT] Match por cuenta+cedula+banco');
            return true;
          }
        }

        return false;
      });

      if (matchingBeneficiary) {
        console.log('✅ [TRANSFER-EXT] Beneficiario encontrado en lista:', matchingBeneficiary.name);
        setFormData(prev => ({ ...prev, beneficiary: matchingBeneficiary.id }));
        setLockedBeneficiaryId(matchingBeneficiary.id);
      } else {
        console.log('🆕 [TRANSFER-EXT] Beneficiario no está en lista, agregándolo como nuevo contacto');

        // Crear beneficiario temporal con estructura completa
        const newBeneficiary = {
          id: preselectedContact.id || `temp-${Date.now()}`,
          name: preselectedContact.name || preselectedContact.beneficiaryName,
          cedula: preselectedContact.identificationNumber || preselectedContact.cedula,
          identificationNumber: preselectedContact.identificationNumber || preselectedContact.cedula,
          accountNumber: preselectedContact.accountNumber,
          accountType: preselectedContact.accountTypeName || preselectedContact.accountType,
          accountTypeCode: preselectedContact.accountTypeCode,
          bankCode: preselectedContact.bankCode,
          bank: preselectedContact.bankName || preselectedContact.bank,
          email: preselectedContact.email || '',
          phone: preselectedContact.phone || '',
          documentType: preselectedContact.identificationTypeCode || preselectedContact.documentType || '1',
          avatar: (preselectedContact.name || preselectedContact.beneficiaryName || 'N').charAt(0).toUpperCase(),
          isNewlyCreated: true
        };

        console.log('📝 [TRANSFER-EXT] Nuevo beneficiario creado:', newBeneficiary);

        // Agregar a la lista de beneficiarios
        setBeneficiaries(prev => [newBeneficiary, ...prev]);

        // Preseleccionar el nuevo beneficiario
        setFormData(prev => ({ ...prev, beneficiary: newBeneficiary.id }));
        setLockedBeneficiaryId(newBeneficiary.id);

        console.log('✅ [TRANSFER-EXT] Nuevo beneficiario agregado y preseleccionado:', newBeneficiary.name);
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

      console.log('🏦 [EXTERNAL-TRANSFER] Cargando datos iniciales...');

      const [accountsResult, beneficiariesResult] = await Promise.all([
        apiServiceTransferExt.getCurrentUserExternalAccountsOrigin(),
        apiServiceTransferExt.getCurrentUserExternalBeneficiaries()
      ]);

      if (accountsResult.success) {
        console.log('✅ [EXTERNAL-TRANSFER] Cuentas cargadas:', accountsResult.data.cuentas.length);
        setAccounts(accountsResult.data.cuentas);

        if (accountsResult.data.cuentas.length === 0) {
          setError('No tienes cuentas activas disponibles para transferencias');
          return;
        }
      } else {
        console.error('❌ [EXTERNAL-TRANSFER] Error cargando cuentas:', accountsResult.error.message);
        setError(accountsResult.error.message);
        return;
      }

      if (beneficiariesResult.success) {
        console.log('✅ [EXTERNAL-TRANSFER] Beneficiarios externos cargados:', beneficiariesResult.data.beneficiarios.length);
        setBeneficiaries(beneficiariesResult.data.beneficiarios);

        // ✅ PRESELECCIONAR contacto después de cargar beneficiarios
        if (preselectedContact) {
          console.log('🎯 [TRANSFER-EXT] Preseleccionando contacto después de cargar beneficiarios');

          // 🔍 Buscar el beneficiario por ID único primero, luego por número de cuenta específico
          const matchingBeneficiary = beneficiariesResult.data.beneficiarios.find(b => {
            // 1. Buscar por ID exacto (más confiable)
            if (preselectedContact.id && b.id === preselectedContact.id) {
              console.log('🎯 [MATCH-LOAD] Encontrado por ID:', b.id);
              return true;
            }

            // 2. Buscar por número de cuenta + cédula + banco (para evitar confusión entre usuarios del mismo banco)
            if (preselectedContact.accountNumber && b.accountNumber === preselectedContact.accountNumber &&
              ((preselectedContact.cedula && b.cedula === preselectedContact.cedula) ||
                (preselectedContact.identificationNumber && b.identificationNumber === preselectedContact.identificationNumber)) &&
              preselectedContact.bankCode && b.bankCode === preselectedContact.bankCode) {
              console.log('🎯 [MATCH-LOAD] Encontrado por cuenta+cedula+banco:', b.accountNumber, b.cedula || b.identificationNumber);
              return true;
            }

            return false;
          });

          if (matchingBeneficiary) {
            console.log('✅ [TRANSFER-EXT] Beneficiario encontrado y preseleccionado:', matchingBeneficiary.name);
            setFormData(prev => ({
              ...prev,
              beneficiary: matchingBeneficiary.id
            }));
            setLockedBeneficiaryId(matchingBeneficiary.id);
          } else {
            console.log('⚠️ [TRANSFER-EXT] No se encontró el beneficiario preseleccionado en la lista');
            console.log('🆕 [TRANSFER-EXT] Agregando beneficiario temporal a la lista');
            
            // Crear beneficiario temporal
            const newBeneficiary = {
              id: preselectedContact.id || `temp-${Date.now()}`,
              name: preselectedContact.name || preselectedContact.beneficiaryName,
              cedula: preselectedContact.identificationNumber || preselectedContact.cedula,
              identificationNumber: preselectedContact.identificationNumber || preselectedContact.cedula,
              accountNumber: preselectedContact.accountNumber,
              accountType: preselectedContact.accountTypeName || preselectedContact.accountType,
              accountTypeCode: preselectedContact.accountTypeCode,
              bankCode: preselectedContact.bankCode,
              bank: preselectedContact.bankName || preselectedContact.bank,
              email: preselectedContact.email || '',
              phone: preselectedContact.phone || '',
              documentType: preselectedContact.identificationTypeCode || preselectedContact.documentType || '1',
              avatar: (preselectedContact.name || preselectedContact.beneficiaryName || 'N').charAt(0).toUpperCase(),
              isNewlyCreated: true
            };
            
            console.log('📝 [TRANSFER-EXT] Beneficiario temporal creado:', newBeneficiary);
            
            // Agregar a la lista
            setBeneficiaries(prev => [newBeneficiary, ...prev]);
            
            // Preseleccionar
            setFormData(prev => ({ ...prev, beneficiary: newBeneficiary.id }));
            setLockedBeneficiaryId(newBeneficiary.id);
          }
        }
      } else {
        console.error('❌ [EXTERNAL-TRANSFER] Error cargando beneficiarios externos:', beneficiariesResult.error.message);
        setBeneficiaries([]);
      }

    } catch (error) {
      console.error('💥 [EXTERNAL-TRANSFER] Error inesperado:', error);
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
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fromAccount) {
      newErrors.fromAccount = 'Selecciona la cuenta de origen';
    }

    if (!formData.beneficiary) {
      newErrors.beneficiary = 'Selecciona un beneficiario';
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

      console.log('💰 [EXTERNAL-TRANSFER] Validando disponibilidad de fondos...');

      const result = await apiServiceTransferExt.validateCurrentUserExternalTransfer(
        formData.fromAccount,
        formData.amount
      );

      if (result.success) {
        console.log('✅ [EXTERNAL-TRANSFER] Fondos validados, procediendo con OTP');

        const selectedBeneficiary = beneficiaries.find(b => b.id === formData.beneficiary);

        setTransferData({
          cuentaOrigen: formData.fromAccount,
          cuentaDestino: selectedBeneficiary.accountNumber,
          monto: parseFloat(formData.amount),
          descripcion: formData.description.trim(),
          beneficiario: selectedBeneficiary,
          // Campos adicionales requeridos para API 2360
          codigoBanco: selectedBeneficiary.bankCode,
          nombreBanco: selectedBeneficiary.bank,
          tipoDocumentoReceptor: selectedBeneficiary.documentType || '1',
          cedulaReceptor: selectedBeneficiary.cedula,
          nombreReceptor: selectedBeneficiary.name,
          tipoCuentaReceptor: selectedBeneficiary.accountTypeCode || '1',
          telefonoReceptor: selectedBeneficiary.phone || '',
          emailReceptor: selectedBeneficiary.email || ''
        });

        setCurrentStep('otp');
      } else {
        console.error('❌ [EXTERNAL-TRANSFER] Error validando fondos:', result.error.message);
        setErrors({
          amount: result.error.message
        });
      }
    } catch (error) {
      console.error('💥 [EXTERNAL-TRANSFER] Error inesperado validando fondos:', error);
      setError('Error inesperado al validar la transferencia');
    } finally {
      setValidatingFunds(false);
    }
  };

  const handleTransferSuccess = (result) => {
    console.log('🎉 [EXTERNAL-TRANSFER] Transferencia externa exitosa:', result);
    setTransferResult(result);
    setCurrentStep('success');
  };

  const handleTransferError = (error) => {
    console.error('❌ [EXTERNAL-TRANSFER] Error en transferencia externa:', error);
    
    // ✅ SI EL ERROR ES POR INTENTOS MÁXIMOS, REGRESAR A EXTERNA TRANSFER WINDOW
    if (error.code === 'MAX_ATTEMPTS_REACHED') {
      console.log('🔙 [EXTERNAL-TRANSFER] Máximo de intentos alcanzado, regresando a ExternaTransferWindow...');
      onBack(); // Regresar a ExternaTransferWindow
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
      selectedBeneficiary = beneficiaries.find(b => b.id === formData.beneficiary);
    } else if (lockedBeneficiaryId) {
      selectedBeneficiary = beneficiaries.find(b => b.id === lockedBeneficiaryId);
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

      // Crear documento PDF con configuración estándar
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;

      // ============================================
      // CARGAR LOGO ESTÁNDAR
      // ============================================
      const logoPath = '/assets/images/isocoaclasnaves.png';

      try {
        const response = await fetch(logoPath);
        if (response.ok) {
          const blob = await response.blob();
          const logoData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });

          // Logo estándar: 12x12 píxeles en posición (15, 13)
          doc.addImage(logoData, 'PNG', 15, 13, 12, 12);
        }
      } catch (logoError) {
        console.warn('No se pudo cargar el logo:', logoError);
      }

      // ============================================
      // ENCABEZADO ESTÁNDAR
      // ============================================

      // Título principal
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('COOPERATIVA DE AHORRO Y CREDITO VILCABAMBA', pageWidth / 2, 20, { align: 'center' });

      // Subtítulo
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('VILCABAMBA - LOJA', pageWidth / 2, 26, { align: 'center' });

      // Fecha
      const currentDate = new Date().toLocaleString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      doc.setFontSize(7);
      doc.text(`Fecha: ${currentDate}`, pageWidth - margin, 20, { align: 'right' });

      // ============================================
      // TÍTULO DEL DOCUMENTO
      // ============================================
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('COMPROBANTE DE TRANSFERENCIA EXTERNA', pageWidth / 2, 35, { align: 'center' });

      // Referencia
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`Referencia: ${data.numeroReferencia || 'N/A'}`, pageWidth / 2, 42, { align: 'center' });

      // ============================================
      // TABLA DE DATOS ESTÁNDAR
      // ============================================

      // Determinar el tipo de transferencia para los datos
      const isCoopTransfer = transferData?.beneficiario?.bankCode === undefined;

      const tableData = [
        ['Monto', formatCurrency(data.monto ?? transferData?.monto ?? 0)],
        ['Cuenta Origen', transferData?.cuentaOrigen ?? ''],
        ['Beneficiario', beneficiario.name ?? ''],
        ...(isCoopTransfer
          ? [
            ['Cuenta Destino', data.cuentaDestino ?? transferData?.cuentaDestino ?? ''],
            ['Tipo', 'Transferencia Cooperativa']
          ]
          : [
            ['Banco Destino', beneficiario.bank ?? ''],
            ['Cuenta Destino', data.cuentaDestino ?? transferData?.cuentaDestino ?? ''],
            ['Tipo', 'Transferencia Externa']
          ]
        ),
        ['Descripción', data.descripcion ?? transferData?.descripcion ?? '']
      ];

      autoTable(doc, {
        startY: 50,
        head: [['Concepto', 'Detalle']],
        body: tableData,
        theme: 'striped',
        styles: {
          fontSize: 7,
          cellPadding: 0.3,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold'
        },
        margin: { left: margin, right: margin }
      });

      // ============================================
      // PIE DE PÁGINA ESTÁNDAR
      // ============================================
      const finalY = doc.lastAutoTable?.finalY || 100;

      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'Este comprobante es válido como soporte de la transacción realizada.',
        pageWidth / 2,
        finalY + 15,
        { align: 'center' }
      );

      doc.text(
        'COOPERATIVA DE AHORRO Y CREDITO VILCABAMBA - Vilcabamba, Loja',
        pageWidth / 2,
        finalY + 22,
        { align: 'center' }
      );

      // Guardar PDF
      const fileName = `comprobante_transferencia_ext_${data.numeroReferencia || Date.now()}.pdf`;
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
    return `${account.descripcion} - ${account.codigo} | ${formatCurrency(account.saldoDisponible)}`;
  };

  const formatBeneficiaryDisplay = (beneficiary) => {
    return `${beneficiary.name} - ${beneficiary.bank}`;
  };

  const hasInsufficientFundsError = () => {
    return errors.amount && errors.amount.includes('Fondos insuficientes');
  };

  const selectedFromAccount = accounts.find(acc => acc.codigo === formData.fromAccount);
  const selectedBeneficiary = beneficiaries.find(b => b.id === formData.beneficiary);

  // Renderizar paso de OTP
  if (currentStep === 'otp') {
    return (
      <SecurityquestionExt
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
            <p className="text-slate-600 mb-6">Tu transferencia interbancaria se ha procesado correctamente</p>

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
                    <span className="text-emerald-700 font-medium">Banco destino:</span>
                    <span className="text-emerald-700">
                      {transferData?.beneficiario?.bank}
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
                onClick={handleNewTransfer}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 shadow-md shadow-sky-500/20"
              >
                Nueva Transferencia
              </button>
              <button
                onClick={onBack}
                className="w-full bg-slate-200/80 hover:bg-slate-300/80 text-slate-700 font-medium py-3 px-6 rounded-xl transition-colors duration-300 backdrop-blur-sm"
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
          <h1 className="text-2xl font-bold text-slate-800">Transferencia Externa</h1>

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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cuenta de destino
                  </label>
                  <select
                    name="beneficiary"
                    value={formData.beneficiary}
                    onChange={handleInputChange}
                    disabled={beneficiaries.length === 0 || Boolean(lockedBeneficiaryId)}
                    className={`w-full px-4 py-2 bg-white border rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${errors.beneficiary ? 'border-red-500' : 'border-slate-300'
                      } ${preselectedContact || lockedBeneficiaryId ? 'border-sky-400 bg-sky-50/20' : ''}`}
                  >
                    <option value="">
                      {beneficiaries.length === 0
                        ? 'No tienes beneficiarios registrados'
                        : 'Selecciona un beneficiario'
                      }
                    </option>
                    {beneficiaries.map((beneficiary) => (
                      <option key={beneficiary.id} value={beneficiary.id}>
                        {`${beneficiary.bank} - ${beneficiary.accountNumber}`}
                      </option>
                    ))}
                  </select>
                  {errors.beneficiary && (
                    <p className="text-red-500 text-sm mt-1 font-medium">{errors.beneficiary}</p>
                  )}
                  {beneficiaries.length === 0 && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-700">
                        � Necesitas tener beneficiarios de otros bancos registrados para realizar transferencias interbancarias
                      </p>
                    </div>
                  )}
                </div>

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
                      placeholder="Transferencia Externa"
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

export default TransferExt;
