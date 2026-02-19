// src/routesConfig.js
import { lazy } from 'react';

// Lazy load components
const MainPage = lazy(() => import('./components/MainPage'));
const AdminAuthForm = lazy(() => import('./components/login-forms/AdminAuthForm'));
const DistributorAuthForm = lazy(() => import('./components/login-forms/DistributorAuthForm'));
const CorporateAuthForm = lazy(() => import('./components/login-forms/CorporateAuthForm'));
const Unauthorized = lazy(() => import('./components/Unauthorized'));

const AdminDashboard = lazy(() => import('./components/dashboard/AdminDashboard'));
const DistributorDashboard = lazy(() => import('./components/dashboard/DistributorDashboard'));
const CorporateDashboard = lazy(() => import('./components/dashboard/CorporateDashboard'));

const StockItemMaster = lazy(() => import('./redux/master-forms/StockItemMaster'));
const CustomerMaster = lazy(() => import('./redux/master-forms/CustomerMaster'));
const DistributorMaster = lazy(() => import('./redux/master-forms/DistributorMaster'));
const CorporateMaster = lazy(() => import('./redux/master-forms/CorporateMaster'));

const ViewFetchMaster = lazy(() => import('./components/fetch-page/ViewFetchMaster'));
const ViewFetchReport = lazy(() => import('./components/reports-page/ViewFetchReport'));
const ViewPendingFetchReport = lazy(() => import('./components/reports-page/ViewPendingFetchReport'));
const ViewItemFetchReport = lazy(() => import('./components/reports-page/ViewItemFetchReport'));

const ViewFetchCorporate = lazy(() => import('./components/reports-page/ViewFetchCorporate'));
const ViewFetchDistributor = lazy(() => import('./components/reports-page/ViewFetchDistributor'));

const NewOrder = lazy(() => import('./components/orders-page/NewOrder'));

// Route config array
const routes = [
  // Public routes
  { path: '/', element: MainPage },
  { path: '/admin-login', element: AdminAuthForm },
  { path: '/distributor-login', element: DistributorAuthForm },
  { path: '/corporate-login', element: CorporateAuthForm },
  { path: '/unauthorized', element: Unauthorized },

  // Dashboards
  { path: '/admin', element: AdminDashboard, roles: ['admin'] },
  { path: '/distributor', element: DistributorDashboard, roles: ['admin', 'distributor'] },
  { path: '/corporate', element: CorporateDashboard, roles: ['admin', 'direct'] },

  // Master routes
  { path: '/inventory-master', element: StockItemMaster, roles: ['admin', 'distributor', 'direct'] },
  { path: '/customer-master', element: CustomerMaster, roles: ['admin', 'distributor', 'direct'] },
  { path: '/distributor-master', element: DistributorMaster, roles: ['admin', 'distributor', 'direct'] },
  { path: '/corporate-master', element: CorporateMaster, roles: ['admin', 'distributor', 'direct'] },

  // Fetch/View
  { path: '/fetch-view-master/:type', element: ViewFetchMaster, roles: ['admin', 'distributor', 'direct'] },
  { path: '/fetch-report', element: ViewFetchReport, roles: ['admin', 'distributor', 'direct'] },
  { path: '/fetch-pending-report', element: ViewPendingFetchReport, roles: ['admin', 'distributor', 'direct'] },
  { path: '/fetch-item-report', element: ViewItemFetchReport, roles: ['admin', 'distributor', 'direct'] },
  { path: '/fetch-corporate', element: ViewFetchCorporate, roles: ['admin', 'distributor', 'direct'] },
  { path: '/fetch-distributor', element: ViewFetchDistributor, roles: ['admin', 'distributor', 'direct'] },

  // View routes
  { path: '/inventory-view/:id', element: StockItemMaster, roles: ['admin', 'distributor', 'direct'] },
  { path: '/customer-view/:id', element: CustomerMaster, roles: ['admin', 'distributor', 'direct'] },
  { path: '/distributor-view/:customer_code', element: DistributorMaster, roles: ['admin', 'distributor', 'direct'] },
  { path: '/corporate-view/:customer_code', element: CorporateMaster, roles: ['admin', 'distributor', 'direct'] },

  // Alter routes
  { path: '/inventory-alter', element: StockItemMaster, roles: ['admin', 'distributor', 'direct'] },
  { path: '/customer-alter', element: CustomerMaster, roles: ['admin', 'distributor', 'direct'] },
  { path: '/distributor-alter/:usercode', element: DistributorMaster, roles: ['admin', 'distributor', 'direct'] },

  // Order reports
  { path: '/order-report-approved/:orderNumberFetch', element: NewOrder, roles: ['admin', 'distributor', 'direct'] },
  { path: '/order-report-corporate/:orderNumberFetch', element: NewOrder, roles: ['admin', 'distributor', 'direct'] },
  { path: '/order-report-distributor/:orderNumberFetch', element: NewOrder, roles: ['admin', 'distributor', 'direct'] },
];

export default routes;
