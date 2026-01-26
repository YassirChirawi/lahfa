import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShoppingCart, PieChart, Wallet, Users, Box, Clock, Settings as SettingsIcon } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/logo.jpg" alt="LAHFA Intimate" className="logo-img" style={{ maxWidth: '40px', borderRadius: '8px' }} />
          <h2>Lahfa'h</h2>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <PieChart size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <ShoppingCart size={20} />
            <span>Orders</span>
          </NavLink>
          <NavLink to="/clients" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <Users size={20} />
            <span>Clients</span>
          </NavLink>
          <NavLink to="/finances" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <Wallet size={20} />
            <span>Finances</span>
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <Box size={20} />
            <span>Produits</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <Clock size={20} />
            <span>Historique</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
            <SettingsIcon size={20} />
            <span>Settings</span>
          </NavLink>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
