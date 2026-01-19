import React from 'react';

const Button = ({ children, onClick, className = '', icon: Icon, disabled = false, type = "button" }) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className} ${!className.includes('bg-') ? 'bg-indigo-600 text-white hover:bg-indigo-700' : ''}`}
        >
            {Icon && <Icon size={18} />}
            <span>{children}</span>
        </button>
    );
};

export default Button;
