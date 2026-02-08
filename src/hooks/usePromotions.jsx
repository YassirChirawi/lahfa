import React, { createContext, useState, useEffect, useContext } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const PromotionsContext = createContext();

export const usePromotions = () => useContext(PromotionsContext);

export const PromotionsProvider = ({ children }) => {
    const [promo, setPromo] = useState({
        isActive: false,
        type: 'none', // 'bogo' (1 bought = 1 free), 'percentage', 'fixed'
        value: 0, // e.g., 20 for 20%
        badgeText: '',
        bannerText: '',
        subtitle: '',
        freeDeliveryThreshold: 300,
        endDate: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const docRef = doc(db, 'settings', 'promotions');
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Check if expired
                let isActive = data.isActive;
                if (data.endDate && new Date() > new Date(data.endDate)) {
                    isActive = false;
                }

                setPromo({
                    ...data,
                    isActive,
                    freeDeliveryThreshold: data.freeDeliveryThreshold || 300 // Default fallback
                });
            } else {
                // Default state if no settings found
                setPromo({
                    isActive: false,
                    type: 'none',
                    value: 0,
                    badgeText: '',
                    bannerText: '',
                    subtitle: '',
                    freeDeliveryThreshold: 300,
                    endDate: null
                });
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching promotions:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        promo,
        loading
    };

    return (
        <PromotionsContext.Provider value={value}>
            {children}
        </PromotionsContext.Provider>
    );
};
