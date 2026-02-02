import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Truck, Gift } from 'lucide-react';

const banners = [
    {
        id: 1,
        title: "Livraison Gratuite 🚚",
        subtitle: "À partir de 200 DH partout au Maroc",
        text: "Commandez vite vos coups de cœur !",
        icon: <Truck size={48} className="text-white drop-shadow-md" />,
        gradient: "from-red-500 via-pink-500 to-rose-500"
    },
    {
        id: 2,
        title: "Sois une déesse ✨",
        subtitle: "Collection Intimate",
        text: "Révèle ta beauté intérieure...",
        icon: <Sparkles size={48} className="text-yellow-200 drop-shadow-md" />,
        gradient: "from-fuchsia-600 via-purple-600 to-indigo-600"
    }
];

const BannerCarousel = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-48 md:h-64 rounded-3xl overflow-hidden shadow-xl mb-8 mx-auto max-w-7xl group">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className={`absolute inset-0 bg-gradient-to-br ${banners[currentIndex].gradient} flex items-center justify-center p-6 text-center`}
                >
                    {/* Background Texture/Sparkles */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat mix-blend-overlay"></div>

                    {/* Floating Hearts Animation Background */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ y: 200, opacity: 0 }}
                                animate={{ y: -200, opacity: [0, 1, 0] }}
                                transition={{
                                    duration: 3 + Math.random() * 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 2,
                                    ease: "linear"
                                }}
                                className="absolute text-white/30"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    fontSize: `${Math.random() * 20 + 10}px`
                                }}
                            >
                                <Heart fill="currentColor" />
                            </motion.div>
                        ))}
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-2 md:gap-4 text-white">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {banners[currentIndex].icon}
                        </motion.div>

                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-3xl md:text-5xl font-extrabold font-serif tracking-tight drop-shadow-sm"
                        >
                            {banners[currentIndex].title}
                        </motion.h2>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-lg md:text-2xl font-medium text-pink-50"
                        >
                            {banners[currentIndex].subtitle}
                        </motion.p>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-sm md:text-base italic opacity-90"
                        >
                            "{banners[currentIndex].text}"
                        </motion.p>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Progress Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default BannerCarousel;
