import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import '../styles/layout.css';

import { Toaster } from 'react-hot-toast';

const MainLayout = () => {
  return (
    <div className="app-layout">
      <Toaster position="top-right" />
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
