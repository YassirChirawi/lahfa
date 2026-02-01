import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

const FloatingActionButton = ({ onClick, label = "Add" }) => {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg z-40 md:hidden flex items-center justify-center"
            onClick={onClick}
            aria-label={label}
        >
            <Plus size={24} />
        </motion.button>
    );
};

export default FloatingActionButton;
