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
                        <User size={20} />
                    </div>
                    <span>Admin User</span>
                </div>
            </div>
        </header>
    );
};

export default Header;
