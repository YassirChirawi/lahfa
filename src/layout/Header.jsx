import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, User, Menu, ArrowLeft } from 'lucide-react';

const Header = ({ onMenuClick }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // Only show back button on sub-pages (not root dashboard)
    const showBackButton = location.pathname !== '/';

    return (
        <header className="header">
            <div className="flex items-center gap-3">
                <button
                    className="icon-btn mobile-menu-btn"
                    onClick={onMenuClick}
                    aria-label="Toggle Menu"
                >
                    <Menu size={24} />
                </button>

                {showBackButton && (
                    <button
                        className="icon-btn back-btn"
                        onClick={() => navigate(-1)}
                        aria-label="Go Back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}

                <h2 className="header-title">
                    {location.pathname === '/' ? 'Dashboard' :
                        location.pathname.substring(1).charAt(0).toUpperCase() + location.pathname.slice(2)}
                </h2>
            </div>
            <div className="header-actions">
                {/* Notification Bell Removed */}
                <div className="user-profile">
                    <div className="avatar">
                        <img src="/eya-profile.png" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    </div>
                    <span>Eya OUCHENE <span style={{ fontSize: '1.2rem' }}>🎀</span></span>
                </div>
            </div>
        </header>
    );
};

export default Header;
