import React, { useState, useEffect } from 'react';
import { usePromotions } from '../hooks/usePromotions';
import { motion, AnimatePresence } from 'framer-motion';

const BannerCarousel = () => {
    const { promo } = usePromotions();
    const [currentIndex, setCurrentIndex] = useState(0);

    const banners = [
        {
            id: 1,
            title: "LIVRAISON OFFERTE",
            subtitle: `Dès ${promo.freeDeliveryThreshold || 300} DH d'achats`
        },
        // Only show Promo banner if active
        ...(promo.isActive ? [{
            id: 2,
            title: promo.bannerText || "OFFRE SPECIALE ❤️",
            subtitle: promo.subtitle || (promo.type === 'bogo' ? "1 ACHETÉ = 1 OFFERT !" : (promo.value ? `-${promo.value}% SUR TOUT !` : "Profitez-en !"))
        }] : []),
        {
            id: 3,
            title: "NOUVELLE COLLECTION",
            subtitle: "Intimate Elegance"
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [banners.length]);

    return (
        <div className="h-full flex items-center justify-center overflow-hidden w-full">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row items-center gap-2 md:gap-3 text-center"
                >
                    <span className="text-xs md:text-sm font-serif tracking-widest text-gray-900 uppercase font-bold border-b border-pink-200 pb-0.5">
                        {banners[currentIndex].title}
                    </span>
                    <span className="text-[10px] md:text-xs font-light tracking-wide text-gray-500 uppercase">
                        {banners[currentIndex].subtitle}
                    </span>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default BannerCarousel;
