import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { getWhatsappMessage } from '../utils/whatsappUtils';

const WhatsAppPreviewModal = ({ isOpen, onClose, order, initialLang = 'fr' }) => {
    const [language, setLanguage] = useState(initialLang);
    const [message, setMessage] = useState('');
    const [showPersonalization, setShowPersonalization] = useState(true);

    // Personalization State
    const [vars, setVars] = useState({
        clientName: '',
        city: '',
        address: '',
        phone: '',
        product: '',
        price: ''
    });

    // Initialize when order changes
    useEffect(() => {
        if (order) {
            setLanguage(initialLang);
            // Initialize vars
            const items = order.items || [];
            const productName = items.length > 0
                ? items.map(i => i.article || i.name).join(', ')
                : (order.article || '');

            setVars({
                clientName: order.customer || '',
                city: order.city || '',
                address: order.address || '',
                phone: order.phone || '', // Editable phone only for display placeholder or logic? Mainly for message.
                product: productName,
                price: order.amount ? order.amount.toFixed(2) : ''
            });
        }
    }, [order, initialLang, isOpen]);

    // Regenerate message when vars or language change
    useEffect(() => {
        if (order) {
            const generatedMsg = getWhatsappMessage(order.status, order, language, {
                clientName: vars.clientName,
                city: vars.city,
                address: vars.address,
                phone: vars.phone,
                product: vars.product,
                price: vars.price
            });
            setMessage(generatedMsg);
        }
    }, [order, language, vars]);


    if (!isOpen || !order) return null;

    const handleSend = () => {
        // Use the phone number from the input state if valid, otherwise fallback to order phone
        let phoneToUse = vars.phone || order.phone;
        if (!phoneToUse) return;

        // Clean phone number
        let phone = phoneToUse.replace(/[\s\-\(\)]/g, '');
        if (phone.startsWith('+')) phone = phone.substring(1);
        else if (phone.startsWith('00')) phone = phone.substring(2);
        else if (phone.startsWith('0') && phone.length > 9) phone = '212' + phone.substring(1);

        const text = encodeURIComponent(message);

        // Check if mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        let url;
        if (isMobile) {
            // Mobile: Use standard wa.me or API link which opens app deeply
            url = `https://wa.me/${phone}?text=${text}`;
        } else {
            // Desktop: Force WhatsApp Web interface directly (skips landing page)
            url = `https://web.whatsapp.com/send?phone=${phone}&text=${text}`;
        }

        window.open(url, '_blank');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-2 rounded-full text-green-600">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Message WhatsApp</h3>
                            <p className="text-xs text-gray-500">Pour {vars.clientName || 'Client'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1">
                    {/* Controls */}
                    <div className="p-4 bg-white border-b space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Langue :</span>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setLanguage('fr')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${language === 'fr' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    🇫🇷 FR
                                </button>
                                <button
                                    onClick={() => setLanguage('darija')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${language === 'darija' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    🇲🇦 DAR
                                </button>
                            </div>
                        </div>

                        {/* Personalization Toggle */}
                        <div className="border rounded-xl overflow-hidden">
                            <button
                                onClick={() => setShowPersonalization(!showPersonalization)}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 text-xs font-medium text-gray-700 hover:bg-gray-100 transition"
                            >
                                <span className="flex items-center gap-2">
                                    <Edit2 size={14} className="text-gray-400" /> Personnaliser les variables
                                </span>
                                {showPersonalization ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            {/* Inputs */}
                            {showPersonalization && (
                                <div className="p-3 bg-white grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
                                    <div className="col-span-2">
                                        <label className="text-[10px] uppercase text-gray-400 font-bold mb-1 block">Nom Client</label>
                                        <input
                                            value={vars.clientName}
                                            onChange={e => setVars({ ...vars, clientName: e.target.value })}
                                            className="w-full text-sm p-2 border rounded-lg focus:ring-1 focus:ring-green-500 outline-none"
                                            placeholder="Nom"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[10px] uppercase text-gray-400 font-bold mb-1 block">Ville</label>
                                        <input
                                            value={vars.city}
                                            onChange={e => setVars({ ...vars, city: e.target.value })}
                                            className="w-full text-sm p-2 border rounded-lg focus:ring-1 focus:ring-green-500 outline-none"
                                            placeholder="Ville"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="text-[10px] uppercase text-gray-400 font-bold mb-1 block">Prix (Total)</label>
                                        <input
                                            value={vars.price}
                                            onChange={e => setVars({ ...vars, price: e.target.value })}
                                            className="w-full text-sm p-2 border rounded-lg focus:ring-1 focus:ring-green-500 outline-none"
                                            placeholder="Prix"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] uppercase text-gray-400 font-bold mb-1 block">Produit</label>
                                        <input
                                            value={vars.product}
                                            onChange={e => setVars({ ...vars, product: e.target.value })}
                                            className="w-full text-sm p-2 border rounded-lg focus:ring-1 focus:ring-green-500 outline-none"
                                            placeholder="Nom du produit"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="p-4">
                        <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                            Message Final
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full h-48 p-4 border rounded-xl shadow-sm text-sm leading-relaxed focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none font-sans"
                            placeholder="Le message apparaîtra ici..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-white flex justify-end gap-3 z-10">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSend}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 font-medium shadow-lg shadow-green-500/20 transition transform active:scale-95"
                    >
                        <Send size={18} />
                        Envoyer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppPreviewModal;
