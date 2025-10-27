import React from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  startIndex, 
  endIndex, 
  totalItems, 
  investmentsPerPage 
}) => {
  if (totalPages <= 1) return null;

  return (
    <>
      {/* Pagination */}
      <div className="flex items-center justify-center space-x-2 mb-8">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentPage === page
                ? "bg-indigo-600 text-white"
                : "border border-gray-300 text-gray-500 hover:bg-white/5"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-500 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
        </button>
      </div>

      {/* Info de paginación */}
      <div className="text-center mb-8">
        <p className="text-gray-500 text-sm">
          Mostrando {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems} inversiones
        </p>
      </div>
    </>
  );
};

export default Pagination;