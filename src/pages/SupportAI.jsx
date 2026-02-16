import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Bot, User, Phone, Check, CheckCheck } from 'lucide-react';
import autoBotService from '../services/whatsappAutoBot';
import { motion, AnimatePresence } from 'framer-motion';

const SupportAI = () => {
    const [messages, setMessages] = useState([
        { id: 1, text: "Bonjour! Je suis l'assistant de Lahfa'h. Veuillez simuler un client en entrant son numéro de téléphone d'abord.", sender: 'bot', time: new Date() }
    ]);
    const [inputText, setInputText] = useState("");
    const [testPhone, setTestPhone] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isThinking]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        if (!testPhone) {
            // First input is treated as phone number
            setTestPhone(inputText.trim());
            setMessages(prev => [...prev,
            { id: Date.now(), text: inputText, sender: 'user', time: new Date() },
            { id: Date.now() + 1, text: `Numéro ${inputText} enregistré. Simulez maintenant un message client (ex: "Où est mon colis?").`, sender: 'bot', time: new Date() }
            ]);
            setInputText("");
            return;
        }

        // Standard Message Flow
        const userMsg = { id: Date.now(), text: inputText, sender: 'user', time: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInputText("");
        setIsThinking(true);

        // Simulate Network Delay
        setTimeout(async () => {
            try {
                const response = await autoBotService.handleIncomingMessage(testPhone, userMsg.text);

                const botMsg = {
                    id: Date.now() + 1,
                    text: response.reply,
                    sender: 'bot',
                    time: new Date(),
                    intent: response.intent,
                    orderRef: response.order?.ref || response.order?.id
                };

                setMessages(prev => [...prev, botMsg]);
            } catch (error) {
                setMessages(prev => [...prev, { id: Date.now() + 1, text: "Erreur lors du traitement.", sender: 'bot', time: new Date() }]);
            } finally {
                setIsThinking(false);
            }
        }, 800);
    };

    const resetSimulation = () => {
        setMessages([{ id: 1, text: "Bonjour! Je suis l'assistant de Lahfa'h. Veuillez simuler un client en entrant son numéro de téléphone d'abord.", sender: 'bot', time: new Date() }]);
        setTestPhone("");
        setInputText("");
    };

    return (
        <div className="h-screen flex flex-col md:flex-row bg-gray-50 overflow-hidden">
            {/* Sidebar / Configuration */}
            <div className="w-full md:w-80 bg-white border-r border-gray-200 p-6 flex flex-col gap-6 z-10 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Bot className="text-indigo-600" /> Support AI
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Simulateur de Chatbot WhatsApp</p>
                </div>

                <div className="card p-4 bg-indigo-50 border-indigo-100">
                    <h3 className="font-bold text-indigo-900 text-sm mb-2 flex items-center gap-2">
                        <Phone size={14} /> Numéro Test
                    </h3>
                    {testPhone ? (
                        <div className="flex justify-between items-center">
                            <span className="font-mono text-lg font-bold text-indigo-700">{testPhone}</span>
                            <button onClick={resetSimulation} className="text-xs text-red-500 hover:underline">Changer</button>
                        </div>
                    ) : (
                        <p className="text-sm text-indigo-400 italic">En attente de saisie...</p>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    <h3 className="font-bold text-gray-700 text-sm mb-3">Intents Détectés</h3>
                    <div className="space-y-2">
                        {messages.filter(m => m.sender === 'bot' && m.intent).map(m => (
                            <div key={m.id} className="text-xs bg-gray-100 p-2 rounded border border-gray-200">
                                <span className={`font-bold ${m.intent === 'TRACKING' ? 'text-green-600' : m.intent === 'COMPLAINT' ? 'text-red-600' : 'text-blue-600'}`}>
                                    {m.intent}
                                </span>
                                {m.orderRef && <span className="text-gray-500 block">Ref: {m.orderRef}</span>}
                                <p className="text-gray-400 mt-1 truncate">"{m.text}"</p>
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={resetSimulation} className="btn-secondary text-sm w-full">
                    Réinitialiser le Chat
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col relative bg-[#E5DDD5]">
                {/* Wallpaper Pattern Overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}></div>

                {/* Header */}
                <div className="bg-[#008069] text-white p-4 flex items-center gap-3 shadow-md z-10">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold">Assistant Lahfa'h</h2>
                        <p className="text-xs opacity-80">En ligne (Intelligent Auto-Response)</p>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 z-10">
                    {messages.map((msg) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[75%] p-3 rounded-lg shadow-sm relative ${msg.sender === 'user'
                                    ? 'bg-[#E7FFDB] rounded-tr-none'
                                    : 'bg-white rounded-tl-none'
                                    } text-sm text-gray-800 leading-relaxed whitespace-pre-wrap`}
                            >
                                {msg.text}
                                <span className="block text-[10px] text-gray-400 text-right mt-1 flex justify-end gap-1 items-center">
                                    {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {msg.sender === 'user' && <CheckCheck size={12} className="text-[#53bdeb]" />}
                                </span>
                            </div>
                        </motion.div>
                    ))}

                    {isThinking && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                            <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm flex gap-1 items-center">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="bg-[#F0F2F5] p-3 flex items-center gap-2 z-10">
                    <input
                        type="text"
                        className="flex-1 bg-white border-none rounded-lg py-3 px-4 focus:outline-none placeholder-gray-400"
                        placeholder={!testPhone ? "Entrez un numéro client pour commencer..." : "Scénario client (ex: Mon colis?)"}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        autoFocus
                    />
                    <button
                        type="submit"
                        className={`p-3 rounded-full transition-all ${inputText.trim() ? 'bg-[#008069] text-white hover:bg-[#006a56]' : 'bg-transparent text-gray-400 cursor-default'
                            }`}
                        disabled={!inputText.trim()}
                    >
                        <Send size={20} />
                    </button>
                </form>

                {/* DEBUG TOOL */}
                <div className="mt-4 pt-4 border-t border-gray-100 p-3 bg-[#F0F2F5] z-10">
                    <p className="text-xs text-gray-400 mb-2">Outil de diagnostic (si l'IA ne trouve rien) :</p>
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                if (!testPhone) {
                                    alert("Veuillez d'abord entrer un numéro de téléphone pour la simulation.");
                                    return;
                                }
                                const phoneNumber = testPhone;
                                const clean = phoneNumber.replace(/\D/g, '').replace(/^212/, '0');
                                const full = `212${clean.substring(1)}`;
                                const q1 = query(collection(db, 'orders'), where('phone', '==', clean));
                                const q2 = query(collection(db, 'orders'), where('phone', '==', full));
                                const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
                                let msg = `Diagnostic pour ${phoneNumber}:\n`;
                                msg += `Format 1 (${clean}): ${s1.size} commandes trouvées.\n`;
                                msg += `Format 2 (${full}): ${s2.size} commandes trouvées.\n`;
                                if (!s1.empty) s1.forEach(d => msg += `Found ID: ${d.id}, Phone: ${d.data().phone}\n`);
                                if (!s2.empty) s2.forEach(d => msg += `Found ID: ${d.id}, Phone: ${d.data().phone}\n`);
                                alert(msg);
                            } catch (e) { alert("Erreur diagnostic: " + e.message); }
                        }}
                        className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded"
                    >
                        🕵️‍♂️ Vérifier ce numéro dans la DB
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SupportAI;
