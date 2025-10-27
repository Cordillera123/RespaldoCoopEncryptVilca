// components/dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import WindowPanel from "./WindowPanel";
import useWindows from "../../hooks/useWindows";
import apiService from "../../services/apiService";



// === IMPORTAR COMPONENTES DE PRODUCTOS SEPARADOS ===
import SavingsProductForm from './SavingsProductForm';
import CreditProductForm from './CreditProductForm';
import InvestmentProductForm from './InvestmentProductForm';
import InsuranceProductForm from './InsuranceProductForm';
import CardsProductForm from './CardsProductForm';

// === IMPORTAR OTROS COMPONENTES ===
import PerfilComponent from "./PerfilComponent";

// === IMPORTAR COMPONENTES DE TRANSFERENCIAS ===
import InternaTransferWindow from './InternaTransferWindow';
import ExternaTransferWindow from './ExternaTransferWindow';
import InternacioTransferWindow from './InternacioTransferWindow';
import ServiciosFacilitoForm from "./ServiciosFacilitoForm";
import CertificadosForm from "./CertificadosForm";

// === IMPORTAR COMPONENTES EMPRESARIALES ===
import {
  PayrollProcessingForm,
  PayrollHistoryForm,
  EmployeeManagementForm,
  TreasuryManagementForm,
  BulkTransfersForm,
  LiquidityManagementForm,
  CompanyUsersForm,
  PermissionsForm,
  AuditLogsForm,
  FinancialReportsForm,
  TransactionReportsForm,
  ComplianceReportsForm,
  PayrollForm,
  CashManagementForm,
  UserManagementForm,
  CorporateReportsForm,
  CompanyInfoForm
} from './empresa';
const FormComponents = {
  DashboardHome: ({ recentProducts = [], onProductClick = () => { } }) => (
    <DashboardHomeContent
      recentProducts={recentProducts}
      onProductClick={onProductClick}
    />
  ),

  // === COMPONENTES DE PRODUCTOS CORREGIDOS ===
  ProductsForm: () => <FormPlaceholder title="Mis Productos" />,
  SavingsProductForm: SavingsProductForm,
  CreditProductForm: CreditProductForm,
  InvestmentProductForm: InvestmentProductForm,
  InsuranceProductForm: InsuranceProductForm,
  CardsProductForm: CardsProductForm,

  // === COMPONENTES DE TRANSFERENCIAS ===
  TransfersForm: () => <FormPlaceholder title="Transferencias" />,
  InternalTransferForm: InternaTransferWindow,
  ExternalTransferForm: ExternaTransferWindow,
  InternationalTransferForm: InternacioTransferWindow,

  ServicesForm: () => <FormPlaceholder title="Servicios" />,
  ServiciosFacilitoForm: ServiciosFacilitoForm,

 
  PayrollForm: PayrollForm,
  PayrollProcessingForm: PayrollProcessingForm,
  PayrollHistoryForm: PayrollHistoryForm,
  EmployeeManagementForm: EmployeeManagementForm,

  CashManagementForm: CashManagementForm,
  TreasuryManagementForm: TreasuryManagementForm,
  BulkTransfersForm: BulkTransfersForm,
  LiquidityManagementForm: LiquidityManagementForm,


  UserManagementForm: UserManagementForm,
  CompanyUsersForm: CompanyUsersForm,
  PermissionsForm: PermissionsForm,
  AuditLogsForm: AuditLogsForm,

  CorporateReportsForm: CorporateReportsForm,
  FinancialReportsForm: FinancialReportsForm,
  TransactionReportsForm: TransactionReportsForm,
  ComplianceReportsForm: ComplianceReportsForm,

  CompanyInfoForm: CompanyInfoForm,

  AccountsForm: () => <FormPlaceholder title="Mis Cuentas" />,
  SavingsAccountForm: () => <FormPlaceholder title="Cuentas de Ahorro" />,
  CheckingAccountForm: () => <FormPlaceholder title="Cuentas Corrientes" />,
  FixedDepositForm: () => <FormPlaceholder title="Depósitos a Plazo" />,
  TransactionsForm: () => <FormPlaceholder title="Transacciones" />,
  CertificadosForm: () => <CertificadosForm title="Certificados"/>,
  TransactionHistoryForm: () => (
    <FormPlaceholder title="Historial de Transacciones" />
  ),
  PendingTransactionsForm: () => (
    <FormPlaceholder title="Transacciones Pendientes" />
  ),
  ScheduledTransactionsForm: () => (
    <FormPlaceholder title="Transacciones Programadas" />
  ),
  ProfileForm: () => <FormPlaceholder title="Mi Perfil" />,

  // === COMPONENTE DE PERFIL AGREGADO ===
  PerfilComponent: () => <PerfilComponent />,
  ClientInfoForm: () => <PerfilComponent />, // Alias por si acaso
  UpdatePasswordForm: () => <FormPlaceholder title="Actualizar Clave de acceso" />,
  StatsForm: () => <FormPlaceholder title="Términos y Condiciones" />,
  IncomeStatsForm: () => <FormPlaceholder title="Estadísticas de Ingresos" />,
  ExpenseStatsForm: () => <FormPlaceholder title="Estadísticas de Gastos" />,
  InvestmentStatsForm: () => (
    <FormPlaceholder title="Estadísticas de Inversiones" />
  ),
  InvestmentsForm: () => <FormPlaceholder title="Inversiones" />,
  PortfolioForm: () => <FormPlaceholder title="Mi Portafolio" />,
  OpportunitiesForm: () => (
    <FormPlaceholder title="Oportunidades de Inversión" />
  ),
  PerformanceForm: () => <FormPlaceholder title="Rendimiento de Inversiones" />,
  LoansForm: () => <FormPlaceholder title="Préstamos" />,
  ActiveLoansForm: () => <FormPlaceholder title="Préstamos Activos" />,
  LoanApplicationForm: () => <FormPlaceholder title="Solicitar Préstamo" />,
  LoanCalculatorForm: () => (
    <FormPlaceholder title="Calculadora de Préstamos" />
  ),
  CardsForm: () => <FormPlaceholder title="Tarjetas" />,
  CreditCardsForm: () => <FormPlaceholder title="Tarjetas de Crédito" />,
  DebitCardsForm: () => <FormPlaceholder title="Tarjetas de Débito" />,
  PrepaidCardsForm: () => <FormPlaceholder title="Tarjetas Prepago" />,
};

// Componente placeholder para formularios
const FormPlaceholder = ({ title }) => (
  <div className="p-8 h-full bg-gradient-to-br from-gray-50 to-white">
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-sky-500 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-white"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
        <p className="text-gray-600">
          Este formulario estará disponible próximamente
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-gray-100 rounded-lg"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-10 bg-gray-100 rounded-lg"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-24 bg-gray-100 rounded-lg"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-10 bg-gray-100 rounded-lg"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-gray-100 rounded-lg"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-32 bg-gray-100 rounded-lg"></div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">
            Guardar
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Definición de productos disponibles con metadatos
const PRODUCT_DEFINITIONS = {
  'SavingsProductForm': {
    id: 'savings',
    name: 'Ahorros',
    icon: '$',
    color: 'sky',
    bgColor: 'bg-sky-50',
    hoverColor: 'hover:bg-sky-100',
    iconBg: 'bg-sky-600',
    description: 'Gestiona tus cuentas de ahorro'
  },
  'CreditProductForm': {
    id: 'credits',
    name: 'Créditos',
    icon: '📋',
    color: 'sky',
    bgColor: 'bg-sky-50',
    hoverColor: 'hover:bg-sky-100',
    iconBg: 'bg-sky-600',
    description: 'Administra tus líneas de crédito'
  },
  'InvestmentProductForm': {
    id: 'investments',
    name: 'Inversiones',
    icon: '📈',
    color: 'sky',
    bgColor: 'bg-sky-50',
    hoverColor: 'hover:bg-sky-100',
    iconBg: 'bg-sky-600',
    description: 'Controla tu portafolio de inversión'
  },
  'InsuranceProductForm': {
    id: 'insurance',
    name: 'Seguros',
    icon: '🛡️',
    color: 'orange',
    bgColor: 'bg-orange-50',
    hoverColor: 'hover:bg-orange-100',
    iconBg: 'bg-orange-600',
    description: 'Protege tu patrimonio'
  },
  'CardsProductForm': {
    id: 'cards',
    name: 'Tarjetas',
    icon: '💳',
    color: 'pink',
    bgColor: 'bg-pink-50',
    hoverColor: 'hover:bg-pink-100',
    iconBg: 'bg-pink-600',
    description: 'Gestiona tus tarjetas'
  },
  'InternalTransferForm': {
    id: 'internal-transfer',
    name: 'Transferencia Interna',
    icon: '🏦',
    color: 'sky',
    bgColor: 'bg-sky-50',
    hoverColor: 'hover:bg-sky-100',
    iconBg: 'bg-sky-600',
    description: 'Transferencias entre cuentas propias'
  },
  'ExternalTransferForm': {
    id: 'external-transfer',
    name: 'Transferencia Externa',
    icon: '🏛️',
    color: 'sky',
    bgColor: 'bg-sky-50',
    hoverColor: 'hover:bg-sky-100',
    iconBg: 'bg-sky-600',
    description: 'Transferencias a otros bancos'
  },
  'InternationalTransferForm': {
    id: 'international-transfer',
    name: 'Transferencia Internacional',
    icon: '🌍',
    color: 'sky',
    bgColor: 'bg-sky-50',
    hoverColor: 'hover:bg-sky-100',
    iconBg: 'bg-sky-600',
    description: 'Transferencias internacionales'
  }
};

// Contenido del dashboard principal con productos recientes dinámicos
const DashboardHomeContent = ({ recentProducts, onProductClick }) => {
  // 🆕 Estados para datos financieros
  const [financialData, setFinancialData] = useState(null);
  const [loadingFinancial, setLoadingFinancial] = useState(true);
  const [financialError, setFinancialError] = useState(null);

  // 🆕 Hook para cargar datos financieros
  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    console.log('💰 [DASHBOARD] Cargando datos financieros...');
    setLoadingFinancial(true);
    setFinancialError(null);

    try {
      // Importar dinámicamente el apiService
      const { default: apiService } = await import('../../services/apiService');

      const result = await apiService.getFormattedFinancialSummary();

      console.log('📊 [DASHBOARD] Resultado financiero:', result);

      if (result.success) {
        setFinancialData(result.data);
        console.log('✅ [DASHBOARD] Datos financieros cargados exitosamente');
      } else {
        setFinancialError(result.error?.message || 'Error cargando datos financieros');
        console.error('❌ [DASHBOARD] Error:', result.error);
      }
    } catch (error) {
      console.error('💥 [DASHBOARD] Error inesperado:', error);
      setFinancialError('Error inesperado al cargar datos financieros');
    } finally {
      setLoadingFinancial(false);
    }
  };

  // 🆕 Función para refrescar datos financieros
  const refreshFinancialData = () => {
    loadFinancialData();
  };

  return (
    <div className="p-6 h-full overflow-auto bg-gradient-to-br from-sky-50 to-sky-100">
      <div className="max-w-7xl mx-auto">

        

        {/* Stats Cards con datos reales ACTUALIZADOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* 🆕 BALANCE TOTAL con disponible abajo */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Balance Total</p>
                {loadingFinancial ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                ) : financialError ? (
                  <div>
                    <p className="text-2xl font-bold text-red-600">Error</p>
                    <p className="text-sm text-red-500 mt-1">No disponible</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-gray-800">
                      {financialData?.formatted?.balanceTotal || '$0.00'}
                    </p>
                    <p className="text-sm text-sky-600 mt-1">
                      Disponible: {financialData?.formatted?.balanceDisponible || '$0.00'}
                    </p>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                </svg>
              </div>
            </div>
          </div>

          {/* 🆕 AHORROS TOTAL con disponible abajo */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Ahorros</p>
                {loadingFinancial ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                ) : financialError ? (
                  <div>
                    <p className="text-2xl font-bold text-red-600">Error</p>
                    <p className="text-sm text-red-500 mt-1">No disponible</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-gray-800">
                      {financialData?.formatted?.ahorrosTotal || '$0.00'}
                    </p>
                    <p className="text-sm text-sky-600 mt-1">
                      Disponible: {financialData?.formatted?.ahorrosDisponible || '$0.00'}
                    </p>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21,18V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V6H12C10.89,6 10,6.9 10,8V16A2,2 0 0,0 12,18" />
                </svg>
              </div>
            </div>
          </div>

          {/* 🆕 INVERSIONES TOTAL con disponible abajo */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Inversiones</p>
                {loadingFinancial ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                ) : financialError ? (
                  <div>
                    <p className="text-2xl font-bold text-red-600">Error</p>
                    <p className="text-sm text-red-500 mt-1">No disponible</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-gray-800">
                      {financialData?.formatted?.inversionesTotal || '$0.00'}
                    </p>
                    <p className="text-sm text-sky-600 mt-1">
                      Disponible: {financialData?.formatted?.inversionesDisponible || '$0.00'}
                    </p>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16,6L18.29,8.29L13.41,13.17L9.41,9.17L2,16.59L3.41,18L9.41,12L13.41,16L19.71,9.71L22,12V6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Gastos del Mes - SIN CAMBIOS */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Gastos del Mes</p>
                {loadingFinancial ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                ) : financialError ? (
                  <div>
                    <p className="text-2xl font-bold text-red-600">Error</p>
                    <p className="text-sm text-red-500 mt-1">No disponible</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-gray-800">
                      {financialData?.formatted?.gastosDelMes || '$0.00'}
                    </p>
                    <p className="text-sm text-orange-600 mt-1">
                      {financialData?.formatted?.porcentajeGastos || '0%'} del total
                    </p>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.92 13.63,13 12,13C10.37,13 9,11.92 9,10.5C9,9.42 10.37,8.5 12,8.5C13.63,8.5 15,9.42 15,10.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        

        {/* Error Alert (si hay error) */}
        {financialError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
              </svg>
              <div>
                <p className="text-red-800 font-medium">Error cargando datos financieros</p>
                <p className="text-red-600 text-sm">{financialError}</p>
              </div>
              <button
                onClick={refreshFinancialData}
                className="ml-auto px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Recent Products Section - SIN CAMBIOS */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Productos Recientes</h2>
              <p className="text-sm text-gray-500">
                {recentProducts.length > 0
                  ? `Últimos ${recentProducts.length} productos visitados`
                  : 'Visita un producto desde el menú lateral para verlo aquí'
                }
              </p>
            </div>
            {recentProducts.length > 0 && (
              <button
                className="text-sm text-sky-600 hover:text-sky-800 font-medium"
                onClick={() => {
                  console.log('Limpiar productos recientes');
                }}
              >
                Limpiar historial
              </button>
            )}
          </div>

          {recentProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recentProducts.map((product, index) => {
                const productData = PRODUCT_DEFINITIONS[product.component];
                if (!productData) return null;

                return (
                  <button
                    key={product.component}
                    onClick={() => onProductClick(product)}
                    className={`relative p-4 ${productData.bgColor} ${productData.hoverColor} rounded-xl transition-all duration-200 text-center group hover:shadow-md hover:scale-105`}
                  >
                    {index === 0 && (
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}

                    <div className={`w-8 h-8 ${productData.iconBg} rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-200`}>
                      <span className="text-white text-lg font-bold">
                        {productData.icon}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      {productData.name}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      Visitado {index === 0 ? 'ahora' : `hace ${index} min`}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-600 mb-2">No hay productos recientes</p>
              <p className="text-sm text-gray-500">
                Explora los productos desde el menú lateral para comenzar
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions for Transfers - SIN CAMBIOS */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Acciones Rápidas - Transferencias
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button
              onClick={() => onProductClick({
                component: 'InternalTransferForm',
                title: 'Transferencia Interna',
                label: 'Transferencia Interna'
              })}
              className="p-4 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors text-center"
            >
              <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-lg">🏦</span>
              </div>
              <span className="text-sm font-medium">Internas</span>
            </button>

            <button
              onClick={() => onProductClick({
                component: 'ExternalTransferForm',
                title: 'Transferencia Externa',
                label: 'Transferencia Externa'
              })}
              className="p-4 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors text-center"
            >
              <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-lg">🏛️</span>
              </div>
              <span className="text-sm font-medium">Externas</span>
            </button>

            <button
              onClick={() => onProductClick({
                component: 'InternationalTransferForm',
                title: 'Transferencia Internacional',
                label: 'Transferencia Internacional'
              })}
              className="p-4 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors text-center"
            >
              <div className="w-8 h-8 bg-sky-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-lg">🌍</span>
              </div>
              <span className="text-sm font-medium">Internacional</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
const Dashboard = ({ userSession, onLogout }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentProducts, setRecentProducts] = useState([]); // Estado para productos recientes
  const [tipoUsuario, setTipoUsuario] = useState('unknown');

  // 🚨 NUEVO: Control de inactividad en el Dashboard
 

  // 🏷️ Función para obtener el nombre corto del componente para la taskbar
  const getShortTitle = (window) => {
    console.log('🏷️ [TASKBAR] Obteniendo título corto para:', window.title, 'Component:', window.componentName);
    
    // Mapeo de nombres de componentes a nombres cortos
    const shortNames = {
      'SavingsProductForm': 'Ahorros',
      'CreditProductForm': 'Créditos', 
      'InvestmentProductForm': 'Inversiones',
      'InsuranceProductForm': 'Seguros',
      'CardsProductForm': 'Tarjetas',
      'InternalTransferForm': 'Transferencias',
      'ExternalTransferForm': 'Externa',
      'InternationalTransferForm': 'Internacional',
      'ServiciosFacilitoForm': 'Servicios Facilito',
      'CertificadosForm': 'Certificados',
      'PerfilComponent': 'Mi Perfil',
      'UpdatePasswordForm': 'Cambiar Clave',
      'StatsForm': 'Términos'
    };

    // 1. Intentar obtener nombre corto por componentName (más confiable)
    if (window.componentName && shortNames[window.componentName]) {
      console.log('✅ [TASKBAR] Nombre encontrado por componentName:', shortNames[window.componentName]);
      return shortNames[window.componentName];
    }

    // 2. Si el título contiene " - ", tomar solo la parte después del guión
    if (window.title && window.title.includes(' - ')) {
      const shortTitle = window.title.split(' - ').pop().trim();
      console.log('✅ [TASKBAR] Nombre extraído del título:', shortTitle);
      return shortTitle;
    }

    // 3. Si no hay mapeo específico, usar el título original (pero limitado)
    const fallbackTitle = window.title || 'Ventana';
    console.log('⚠️ [TASKBAR] Usando título fallback:', fallbackTitle);
    return fallbackTitle.length > 15 ? fallbackTitle.substring(0, 15) + '...' : fallbackTitle;
  };

  const {
    windows,
    openWindow,
    openOrFocusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
    arrangeWindows,
    windowCount,
    restoreAndMaximizeWindow
  } = useWindows();

  useEffect(() => {
    console.log("📊 [DASHBOARD] Cargando dashboard...");
    console.log("👤 [DASHBOARD] Sesión del usuario:", userSession);

    // Cargar inmediatamente sin setTimeout artificial
    if (userSession && userSession.userData) {
      console.log(
        "📋 [DASHBOARD] Datos del usuario desde la sesión:",
        userSession.userData
      );
      setUserInfo(userSession.userData);
    } else {
      setUserInfo({
        estado: "OK",
        msg: "Autenticación exitosa",
        cliente: [
          {
            nomcli: "ALEJANDRO FERNANDO",
            apecli: "MORALES TINGO",
            idecli: "1804567890",
            codcli: "001234",
            fecnac: "1990-05-15",
            direma: "alejandro.morales@email.com",
            tlfcel: "0987654321",
            dirdom: "Av. Principal 123, Latacunga",
            dirtra: "Edificio Corporativo, Piso 5",
            nomemp: "COOPERATIVA LAS NAVES LTDA.",
            codemp: "001",
            nomofi: "OFICINA MATRIZ",
            codofi: "001",
          },
        ],
      });
    }
    
    // Obtener tipo de usuario
    const userType = apiService.getUserType();
    console.log('🏢 [DASHBOARD] Tipo de usuario detectado:', userType);
    setTipoUsuario(userType);
    
    setLoading(false);
  }, [userSession]);

  // Función para agregar producto a recientes
  const addToRecentProducts = (menuItem) => {
    console.log('📝 [DASHBOARD] Agregando a productos recientes:', menuItem);

    setRecentProducts(prev => {
      // Filtrar el producto si ya existe
      const filtered = prev.filter(item => item.component !== menuItem.component);

      // Agregar al inicio del array (más reciente)
      const updated = [menuItem, ...filtered];

      // Mantener solo los últimos 4 productos
      const limited = updated.slice(0, 4);

      console.log('📋 [DASHBOARD] Productos recientes actualizados:', limited);
      return limited;
    });
  };

  const handleMenuClick = (menuItem) => {
    console.log('🖱️ [DASHBOARD] Menu clicked:', menuItem);
    console.log('🧩 [DASHBOARD] Component to load:', menuItem.component);

    const ComponentToRender = FormComponents[menuItem.component];
    console.log('📦 [DASHBOARD] Component found:', !!ComponentToRender);

    if (ComponentToRender) {
      // Agregar a productos recientes si es un producto
      if (PRODUCT_DEFINITIONS[menuItem.component]) {
        addToRecentProducts(menuItem);
      }

      // 🔍 Usar openOrFocusWindow para maximizar ventanas existentes o crear nuevas
      console.log('🎯 [DASHBOARD] Usando openOrFocusWindow para:', menuItem.component);

      // Si es el Dashboard, pasar las props necesarias
      if (menuItem.component === 'DashboardHome') {
        openOrFocusWindow({
          title: menuItem.title || menuItem.label,
          componentName: menuItem.component,
          component: () => (
            <DashboardHomeContent
              recentProducts={recentProducts}
              onProductClick={handleProductClick}
            />
          ),
          size: { width: 900, height: 700 },
          minSize: { width: 600, height: 400 },
        });
      }
      // ⭐ CONFIGURACIÓN ESPECIAL PARA SERVICIOS FACILITO
      else if (menuItem.component === 'ServiciosFacilitoForm') {
        console.log('🏪 [DASHBOARD] Abriendo/Maximizando Servicios Facilito');
        openOrFocusWindow({
          title: menuItem.title || 'Pago de Servicios Facilito',
          componentName: menuItem.component,
          component: () => <ComponentToRender openWindow={openWindow} />,
          size: { width: 1100, height: 750 }, // Ventana más grande para iframe
          minSize: { width: 900, height: 600 }, // Tamaño mínimo mayor
        });
      }
      else {
        openOrFocusWindow({
          title: menuItem.title || menuItem.label,
          componentName: menuItem.component,
          component: () => <ComponentToRender openWindow={openWindow} />,
          size: { width: 900, height: 700 },
          minSize: { width: 600, height: 400 },
        });
      }
    } else {
      console.error('❌ [DASHBOARD] Component not found:', menuItem.component);
      console.log('📋 [DASHBOARD] Available components:', Object.keys(FormComponents));
    }
  };

  // Función para manejar clics desde el dashboard (productos recientes)
  const handleProductClick = (product) => {
    console.log('🎯 [DASHBOARD] Product clicked from dashboard:', product);
    handleMenuClick(product);
  };

  const handleLogout = () => {
    console.log("🚪 [DASHBOARD] Cerrando sesión...");
    if (onLogout) onLogout();
  };

  // Sin pantalla de carga duplicada - ya existe en index.html

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-2xl border border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-600"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
            </svg>
          </div>
          <h3 className="text-gray-800 text-lg font-semibold mb-2">
            Error de autenticación
          </h3>
          <p className="text-gray-600 text-sm mb-6">
            No se pudieron cargar los datos del usuario
          </p>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg"
          >
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex overflow-hidden fixed inset-0">
      {/* Sidebar */}
      <Sidebar
        userInfo={userInfo}
        onMenuClick={handleMenuClick}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 z-10">
          <div className="px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Panel de Control
                </h1>
          
              </div>

              {/* Window Controls */}
              <div className="flex items-center space-x-4">
                {windowCount > 0 && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => arrangeWindows("auto")}
                      className="px-3 py-1 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
                      title="Auto-organizar"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M3,11H11V3H3M3,21H11V13H3M13,21H21V13H13M13,3V11H21V3" />
                      </svg>
                      <span>Auto</span>
                    </button>
                    <button
                      onClick={() => arrangeWindows("cascade")}
                      className="px-3 py-1 bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
                      title="Organizar en cascada"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M2,5V19H20V17H4V5M24,3H6V15H24V3M22,5H8V13H22V5Z" />
                      </svg>
                      <span>Cascada</span>
                    </button>
                  </div>
                )}

                {/* User Profile Menu */}
                <div className="flex items-center space-x-3">
                  {/* <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                    <svg
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.19 14,4.29 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A2,2 0 0,1 12,23A2,2 0 0,1 10,21" />
                    </svg>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  </button> */}

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-teal-700">
                        {userInfo?.cliente?.[0]?.nomcli}{" "}
                        {userInfo?.cliente?.[0]?.apecli}
                      </p>
                      <p className="text-xs text-gray-500">
                        Último acceso: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-teal-200 shadow-sm relative">
                      <img
                        src="/path/to/user/avatar.png" // Reemplazar con la ruta real del avatar del usuario si está disponible
                        alt="Perfil de usuario"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center"
                        style={{ display: 'none' }}
                      >
                        <span className="text-white font-bold text-sm">
                          {userInfo?.cliente?.[0]?.nomcli?.charAt(0)}
                          {userInfo?.cliente?.[0]?.apecli?.charAt(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Dashboard Area */}
        <main className="flex-1 relative overflow-hidden h-full">
          {/* Background Dashboard Content */}
          <div className="absolute inset-0 overflow-auto">
            <DashboardHomeContent
              recentProducts={recentProducts}
              onProductClick={handleProductClick}
            />
          </div>

          {/* Windows Layer */}
          <div className="absolute inset-0 pointer-events-none">
            {windows.map((window) => (
              <div key={window.id} className="pointer-events-auto">
                <WindowPanel
                  window={window}
                  onClose={closeWindow}
                  onMinimize={minimizeWindow}
                  onMaximize={maximizeWindow}
                  onFocus={focusWindow}
                  onPositionChange={updateWindowPosition}
                  onSizeChange={updateWindowSize}
                >
                  {React.createElement(window.component)}
                </WindowPanel>
              </div>
            ))}
          </div>

          {/* Window Taskbar (when windows are minimized) */}
          {windows.some((w) => w.isMinimized) && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 px-4 py-2">
              <div className="flex space-x-2">
                {windows
                  .filter((w) => w.isMinimized)
                  .map((window) => (
                    <button
                      key={window.id}
                      onClick={() => restoreAndMaximizeWindow(window.id)}
                      className="flex items-center space-x-2 px-3 py-2 bg-sky-100 hover:bg-sky-200 rounded-lg transition-colors text-sm"
                      title={`Maximizar ${getShortTitle(window)}`}
                    >
                      <div className="w-4 h-4 bg-sky-500 rounded-sm flex items-center justify-center">
                        <svg
                          className="w-2 h-2 text-white"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z" />
                        </svg>
                      </div>
                      <span className="max-w-32 truncate">{getShortTitle(window)}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Styles */}
      <style>{`
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-in {
          animation: slideInFromTop 0.2s ease-out;
        }

        .slide-in-from-top-2 {
          transform: translateY(-8px);
        }
      `}</style>

   
    </div>
  );
};

export default Dashboard;
