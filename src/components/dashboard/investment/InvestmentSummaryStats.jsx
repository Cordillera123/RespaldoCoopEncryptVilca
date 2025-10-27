import React from 'react';

const InvestmentSummaryStats = ({ investments }) => {
  const totalAmount = investments.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-gray-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Inversiones</p>
            <p className="text-2xl font-bold text-gray-800">{investments.length}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6"/>
            </svg>
          </div>
        </div>
      </div>
      
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-gray-300">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Monto Total</p>
            <p className="text-2xl font-bold text-gray-800">
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentSummaryStats;