import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';
import { getMenuByUserType, addServicesToMenu } from '../../config/menuConfig';
import logosidebar from '/assets/images/logolasnaves_c.png';

const Sidebar = ({ userInfo, onMenuClick, onLogout }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState({});
  const [serviciosAvailable, setServiciosAvailable] = useState(false);
  const [serviciosLoading, setServiciosLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [tipoUsuario, setTipoUsuario] = useState('unknown');
  const [showUserTypeInfo, setShowUserTypeInfo] = useState(false);

  const cliente = userInfo?.cliente?.[0] || {};

  // Detectar tipo de usuario y cargar menú correspondiente
  useEffect(() => {
    if (userInfo) {
      const userType = apiService.getUserType();
      console.log('🏢 [SIDEBAR] Tipo de usuario detectado:', userType);
      setTipoUsuario(userType);
      
      // Cargar menú base según tipo de usuario
      const baseMenu = getMenuByUserType(userType);
      setMenuItems(baseMenu);
      
      // Verificar servicios disponibles
      checkServiciosAvailability();
    }
  }, [userInfo]);

  // Agregar servicios al menú cuando estén disponibles
  useEffect(() => {
    if (menuItems.length > 0) {
      const updatedMenu = addServicesToMenu(menuItems, serviciosAvailable);
      if (updatedMenu.length !== menuItems.length) {
        setMenuItems(updatedMenu);
      }
    }
  }, [serviciosAvailable, serviciosLoading]);

  const checkServiciosAvailability = async () => {
    console.log('🏪 [SIDEBAR] Verificando disponibilidad de servicios...');
    setServiciosLoading(true);
    
    try {
      const result = await apiService.validateFacilitoAccess();
      setServiciosAvailable(result.success);
      console.log('🔍 [SIDEBAR] Resultado completo:', result);
      console.log('✅ [SIDEBAR] Servicios disponibles:', result.success);
      
      if (!result.success) {
        console.log('❌ [SIDEBAR] Razón del fallo:', result.error?.message);
      }
    } catch (error) {
      console.error('❌ [SIDEBAR] Error verificando servicios:', error);
      setServiciosAvailable(false);
    } finally {
      setServiciosLoading(false);
    }
  };

  // Los menuItems ahora se cargan dinámicamente en el useEffect

  const handleMenuClick = (item) => {
    if (item.hasSubmenu) {
      setExpandedMenus(prev => ({
        ...prev,
        [item.id]: !prev[item.id]
      }));
    } else {
      setActiveSection(item.id);
      onMenuClick?.(item);
    }
  };

  const handleSubmenuClick = (parentItem, subItem) => {
    setActiveSection(subItem.id);
    onMenuClick?.({
      ...subItem,
      title: `${parentItem.label} - ${subItem.label}`
    });
  };

  // Función para colores metálicos premium
  const getColorClasses = (color) => {
    const colors = {
      gold: {
        bg: 'bg-gray-800',
        text: 'text-gray-300',
        hover: 'hover:bg-gray-700/20',
        accent: 'bg-yellow-500',
        shine: 'from-yellow-400/20 to-yellow-600/20'
      },
      copper: {
        bg: 'bg-gray-800',
        text: 'text-gray-300',
        hover: 'hover:bg-gray-700/20',
        accent: 'bg-orange-500',
        shine: 'from-orange-400/20 to-orange-600/20'
      },
      platinum: {
        bg: 'bg-gray-800',
        text: 'text-gray-300', 
        hover: 'hover:bg-gray-700/20',
        accent: 'bg-gray-400',
        shine: 'from-gray-300/20 to-gray-500/20'
      },
      silver: {
        bg: 'bg-gray-800',
        text: 'text-gray-300',
        hover: 'hover:bg-gray-700/20',
        accent: 'bg-gray-500',
        shine: 'from-gray-400/20 to-gray-600/20'
      },
      bronze: {
        bg: 'bg-gray-800',
        text: 'text-gray-300',
        hover: 'hover:bg-gray-700/20',
        accent: 'bg-amber-600',
        shine: 'from-amber-500/20 to-amber-700/20'
      }
    };
    return colors[color] || colors.gold;
  };

  return (
    <div className="w-64 bg-white text-gray-800 flex flex-col shadow-lg h-screen overflow-hidden border-r border-gray-200">
      {/* Brand Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center">
            <img 
              src={logosidebar} 
              alt="Las Naves - Cooperativa de Ahorro y Crédito" 
              className="h-20 w-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-3 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => handleMenuClick(item)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all duration-200 group ${
                  activeSection === item.id
                    ? 'bg-sky-50 text-sky-600 font-semibold'
                    : 'text-gray-600 hover:bg-sky-50 hover:text-sky-700'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    activeSection === item.id 
                      ? 'bg-sky-100 text-sky-600' 
                      : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700'
                  }`}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d={item.icon}/>
                    </svg>
                  </div>
                  <span className="font-medium text-sm">{item.label}</span>
                  {/* Indicador de carga para servicios */}
                  {item.id === 'services' && serviciosLoading && (
                    <div className="w-3 h-3 border border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
                  )}
                </div>
                {item.hasSubmenu && (
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${
                      expandedMenus[item.id] ? 'rotate-180' : ''
                    }`} 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M7,10L12,15L17,10H7Z"/>
                  </svg>
                )}
              </button>

              {/* Submenu */}
              {item.hasSubmenu && expandedMenus[item.id] && (
                <div className="mt-2 ml-1 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  {(item.id === 'products' || item.id === 'transfers' || item.id === 'profile' || item.id === 'services') ? (
                    // Grid design for specific submenus
                    <div className={`grid gap-2 p-2 bg-gray-50/80 rounded-lg ${
                      item.id === 'products' ? 'grid-cols-2' : 
                      item.id === 'profile' ? 'grid-cols-2' : 
                      item.id === 'services' ? 'grid-cols-2' :
                      'grid-cols-2'
                    }`}>
                      {item.submenu.map((subItem) => {
                        return (
                          <button
                            key={subItem.id}
                            onClick={() => handleSubmenuClick(item, subItem)}
                            className={`group bg-white hover:bg-sky-50 rounded-xl p-3 text-center transition-all duration-200 hover:scale-105 hover:shadow-md border border-gray-200/80 ${
                              activeSection === subItem.id ? 'ring-2 ring-sky-500 shadow-md' : ''
                            }`}
                            title={subItem.description}
                          >
                            <div className="flex flex-col items-center space-y-2">
                              {/* Icon */}
                              <div className={`w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:text-sky-600 group-hover:bg-sky-100 transition-all duration-200`}>
                                <span className="font-bold text-lg">
                                  {subItem.customIcon}
                                </span>
                              </div>
                              {/* Text */}
                              <span className="text-xs font-medium text-gray-700 group-hover:text-sky-700 transition-colors">
                                {subItem.label}
                              </span>
                            </div>
                            
                            {/* Active indicator */}
                            {activeSection === subItem.id && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-sky-500 rounded-full border-2 border-white"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    // List design for other submenus
                    item.submenu.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => handleSubmenuClick(item, subItem)}
                        className={`w-full flex items-center p-2 pl-3 rounded-md text-left transition-all duration-200 text-xs ${
                          activeSection === subItem.id
                            ? 'bg-sky-50 text-sky-700 font-semibold'
                            : 'text-gray-500 hover:text-sky-700 hover:bg-sky-50'
                        }`}
                      >
                        <div className="w-1.5 h-1.5 bg-current rounded-full mr-2 opacity-60"></div>
                        {subItem.label}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-gray-200 space-y-2 flex-shrink-0 bg-gray-50/50">
        {/* Quick Actions */}
        <div className="flex space-x-2">
          <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg text-xs font-medium transition-colors duration-200">
            Soporte
          </button>
          <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg text-xs font-medium transition-colors duration-200">
            Ayuda
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full bg-gradient-to-r from-red-600/90 to-red-700/90 hover:from-red-700 hover:to-red-800 text-white p-2.5 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center group text-sm"
        >
          <svg className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-200" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16,17V14H9V10H16V7L21,12L16,17M14,2A2,2 0 0,1 16,4V6H14V4H5V20H14V18H16V20A2,2 0 0,1 14,22H5A2,2 0 0,1 3,20V4A2,2 0 0,1 5,2H14Z"/>
          </svg>
          Cerrar Sesión
        </button>
      </div>

      {/* Custom Scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>

    </div>
  );
};

export default Sidebar;
