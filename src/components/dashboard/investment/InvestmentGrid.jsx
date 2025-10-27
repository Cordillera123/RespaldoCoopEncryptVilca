import React from 'react';
import { MdTrendingUp } from 'react-icons/md';

const InvestmentGrid = ({ currentInvestments, handleInvestmentClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {currentInvestments.map((investment) => (
        <div
          key={investment.id}
          onClick={() => handleInvestmentClick(investment)}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-300 hover:bg-white/15 transition-all duration-200 cursor-pointer group hover:shadow-xl hover:scale-105"
        >
          {/* Investment Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <MdTrendingUp className="text-white text-3xl" />
            </div>
          </div>

          {/* Investment Type */}
          <h3 className="text-lg font-bold text-gray-800 text-center mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
            {investment.type}
          </h3>

          {/* Investment Number */}
          <p className="text-gray-500 text-center font-mono text-sm mb-4">
            {investment.investmentNumber}
          </p>

          {/* Investment Amount */}
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-indigo-400">
              ${investment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500">{investment.currency} - Invertido</p>
          </div>

          {/* Investment Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Rentabilidad:</span>
              <span className="text-xs font-semibold text-emerald-400">
                {investment.interestRate}% anual
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Plazo:</span>
              <span className="text-xs font-semibold text-indigo-400">
                {investment.term}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Estado:</span>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                investment.status === 'VIGENTE' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
              }`}>
                {investment.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Vence:</span>
              <span className="text-xs text-gray-500">
                {investment.maturityDate}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InvestmentGrid;