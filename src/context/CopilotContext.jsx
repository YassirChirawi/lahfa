import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import aiService from '../services/aiService';
import { useOrders } from './OrderContext';
import { useClients } from './ClientContext';

const CopilotContext = createContext();

export const CopilotProvider = ({ children }) => {
    const { orders, addOrder } = useOrders();
    const { clients } = useClients();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, role: 'assistant', content: "Bonjour maman Eya ! 💖 Je suis Mervat, votre petite assistante. Comment puis-je vous aider aujourd'hui ? ✨🌸" }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Context automatic updates based on current page
    const getPageContext = () => {
        const path = location.pathname;
        if (path === '/') return "Dashboard (Vue d'ensemble)";
        if (path.includes('orders')) return "Gestion des Commandes";
        if (path.includes('products')) return "Catalogue Produits";
        if (path.includes('clients')) return "Gestion Clients";
        if (path.includes('finance')) return "Analyses Financières";
        return "Application Lahfa";
    };

    const executeAction = async (actionType, data) => {
        setIsTyping(true);
        let feedback = "";

        try {
            if (actionType === 'CREATE_ORDER') {
                // Resolve District ID for Sendit Compliance
                let districtId = null;
                try {
                    const citiesRef = doc(db, 'settings', 'cities');
                    const citiesSnap = await getDoc(citiesRef);
                    if (citiesSnap.exists()) {
                        const citiesList = citiesSnap.data().list || [];
                        const match = citiesList.find(c =>
                            c.name.toLowerCase().trim() === data.city?.toLowerCase().trim()
                        );
                        if (match) districtId = match.id;
                    }
                } catch (e) { console.warn("City resolution failed", e); }

                const newOrder = {
                    customer: data.customer,
                    phone: data.phone || '',
                    city: data.city || '',
                    address: data.address || data.city || '',
                    amount: data.amount || 0,
                    items: [{ article: data.product, quantity: data.quantity || 1, price: data.amount || 0 }],
                    status: 'Packing',
                    deliveryValues: {
                        districtId: districtId,
                        allowTry: false,
                        allowOpen: false,
                        isExchange: false
                    }
                };
                await addOrder(newOrder);
                feedback = `Commande créée pour ${data.customer} (${data.city}) ! 🎉\n` +
                    (districtId ? "La ville est conforme pour Sendit. ✅" : "⚠️ Ville non reconnue par Sendit (ID manquant).");

                const followUpMsg = {
                    id: Date.now(),
                    role: 'assistant',
                    content: feedback,
                    action: {
                        type: 'SEND_TO_SENDIT',
                        label: 'Envoyer à Sendit 🚚',
                        data: { ...data, districtId } // Pass resolved ID
                    }
                };
                setMessages(prev => [...prev, followUpMsg]);
            } else if (actionType === 'SEND_TO_SENDIT') {
                // Flow simulation
                feedback = "Demande envoyée à Sendit. Étiquette prête ! 📄\nVoulez-vous demander un ramassage ?";
                const pickupMsg = {
                    id: Date.now(),
                    role: 'assistant',
                    content: feedback,
                    action: { type: 'REQUEST_PICKUP', label: 'Demander Ramassage 📦' }
                };
                setMessages(prev => [...prev, pickupMsg]);
            } else if (actionType === 'REQUEST_PICKUP') {
                feedback = "Ramassage demandé ! Le livreur passera demain. ✅";
                setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: feedback }]);
            }
        } catch (e) {
            console.error("Action Error:", e);
            setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: "Erreur lors de l'exécution. ❌" }]);
        }
        setIsTyping(false);
    };

    const sendMessage = async (content) => {
        const userMsg = { id: Date.now(), role: 'user', content };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        try {
            // Commands handling
            if (content.startsWith('/')) {
                const [cmd, ...args] = content.split(' ');
                handleCommand(cmd.toLowerCase(), args);
                return;
            }

            // Normal AI Call
            const response = await aiService.generateCopilotResponse(content, getPageContext());

            // Detect Order Intent
            const orderIntent = await aiService.parseOrderIntent(content);

            const botMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                content: response,
                action: orderIntent ? {
                    type: 'CREATE_ORDER',
                    label: `Créer commande (${orderIntent.product || 'Produit'})`,
                    data: orderIntent
                } : null
            };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);

        } catch (error) {
            console.error("Copilot Error:", error);
            setIsTyping(false);
        }
    };

    const handleCommand = async (cmd, args) => {
        let feedback = "";

        switch (cmd) {
            case '/nav':
                const target = args[0]?.toLowerCase() || '';
                const navMap = {
                    'orders': '/orders',
                    'commandes': '/orders',
                    'products': '/products',
                    'produits': '/products',
                    'clients': '/clients',
                    'finance': '/finances',
                    'finances': '/finances',
                    'settings': '/settings',
                    'parametres': '/settings',
                    'paramètres': '/settings',
                    'support': '/support-ai',
                    'history': '/history',
                    'historique': '/history',
                    'pickups': '/pickups',
                    'dashboard': '/'
                };

                if (navMap[target]) {
                    navigate(navMap[target]);
                    feedback = `Redirection vers ${target}... 🚀`;
                } else {
                    feedback = `Page "${target}" inconnue. Essayez : orders, products, clients, finance, settings...`;
                }
                break;

            case '/search':
                const term = args.join(' ').toLowerCase();
                if (!term) {
                    feedback = "Veuillez entrer un terme à rechercher (ex: /search VIP).";
                } else {
                    const matchedClients = clients.filter(c =>
                        c.name?.toLowerCase().includes(term) ||
                        c.phone?.includes(term) ||
                        (term === 'vip' && c.totalSpent > 1000)
                    );
                    const matchedOrders = orders.filter(o =>
                        o.customer?.toLowerCase().includes(term) ||
                        o.displayId?.toLowerCase().includes(term) ||
                        o.phone?.includes(term)
                    );

                    if (matchedClients.length === 0 && matchedOrders.length === 0) {
                        feedback = `Aucun résultat trouvé pour "${term}".`;
                    } else {
                        feedback = `Résultats pour "${term}" :\n`;
                        if (matchedClients.length > 0) {
                            feedback += `👥 Clients (${matchedClients.length}) : ${matchedClients.slice(0, 3).map(c => c.name).join(', ')}${matchedClients.length > 3 ? '...' : ''}\n`;
                        }
                        if (matchedOrders.length > 0) {
                            feedback += `📦 Commandes (${matchedOrders.length}) : ${matchedOrders.slice(0, 3).map(o => o.displayId || o.id.substring(0, 8)).join(', ')}${matchedOrders.length > 3 ? '...' : ''}`;
                        }
                    }
                }
                break;

            case '/stats':
                setIsTyping(true);
                feedback = await aiService.generateCopilotStats(orders, clients);
                setIsTyping(false);
                break;

            default:
                feedback = `Commande "${cmd}" non reconnue. Tapez /nav, /search ou /stats.`;
        }

        setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: feedback }]);
    };

    return (
        <CopilotContext.Provider value={{
            isOpen,
            setIsOpen,
            messages,
            sendMessage,
            isTyping,
            currentPath: location.pathname,
            pageName: getPageContext(),
            executeAction
        }}>
            {children}
        </CopilotContext.Provider>
    );
};

export const useCopilot = () => useContext(CopilotContext);
