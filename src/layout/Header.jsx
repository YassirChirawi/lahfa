import React from 'react';
import { Bell, User } from 'lucide-react';

const Header = () => {
    return (
        <header className="header">
            <h2 className="header-title">Dashboard</h2>
            <div className="header-actions">
                <button className="icon-btn">
                    <Bell size={20} />
                </button>
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
