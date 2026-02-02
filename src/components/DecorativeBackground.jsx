import React from 'react';
import { motion } from 'framer-motion';

const DecorativeBackground = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {/* Soft glowing orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pink-300/20 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-red-200/20 rounded-full blur-3xl" />
            <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-64 h-64 bg-purple-200/10 rounded-full blur-3xl" />

            {/* Floating Sparkles/Hearts */}
            {[...Array(15)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{
                        x: Math.random() * window.innerWidth,
                        y: Math.random() * window.innerHeight,
                        scale: 0,
                        opacity: 0
                    }}
                    animate={{
                        y: [null, Math.random() * -100],
                        scale: [0, 1, 0],
                        opacity: [0, 0.4, 0]
                    }}
                    transition={{
                        duration: 5 + Math.random() * 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: Math.random() * 5
                    }}
                    className="absolute text-pink-300"
                    style={{ fontSize: `${Math.random() * 20 + 10}px` }}
                >
                    {i % 2 === 0 ? '✨' : '💖'}
                </motion.div>
            ))}
        </div>
    );
};

export default DecorativeBackground;
