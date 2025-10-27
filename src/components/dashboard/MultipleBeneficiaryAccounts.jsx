import React, { useState, useEffect } from 'react';

/**
 * Componente para manejar beneficiarios con múltiples cuentas bancarias
 * Permite seleccionar entre diferentes cuentas del mismo beneficiario
 */
const MultipleBeneficiaryAccounts = ({
  beneficiary,
  accounts = [],
  selectedAccountId,
  onAccountSelect,
  disabled = false,
  showLabel = true
}) => {
  const [selectedAccount, setSelectedAccount] = useState(selectedAccountId || '');

  useEffect(() => {
    if (selectedAccountId && selectedAccountId !== selectedAccount) {
      setSelectedAccount(selectedAccountId);
    }
  }, [selectedAccountId]);

  // Si solo hay una cuenta, no mostrar selector
  if (accounts.length <= 1) {
    const singleAccount = accounts[0];
    if (singleAccount && onAccountSelect && selectedAccount !== singleAccount.id) {
      onAccountSelect(singleAccount);
    }
    return null;
  }

  const handleAccountChange = (e) => {
    const accountId = e.target.value;
    setSelectedAccount(accountId);
    
    const account = accounts.find(acc => acc.id === accountId);
    if (account && onAccountSelect) {
      onAccountSelect(account);
    }
  };

  const getAccountDisplayText = (account) => {
    const bankInfo = account.bank ? ` - ${account.bank}` : '';
    const typeInfo = account.accountType ? ` (${account.accountType})` : '';
    return `${account.accountNumber}${bankInfo}${typeInfo}`;
  };

  return (
    <div className="space-y-2">
      {showLabel && (
        <label className="block text-sm font-medium text-slate-700">
          Seleccionar Cuenta
        </label>
      )}
      
      <div className="relative">
        <select
          value={selectedAccount}
          onChange={handleAccountChange}
          disabled={disabled}
          className="w-full px-4 py-2 bg-white border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-sky-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Selecciona una cuenta</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {getAccountDisplayText(account)}
            </option>
          ))}
        </select>

        {/* Icono de múltiples cuentas */}
        <div className="absolute right-10 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,5V7H15V5H19M9,5V11H5V5H9M19,13V19H15V13H19M9,17V19H5V17H9M21,3H13V9H21V3M11,3H3V13H11V3M21,11H13V21H21V11M11,15H3V21H11V15Z" />
          </svg>
        </div>
      </div>

      {/* Información de la cuenta seleccionada */}
      {selectedAccount && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,18H4V8H20M20,6H12L10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6Z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              {(() => {
                const account = accounts.find(acc => acc.id === selectedAccount);
                if (!account) return null;
                
                return (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-sky-800">
                      Cuenta: {account.accountNumber}
                    </p>
                    {account.bank && (
                      <p className="text-xs text-sky-600">
                        Banco: {account.bank}
                      </p>
                    )}
                    {account.accountType && (
                      <p className="text-xs text-sky-600">
                        Tipo: {account.accountType}
                      </p>
                    )}
                    {account.isAdditionalAccount && (
                      <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Cuenta Agregada
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Contador de cuentas */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{accounts.length} cuentas disponibles</span>
        {selectedAccount && (
          <span className="text-green-600">✓ Cuenta seleccionada</span>
        )}
      </div>
    </div>
  );
};

export default MultipleBeneficiaryAccounts;
