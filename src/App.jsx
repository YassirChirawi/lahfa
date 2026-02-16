import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { PromotionsProvider } from './hooks/usePromotions';
import { ConfirmationProvider } from './context/ConfirmationContext';
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
import Pickups from './pages/Pickups';
import SupportAI from './pages/SupportAI';
import Catalogue from './pages/Catalogue';
import { SecurityProvider, useSecurity } from './context/SecurityContext';
import LockScreen from './components/LockScreen';
import { CopilotProvider } from './context/CopilotContext';

// Inner component to access SecurityContext and Location
const AppContent = () => {
  const { isLocked } = useSecurity();
  const location = useLocation();

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
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="finances" element={<Finances />} />
            <Route path="clients" element={<Clients />} />
            <Route path="products" element={<Products />} />
            <Route path="history" element={<History />} />
            <Route path="support-ai" element={<SupportAI />} />
            <Route path="settings" element={<Settings />} />
            <Route path="pickups" element={<Pickups />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </div>
    </>
  );
};

function App() {
  return (
    <HashRouter>
      <SecurityProvider>
        <PromotionsProvider>
          <ConfirmationProvider>
            <ClientProvider>
              <ProductProvider>
                <CollectionProvider>
                  <OrderProvider>
                    <ExpenseProvider>
                      <CopilotProvider>
                        <AppContent />
                      </CopilotProvider>
                    </ExpenseProvider>
                  </OrderProvider>
                </CollectionProvider>
              </ProductProvider>
            </ClientProvider>
          </ConfirmationProvider>
        </PromotionsProvider>
      </SecurityProvider>
    </HashRouter>
  );
}

export default App;
