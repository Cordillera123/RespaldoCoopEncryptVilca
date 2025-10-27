// components/PerfilComponent.jsx
import React, { useState } from 'react';

const PerfilComponent = ({ userInfo }) => {
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    // Datos personales
    nombres: 'JUAN CARLOS',
    apellidos: 'RODRIGUEZ MARTINEZ',
    cedula: '1750456789',
    fechaNacimiento: '1985-03-15',
    genero: 'MASCULINO',
    estadoCivil: 'CASADO',
    nacionalidad: 'ECUATORIANA',
    
    // Datos de contacto
    telefono: '0987654321',
    celular: '0998765432',
    email: 'juan.rodriguez@email.com',
    
    // Dirección
    provincia: 'PICHINCHA',
    canton: 'QUITO',
    parroquia: 'LA MAGDALENA',
    direccion: 'AV. 6 DE DICIEMBRE N24-253 Y LIZARDO GARCIA',
    referencia: 'FRENTE AL PARQUE LA CAROLINA',
    
    // Datos laborales
    ocupacion: 'INGENIERO SISTEMAS',
    empresa: 'TECH SOLUTIONS CIA. LTDA.',
    cargo: 'GERENTE DE DESARROLLO',
    ingresosMensuales: 2850.00,
    tiempoLaboral: '5 AÑOS',
    
    // Datos financieros
    patrimonio: 125000.00,
    otrosIngresos: 450.00,
    gastosMensuales: 1800.00
  });

  const cliente = userInfo?.cliente?.[0] || {};

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Aquí iría la lógica para guardar los datos
    alert('Información actualizada correctamente');
    setEditMode(false);
  };

  const handleCancel = () => {
    // Resetear datos si se cancela
    setEditMode(false);
  };

  const downloadProfilePDF = () => {
    const link = document.createElement('a');
    link.href = '#';
    link.download = `perfil_cliente_${cliente.codcli || 'usuario'}.pdf`;
    link.click();
    alert('Descargando información de perfil en PDF...');
  };

  const tabs = [
    { id: 'personal', label: 'Datos Personales', icon: '👤' },
    { id: 'contacto', label: 'Contacto', icon: '📞' },
    { id: 'direccion', label: 'Dirección', icon: '🏠' },
    { id: 'laboral', label: 'Información Laboral', icon: '💼' },
    { id: 'financiero', label: 'Datos Financieros', icon: '💰' }
  ];

  return (
    <div className="p-6 h-full bg-gradient-to-br from-indigo-50 to-indigo-100 overflow-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-200 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">👤</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Mi Perfil</h1>
                <p className="text-gray-600">Información personal y datos de contacto</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              {editMode ? (
                <>
                  <button 
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Guardar
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={downloadProfilePDF}
                    className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    <span>Descargar PDF</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Cliente Info Card */}
          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Código Cliente</p>
                <p className="font-bold text-gray-800">{cliente.codcli || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Oficina</p>
                <p className="font-bold text-gray-800">{cliente.nomofi || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <span className="inline-flex px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  ACTIVO
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha Registro</p>
                <p className="font-bold text-gray-800">15/01/2020</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-lg border border-indigo-200 overflow-hidden mb-6">
          <div className="flex overflow-x-auto bg-indigo-50 border-b border-indigo-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-white'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Datos Personales */}
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombres</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.nombres}
                      onChange={(e) => handleInputChange('nombres', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">{formData.nombres}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.apellidos}
                      onChange={(e) => handleInputChange('apellidos', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">{formData.apellidos}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cédula</label>
                  <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">{formData.cedula}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento</label>
                  {editMode ? (
                    <input
                      type="date"
                      value={formData.fechaNacimiento}
                      onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">{formData.fechaNacimiento}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Género</label>
                  {editMode ? (
                    <select
                      value={formData.genero}
                      onChange={(e) => handleInputChange('genero', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="MASCULINO">MASCULINO</option>
                      <option value="FEMENINO">FEMENINO</option>
                    </select>
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">{formData.genero}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado Civil</label>
                  {editMode ? (
                    <select
                      value={formData.estadoCivil}
                      onChange={(e) => handleInputChange('estadoCivil', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="SOLTERO">SOLTERO</option>
                      <option value="CASADO">CASADO</option>
                      <option value="DIVORCIADO">DIVORCIADO</option>
                      <option value="VIUDO">VIUDO</option>
                      <option value="UNION LIBRE">UNION LIBRE</option>
                    </select>
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">{formData.estadoCivil}</p>
                  )}
                </div>
              </div>
            )}

            {/* Contacto */}
            {activeTab === 'contacto' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">{formData.telefono}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Celular</label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={formData.celular}
                      onChange={(e) => handleInputChange('celular', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">{formData.celular}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  {editMode ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">{formData.email}</p>
                  )}
                </div>
              </div>
            )}

            {/* Dirección */}
            {activeTab === 'direccion' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provincia</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.provincia}
                      onChange={(e) => handleInputChange('provincia', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">{formData.provincia}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cantón</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.canton}
                      onChange={(e) => handleInputChange('canton', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">{formData.canton}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Parroquia</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.parroquia}
                      onChange={(e) => handleInputChange('parroquia', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">{formData.parroquia}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                  {editMode ? (
                    <textarea
                      value={formData.direccion}
                      onChange={(e) => handleInputChange('direccion', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">{formData.direccion}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Referencia</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.referencia}
                      onChange={(e) => handleInputChange('referencia', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">{formData.referencia}</p>
                  )}
                </div>
              </div>
            )}

            {/* Información Laboral */}
            {activeTab === 'laboral' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ocupación</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.ocupacion}
                      onChange={(e) => handleInputChange('ocupacion', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">{formData.ocupacion}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Empresa</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.empresa}
                      onChange={(e) => handleInputChange('empresa', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">{formData.empresa}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.cargo}
                      onChange={(e) => handleInputChange('cargo', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">{formData.cargo}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tiempo Laboral</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.tiempoLaboral}
                      onChange={(e) => handleInputChange('tiempoLaboral', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">{formData.tiempoLaboral}</p>
                  )}
                </div>
              </div>
            )}

            {/* Datos Financieros */}
            {activeTab === 'financiero' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ingresos Mensuales</label>
                  {editMode ? (
                    <input
                      type="number"
                      step="0.01"
                      value={formData.ingresosMensuales}
                      onChange={(e) => handleInputChange('ingresosMensuales', parseFloat(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">${formData.ingresosMensuales.toLocaleString()}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Otros Ingresos</label>
                  {editMode ? (
                    <input
                      type="number"
                      step="0.01"
                      value={formData.otrosIngresos}
                      onChange={(e) => handleInputChange('otrosIngresos', parseFloat(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">${formData.otrosIngresos.toLocaleString()}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gastos Mensuales</label>
                  {editMode ? (
                    <input
                      type="number"
                      step="0.01"
                      value={formData.gastosMensuales}
                      onChange={(e) => handleInputChange('gastosMensuales', parseFloat(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">${formData.gastosMensuales.toLocaleString()}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Patrimonio</label>
                  {editMode ? (
                    <input
                      type="number"
                      step="0.01"
                      value={formData.patrimonio}
                      onChange={(e) => handleInputChange('patrimonio', parseFloat(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium bg-gray-50 px-4 py-2 rounded-lg">${formData.patrimonio.toLocaleString()}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Información de Seguridad */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Información de Seguridad</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-indigo-600 text-2xl">🔐</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Último Acceso</h3>
              <p className="text-gray-600 text-sm">Hoy, 09:30 AM</p>
              <p className="text-gray-500 text-xs">IP: 190.123.45.67</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 text-2xl">✅</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Verificación</h3>
              <p className="text-green-600 text-sm font-medium">Cuenta Verificada</p>
              <p className="text-gray-500 text-xs">Datos validados</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-yellow-600 text-2xl">🔑</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Contraseña</h3>
              <p className="text-gray-600 text-sm">Actualizada hace 30 días</p>
              <p className="text-yellow-600 text-xs">Se recomienda cambiarla</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 text-2xl">💰</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Monto Máximo</h3>
              <p className="text-blue-600 text-sm font-medium">$1,500.00</p>
              <p className="text-gray-500 text-xs">Límite diario de transferencias</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerfilComponent;