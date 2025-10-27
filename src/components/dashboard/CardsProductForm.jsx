import React, { useState } from 'react';
import { MdCreditCard } from 'react-icons/md';

const CardsProductForm = () => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 4;

  // Datos simulados de tarjetas (expandidos para demostrar paginación)
  const cardProducts = [
    {
      id: 'CC-001234',
      cardNumber: '**** **** **** 1234',
      type: 'Tarjeta de Crédito Platinum',
      limit: 8000.00,
      available: 6250.00,
      used: 1750.00,
      cutoffDate: '2024-02-25',
      paymentDate: '2024-03-10',
      minimumPayment: 175.00,
      status: 'ACTIVA',
      currency: 'USD',
      interestRate: 24.5,
      expiryDate: '12/27'
    },
    {
      id: 'DC-005678',
      cardNumber: '**** **** **** 5678',
      type: 'Tarjeta de Débito',
      limit: 2000.00,
      available: 1850.00,
      used: 150.00,
      cutoffDate: 'N/A',
      paymentDate: 'N/A',
      minimumPayment: 0,
      status: 'ACTIVA',
      currency: 'USD',
      interestRate: 0,
      expiryDate: '08/26'
    },
    {
      id: 'CC-009876',
      cardNumber: '**** **** **** 9876',
      type: 'Tarjeta de Crédito Gold',
      limit: 5000.00,
      available: 3200.00,
      used: 1800.00,
      cutoffDate: '2024-02-20',
      paymentDate: '2024-03-05',
      minimumPayment: 180.00,
      status: 'ACTIVA',
      currency: 'USD',
      interestRate: 22.5,
      expiryDate: '09/26'
    },
    {
      id: 'CC-004321',
      cardNumber: '**** **** **** 4321',
      type: 'Tarjeta de Crédito Black',
      limit: 15000.00,
      available: 12500.00,
      used: 2500.00,
      cutoffDate: '2024-02-28',
      paymentDate: '2024-03-15',
      minimumPayment: 250.00,
      status: 'ACTIVA',
      currency: 'USD',
      interestRate: 19.8,
      expiryDate: '11/27'
    },
    {
      id: 'DC-007890',
      cardNumber: '**** **** **** 7890',
      type: 'Tarjeta de Débito Premium',
      limit: 3000.00,
      available: 2750.00,
      used: 250.00,
      cutoffDate: 'N/A',
      paymentDate: 'N/A',
      minimumPayment: 0,
      status: 'ACTIVA',
      currency: 'USD',
      interestRate: 0,
      expiryDate: '06/27'
    },
    {
      id: 'CC-003456',
      cardNumber: '**** **** **** 3456',
      type: 'Tarjeta de Crédito Empresarial',
      limit: 25000.00,
      available: 18500.00,
      used: 6500.00,
      cutoffDate: '2024-02-22',
      paymentDate: '2024-03-07',
      minimumPayment: 650.00,
      status: 'ACTIVA',
      currency: 'USD',
      interestRate: 18.5,
      expiryDate: '03/28'
    }
  ];

  // Datos simulados de transacciones
  const recentTransactions = [
    {
      id: 1,
      date: '2024-02-15',
      description: 'Supermercado Plaza',
      amount: 85.50,
      type: 'Compra',
      status: 'Procesada',
      reference: 'TXN-2024-001'
    },
    {
      id: 2,
      date: '2024-02-14',
      description: 'Gasolinera Shell',
      amount: 45.00,
      type: 'Compra',
      status: 'Procesada',
      reference: 'TXN-2024-002'
    },
    {
      id: 3,
      date: '2024-02-13',
      description: 'Pago Servicios Básicos',
      amount: 125.75,
      type: 'Pago',
      status: 'Procesada',
      reference: 'TXN-2024-003'
    },
    {
      id: 4,
      date: '2024-02-12',
      description: 'Restaurante Bella Vista',
      amount: 68.30,
      type: 'Compra',
      status: 'Procesada',
      reference: 'TXN-2024-004'
    },
    {
      id: 5,
      date: '2024-02-11',
      description: 'Farmacia San Juan',
      amount: 32.15,
      type: 'Compra',
      status: 'Procesada',
      reference: 'TXN-2024-005'
    }
  ];

  // Calcular paginación
  const totalPages = Math.ceil(cardProducts.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const currentCards = cardProducts.slice(startIndex, endIndex);

  const handleCardClick = (card) => {
    setSelectedCard(card);
    setShowDetails(true);
  };

  const downloadStatementPDF = () => {
    const link = document.createElement('a');
    link.href = '#';
    link.download = `estado_cuenta_${selectedCard.id}.pdf`;
    link.click();
    alert('Descargando estado de cuenta en PDF...');
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (showDetails && selectedCard) {
    return (
      <div className="min-h-full bg-blue-50">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => setShowDetails(false)}
              className="flex items-center space-x-3 text-gray-500 hover:text-white transition-colors group"
            >
              <div className="p-2 rounded-full bg-white/10 shadow-sm group-hover:shadow-md transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
                </svg>
              </div>
              <span className="font-medium">Volver a Tarjetas</span>
            </button>

            <div className="flex items-center space-x-3">
              <button className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg shadow-sm border border-gray-300 transition-colors">
                <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
                </svg>
              </button>
              <button 
                onClick={downloadStatementPDF}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                <span>Estado de Cuenta</span>
              </button>
            </div>
          </div>

          {/* Card Summary */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-300 mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-8 py-6">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h1 className="text-2xl font-bold mb-1">{selectedCard.type}</h1>
                  <p className="text-purple-100 font-mono text-lg">{selectedCard.cardNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-medium mb-1">
                    {selectedCard.type.includes('Crédito') ? 'Disponible' : 'Saldo Disponible'}
                  </p>
                  <p className="text-4xl font-bold">${selectedCard.available.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
            
            <div className="px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-500 font-medium mb-1">Número de Tarjeta</p>
                  <p className="font-bold text-black">{selectedCard.id}</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-500 font-medium mb-1">
                    {selectedCard.type.includes('Crédito') ? 'Límite Total' : 'Límite Diario'}
                  </p>
                  <p className="font-bold text-black">${selectedCard.limit.toFixed(2)}</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-500 font-medium mb-1">Vencimiento</p>
                  <p className="font-bold text-black">{selectedCard.expiryDate}</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-500 font-medium mb-1">Estado</p>
                  <span className="inline-flex px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-semibold border border-emerald-400/30">
                    {selectedCard.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions Table */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-300 overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-white/5 to-white/10 border-b border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">Transacciones Recientes</h2>
                  <p className="text-gray-600">Últimos movimientos de tu tarjeta</p>
                </div>
                <div className="flex items-center space-x-3">
                  <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white/10 text-white">
                    <option>Últimas 10 transacciones</option>
                    <option>Último mes</option>
                    <option>Últimos 3 meses</option>
                  </select>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6,2V8H6V8L10,12L6,16V16H6V22H8V16.42L12,12.42L16,16.42V22H18V16H18V16L14,12L18,8V8H18V2H16V7.58L12,11.58L8,7.58V2H6Z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Referencia</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-800">{transaction.date}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-800">{transaction.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 font-mono">{transaction.reference}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                          transaction.type === 'Compra' 
                            ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' 
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-bold ${
                          transaction.type === 'Compra' ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                          {transaction.type === 'Compra' ? '-' : '+'}${transaction.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-400/30">
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-8 py-4 bg-white/5 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-600">Mostrando {recentTransactions.length} transacciones recientes</p>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 border border-gray-300 rounded text-gray-500 hover:bg-white/5">Anterior</button>
                  <span className="px-3 py-1 bg-purple-600 text-white rounded">1</span>
                  <button className="px-3 py-1 border border-gray-300 rounded text-gray-500 hover:bg-white/5">Siguiente</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">💳</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Tarjetas</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Selecciona una tarjeta para ver sus transacciones recientes
          </p>
        </div>

       

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {currentCards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card)}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-300 hover:bg-white/15 transition-all duration-200 cursor-pointer group hover:shadow-xl hover:scale-105"
            >
              {/* Card Icon */}
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MdCreditCard className="text-white text-3xl" />
                </div>
              </div>

              {/* Card Type */}
              <h3 className="text-lg font-bold text-gray-800 text-center mb-2 group-hover:text-purple-600 transition-colors">
                {card.type}
              </h3>

              {/* Card Number */}
              <p className="text-gray-500 text-center font-mono text-sm mb-4">
                {card.cardNumber}
              </p>

              {/* Available Amount */}
              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-purple-400">
                  ${card.available.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">{card.currency} - Disponible</p>
              </div>

              {/* Card Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Límite:</span>
                  <span className="text-xs font-semibold text-purple-400">
                    ${card.limit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Usado:</span>
                  <span className="text-xs font-semibold text-orange-400">
                    ${card.used.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Estado:</span>
                  <span className="inline-flex px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-400/30">
                    {card.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Vence:</span>
                  <span className="text-xs text-gray-500">
                    {card.expiryDate}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPage === page
                  ? "bg-purple-600 text-white"
                  : "border border-gray-300 text-gray-500 hover:bg-white/5"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        </div>

        {/* Info de paginación */}
        <div className="text-center mb-8">
          <p className="text-gray-500 text-sm">
            Mostrando {startIndex + 1}-{Math.min(endIndex, cardProducts.length)} de {cardProducts.length} tarjetas
          </p>
        </div>

        {/* Services Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-300 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-white/5 to-white/10 border-b border-gray-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Servicios de Tarjetas</h2>
            <p className="text-gray-600">Acciones rápidas para gestionar tus tarjetas</p>
          </div>
          <div className="px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <button className="p-6 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-center group hover:shadow-md">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-red-500/30 transition-colors border border-red-400/30">
                  <svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-800">Bloquear Tarjeta</span>
              </button>
              <button className="p-6 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-center group hover:shadow-md">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-500/30 transition-colors border border-blue-400/30">
                  <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-800">Estado de Cuenta</span>
              </button>
              <button className="p-6 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-center group hover:shadow-md">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-500/30 transition-colors border border-emerald-400/30">
                  <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-800">Cambiar PIN</span>
              </button>
              <button className="p-6 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-center group hover:shadow-md">
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-500/30 transition-colors border border-orange-400/30">
                  <svg className="w-6 h-6 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z"/>
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-800">Aumentar Límite</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardsProductForm;