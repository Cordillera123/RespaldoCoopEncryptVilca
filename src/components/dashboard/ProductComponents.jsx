// // Agregar al INICIO del archivo ProductComponents.jsx
// import React, { useState } from 'react';
// // === COMPONENTE DE AHORROS CON ESTADO DE CUENTA ===
// const SavingsProductForm = () => {
//   const [selectedAccount, setSelectedAccount] = useState(null);
//   const [showStatement, setShowStatement] = useState(false);

//   // Datos simulados de cuentas de ahorro
//   const savingsAccounts = [
//     {
//       id: '220102001460',
//       type: 'Cuenta de Ahorro Tradicional',
//       balance: 15250.80,
//       interestRate: 2.5,
//       lastMovement: '2024-01-15',
//       status: 'ACTIVA'
//     },
//     {
//       id: '220102001461',
//       type: 'Ahorro Programado',
//       balance: 8500.00,
//       interestRate: 3.2,
//       lastMovement: '2024-01-10',
//       status: 'ACTIVA'
//     },
//     {
//       id: '220102001462',
//       type: 'Ahorro Navideño',
//       balance: 2850.50,
//       interestRate: 4.0,
//       lastMovement: '2024-01-08',
//       status: 'ACTIVA'
//     }
//   ];

//   // Datos simulados del estado de cuenta
//   const accountStatement = [
//     { date: '2024-01-15', description: 'Depósito en efectivo', debit: 0, credit: 500.00, balance: 15250.80 },
//     { date: '2024-01-10', description: 'Transferencia recibida', debit: 0, credit: 1200.00, balance: 14750.80 },
//     { date: '2024-01-08', description: 'Retiro cajero automático', debit: 150.00, credit: 0, balance: 13550.80 },
//     { date: '2024-01-05', description: 'Pago de servicios', debit: 85.50, credit: 0, balance: 13700.80 },
//     { date: '2024-01-03', description: 'Intereses ganados', debit: 0, credit: 25.30, balance: 13786.30 }
//   ];

//   const handleAccountClick = (account) => {
//     setSelectedAccount(account);
//     setShowStatement(true);
//   };

//   const downloadStatementPDF = () => {
//     // Simulación de descarga PDF
//     const link = document.createElement('a');
//     link.href = '#';
//     link.download = `estado_cuenta_${selectedAccount.id}_${new Date().toISOString().split('T')[0]}.pdf`;
//     link.click();
//     alert('Descargando estado de cuenta en PDF...');
//   };

//   if (showStatement && selectedAccount) {
//     return (
//       <div className="p-6 h-full bg-gradient-to-br from-emerald-50 to-emerald-100 overflow-auto">
//         <div className="max-w-6xl mx-auto">
//           {/* Header del Estado de Cuenta */}
//           <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-200 mb-6">
//             <div className="flex items-center justify-between mb-4">
//               <button 
//                 onClick={() => setShowStatement(false)}
//                 className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-medium"
//               >
//                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
//                 </svg>
//                 <span>Volver a Ahorros</span>
//               </button>
//               <button 
//                 onClick={downloadStatementPDF}
//                 className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
//               >
//                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
//                 </svg>
//                 <span>Descargar PDF</span>
//               </button>
//             </div>
            
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//               <div>
//                 <p className="text-sm text-gray-500">Número de Cuenta</p>
//                 <p className="font-bold text-gray-800">{selectedAccount.id}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Tipo de Cuenta</p>
//                 <p className="font-bold text-gray-800">{selectedAccount.type}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Saldo Actual</p>
//                 <p className="font-bold text-emerald-600">${selectedAccount.balance.toLocaleString()}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Estado</p>
//                 <span className="inline-flex px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
//                   {selectedAccount.status}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Tabla de Movimientos */}
//           <div className="bg-white rounded-2xl shadow-lg border border-emerald-200 overflow-hidden">
//             <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-200">
//               <h2 className="text-xl font-bold text-gray-800">Estado de Cuenta - Últimos Movimientos</h2>
//             </div>
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
//                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Débito</th>
//                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Crédito</th>
//                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {accountStatement.map((movement, index) => (
//                     <tr key={index} className="hover:bg-gray-50">
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{movement.date}</td>
//                       <td className="px-6 py-4 text-sm text-gray-900">{movement.description}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
//                         {movement.debit > 0 ? `$${movement.debit.toFixed(2)}` : '-'}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
//                         {movement.credit > 0 ? `$${movement.credit.toFixed(2)}` : '-'}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
//                         ${movement.balance.toFixed(2)}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 h-full bg-gradient-to-br from-emerald-50 to-emerald-100 overflow-auto">
//       <div className="max-w-6xl mx-auto">
//         <div className="text-center mb-8">
//           <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
//             <span className="text-white text-3xl">$</span>
//           </div>
//           <h1 className="text-4xl font-bold text-gray-800 mb-3">Productos de Ahorro</h1>
//           <p className="text-gray-600 text-lg">Gestiona todas tus cuentas de ahorro</p>
//         </div>

//         <div className="grid gap-6">
//           {savingsAccounts.map((account) => (
//             <div key={account.id} className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-200 hover:shadow-xl transition-all duration-200 cursor-pointer"
//                  onClick={() => handleAccountClick(account)}>
//               <div className="flex items-center justify-between">
//                 <div className="flex-1">
//                   <div className="flex items-center space-x-4">
//                     <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
//                       <span className="text-emerald-600 text-xl font-bold">$</span>
//                     </div>
//                     <div>
//                       <h3 className="text-lg font-bold text-gray-800">{account.type}</h3>
//                       <p className="text-gray-600">Cuenta: {account.id}</p>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <p className="text-2xl font-bold text-emerald-600">${account.balance.toLocaleString()}</p>
//                   <p className="text-sm text-gray-500">Tasa: {account.interestRate}% anual</p>
//                 </div>
//                 <svg className="w-6 h-6 text-gray-400 ml-4" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
//                 </svg>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// // === COMPONENTE DE INVERSIONES CON DETALLE ===
// const InvestmentProductForm = () => {
//   const [selectedInvestment, setSelectedInvestment] = useState(null);
//   const [showDetail, setShowDetail] = useState(false);

//   // Datos simulados de inversiones
//   const investments = [
//     {
//       id: '220102001460',
//       type: 'DEPÓSITO DE PLAZO FIJO',
//       amount: 3200.00,
//       interestRate: 8.50,
//       maturityDate: '2024-01-17',
//       status: 'VIGENTE',
//       paymentType: 'PAGO ANTICIPADO VT. NOMINAL'
//     },
//     {
//       id: '220102001461', 
//       type: 'FONDO DE INVERSIÓN',
//       amount: 5500.00,
//       interestRate: 12.30,
//       maturityDate: '2024-06-15',
//       status: 'VIGENTE',
//       paymentType: 'PAGO AL VENCIMIENTO'
//     }
//   ];

//   const handleInvestmentClick = (investment) => {
//     setSelectedInvestment(investment);
//     setShowDetail(true);
//   };

//   const downloadInvestmentPDF = () => {
//     const link = document.createElement('a');
//     link.href = '#';
//     link.download = `detalle_inversion_${selectedInvestment.id}.pdf`;
//     link.click();
//     alert('Descargando detalle de inversión en PDF...');
//   };

//   if (showDetail && selectedInvestment) {
//     return (
//       <div className="p-6 h-full bg-gradient-to-br from-purple-50 to-purple-100 overflow-auto">
//         <div className="max-w-4xl mx-auto">
//           {/* Header similar a la imagen */}
//           <div className="bg-blue-600 text-white rounded-t-2xl p-4">
//             <div className="flex items-center justify-between">
//               <h1 className="text-xl font-bold">Detalle Inversión</h1>
//               <button 
//                 onClick={() => setShowDetail(false)}
//                 className="text-white hover:text-blue-200"
//               >
//                 <span className="text-sm">SALIR</span>
//               </button>
//             </div>
//           </div>

//           {/* Contenido del detalle */}
//           <div className="bg-white border-x border-b rounded-b-2xl p-6 shadow-lg">
//             {/* Información principal similar a la imagen */}
//             <div className="border-b pb-4 mb-6">
//               <div className="flex items-center space-x-2 mb-4">
//                 <div className="w-4 h-4 bg-gray-400 rounded-sm"></div>
//                 <span className="font-medium">{selectedInvestment.id} (Vnc: {selectedInvestment.maturityDate}) - {selectedInvestment.type}</span>
//               </div>
//             </div>

//             {/* Grid de información */}
//             <div className="grid grid-cols-3 gap-8 mb-8">
//               <div>
//                 <div className="mb-4">
//                   <p className="text-sm text-gray-600 mb-1">Estado:</p>
//                   <p className="font-bold">{selectedInvestment.status}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Interés/Vta:</p>
//                   <p className="font-bold">{selectedInvestment.interestRate.toFixed(2)}</p>
//                 </div>
//               </div>
              
//               <div>
//                 <div className="mb-4">
//                   <p className="text-sm text-gray-600 mb-1">Monto Inversión:</p>
//                   <p className="font-bold">{selectedInvestment.amount.toFixed(2)}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Tipo Pago Int:</p>
//                   <p className="font-bold text-sm">{selectedInvestment.paymentType}</p>
//                 </div>
//               </div>

//               <div>
//                 <div className="mb-4">
//                   <p className="text-sm text-gray-600 mb-1">Saldo:</p>
//                   <p className="font-bold">{selectedInvestment.amount.toFixed(2)}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Botones de acción */}
//             <div className="flex justify-between items-center pt-6 border-t">
//               <button 
//                 onClick={() => setShowDetail(false)}
//                 className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
//               >
//                 Volver
//               </button>
//               <button 
//                 onClick={downloadInvestmentPDF}
//                 className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
//               >
//                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
//                 </svg>
//                 <span>Descargar PDF</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 h-full bg-gradient-to-br from-purple-50 to-purple-100 overflow-auto">
//       <div className="max-w-6xl mx-auto">
//         <div className="text-center mb-8">
//           <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
//             <span className="text-white text-3xl">📈</span>
//           </div>
//           <h1 className="text-4xl font-bold text-gray-800 mb-3">Productos de Inversión</h1>
//           <p className="text-gray-600 text-lg">Controla tu portafolio de inversiones</p>
//         </div>

//         <div className="grid gap-6">
//           {investments.map((investment) => (
//             <div key={investment.id} className="bg-white rounded-2xl p-6 shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-200 cursor-pointer"
//                  onClick={() => handleInvestmentClick(investment)}>
//               <div className="flex items-center justify-between">
//                 <div className="flex-1">
//                   <div className="flex items-center space-x-4">
//                     <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
//                       <span className="text-purple-600 text-xl">📈</span>
//                     </div>
//                     <div>
//                       <h3 className="text-lg font-bold text-gray-800">{investment.type}</h3>
//                       <p className="text-gray-600">Código: {investment.id}</p>
//                       <p className="text-sm text-gray-500">Vencimiento: {investment.maturityDate}</p>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <p className="text-2xl font-bold text-purple-600">${investment.amount.toLocaleString()}</p>
//                   <p className="text-sm text-gray-500">Tasa: {investment.interestRate}%</p>
//                   <span className="inline-flex px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
//                     {investment.status}
//                   </span>
//                 </div>
//                 <svg className="w-6 h-6 text-gray-400 ml-4" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
//                 </svg>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// // === COMPONENTE DE CRÉDITOS CON TABLA DE AMORTIZACIÓN ===
// const CreditProductForm = () => {
//   const [selectedCredit, setSelectedCredit] = useState(null);
//   const [showAmortization, setShowAmortization] = useState(false);

//   // Datos simulados de créditos
//   const credits = [
//     {
//       id: 'CR-001234',
//       type: 'Crédito de Consumo',
//       originalAmount: 15000.00,
//       currentBalance: 8500.50,
//       monthlyPayment: 458.33,
//       interestRate: 14.5,
//       remainingPayments: 18,
//       nextPaymentDate: '2024-02-15',
//       status: 'VIGENTE'
//     },
//     {
//       id: 'CR-001235', 
//       type: 'Microcrédito Empresarial',
//       originalAmount: 8000.00,
//       currentBalance: 3200.80,
//       monthlyPayment: 275.50,
//       interestRate: 16.8,
//       remainingPayments: 12,
//       nextPaymentDate: '2024-02-10',
//       status: 'VIGENTE'
//     }
//   ];

//   // Tabla de amortización simulada
//   const amortizationTable = [
//     { payment: 1, date: '2024-02-15', capital: 308.33, interest: 150.00, payment: 458.33, balance: 8192.17 },
//     { payment: 2, date: '2024-03-15', capital: 312.08, interest: 146.25, payment: 458.33, balance: 7880.09 },
//     { payment: 3, date: '2024-04-15', capital: 315.88, interest: 142.45, payment: 458.33, balance: 7564.21 },
//     { payment: 4, date: '2024-05-15', capital: 319.73, interest: 138.60, payment: 458.33, balance: 7244.48 },
//     { payment: 5, date: '2024-06-15', capital: 323.63, interest: 134.70, payment: 458.33, balance: 6920.85 }
//   ];

//   const handleCreditClick = (credit) => {
//     setSelectedCredit(credit);
//     setShowAmortization(true);
//   };

//   const downloadAmortizationPDF = () => {
//     const link = document.createElement('a');
//     link.href = '#';
//     link.download = `tabla_amortizacion_${selectedCredit.id}.pdf`;
//     link.click();
//     alert('Descargando tabla de amortización en PDF...');
//   };

//   if (showAmortization && selectedCredit) {
//     return (
//       <div className="p-6 h-full bg-gradient-to-br from-blue-50 to-blue-100 overflow-auto">
//         <div className="max-w-6xl mx-auto">
//           {/* Header */}
//           <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-200 mb-6">
//             <div className="flex items-center justify-between mb-4">
//               <button 
//                 onClick={() => setShowAmortization(false)}
//                 className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
//               >
//                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
//                 </svg>
//                 <span>Volver a Créditos</span>
//               </button>
//               <button 
//                 onClick={downloadAmortizationPDF}
//                 className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
//               >
//                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
//                 </svg>
//                 <span>Descargar PDF</span>
//               </button>
//             </div>
            
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//               <div>
//                 <p className="text-sm text-gray-500">Código de Crédito</p>
//                 <p className="font-bold text-gray-800">{selectedCredit.id}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Saldo Actual</p>
//                 <p className="font-bold text-blue-600">${selectedCredit.currentBalance.toLocaleString()}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Cuota Mensual</p>
//                 <p className="font-bold text-gray-800">${selectedCredit.monthlyPayment.toFixed(2)}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-500">Cuotas Restantes</p>
//                 <p className="font-bold text-orange-600">{selectedCredit.remainingPayments}</p>
//               </div>
//             </div>
//           </div>

//           {/* Tabla de Amortización */}
//           <div className="bg-white rounded-2xl shadow-lg border border-blue-200 overflow-hidden">
//             <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
//               <h2 className="text-xl font-bold text-gray-800">Tabla de Amortización</h2>
//             </div>
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase"># Cuota</th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
//                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Capital</th>
//                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Interés</th>
//                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cuota</th>
//                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {amortizationTable.map((row, index) => (
//                     <tr key={index} className="hover:bg-gray-50">
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">{row.payment}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.date}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600">${row.capital.toFixed(2)}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">${row.interest.toFixed(2)}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">${row.payment.toFixed(2)}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-red-600">${row.balance.toFixed(2)}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 h-full bg-gradient-to-br from-blue-50 to-blue-100 overflow-auto">
//       <div className="max-w-6xl mx-auto">
//         <div className="text-center mb-8">
//           <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
//             <span className="text-white text-3xl">📋</span>
//           </div>
//           <h1 className="text-4xl font-bold text-gray-800 mb-3">Productos de Crédito</h1>
//           <p className="text-gray-600 text-lg">Administra tus líneas de crédito y préstamos</p>
//         </div>

//         <div className="grid gap-6">
//           {credits.map((credit) => (
//             <div key={credit.id} className="bg-white rounded-2xl p-6 shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-200 cursor-pointer"
//                  onClick={() => handleCreditClick(credit)}>
//               <div className="flex items-center justify-between">
//                 <div className="flex-1">
//                   <div className="flex items-center space-x-4">
//                     <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
//                       <span className="text-blue-600 text-xl">📋</span>
//                     </div>
//                     <div>
//                       <h3 className="text-lg font-bold text-gray-800">{credit.type}</h3>
//                       <p className="text-gray-600">Código: {credit.id}</p>
//                       <p className="text-sm text-gray-500">Próximo pago: {credit.nextPaymentDate}</p>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <p className="text-2xl font-bold text-blue-600">${credit.currentBalance.toLocaleString()}</p>
//                   <p className="text-sm text-gray-500">Cuota: ${credit.monthlyPayment.toFixed(2)}</p>
//                   <span className="inline-flex px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
//                     {credit.status}
//                   </span>
//                 </div>
//                 <svg className="w-6 h-6 text-gray-400 ml-4" viewBox="0 0 24 24" fill="currentColor">
//                   <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
//                 </svg>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// // === COMPONENTES PARA SEGUROS Y TARJETAS (Básicos) ===
// const InsuranceProductForm = () => {
//   const insuranceProducts = [
//     {
//       id: 'SEG-001',
//       type: 'Seguro de Vida',
//       coverage: 50000.00,
//       premium: 85.50,
//       status: 'VIGENTE',
//       expiryDate: '2024-12-31'
//     },
//     {
//       id: 'SEG-002',
//       type: 'Seguro Vehicular',
//       coverage: 25000.00,
//       premium: 125.30,
//       status: 'VIGENTE',
//       expiryDate: '2024-08-15'
//     }
//   ];

//   return (
//     <div className="p-6 h-full bg-gradient-to-br from-orange-50 to-orange-100 overflow-auto">
//       <div className="max-w-6xl mx-auto">
//         <div className="text-center mb-8">
//           <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
//             <span className="text-white text-3xl">🛡️</span>
//           </div>
//           <h1 className="text-4xl font-bold text-gray-800 mb-3">Productos de Seguros</h1>
//           <p className="text-gray-600 text-lg">Protege tu patrimonio y el de tu familia</p>
//         </div>

//         <div className="grid gap-6">
//           {insuranceProducts.map((insurance) => (
//             <div key={insurance.id} className="bg-white rounded-2xl p-6 shadow-lg border border-orange-200 hover:shadow-xl transition-all duration-200">
//               <div className="flex items-center justify-between">
//                 <div className="flex-1">
//                   <div className="flex items-center space-x-4">
//                     <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
//                       <span className="text-orange-600 text-xl">🛡️</span>
//                     </div>
//                     <div>
//                       <h3 className="text-lg font-bold text-gray-800">{insurance.type}</h3>
//                       <p className="text-gray-600">Póliza: {insurance.id}</p>
//                       <p className="text-sm text-gray-500">Vence: {insurance.expiryDate}</p>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <p className="text-2xl font-bold text-orange-600">${insurance.coverage.toLocaleString()}</p>
//                   <p className="text-sm text-gray-500">Prima: ${insurance.premium.toFixed(2)}/mes</p>
//                   <span className="inline-flex px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
//                     {insurance.status}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Información adicional */}
//         <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg border border-orange-200">
//           <h2 className="text-xl font-bold text-gray-800 mb-4">Beneficios de tus Seguros</h2>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <div className="text-center">
//               <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
//                 <span className="text-orange-600 text-2xl">💰</span>
//               </div>
//               <h3 className="font-semibold text-gray-800 mb-2">Cobertura Amplia</h3>
//               <p className="text-gray-600 text-sm">Protección integral para ti y tu familia</p>
//             </div>
//             <div className="text-center">
//               <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
//                 <span className="text-orange-600 text-2xl">⚡</span>
//               </div>
//               <h3 className="font-semibold text-gray-800 mb-2">Pago Rápido</h3>
//               <p className="text-gray-600 text-sm">Siniestros procesados en 24-48 horas</p>
//             </div>
//             <div className="text-center">
//               <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
//                 <span className="text-orange-600 text-2xl">📞</span>
//               </div>
//               <h3 className="font-semibold text-gray-800 mb-2">Asistencia 24/7</h3>
//               <p className="text-gray-600 text-sm">Atención disponible todos los días</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const CardsProductForm = () => {
//   const cardProducts = [
//     {
//       id: '**** **** **** 1234',
//       type: 'Tarjeta de Crédito Platinum',
//       limit: 8000.00,
//       available: 6250.00,
//       cutoffDate: '2024-02-25',
//       paymentDate: '2024-03-10',
//       status: 'ACTIVA'
//     },
//     {
//       id: '**** **** **** 5678',
//       type: 'Tarjeta de Débito',
//       limit: 2000.00,
//       available: 1850.00,
//       cutoffDate: 'N/A',
//       paymentDate: 'N/A',
//       status: 'ACTIVA'
//     }
//   ];

//   return (
//     <div className="p-6 h-full bg-gradient-to-br from-pink-50 to-pink-100 overflow-auto">
//       <div className="max-w-6xl mx-auto">
//         <div className="text-center mb-8">
//           <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
//             <span className="text-white text-3xl">💳</span>
//           </div>
//           <h1 className="text-4xl font-bold text-gray-800 mb-3">Productos de Tarjetas</h1>
//           <p className="text-gray-600 text-lg">Gestiona todas tus tarjetas financieras</p>
//         </div>

//         <div className="grid gap-6">
//           {cardProducts.map((card, index) => (
//             <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-pink-200 hover:shadow-xl transition-all duration-200">
//               <div className="flex items-center justify-between">
//                 <div className="flex-1">
//                   <div className="flex items-center space-x-4">
//                     <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
//                       <span className="text-pink-600 text-xl">💳</span>
//                     </div>
//                     <div>
//                       <h3 className="text-lg font-bold text-gray-800">{card.type}</h3>
//                       <p className="text-gray-600 font-mono">{card.id}</p>
//                       {card.paymentDate !== 'N/A' && (
//                         <p className="text-sm text-gray-500">Próximo pago: {card.paymentDate}</p>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <p className="text-2xl font-bold text-pink-600">${card.available.toLocaleString()}</p>
//                   <p className="text-sm text-gray-500">
//                     {card.type.includes('Crédito') ? 'Disponible' : 'Límite diario'}
//                   </p>
//                   <span className="inline-flex px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
//                     {card.status}
//                   </span>
//                 </div>
//               </div>
              
//               {card.type.includes('Crédito') && (
//                 <div className="mt-4 pt-4 border-t border-gray-200">
//                   <div className="flex justify-between text-sm">
//                     <span className="text-gray-600">Límite total:</span>
//                     <span className="font-medium">${card.limit.toLocaleString()}</span>
//                   </div>
//                   <div className="flex justify-between text-sm mt-1">
//                     <span className="text-gray-600">Utilizado:</span>
//                     <span className="font-medium text-red-600">${(card.limit - card.available).toLocaleString()}</span>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>

//         {/* Acciones rápidas para tarjetas */}
//         <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg border border-pink-200">
//           <h2 className="text-xl font-bold text-gray-800 mb-6">Servicios de Tarjetas</h2>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             <button className="p-4 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors text-center">
//               <div className="text-2xl mb-2">🔒</div>
//               <span className="text-sm font-medium text-gray-700">Bloquear</span>
//             </button>
//             <button className="p-4 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors text-center">
//               <div className="text-2xl mb-2">📋</div>
//               <span className="text-sm font-medium text-gray-700">Estado de Cuenta</span>
//             </button>
//             <button className="p-4 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors text-center">
//               <div className="text-2xl mb-2">🔢</div>
//               <span className="text-sm font-medium text-gray-700">Cambiar PIN</span>
//             </button>
//             <button className="p-4 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors text-center">
//               <div className="text-2xl mb-2">📈</div>
//               <span className="text-sm font-medium text-gray-700">Aumentar Límite</span>
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // === EXPORTAR COMPONENTES ACTUALIZADOS ===
// export default {
//   SavingsProductForm,
//   InvestmentProductForm, 
//   CreditProductForm,
//   InsuranceProductForm,
//   CardsProductForm
// };