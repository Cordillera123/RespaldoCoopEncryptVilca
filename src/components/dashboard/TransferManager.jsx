import React, { useState } from 'react';
import TransferCoopint from './TransferCoopint';
import TransferExt from './TransferExt';
import AddAccountToBeneficiary from './AddAccountToBeneficiary';

const TransferManager = ({ onBack, transferType = 'internal', preselectedContact = null }) => {
  const [currentView, setCurrentView] = useState('transfer'); // 'transfer', 'addAccount'
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);

  const handleShowAddAccount = (beneficiary) => {
    console.log('🔄 [TRANSFER-MANAGER] Mostrando formulario de agregar cuenta para:', beneficiary.name);
    setSelectedBeneficiary(beneficiary);
    setCurrentView('addAccount');
  };

  const handleBackFromAddAccount = () => {
    console.log('🔄 [TRANSFER-MANAGER] Regresando a transferencia');
    setCurrentView('transfer');
    setSelectedBeneficiary(null);
  };

  const handleAccountCreated = (accountData) => {
    console.log('✅ [TRANSFER-MANAGER] Cuenta creada exitosamente:', accountData);
    // La vista de éxito ya maneja la navegación hacia transferencias
    setCurrentView('transfer');
    setSelectedBeneficiary(null);
  };

  const handleTransferToAccount = (accountData, isInternal) => {
    console.log('🔄 [TRANSFER-MANAGER] Iniciando transferencia a cuenta:', {
      account: accountData.accountNumber,
      bank: accountData.bank,
      isInternal: isInternal
    });

    // Preparar datos del contacto para preseleccionar en la transferencia
    const contactForTransfer = {
      id: `new_${Date.now()}`, // ID temporal único
      name: accountData.name,
      cedula: accountData.cedula,
      identificationNumber: accountData.cedula,
      accountNumber: accountData.accountNumber,
      bank: accountData.bank,
      bankCode: accountData.bankCode, // ✅ AGREGAR bankCode para transferencias externas
      accountType: accountData.accountType,
      accountTypeCode: accountData.accountTypeCode, // ✅ AGREGAR accountTypeCode
      email: accountData.email,
      phone: accountData.phone,
      avatar: accountData.avatar || accountData.name?.charAt(0).toUpperCase(),
      // Flags para indicar que es una cuenta recién creada
      isNewAccount: true,
      isInternalAccount: isInternal,
      // Campos adicionales para transferencias externas (API 2380)
      documentType: '1', // Tipo documento por defecto (cédula)
      codigoBanco: accountData.bankCode, // ✅ CAMPO ESPECÍFICO que falta en el error
      tipoDocumentoReceptor: '1', // Cédula por defecto
      cedulaReceptor: accountData.cedula,
      nombreReceptor: accountData.name,
      tipoCuentaReceptor: accountData.accountTypeCode
    };

    // Cambiar el tipo de transferencia si es necesario
    if (isInternal && transferType !== 'internal') {
      // Redirigir a transferencia interna
      setCurrentView('transferInternal');
    } else if (!isInternal && transferType !== 'external') {
      // Redirigir a transferencia externa
      setCurrentView('transferExternal');
    } else {
      // Mantener en la misma vista de transferencia
      setCurrentView('transfer');
    }

    // Establecer el contacto preseleccionado
    setPreselectedContactForTransfer(contactForTransfer);
  };

  const [preselectedContactForTransfer, setPreselectedContactForTransfer] = useState(preselectedContact);

  // Renderizar vista de agregar cuenta
  if (currentView === 'addAccount' && selectedBeneficiary) {
    return (
      <AddAccountToBeneficiary
        beneficiary={selectedBeneficiary}
        onBack={handleBackFromAddAccount}
        onSuccess={handleAccountCreated}
        onTransferToAccount={handleTransferToAccount}
      />
    );
  }

  // Renderizar vista de transferencia interna (cuando se redirige desde cuenta interna creada)
  if (currentView === 'transferInternal') {
    return (
      <TransferCoopint
        onBack={onBack}
        preselectedContact={preselectedContactForTransfer}
        onShowAddAccount={handleShowAddAccount}
      />
    );
  }

  // Renderizar vista de transferencia externa (cuando se redirige desde cuenta externa creada)
  if (currentView === 'transferExternal') {
    return (
      <TransferExt
        onBack={onBack}
        preselectedContact={preselectedContactForTransfer}
        onShowAddAccount={handleShowAddAccount}
      />
    );
  }

  // Renderizar vista de transferencia normal
  if (transferType === 'internal') {
    return (
      <TransferCoopint
        onBack={onBack}
        preselectedContact={preselectedContactForTransfer}
        onShowAddAccount={handleShowAddAccount}
      />
    );
  } else {
    return (
      <TransferExt
        onBack={onBack}
        preselectedContact={preselectedContactForTransfer}
        onShowAddAccount={handleShowAddAccount}
      />
    );
  }
};

export default TransferManager;
