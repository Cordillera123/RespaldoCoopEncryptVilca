import React, { useState } from 'react';
import { MdDateRange, MdSearch } from 'react-icons/md';

const InvestmentDetail = ({
  selectedInvestment,
  investmentDetail,
  detailLoading,
  dateFilters,
  searchFilter,
  setSearchFilter,
  onBack,
  loadInvestmentDetail
}) => {

  const [localDateFilters, setLocalDateFilters] = useState(dateFilters);

  // Funciones auxiliares
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const [month, day, year] = dateString.split('/');
    return `${day}/${month}/${year}`;
  };

  const applyDateFilters = () => {
    if (selectedInvestment) {
      loadInvestmentDetail(selectedInvestment);
    }
  };

  const handleDateFilterChange = (field, value) => {
    setLocalDateFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleCustomDates = () => {
    setLocalDateFilters(prev => ({
      ...prev,
      showCustomDates: !prev.showCustomDates
    }));
  };

  const setDateRange = (days) => {
    const today = new Date();
    const startDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const formatDate = (date) => {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    const newFilters = {
      fechaDesde: formatDate(startDate),
      fechaHasta: formatDate(today),
      showCustomDates: false
    };

    setLocalDateFilters(newFilters);
    
    if (selectedInvestment) {
      loadInvestmentDetail(selectedInvestment, newFilters.fechaDesde, newFilters.fechaHasta);
    }
  };

  const getFilteredMovements = () => {
    if (!investmentDetail?.movimientos || !Array.isArray(investmentDetail.movimientos)) {
      return [];
    }

    if (!searchFilter.trim()) {
      return investmentDetail.movimientos;
    }

    const searchTerm = searchFilter.toLowerCase();
    return investmentDetail.movimientos.filter(movement => 
      movement.descripcion?.toLowerCase().includes(searchTerm) ||
      movement.numeroDocumento?.toLowerCase().includes(searchTerm) ||
      movement.tipoTransaccion?.toLowerCase().includes(searchTerm) ||
      movement.fechaFormateada?.toLowerCase().includes(searchTerm) ||
      movement.valorCredito?.toString().includes(searchTerm) ||
      movement.valorDebito?.toString().includes(searchTerm)
    );
  };

  const clearSearchFilter = () => {
    setSearchFilter('');
  };

  const downloadInvestmentPDF = () => {
    const link = document.createElement('a');
    link.href = '#';
    link.download = `detalle_inversion_${selectedInvestment.code}.pdf`;
    link.click();
    alert('Descargando detalle de inversión en PDF...');
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div className="min-h-full bg-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handleBack}
            className="flex items-center space-x-3 text-gray-500 hover:text-gray-700 transition-colors group"
          >
            <div className="p-2 rounded-full bg-white/10 shadow-sm group-hover:shadow-md transition-all">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
              </svg>
            </div>
            <span className="font-medium">Volver a Inversiones</span>
          </button>

          <div className="flex items-center space-x-3">
            <button className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg shadow-sm border border-gray-300 transition-colors">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
              </svg>
            </button>
            
          </div>
        </div>

        {/* RESUMEN DE INVERSIÓN */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-300 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
            <div className="flex items-center justify-between text-white">
              <div>
                <h1 className="text-2xl font-bold mb-1">
                  {investmentDetail?.inversion?.tipoInversion || selectedInvestment.type}
                </h1>
                <p className="text-indigo-100 font-mono text-lg">
                  **** **** **** {(investmentDetail?.inversion?.codigo || selectedInvestment.code)?.slice(-4)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-indigo-100 text-sm font-medium mb-1">Monto Invertido</p>
                <p className="text-4xl font-bold">
                  ${(investmentDetail?.inversion?.saldoContable || selectedInvestment.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
          
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <p className="text-sm text-gray-500 font-medium mb-1">Código</p>
                <p className="font-bold text-black">
                  {investmentDetail?.inversion?.codigo || selectedInvestment.code}
                </p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <p className="text-sm text-gray-500 font-medium mb-1">Tasa de Rendimiento</p>
                <p className="font-bold text-black">
                  {investmentDetail?.inversion?.tasaInteres || selectedInvestment.interestRate}% anual
                </p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <p className="text-sm text-gray-500 font-medium mb-1">Fecha de Vencimiento</p>
                <p className="font-bold text-black">
                  {investmentDetail?.inversion?.fechaVencimiento || selectedInvestment.maturityDate}
                </p>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <p className="text-sm text-gray-500 font-medium mb-1">Estado</p>
                <span className="inline-flex px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-semibold border border-emerald-400/30">
                  {investmentDetail?.inversion?.estado || selectedInvestment.status}
                </span>
              </div>
            </div>
            
            {/* Información adicional de la inversión */}
            {investmentDetail?.inversion && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium mb-1">Saldo Disponible</p>
                  <p className="text-xl font-bold text-blue-800">
                    ${investmentDetail.inversion.saldoDisponible.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-sm text-green-600 font-medium mb-1">Rendimiento Esperado</p>
                  <p className="text-xl font-bold text-green-800">
                    ${investmentDetail.inversion.rendimientoEsperado?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FILTROS DE FECHA */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-300 mb-8 overflow-hidden">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <MdDateRange className="text-indigo-600 text-xl" />
                <h3 className="text-lg font-bold text-gray-800">Filtros de Fecha</h3>
              </div>
              <button 
                onClick={toggleCustomDates}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                {localDateFilters.showCustomDates ? 'Usar rangos predefinidos' : 'Fechas personalizadas'}
              </button>
            </div>

            {!localDateFilters.showCustomDates ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button 
                  onClick={() => setDateRange(30)}
                  className="py-2 px-4 bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                >
                  Últimos 30 días
                </button>
                <button 
                  onClick={() => setDateRange(90)}
                  className="py-2 px-4 bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                >
                  Últimos 3 meses
                </button>
                <button 
                  onClick={() => setDateRange(180)}
                  className="py-2 px-4 bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                >
                  Últimos 6 meses
                </button>
                <button 
                  onClick={() => setDateRange(365)}
                  className="py-2 px-4 bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                >
                  Último año
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Desde</label>
                  <input
                    type="date"
                    value={localDateFilters.fechaDesde ? formatDateForDisplay(localDateFilters.fechaDesde).split('/').reverse().join('-') : ''}
                    onChange={(e) => {
                      const [year, month, day] = e.target.value.split('-');
                      handleDateFilterChange('fechaDesde', `${month}/${day}/${year}`);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Hasta</label>
                  <input
                    type="date"
                    value={localDateFilters.fechaHasta ? formatDateForDisplay(localDateFilters.fechaHasta).split('/').reverse().join('-') : ''}
                    onChange={(e) => {
                      const [year, month, day] = e.target.value.split('-');
                      handleDateFilterChange('fechaHasta', `${month}/${day}/${year}`);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={applyDateFilters}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <MdSearch className="text-lg" />
                      <span>Filtrar</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Mostrar período actual */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">Período consultado:</span>
                <span className="font-semibold text-blue-800">
                  {formatDateForDisplay(localDateFilters.fechaDesde)} - {formatDateForDisplay(localDateFilters.fechaHasta)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TABLA DE MOVIMIENTOS */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-300 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-white/5 to-white/10 border-b border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Historial de Rendimientos</h2>
                <p className="text-gray-600">Movimientos y ganancias de tu inversión</p>
              </div>
              
              {/* CAMPO DE BÚSQUEDA */}
              {investmentDetail?.movimientos?.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Buscar en movimientos..."
                      className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none bg-white/80"
                    />
                    <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                    {searchFilter && (
                      <button
                        onClick={clearSearchFilter}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  {searchFilter && (
                    <span className="text-sm text-gray-600">
                      {getFilteredMovements().length} de {investmentDetail.movimientos.length} movimientos
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {detailLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : investmentDetail?.movimientos?.length > 0 ? (
            <>
              {getFilteredMovements().length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Documento</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Crédito</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Débito</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {getFilteredMovements().map((movement) => (
                        <tr key={movement.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-800">
                              {movement.fechaFormateada || movement.fecha}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-2 h-2 rounded-full ${movement.esGanancia ? 'bg-emerald-400' : movement.valorDebito > 0 ? 'bg-red-400' : 'bg-gray-400'}`}></div>
                              <div className="text-sm font-medium text-gray-800">{movement.descripcion}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 font-mono">{movement.numeroDocumento}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                              movement.esGanancia 
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' 
                                : movement.valorDebito > 0
                                ? 'bg-red-500/20 text-red-300 border-red-400/30'
                                : 'bg-gray-500/20 text-gray-300 border-gray-400/30'
                            }`}>
                              {movement.tipoTransaccion || (movement.esGanancia ? 'Efect' : movement.valorDebito > 0 ? 'Débito' : 'Saldo')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm font-semibold text-emerald-400">
                              {movement.valorCredito > 0 ? `${movement.valorCredito.toFixed(4)}` : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm font-semibold text-red-400">
                              {movement.valorDebito > 0 ? `${movement.valorDebito.toFixed(4)}` : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-sm font-bold text-gray-800">
                              ${movement.saldo.toFixed(4)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MdSearch className="w-8 h-8 text-yellow-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Sin resultados de búsqueda</h3>
                  <p className="text-gray-500 mb-4">No se encontraron movimientos que coincidan con "{searchFilter}"</p>
                  <button
                    onClick={clearSearchFilter}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Limpiar filtro
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,3H5C3.9,3 3,3.9 3,5V19C3,20.1 3.9,21 5,21H19C20.1,21 21,20.1 21,19V5C21,3.9 20.1,3 19,3M19,19H5V5H19V19Z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Sin movimientos en este período</h3>
              <p className="text-gray-500">No se encontraron movimientos en el rango de fechas seleccionado</p>
            </div>
          )}

          {/* Resumen de movimientos */}
          {investmentDetail?.movimientos?.length > 0 && (
            <div className="px-8 py-4 bg-white/5 border-t border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-600">Total Movimientos</p>
                  <p className="font-bold text-gray-800">{investmentDetail.movimientos.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Total Créditos</p>
                  <p className="font-bold text-emerald-600">
                    ${investmentDetail.estadisticas?.totalCreditos?.toFixed(4) || '0.0000'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Total Débitos</p>
                  <p className="font-bold text-red-600">
                    ${investmentDetail.estadisticas?.totalDebitos?.toFixed(4) || '0.0000'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Saldo Actual</p>
                  <p className="font-bold text-indigo-600">
                    ${investmentDetail.estadisticas?.saldoActual?.toFixed(4) || '0.0000'}
                  </p>
                </div>
              </div>
              
              {/* Información adicional del cliente */}
              {investmentDetail?.cliente && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Cliente</p>
                      <p className="font-semibold text-gray-800">{investmentDetail.cliente.nombreCompleto}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Oficina</p>
                      <p className="font-semibold text-gray-800">{investmentDetail.cliente.nombreOficina}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestmentDetail;