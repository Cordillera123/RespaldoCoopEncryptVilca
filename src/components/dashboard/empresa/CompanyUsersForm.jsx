// src/components/dashboard/empresa/CompanyUsersForm.jsx
import React, { useState } from 'react';

const CompanyUsersForm = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'Ana Martínez', email: 'ana.martinez@empresa.com', role: 'Administrador', status: 'Activo', lastLogin: '2024-11-25 09:30' },
    { id: 2, name: 'Roberto Silva', email: 'roberto.silva@empresa.com', role: 'Operador', status: 'Activo', lastLogin: '2024-11-25 08:15' },
    { id: 3, name: 'Carmen Ruiz', email: 'carmen.ruiz@empresa.com', role: 'Consulta', status: 'Inactivo', lastLogin: '2024-11-20 16:45' },
  ]);

  const [showAddUser, setShowAddUser] = useState(false);

  return (
    <div className="p-8 h-full bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">👥</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Gestión de Usuarios Empresariales</h2>
          <p className="text-gray-600">Administra los usuarios con acceso al sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-indigo-600">{users.length}</div>
            <div className="text-sm text-gray-700">Total Usuarios</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{users.filter(u => u.status === 'Activo').length}</div>
            <div className="text-sm text-gray-700">Activos</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">{users.filter(u => u.role === 'Administrador').length}</div>
            <div className="text-sm text-gray-700">Administradores</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'Operador').length}</div>
            <div className="text-sm text-gray-700">Operadores</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">Usuarios del Sistema</h3>
              <button
                onClick={() => setShowAddUser(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Agregar Usuario
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-700">Nombre</th>
                  <th className="text-left p-4 font-medium text-gray-700">Email</th>
                  <th className="text-left p-4 font-medium text-gray-700">Rol</th>
                  <th className="text-center p-4 font-medium text-gray-700">Estado</th>
                  <th className="text-left p-4 font-medium text-gray-700">Último Acceso</th>
                  <th className="text-center p-4 font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-indigo-600 font-semibold text-sm">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.role === 'Administrador' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'Operador' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{user.lastLogin}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">Editar</button>
                        <button className="text-red-600 hover:text-red-800 text-sm">Desactivar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal para agregar usuario */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Agregar Nuevo Usuario</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <option>Consulta</option>
                    <option>Operador</option>
                    <option>Administrador</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Agregar Usuario
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyUsersForm;