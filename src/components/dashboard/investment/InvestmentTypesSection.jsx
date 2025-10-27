import React from 'react';
import { MdCalculate, MdTrendingUp } from 'react-icons/md';

const InvestmentTypesSection = ({
  investmentTypes,
  typesLoading,
  showInvestmentTypes,
  typesError,
  loadInvestmentTypes,
  loadInvestmentTerms,
  plazosLoading
}) => {
  
  const formatAmount = (amount) => {
    const numAmount = parseFloat(amount);
    return isNaN(numAmount) ? '0.00' : numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 });
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-300 overflow-hidden">
      <div className="px-8 py-6 bg-gradient-to-r from-white/5 to-white/10 border-b border-gray-300">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Tipos de Inversión Disponibles</h2>
            <p className="text-gray-600">Explora nuestras opciones de inversión para hacer crecer tu patrimonio</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={loadInvestmentTerms}
              disabled={plazosLoading}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
            >
              <MdCalculate className="text-lg" />
              <span>{plazosLoading ? 'Cargando...' : 'Calculadora'}</span>
            </button>
            <button 
              onClick={loadInvestmentTypes}
              disabled={typesLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {typesLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Cargando...</span>
                </div>
              ) : (
                'Ver Tipos Disponibles'
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="px-8 py-6">
        {typesError ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Error al cargar tipos</h3>
            <p className="text-gray-600 mb-4">{typesError}</p>
            <button 
              onClick={loadInvestmentTypes}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : showInvestmentTypes && investmentTypes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {investmentTypes.map((tipo, index) => (
              <div key={index} className="border border-gray-300 rounded-lg p-6 hover:bg-white/5 transition-colors group">
                <h3 className="font-bold text-gray-800 mb-4 text-center text-lg group-hover:text-indigo-600 transition-colors">
                  {tipo.des_tinve}
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500 font-medium">Plazo:</span>
                    <span className="text-gray-800 font-semibold">
                      {tipo.plz_minim} - {tipo.plz_maxim} días
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500 font-medium">Monto mínimo:</span>
                    <span className="text-gray-800 font-semibold">
                      ${formatAmount(tipo.mnt_minim)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500 font-medium">Monto máximo:</span>
                    <span className="text-gray-800 font-semibold">
                      ${formatAmount(tipo.mnt_maxim)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-1">
                    <span className="text-gray-500 font-medium">Tasa:</span>
                    <span className="text-emerald-600 font-bold text-base">
                      {tipo.tas_minim}% - {tipo.tas_maxim}%
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md">
                    Más Información
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : showInvestmentTypes ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdTrendingUp className="text-gray-400 text-2xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay tipos disponibles</h3>
            <p className="text-gray-500">No se encontraron tipos de inversión en este momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-400/30">
                <svg className="w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6Z"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Bajo Riesgo</h3>
              <p className="text-gray-600">Depósitos a plazo fijo y certificados con rentabilidad garantizada</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-400/30">
                <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Riesgo Moderado</h3>
              <p className="text-gray-600">Fondos mutuos mixtos que combinan renta fija y variable</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-400/30">
                <svg className="w-8 h-8 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z"/>
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Alto Rendimiento</h3>
              <p className="text-gray-600">Fondos de inversión especializados con mayor potencial de ganancia</p>
            </div>
          </div>
        )}
        
        {!showInvestmentTypes && !typesLoading && (
          <div className="mt-8 text-center">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow-md">
              Solicitar Asesoría de Inversión
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentTypesSection;