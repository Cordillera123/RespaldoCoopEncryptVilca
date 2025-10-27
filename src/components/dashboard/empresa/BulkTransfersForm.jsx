// src/components/dashboard/empresa/BulkTransfersForm.jsx
import React, { useState } from 'react';

const BulkTransfersForm = () => {
  const [transfers, setTransfers] = useState([
    { id: 1, account: '1234567890', name: 'Juan Pérez', amount: 1250.00, concept: 'Salario Noviembre' },
    { id: 2, account: '1234567891', name: 'María González', amount: 1400.00, concept: 'Salario Noviembre' },
    { id: 3, account: '1234567892', name: 'Carlos López', amount: 1180.00, concept: 'Salario Noviembre' },
  ]);

  const totalAmount = transfers.reduce((sum, transfer) => sum + transfer.amount, 0);

  return (
    <div className="p-8 h-full bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">📋</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Transferencias Masivas</h2>
          <p className="text-gray-600">Procesa múltiples transferencias simultáneamente</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{transfers.length}</div>
            <div className="text-sm text-gray-700">Transferencias</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">${totalAmount.toFixed(2)}</div>
            <div className="text-sm text-gray-700">Monto Total</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">Pendiente</div>
            <div className="text-sm text-gray-700">Estado</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">Hoy</div>
            <div className="text-sm text-gray-700">Fecha Proceso</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">Lista de Transferencias</h3>
              <div className="space-x-2">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Importar CSV
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Procesar Todo
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-700">Cuenta</th>
                  <th className="text-left p-4 font-medium text-gray-700">Beneficiario</th>
                  <th className="text-right p-4 font-medium text-gray-700">Monto</th>
                  <th className="text-left p-4 font-medium text-gray-700">Concepto</th>
                  <th className="text-center p-4 font-medium text-gray-700">Estado</th>
                  <th className="text-center p-4 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer) => (
                  <tr key={transfer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-mono text-sm">{transfer.account}</td>
                    <td className="p-4">{transfer.name}</td>
                    <td className="p-4 text-right font-semibold">${transfer.amount.toFixed(2)}</td>
                    <td className="p-4 text-sm text-gray-600">{transfer.concept}</td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        Pendiente
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button className="text-blue-600 hover:text-blue-800 mr-2">Editar</button>
                      <button className="text-red-600 hover:text-red-800">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkTransfersForm;