import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute, { PublicRoute, AdminRoute, CashierRoute } from './components/ProtectedRoute';

// Pages
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetailsPage from './pages/CustomerDetailsPage';
import CustomerFormPage from './pages/CustomerFormPage';
import Orders from './pages/Orders';
import OrderDetailsPage from './pages/OrderDetailsPage';
import OrderFormPage from './pages/OrderFormPage';
import Services from './pages/Services';
import ServiceDetailsPage from './pages/ServiceDetailsPage';
import ServiceFormPage from './pages/ServiceFormPage';
import Staff from './pages/Staff';
import StaffDetailsPage from './pages/StaffDetailsPage';
import StaffFormPage from './pages/StaffFormPage';
import Users from './pages/Users';
import UserDetailsPage from './pages/UserDetailsPage';
import UserFormPage from './pages/UserFormPage';
import Reports from './pages/Reports';

// Constants
import { ROUTES } from './constants';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route
                path={ROUTES.LOGIN}
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                {/* Dashboard - accessible by all authenticated users */}
                <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />

                {/* Customer routes - accessible by admin and cashier */}
                <Route path={ROUTES.CUSTOMERS} element={<Customers />} />
                <Route path="/customers/new" element={<CustomerFormPage />} />
                <Route path="/customers/edit/:id" element={<CustomerFormPage />} />
                <Route path="/customers/:id" element={<CustomerDetailsPage />} />

                {/* Order routes - accessible by admin and cashier */}
                <Route path={ROUTES.ORDERS} element={<Orders />} />
                <Route path="/orders/new" element={<OrderFormPage />} />
                <Route path="/orders/edit/:id" element={<OrderFormPage />} />
                <Route path="/orders/:id" element={<OrderDetailsPage />} />

                {/* Service routes - admin only */}
                <Route
                  path={ROUTES.SERVICES}
                  element={
                    <AdminRoute>
                      <Services />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/services/new"
                  element={
                    <AdminRoute>
                      <ServiceFormPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/services/edit/:id"
                  element={
                    <AdminRoute>
                      <ServiceFormPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/services/:id"
                  element={
                    <AdminRoute>
                      <ServiceDetailsPage />
                    </AdminRoute>
                  }
                />

                {/* Staff routes - admin only */}
                <Route
                  path={ROUTES.STAFF}
                  element={
                    <AdminRoute>
                      <Staff />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/staff/new"
                  element={
                    <AdminRoute>
                      <StaffFormPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/staff/edit/:id"
                  element={
                    <AdminRoute>
                      <StaffFormPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/staff/:id"
                  element={
                    <AdminRoute>
                      <StaffDetailsPage />
                    </AdminRoute>
                  }
                />

                {/* User routes - admin only */}
                <Route
                  path={ROUTES.USERS}
                  element={
                    <AdminRoute>
                      <Users />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/users/new"
                  element={
                    <AdminRoute>
                      <UserFormPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/users/edit/:id"
                  element={
                    <AdminRoute>
                      <UserFormPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/users/:id"
                  element={
                    <AdminRoute>
                      <UserDetailsPage />
                    </AdminRoute>
                  }
                />

                {/* Report routes - accessible by all authenticated users */}
                <Route
                  path={`${ROUTES.REPORTS}/*`}
                  element={<Reports />}
                />
              </Route>

              {/* Catch all route */}
              <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            </Routes>
          </div>
        </Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
