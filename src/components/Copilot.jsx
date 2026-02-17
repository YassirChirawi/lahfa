import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Command, BarChart2, ShoppingBag, Users, Settings, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCopilot } from '../context/CopilotContext';
import mervatAvatar from '../assets/mervat.jpeg';

const Copilot = () => {
    const { isOpen, setIsOpen, messages, sendMessage, isTyping, pageName, executeAction } = useCopilot();
    const [input, setInput] = useState('');
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input.trim());
        setInput('');
    };

    const quickCommands = [
        { label: 'Stats Aujourd\'hui', cmd: '/stats', icon: BarChart2 },
        { label: 'Commandes', cmd: '/nav orders', icon: ShoppingBag },
        { label: 'Clients VIP', cmd: '/search VIP', icon: Users },
        { label: 'Paramètres', cmd: '/nav settings', icon: Settings },
    ];

    return (
        <>
            {/* FLOATING ACTION BUTTON */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed sm:bottom-6 bottom-4 sm:right-6 right-4 z-50 p-3 sm:p-4 rounded-full shadow-2xl flex items-center justify-center transition-colors ${isOpen ? 'bg-rose-500 text-white' : 'bg-rose-400 text-white'
                    }`}
            >
                {isOpen ? <X size={24} /> : (
                    <img src={mervatAvatar} alt="Mervat" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/50 shadow-inner object-cover" />
                )}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-400"></span>
                    </span>
                )}
            </motion.button>

            {/* COPILOT PANEL */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.95 }}
                        className="fixed sm:bottom-24 bottom-0 sm:right-6 right-0 z-50 w-full sm:w-[380px] h-full sm:h-[600px] bg-white sm:rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
                    >
                        {/* HEADER */}
                        <div className="bg-rose-400 p-4 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-0.5 rounded-lg border border-white/30 overflow-hidden">
                                    <img src={mervatAvatar} alt="Mervat" className="w-10 h-10 rounded-lg object-cover" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Mervat ✨</h3>
                                    <p className="text-[10px] opacity-80 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                        Analysant : {pageName}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded">
                                <Minimize2 size={18} />
                            </button>
                        </div>

                        {/* MESSAGES */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-rose-400 text-white rounded-tr-none'
                                        : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-none'
                                        }`}>
                                        {msg.content}

                                        {msg.action && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <button
                                                    onClick={() => executeAction(msg.action.type, msg.action.data)}
                                                    className="w-full py-2 bg-rose-50 text-rose-700 rounded-lg font-bold hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    {msg.action.label}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75"></span>
                                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150"></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* QUICK COMMANDS */}
                        <div className="p-2 border-t border-gray-100 bg-white flex gap-2 overflow-x-auto no-scrollbar">
                            {quickCommands.map((qc) => (
                                <button
                                    key={qc.cmd}
                                    onClick={() => sendMessage(qc.cmd)}
                                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-600 rounded-full text-[11px] font-medium transition-colors"
                                >
                                    <qc.icon size={12} />
                                    {qc.label}
                                </button>
                            ))}
                        </div>

                        {/* INPUT */}
                        <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100 pb-8 sm:pb-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Posez une question maman Eya..."
                                    className="w-full pl-4 pr-12 py-3.5 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-rose-300 focus:bg-white transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="absolute right-2 top-2 p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-30"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                            <div className="mt-2 flex justify-between items-center text-[10px] text-gray-400 px-1">
                                <span className="flex items-center gap-1"><Command size={10} /> Appuyez sur Entrée</span>
                                <span>Mervat AI v3.0 ✨</span>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Copilot;
