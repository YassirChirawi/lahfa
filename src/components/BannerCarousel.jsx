import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const banners = [
    {
        id: 1,
        title: "LIVRAISON OFFERTE",
        subtitle: "Dès 250 DH d'achats"
    },
    {
        id: 2,
        title: "NOUVELLE COLLECTION",
        subtitle: "Intimate Elegance"
    }
];

const BannerCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

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
