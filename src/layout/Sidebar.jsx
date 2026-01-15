import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, PieChart, Wallet } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo.jpg" alt="LAHFA Intimate" className="logo-img" style={{ maxWidth: '40px', borderRadius: '8px' }} />
        <h2>LAHFA</h2>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <PieChart size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ShoppingCart size={20} />
          <span>Orders</span>
        </NavLink>
        <NavLink to="/finances" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Wallet size={20} />
          <span>Finances</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
