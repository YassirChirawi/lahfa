import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import Dashboard from './pages/Dashboard';
import { OrderProvider } from './context/OrderContext';
import Orders from './pages/Orders';
import { ExpenseProvider } from './context/ExpenseContext';
import { CollectionProvider } from './context/CollectionContext';
import Finances from './pages/Finances';
import { ClientProvider } from './context/ClientContext';
import Clients from './pages/Clients';
import { ProductProvider } from './context/ProductContext';
import Products from './pages/Products';
import History from './pages/History';
import Settings from './pages/Settings';
import Catalogue from './pages/Catalogue'; // Import Public Catalogue

import { SecurityProvider, useSecurity } from './context/SecurityContext';
import LockScreen from './components/LockScreen';

// Inner component to access SecurityContext and Location
const AppContent = () => {
  const { isLocked } = useSecurity();
  const location = useLocation();

  // Define public routes that don't require the lock screen
  const isPublicRoute = location.pathname.startsWith('/catalogue');

  return (
    <>
      {isLocked && !isPublicRoute && <LockScreen />}
      <div style={{
        filter: (isLocked && !isPublicRoute) ? 'blur(5px)' : 'none',
        pointerEvents: (isLocked && !isPublicRoute) ? 'none' : 'auto',
        transition: 'filter 0.3s'
      }}>
        <Routes>
          {/* Public Route */}
          <Route path="/catalogue" element={<Catalogue />} />

          {/* Protected Admin Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="finances" element={<Finances />} />
            <Route path="clients" element={<Clients />} />
            <Route path="products" element={<Products />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </div>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <SecurityProvider>
        <ClientProvider>
          <ProductProvider>
            <CollectionProvider>
              <OrderProvider>
                <ExpenseProvider>
                  <AppContent />
                </ExpenseProvider>
              </OrderProvider>
            </CollectionProvider>
          </ProductProvider>
        </ClientProvider>
      </SecurityProvider>
    </BrowserRouter>
  );
}

export default App;
