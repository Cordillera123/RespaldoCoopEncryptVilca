import { useState, useCallback, useMemo } from 'react';

/**
 * Hook personalizado para manejar beneficiarios con múltiples cuentas bancarias
 * Permite agrupar y gestionar cuentas de un mismo beneficiario sin duplicados
 */
const useBeneficiaryAccounts = (initialBeneficiaries = []) => {
  const [beneficiaries, setBeneficiaries] = useState(initialBeneficiaries);

  /**
   * Agrupa beneficiarios por cédula, consolidando múltiples cuentas
   */
  const groupedBeneficiaries = useMemo(() => {
    const groups = {};
    
    beneficiaries.forEach(beneficiary => {
      const key = beneficiary.cedula || beneficiary.identificationNumber;
      
      if (!key) return; // Saltar si no tiene identificación
      
      if (!groups[key]) {
        // Primera cuenta de este beneficiario
        groups[key] = {
          ...beneficiary,
          accounts: [{
            id: beneficiary.id,
            accountNumber: beneficiary.accountNumber,
            bank: beneficiary.bank,
            bankCode: beneficiary.bankCode,
            accountType: beneficiary.accountType,
            accountTypeCode: beneficiary.accountTypeCode,
            isAdditionalAccount: beneficiary.isAdditionalAccount || false,
            originalBeneficiaryId: beneficiary.originalBeneficiaryId
          }],
          accountCount: 1
        };
      } else {
        // Agregar cuenta adicional al beneficiario existente
        const existingAccount = groups[key].accounts.find(
          acc => acc.accountNumber === beneficiary.accountNumber && 
                 acc.bankCode === beneficiary.bankCode
        );
        
        if (!existingAccount) {
          groups[key].accounts.push({
            id: beneficiary.id,
            accountNumber: beneficiary.accountNumber,
            bank: beneficiary.bank,
            bankCode: beneficiary.bankCode,
            accountType: beneficiary.accountType,
            accountTypeCode: beneficiary.accountTypeCode,
            isAdditionalAccount: beneficiary.isAdditionalAccount || false,
            originalBeneficiaryId: beneficiary.originalBeneficiaryId
          });
          groups[key].accountCount = groups[key].accounts.length;
        }
      }
    });
    
    return Object.values(groups);
  }, [beneficiaries]);

  /**
   * Agrega una nueva cuenta a un beneficiario existente
   */
  const addAccountToBeneficiary = useCallback((beneficiaryData, newAccountData) => {
    console.log('🔄 [BENEFICIARY-ACCOUNTS] Agregando cuenta a beneficiario existente:', {
      beneficiario: beneficiaryData.name,
      nuevaCuenta: newAccountData.accountNumber,
      banco: newAccountData.bank
    });

    const newBeneficiaryEntry = {
      ...beneficiaryData,
      id: `${beneficiaryData.id}_${newAccountData.accountNumber}`, // ID único para la nueva cuenta
      accountNumber: newAccountData.accountNumber,
      bank: newAccountData.bank,
      bankCode: newAccountData.bankCode,
      accountType: newAccountData.accountType,
      accountTypeCode: newAccountData.accountTypeCode,
      isAdditionalAccount: true,
      originalBeneficiaryId: beneficiaryData.id
    };

    setBeneficiaries(prev => [newBeneficiaryEntry, ...prev]);
    
    return newBeneficiaryEntry;
  }, []);

  /**
   * Obtiene todas las cuentas de un beneficiario específico
   */
  const getBeneficiaryAccounts = useCallback((beneficiaryCedula) => {
    const group = groupedBeneficiaries.find(
      group => group.cedula === beneficiaryCedula || group.identificationNumber === beneficiaryCedula
    );
    return group ? group.accounts : [];
  }, [groupedBeneficiaries]);

  /**
   * Obtiene la cuenta específica por ID
   */
  const getAccountById = useCallback((accountId) => {
    for (const group of groupedBeneficiaries) {
      const account = group.accounts.find(acc => acc.id === accountId);
      if (account) {
        return {
          ...account,
          beneficiary: group
        };
      }
    }
    return null;
  }, [groupedBeneficiaries]);

  /**
   * Verifica si un beneficiario tiene múltiples cuentas
   */
  const hasMultipleAccounts = useCallback((beneficiaryCedula) => {
    const accounts = getBeneficiaryAccounts(beneficiaryCedula);
    return accounts.length > 1;
  }, [getBeneficiaryAccounts]);

  /**
   * Obtiene estadísticas de los beneficiarios
   */
  const stats = useMemo(() => {
    const totalBeneficiaries = groupedBeneficiaries.length;
    const totalAccounts = beneficiaries.length;
    const beneficiariesWithMultipleAccounts = groupedBeneficiaries.filter(
      group => group.accountCount > 1
    ).length;

    return {
      totalBeneficiaries,
      totalAccounts,
      beneficiariesWithMultipleAccounts,
      averageAccountsPerBeneficiary: totalBeneficiaries > 0 ? 
        Math.round((totalAccounts / totalBeneficiaries) * 100) / 100 : 0
    };
  }, [groupedBeneficiaries, beneficiaries]);

  return {
    // Estados
    beneficiaries,
    groupedBeneficiaries,
    setBeneficiaries,
    
    // Funciones
    addAccountToBeneficiary,
    getBeneficiaryAccounts,
    getAccountById,
    hasMultipleAccounts,
    
    // Estadísticas
    stats
  };
};

export default useBeneficiaryAccounts;