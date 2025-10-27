// Barrel export principal para componentes
// Exporta todos los componentes principales del dashboard

// Componentes de autenticación
export { default as TwoFactorAuthPage } from './TwoFactorAuthPage';

// Componentes principales del dashboard
export { default as Dashboard } from './dashboard/Dashboard';
export { default as InvestmentProductForm } from './dashboard/InvestmentProductForm';
export { default as SavingsProductForm } from './dashboard/SavingsProductForm';
export { default as CreditProductForm } from './dashboard/CreditProductForm';
export { default as CardsProductForm } from './dashboard/CardsProductForm';
export { default as CertificadosForm } from './dashboard/CertificadosForm';
export { default as InsuranceProductForm } from './dashboard/InsuranceProductForm';
export { default as ServiciosFacilitoForm } from './dashboard/ServiciosFacilitoForm';

// Componentes de inversión (re-export desde investment)
export * from './dashboard/investment';
