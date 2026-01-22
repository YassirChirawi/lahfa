import React, { createContext, useContext, useState, useEffect } from 'react';

const SecurityContext = createContext();

export const useSecurity = () => useContext(SecurityContext);

export const SecurityProvider = ({ children }) => {
    const [isLocked, setIsLocked] = useState(true); // Locked by default on refresh
    const [lastActivity, setLastActivity] = useState(Date.now());
    const LOCK_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    const unlock = (code) => {
        if (code === '1907') {
            setIsLocked(false);
            setLastActivity(Date.now());
            return true;
        }
        return false;
    };

    const resetActivity = () => {
        if (!isLocked) {
            setLastActivity(Date.now());
        }
    };

    useEffect(() => {
        const events = ['mousemove', 'keydown', 'click', 'scroll'];

        const handleActivity = () => {
            resetActivity();
        };

        events.forEach(event => window.addEventListener(event, handleActivity));

        const interval = setInterval(() => {
            if (!isLocked && Date.now() - lastActivity > LOCK_TIMEOUT) {
                setIsLocked(true);
            }
        }, 10000); // Check every 10 seconds

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity));
            clearInterval(interval);
        };
    }, [isLocked, lastActivity]);

    return (
        <SecurityContext.Provider value={{ isLocked, unlock }}>
            {children}
        </SecurityContext.Provider>
    );
};
