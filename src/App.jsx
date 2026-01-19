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

function App() {
  return (
    <ClientProvider>
      <ProductProvider>
        <OrderProvider>
          <ExpenseProvider>
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
          </ExpenseProvider>
        </OrderProvider>
      </ProductProvider>
    </ClientProvider>
  );
}

export default App;
