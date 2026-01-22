import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import Dashboard from './pages/Dashboard';
import { OrderProvider } from './context/OrderContext';
import Orders from './pages/Orders';
import { ExpenseProvider } from './context/ExpenseContext';
import Finances from './pages/Finances';
import { ClientProvider } from './context/ClientContext';
import Clients from './pages/Clients';
import { ProductProvider } from './context/ProductContext';
import Products from './pages/Products';

import { SecurityProvider, useSecurity } from './context/SecurityContext';
import LockScreen from './components/LockScreen';

// Inner component to access SecurityContext
const AppContent = () => {
  const { isLocked } = useSecurity();

  return (
    <>
      {isLocked && <LockScreen />}
      <div style={{ filter: isLocked ? 'blur(5px)' : 'none', pointerEvents: isLocked ? 'none' : 'auto', transition: 'filter 0.3s' }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="finances" element={<Finances />} />
              <Route path="clients" element={<Clients />} />
              <Route path="products" element={<Products />} />
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </div>
    </>
  );
};

function App() {
  return (
    <SecurityProvider>
      <ClientProvider>
        <ProductProvider>
          <OrderProvider>
            <ExpenseProvider>
              <AppContent />
            </ExpenseProvider>
          </OrderProvider>
        </ProductProvider>
      </ClientProvider>
    </SecurityProvider>
  );
}

export default App;
