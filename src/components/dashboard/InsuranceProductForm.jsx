import React, { useState } from 'react';
import { MdSecurity } from 'react-icons/md';

const InsuranceProductForm = () => {
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const insurancePerPage = 4;

  // Datos simulados de seguros (expandidos para demostrar paginación)
  const insuranceProducts = [
    {
      id: 'SEG-001',
      type: 'Seguro de Vida',
      coverage: 50000.00,
      premium: 85.50,
      status: 'VIGENTE',
      expiryDate: '2024-12-31',
      policyNumber: '**** **** **** 0001',
      currency: 'USD',
      nextPaymentDate: '2024-08-15',
      beneficiaries: 'Cónyuge e hijos',
      deductible: 0
    },
    {
      id: 'SEG-002',
      type: 'Seguro Vehicular',
      coverage: 25000.00,
      premium: 125.30,
      status: 'VIGENTE',
      expiryDate: '2024-08-15',
      policyNumber: '**** **** **** 0002',
      currency: 'USD',
      nextPaymentDate: '2024-08-10',
      beneficiaries: 'Propietario del vehículo',
      deductible: 500.00
    },
    {
      id: 'SEG-003',
      type: 'Seguro de Hogar',
      coverage: 120000.00,
      premium: 95.75,
      status: 'VIGENTE',
      expiryDate: '2024-10-20',
      policyNumber: '**** **** **** 0003',
      currency: 'USD',
      nextPaymentDate: '2024-08-20',
      beneficiaries: 'Propietario',
      deductible: 1000.00
    },
    {
      id: 'SEG-004',
      type: 'Seguro Médico',
      coverage: 75000.00,
      premium: 180.50,
      status: 'VIGENTE',
      expiryDate: '2024-11-30',
      policyNumber: '**** **** **** 0004',
      currency: 'USD',
      nextPaymentDate: '2024-08-25',
      beneficiaries: 'Familia',
      deductible: 250.00
    },
    {
      id: 'SEG-005',
      type: 'Seguro de Viaje',
      coverage: 15000.00,
      premium: 35.25,
      status: 'VIGENTE',
      expiryDate: '2024-09-15',
      policyNumber: '**** **** **** 0005',
      currency: 'USD',
      nextPaymentDate: '2024-08-15',
      beneficiaries: 'Asegurado',
      deductible: 100.00
    },
    {
      id: 'SEG-006',
      type: 'Seguro Empresarial',
      coverage: 200000.00,
      premium: 320.80,
      status: 'VIGENTE',
      expiryDate: '2024-12-15',
      policyNumber: '**** **** **** 0006',
      currency: 'USD',
      nextPaymentDate: '2024-08-30',
      beneficiaries: 'Empresa',
      deductible: 2500.00
    }
  ];

  // Datos simulados de cobertura detallada
  const coverageDetails = [
    {
      id: 1,
      coverage: 'Muerte por Accidente',
      amount: 50000.00,
      status: 'Activa',
      description: 'Cobertura completa por muerte accidental'
    },
    {
      id: 2,
      coverage: 'Invalidez Permanente',
      amount: 25000.00,
      status: 'Activa',
      description: 'Indemnización por invalidez permanente total'
    },
    {
      id: 3,
      coverage: 'Gastos Médicos',
      amount: 5000.00,
      status: 'Activa',
      description: 'Reembolso de gastos médicos por accidente'
    },
    {
      id: 4,
      coverage: 'Gastos Funerarios',
      amount: 3000.00,
      status: 'Activa',
      description: 'Cobertura de gastos funerarios'
    }
  ];

  // Calcular paginación
  const totalPages = Math.ceil(insuranceProducts.length / insurancePerPage);
  const startIndex = (currentPage - 1) * insurancePerPage;
  const endIndex = startIndex + insurancePerPage;
  const currentInsurances = insuranceProducts.slice(startIndex, endIndex);

  const handleInsuranceClick = (insurance) => {
    setSelectedInsurance(insurance);
    setShowDetails(true);
  };

  const downloadPolicyPDF = () => {
    const link = document.createElement('a');
    link.href = '#';
    link.download = `poliza_seguro_${selectedInsurance.id}.pdf`;
    link.click();
    alert('Descargando póliza de seguro en PDF...');
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (showDetails && selectedInsurance) {
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
              <span className="font-medium">Volver a Seguros</span>
            </button>

            <div className="flex items-center space-x-3">
              <button className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg shadow-sm border border-gray-300 transition-colors">
                <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
                </svg>
              </button>
              <button 
                onClick={downloadPolicyPDF}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                <span>Exportar Póliza</span>
              </button>
            </div>
          </div>

          {/* Insurance Summary Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-300 mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h1 className="text-2xl font-bold mb-1">{selectedInsurance.type}</h1>
                  <p className="text-green-100 font-mono text-lg">{selectedInsurance.policyNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-100 text-sm font-medium mb-1">Cobertura Total</p>
                  <p className="text-4xl font-bold">${selectedInsurance.coverage.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
            
            <div className="px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-500 font-medium mb-1">Póliza</p>
                  <p className="font-bold text-black">{selectedInsurance.id}</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-500 font-medium mb-1">Prima Mensual</p>
                  <p className="font-bold text-black">${selectedInsurance.premium.toFixed(2)}</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-500 font-medium mb-1">Vencimiento</p>
                  <p className="font-bold text-black">{selectedInsurance.expiryDate}</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-sm text-gray-500 font-medium mb-1">Estado</p>
                  <span className="inline-flex px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-semibold border border-emerald-400/30">
                    {selectedInsurance.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Coverage Details Table */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-300 overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-white/5 to-white/10 border-b border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">Detalles de Cobertura</h2>
                  <p className="text-gray-600">Coberturas incluidas en tu póliza de seguro</p>
                </div>
                <div className="flex items-center space-x-3">
                  <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white/10 text-white">
                    <option>Todas las coberturas</option>
                    <option>Solo activas</option>
                    <option>Por monto</option>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo de Cobertura</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto Asegurado</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {coverageDetails.map((coverage) => (
                    <tr key={coverage.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-400/30">
                            <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,16.6 15.6,17 15,17H9C8.4,17 8,16.6 8,16V13C8,12.4 8.4,11.5 9,11.5V10C9,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.2,8.7 10.2,10V11.5H13.8V10C13.8,8.7 12.8,8.2 12,8.2Z"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800">{coverage.coverage}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <p className="text-sm text-gray-600">{coverage.description}</p>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <span className="text-lg font-bold text-emerald-400">
                          ${coverage.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span className="inline-flex px-3 py-1 text-sm font-medium bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-400/30">
                          {coverage.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-8 py-4 bg-white/5 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-600">Mostrando {coverageDetails.length} coberturas activas</p>
                <div className="flex items-center space-x-4">
                  <p className="text-gray-600">Total asegurado: <span className="font-bold text-emerald-400">${coverageDetails.reduce((sum, item) => sum + item.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></p>
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
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-3xl font-bold">🛡️</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Seguros</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Selecciona un seguro para ver sus detalles de cobertura
          </p>
        </div>

        
        {/* Insurance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {currentInsurances.map((insurance) => (
            <div
              key={insurance.id}
              onClick={() => handleInsuranceClick(insurance)}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-300 hover:bg-white/15 transition-all duration-200 cursor-pointer group hover:shadow-xl hover:scale-105"
            >
              {/* Insurance Icon */}
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MdSecurity className="text-white text-3xl" />
                </div>
              </div>

              {/* Insurance Type */}
              <h3 className="text-lg font-bold text-gray-800 text-center mb-2 group-hover:text-green-600 transition-colors">
                {insurance.type}
              </h3>

              {/* Policy Number */}
              <p className="text-gray-500 text-center font-mono text-sm mb-4">
                {insurance.policyNumber}
              </p>

              {/* Coverage Amount */}
              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-green-400">
                  ${insurance.coverage.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">{insurance.currency} - Cobertura</p>
              </div>

              {/* Insurance Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Prima:</span>
                  <span className="text-xs font-semibold text-green-400">
                    ${insurance.premium.toFixed(2)}/mes
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Deducible:</span>
                  <span className="text-xs font-semibold text-orange-400">
                    ${insurance.deductible.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Estado:</span>
                  <span className="inline-flex px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-400/30">
                    {insurance.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Vence:</span>
                  <span className="text-xs text-gray-500">
                    {insurance.expiryDate}
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
                  ? "bg-green-600 text-white"
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
            Mostrando {startIndex + 1}-{Math.min(endIndex, insuranceProducts.length)} de {insuranceProducts.length} seguros
          </p>
        </div>

        {/* Benefits Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-300 overflow-hidden">
          <div className="px-8 py-6 bg-gradient-to-r from-white/5 to-white/10 border-b border-gray-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Beneficios de tus Seguros</h2>
            <p className="text-gray-600">Ventajas y servicios incluidos en tus pólizas</p>
          </div>
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-400/30">
                  <svg className="w-8 h-8 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1Z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Cobertura Amplia</h3>
                <p className="text-gray-600">Protección integral para ti y tu familia en todas las situaciones</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-400/30">
                  <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Pago Rápido</h3>
                <p className="text-gray-600">Siniestros procesados y pagados en 24-48 horas hábiles</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-400/30">
                  <svg className="w-8 h-8 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H5C3.89,1 3,1.89 3,3V21A2,2 0 0,0 5,23H19A2,2 0 0,0 21,21V9Z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Asistencia 24/7</h3>
                <p className="text-gray-600">Atención telefónica disponible las 24 horas, todos los días del año</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceProductForm;