// config/menuConfig.js - Configuración de menús por tipo de usuario

/**
 * Configuración de menús para Persona Natural (Cédula)
 */
export const PERSONA_NATURAL_MENU = [
  { 
    id: 'products', 
    label: 'Mis Productos', 
    icon: 'M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21A7,7 0 0,1 14,26H10A7,7 0 0,1 3,19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2Z',
    component: 'ProductsForm',
    hasSubmenu: true,
    submenu: [
      { 
        id: 'savings-product', 
        label: 'Ahorros', 
        component: 'SavingsProductForm',
        iconType: 'custom',
        customIcon: '$',
        description: 'Gestiona tus cuentas de ahorro',
        color: 'gold'
      },
      { 
        id: 'credit-product', 
        label: 'Créditos', 
        component: 'CreditProductForm',
        iconType: 'custom', 
        customIcon: '📋',
        description: 'Administra tus líneas de crédito',
        color: 'copper'
      },
      { 
        id: 'investment-product', 
        label: 'Inversiones', 
        component: 'InvestmentProductForm',
        iconType: 'custom',
        customIcon: '📈',
        description: 'Controla tu portafolio de inversión',
        color: 'platinum'
      }
    ]
  },
  { 
    id: 'transfers', 
    label: 'Transferencias', 
    icon: 'M9,7H15L11,3L9,7M11,21L15,17H9L11,21M21,9V15L17,11L21,9M3,15V9L7,11L3,15',
    component: 'TransfersForm',
    hasSubmenu: true,
    submenu: [
      { 
        id: 'internal', 
        label: 'Transferencias', 
        component: 'InternalTransferForm',
        iconType: 'custom',
        customIcon: '🏦',
        description: 'Transferencias entre cuentas propias',
        color: 'gold'
      },
      { 
        id: 'transfer-history', 
        label: 'Historial de Movimientos', 
        component: 'TransferHistoryWindow',
        iconType: 'custom',
        customIcon: '📜',
        description: 'Consulta tu historial de transferencias',
        color: 'copper'
      }
    ]
  },
  { 
    id: 'profile', 
    label: 'Mi Perfil', 
    icon: 'M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z',
    component: 'ProfileForm',
    hasSubmenu: true,
    submenu: [
      { 
        id: 'client-info', 
        label: 'Información de Cliente', 
        component: 'PerfilComponent',
        iconType: 'custom',
        customIcon: '👤',
        description: 'Gestiona tu información personal',
        color: 'copper'
      }
    ]
  },
  { 
    id: 'stats',  
    label: 'Términos y Condiciones', 
    icon: 'M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6',
    component: 'StatsForm',
  }
];

/**
 * Configuración de menús para Empresa (RUC)
 */
export const EMPRESA_MENU = [
  { 
    id: 'products', 
    label: 'Productos Empresariales', 
    icon: 'M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21A7,7 0 0,1 14,26H10A7,7 0 0,1 3,19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2Z',
    component: 'ProductsForm',
    hasSubmenu: true,
    submenu: [
      { 
        id: 'business-savings', 
        label: 'Cuentas Empresariales', 
        component: 'SavingsProductForm',
        iconType: 'custom',
        customIcon: '🏢',
        description: 'Gestiona cuentas empresariales',
        color: 'gold'
      },
      { 
        id: 'business-credit', 
        label: 'Líneas de Crédito', 
        component: 'CreditProductForm',
        iconType: 'custom', 
        customIcon: '💼',
        description: 'Administra créditos empresariales',
        color: 'copper'
      },
      { 
        id: 'business-investment', 
        label: 'Inversiones Corporativas', 
        component: 'InvestmentProductForm',
        iconType: 'custom',
        customIcon: '📊',
        description: 'Portafolio de inversiones empresariales',
        color: 'platinum'
      }
    ]
  },
  { 
    id: 'transfers', 
    label: 'Transferencias', 
    icon: 'M9,7H15L11,3L9,7M11,21L15,17H9L11,21M21,9V15L17,11L21,9M3,15V9L7,11L3,15',
    component: 'TransfersForm',
    hasSubmenu: true,
    submenu: [
      { 
        id: 'internal', 
        label: 'Transferencias Internas', 
        component: 'InternalTransferForm',
        iconType: 'custom',
        customIcon: '🏦',
        description: 'Entre cuentas de la empresa',
        color: 'gold'
      },
      { 
        id: 'external', 
        label: 'Transferencias Externas', 
        component: 'ExternalTransferForm',
        iconType: 'custom',
        customIcon: '🏛️',
        description: 'A otros bancos e instituciones',
        color: 'copper'
      },
      { 
        id: 'transfer-history',
        label: 'Historial de Movimientos',
        component: 'TransferHistoryWindow',
        iconType: 'custom',
        customIcon: '📜',
        description: 'Consulta tu historial de transferencias empresariales',
        color: 'copper'
      },
      { 
        id: 'international', 
        label: 'Internacional', 
        component: 'InternationalTransferForm',
        iconType: 'custom',
        customIcon: '🌍',
        description: 'Transferencias internacionales',
        color: 'platinum'
      }
    ]
  },
  { 
    id: 'payroll', 
    label: 'Pago de Nómina', 
    icon: 'M14,6V4H20V6H14M20,16V18H8V16H20M20,11V13H8V11H20Z',
    component: 'PayrollForm',
    hasSubmenu: true,
    submenu: [
      { 
        id: 'payroll-processing', 
        label: 'Procesar Nómina', 
        component: 'PayrollProcessingForm',
        iconType: 'custom',
        customIcon: '💰',
        description: 'Procesamiento de nómina empresarial',
        color: 'gold'
      },
      { 
        id: 'payroll-history', 
        label: 'Historial de Nóminas', 
        component: 'PayrollHistoryForm',
        iconType: 'custom',
        customIcon: '📊',
        description: 'Historial y reportes de nómina',
        color: 'copper'
      },
      { 
        id: 'employee-management', 
        label: 'Gestión de Empleados', 
        component: 'EmployeeManagementForm',
        iconType: 'custom',
        customIcon: '👥',
        description: 'Administrar datos de empleados',
        color: 'platinum'
      }
    ]
  },
  { 
    id: 'cash-management', 
    label: 'Cash Management', 
    icon: 'M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10Z',
    component: 'CashManagementForm',
    hasSubmenu: true,
    submenu: [
      { 
        id: 'treasury-management', 
        label: 'Gestión de Tesorería', 
        component: 'TreasuryManagementForm',
        iconType: 'custom',
        customIcon: '🏦',
        description: 'Control de flujo de efectivo',
        color: 'gold'
      },
      { 
        id: 'bulk-transfers', 
        label: 'Transferencias Masivas', 
        component: 'BulkTransfersForm',
        iconType: 'custom',
        customIcon: '📋',
        description: 'Múltiples transferencias simultáneas',
        color: 'copper'
      },
      { 
        id: 'liquidity-management', 
        label: 'Gestión de Liquidez', 
        component: 'LiquidityManagementForm',
        iconType: 'custom',
        customIcon: '💧',
        description: 'Optimización de liquidez empresarial',
        color: 'platinum'
      }
    ]
  },
  { 
    id: 'user-management', 
    label: 'Gestión de Usuarios', 
    icon: 'M16,4C16.88,4 17.67,4.38 18.12,5H20A2,2 0 0,1 22,7V19A2,2 0 0,1 20,21H4A2,2 0 0,1 2,19V7A2,2 0 0,1 4,5H5.88C6.33,4.38 7.12,4 8,4H16M16,6H8A1,1 0 0,0 7,7V8H17V7A1,1 0 0,0 16,6Z',
    component: 'UserManagementForm',
    hasSubmenu: true,
    submenu: [
      { 
        id: 'company-users', 
        label: 'Usuarios de la Empresa', 
        component: 'CompanyUsersForm',
        iconType: 'custom',
        customIcon: '👥',
        description: 'Administrar usuarios empresariales',
        color: 'gold'
      },
      { 
        id: 'permissions', 
        label: 'Permisos y Roles', 
        component: 'PermissionsForm',
        iconType: 'custom',
        customIcon: '🔑',
        description: 'Configurar permisos de acceso',
        color: 'copper'
      },
      { 
        id: 'audit-logs', 
        label: 'Logs de Auditoría', 
        component: 'AuditLogsForm',
        iconType: 'custom',
        customIcon: '📋',
        description: 'Registro de actividades',
        color: 'platinum'
      }
    ]
  },
  { 
    id: 'reports', 
    label: 'Reportes Corporativos', 
    icon: 'M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6',
    component: 'CorporateReportsForm',
    hasSubmenu: true,
    submenu: [
      { 
        id: 'financial-reports', 
        label: 'Reportes Financieros', 
        component: 'FinancialReportsForm',
        iconType: 'custom',
        customIcon: '📊',
        description: 'Estados financieros y análisis',
        color: 'gold'
      },
      { 
        id: 'transaction-reports', 
        label: 'Reportes de Transacciones', 
        component: 'TransactionReportsForm',
        iconType: 'custom',
        customIcon: '📈',
        description: 'Análisis de movimientos',
        color: 'copper'
      },
      { 
        id: 'compliance-reports', 
        label: 'Reportes de Cumplimiento', 
        component: 'ComplianceReportsForm',
        iconType: 'custom',
        customIcon: '✅',
        description: 'Reportes regulatorios',
        color: 'platinum'
      }
    ]
  },
  { 
    id: 'profile', 
    label: 'Perfil Empresarial', 
    icon: 'M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z',
    component: 'ProfileForm',
    hasSubmenu: true,
    submenu: [
      { 
        id: 'company-info', 
        label: 'Información Empresarial', 
        component: 'CompanyInfoForm',
        iconType: 'custom',
        customIcon: '🏢',
        description: 'Datos de la empresa',
        color: 'copper'
      }
    ]
  },
  { 
    id: 'stats',  
    label: 'Términos y Condiciones', 
    icon: 'M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6',
    component: 'StatsForm',
  }
];

/**
 * Función para obtener menú según tipo de usuario
 */
export const getMenuByUserType = (tipoUsuario) => {
  console.log('📋 [MENU-CONFIG] Obteniendo menú para tipo:', tipoUsuario);
  
  switch (tipoUsuario) {
    case 'empresa':
      console.log('🏢 [MENU-CONFIG] Cargando menú empresarial');
      return EMPRESA_MENU;
    case 'persona_natural':
      console.log('👤 [MENU-CONFIG] Cargando menú persona natural');
      return PERSONA_NATURAL_MENU;
    default:
      console.log('⚠️ [MENU-CONFIG] Tipo desconocido, usando menú persona natural por defecto');
      return PERSONA_NATURAL_MENU;
  }
};

/**
 * Verificar si hay servicios disponibles para agregar al menú
 */
export const addServicesToMenu = (menu, serviciosAvailable) => {
  if (!serviciosAvailable) return menu;
  
  const serviciosMenu = {
    id: 'services',
    label: 'Servicios',
    icon: 'M12,2A2,2 0 0,1 14,4V6A2,2 0 0,1 12,8A2,2 0 0,1 10,6V4A2,2 0 0,1 12,2M21,9V7L15,1L13.5,2.5L15.17,4.17L13.24,6.1C12.45,6.04 11.64,6 10.79,6C8.61,6 6.5,6.5 4.75,7.36L3.27,5.88C2.5,5.11 2.5,3.89 3.27,3.12C4.04,2.35 5.26,2.35 6.03,3.12L7.5,4.59C8.26,4.36 9.04,4.17 9.83,4.04C10.05,4.01 10.27,4 10.5,4C11.22,4 11.94,4.08 12.66,4.23L15.49,1.4C16.88,0 19.12,0 20.51,1.4C21.9,2.79 21.9,5.03 20.51,6.42L17.68,9.25C18.84,10.8 19.5,12.7 19.5,14.79C19.5,18.4 16.4,21.5 12.79,21.5C9.18,21.5 6.08,18.4 6.08,14.79C6.08,13.28 6.58,11.89 7.44,10.8C7.44,10.8 7.44,10.8 7.44,10.8C7.44,10.8 7.44,10.8 7.44,10.8C7.44,10.8 7.44,10.8 7.44,10.8',
    component: 'ServicesForm',
    hasSubmenu: true,
    submenu: [
      {
        id: 'facilito-payments',
        label: 'Pago de Servicios Facilito',
        component: 'ServiciosFacilitoForm',
        iconType: 'custom',
        customIcon: '💡',
        description: 'Pago de servicios básicos en línea',
        color: 'bronze'
      },
      {
        id: 'Certificados-consolite',
        label: 'Certificados',
        component: 'CertificadosForm',
        iconType: 'custom',
        customIcon: '📜',
        description: 'Emisión y gestión de certificados',
        color: 'copper'
      },
      {
        id: 'cupos-personalizados',
        label: 'Personalización de Cupos',
        component: 'CupoComponent',
        iconType: 'custom',
        customIcon: '💰',
        description: 'Configura límites diarios de transferencia',
        color: 'gold'
      }
    ]
  };

  // Buscar dónde insertar el menú de servicios (antes del perfil)
  const profileIndex = menu.findIndex(item => item.id === 'profile');
  if (profileIndex !== -1) {
    const menuWithServices = [...menu];
    menuWithServices.splice(profileIndex, 0, serviciosMenu);
    return menuWithServices;
  }
  
  // Si no encuentra el perfil, agregar antes del último elemento
  const menuWithServices = [...menu];
  menuWithServices.splice(-1, 0, serviciosMenu);
  return menuWithServices;
};