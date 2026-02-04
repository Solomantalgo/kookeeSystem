import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { wsService } from './services/websocket';
import { Layout } from './components/layout/Layout';
import { DashboardProvider } from './context/DashboardContext';

// Auth & Core
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Alerts } from './pages/Alerts';
import { Merchandisers } from './pages/Merchandisers';
import { Outlets } from './pages/Outlets';
import { ReportsList } from './pages/ReportsList';
import { ReportDetail } from './pages/ReportDetail';
import { AssignOutlets } from './pages/AssignOutlets';
import { MissingReports } from './pages/MissingReports';
import { StockMatrix } from './pages/StockMatrix';
// Sales Pages
import { SalesDashboard } from './pages/sales/SalesDashboard';
import { SalesRoutes } from './pages/sales/SalesRoutes';
import { SalesAgents } from './pages/sales/SalesAgents';
import { LiveTrackingMap } from './pages/sales/LiveTrackingMap';
import { CustomerNavigationMap } from './pages/sales/CustomerNavigationMap';
import { RouteOverviewMap } from './pages/sales/RouteOverviewMap';

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Connect WebSocket on app start
    wsService.connect();
    return () => {
      wsService.disconnect();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/sales" replace />} />
                <Route path="dashboard" element={<Dashboard />} />

                {/* Sales Section */}
                <Route path="sales">
                  <Route index element={<SalesDashboard />} />
                  <Route path="live-tracking" element={<LiveTrackingMap />} />
                  <Route path="customer-nav/:id" element={<CustomerNavigationMap />} />
                  <Route path="route-overview/:id" element={<RouteOverviewMap />} />
                  <Route path="routes" element={<SalesRoutes />} />
                  <Route path="agents" element={<SalesAgents />} />
                </Route>

                {/* Merchandiser Section (Untouched) */}
                <Route path="merchandisers" element={<Merchandisers />} />
                <Route path="outlets" element={<Outlets />} />
                <Route path="reports" element={<ReportsList />} />
                <Route path="reports/:id" element={<ReportDetail />} />
                <Route path="stock-matrix" element={<StockMatrix />} />
                <Route path="assign" element={<AssignOutlets />} />
                <Route path="missing" element={<MissingReports />} />
                <Route path="alerts" element={<Alerts />} />

                {/* Removed Performance/Analytics/Tracking as requested/replaced */}
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </DashboardProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
