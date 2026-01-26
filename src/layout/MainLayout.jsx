import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import '../styles/layout.css';

import { Toaster } from 'react-hot-toast';
import useOrderPolling from '../hooks/useOrderPolling';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Start polling for order status updates
  useOrderPolling();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="app-layout">
      <Toaster position="top-right" />
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="main-content">
        <Header onMenuClick={toggleSidebar} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
