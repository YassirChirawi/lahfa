import React, { useState, useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import { useProducts } from '../context/ProductContext';
import CreateOrderModal from '../components/CreateOrderModal';
import { Plus, Search, Filter, Trash2, RotateCcw, FileText, Truck, RefreshCw, MessageCircle, Eye, Link2, MapPin } from 'lucide-react';
import { generateInvoice } from '../utils/generateInvoice';
import { getWhatsAppUrl } from '../utils/whatsappUtils';
import olivraisonService from '../services/olivraisonService';
import senditService from '../services/senditService';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import '../styles/orders.css';
import '../styles/modal.css';

import MessagePreviewModal from '../components/MessagePreviewModal';
import TrackingTimelineModal from '../components/TrackingTimelineModal'; // Added

const mapSenditStatus = (senditStatus) => {
    if (!senditStatus) return null;
    const normalized = senditStatus.toUpperCase();

    const statusMap = {
        'DELIVERED': 'Livré',
        'LIVRÉ': 'Livré',
        'CANCELED': 'Retour',
        'ANNULÉ': 'Retour',
        'REJECTED': 'Retour',
        'REFUSÉ': 'Retour',
        'DELIVERING': 'Livraison',
        'EN COURS DE LIVRAISON': 'Livraison',
        'DISTRIBUTED': 'Livraison',
        'DISTRIBUÉ': 'Livraison',
        'UNREACHABLE': 'Pas de réponse client',
        'INJOIGNABLE': 'Pas de réponse client',
        'POSTPONED': 'Pas de réponse client',
        'REPORTÉ': 'Pas de réponse client',
        'PICKED_UP': 'Ramassage',
        'PICKEDUP': 'Ramassage', // Added
        'TO_PICKUP': 'Ramassage', // Added
        'RAMASSÉ': 'Ramassage',
        'WAREHOUSE': 'Ramassage',
        'ENTREPÔT': 'Ramassage',
        'TRANSIT': 'Ramassage',
        'EN TRANSIT': 'Ramassage',
        'CREATED': 'Ramassage',
        'PENDING': 'Ramassage', // Added
        'TO_PREPARE': 'Ramassage' // Added
    };
    return statusMap[normalized] || null;
};

const Orders = () => {
    const { orders, addOrder, updateOrderStatus, updateOrder, deleteOrder, restoreOrder, permanentDeleteOrder } = useOrders();
    const { products, addPendingReturn, cancelPendingReturn } = useProducts();
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('');
    const [productFilter, setProductFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState(null);
    const [showTrash, setShowTrash] = useState(false); // Toggle for deleted orders
    const [whatsappLang, setWhatsappLang] = useState('fr'); // 'fr' or 'darija'
    const [selectedOrders, setSelectedOrders] = useState([]); // Multiple selection for ramassage

    // WhatsApp Modal State
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [whatsappOrder, setWhatsappOrder] = useState(null);

    // Tracking Modal State
    const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
    const [trackingData, setTrackingData] = useState(null);
    const [trackingProvider, setTrackingProvider] = useState(null);

    // Active Providers State
    const [activeProviders, setActiveProviders] = useState({ olivraison: false, sendit: false });

    useEffect(() => {
        const fetchProviders = async () => {
            try {
                const docRef = doc(db, 'settings', 'delivery');
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    setActiveProviders({
                        olivraison: data.olivraison?.active ?? !!data.apiKey,
                        sendit: data.sendit?.active ?? false
                    });
                }
            } catch (e) { console.error(e); }
        };
        fetchProviders();
    }, []);

    const filteredOrders = orders.filter(order => {
        // Trash Mode: Only show deleted. Normal Mode: Only show non-deleted.
        if (showTrash) {
            if (!order.deleted) return false;
        } else {
            if (order.deleted) return false;
        }

        const matchesStatus = filter === 'All' || order.status === filter;
        const matchesSearch =
            (order.customer && order.customer.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.id && order.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.phone && order.phone.includes(searchTerm));

        const matchesCity = cityFilter === '' || (order.city && order.city.toLowerCase().includes(cityFilter.toLowerCase()));

        // Handle items for product filter
        const items = order.items || [{ article: order.article }];
        const matchesProduct = productFilter === '' || items.some(item => item.article && item.article.toLowerCase().includes(productFilter.toLowerCase()));

        const matchesDate = dateFilter === '' || (order.date && order.date.includes(dateFilter));

        const price = parseFloat(order.amount) || 0;
        const matchesMinPrice = minPrice === '' || price >= parseFloat(minPrice);
        const matchesMaxPrice = maxPrice === '' || price <= parseFloat(maxPrice);

        return matchesStatus && matchesSearch && matchesCity && matchesProduct && matchesDate && matchesMinPrice && matchesMaxPrice;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Livré': return 'status-success';
            case 'Packing': return 'status-warning';
            case 'Ramassage': return 'status-info';
            case 'Livraison': return 'status-primary'; // You might need to add this class or use another
            case 'Retour': return 'status-danger';
            case 'Pas de réponse client': return 'status-default';
            default: return 'status-default';
        }
    };

    const handleOpenTracking = async (order) => {
        if (!order.deliveryValues?.trackingID) return;
        const provider = order.deliveryValues.provider || 'olivraison';
        const trackingID = order.deliveryValues.trackingID;

        const toastId = toast.loading("Chargement de l'historique...");
        try {
            let data;
            if (provider === 'sendit') {
                const result = await senditService.getPackageStatus(trackingID);
                data = result.raw || result;
            } else {
                // Mock or implement Olivraison history if available
                data = { history: [] };
                toast("Historique détaillé non disponible pour Olivraison", { icon: 'ℹ️' });
            }

            setTrackingData(data);
            setTrackingProvider(provider);
            setIsTrackingModalOpen(true);
            toast.dismiss(toastId);
        } catch (error) {
            console.error(error);
            toast.error("Impossible de récupérer l'historique", { id: toastId });
        }
    };

    const handleSaveOrder = async (orderData) => {
        if (editingOrder) {
            await updateOrder(editingOrder.id, orderData);
        } else {
            await addOrder(orderData);
        }
        setIsModalOpen(false);
        setEditingOrder(null);
    };

    const openEditModal = (order) => {
        setEditingOrder(order);
        setIsModalOpen(true);
    };

    const handleOpenWhatsApp = (order) => {
        setWhatsappOrder(order);
        setIsWhatsAppModalOpen(true);
    };

    const toggleOrderSelection = (id) => {
        setSelectedOrders(prev =>
            prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
        );
    };

    const toggleAllSelection = () => {
        if (selectedOrders.length === filteredOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(filteredOrders.map(o => o.id));
        }
    };

    const applyStatusUpdate = async (orderId, newStatus) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const previousStatus = order.status;
        if (previousStatus === newStatus) return;

        await updateOrderStatus(orderId, newStatus);

        // Handle Return Logic (Stock)
        if (newStatus === 'Retour' && previousStatus !== 'Retour') {
            const itemsToReturn = order.items || [{
                article: order.article,
                quantity: order.quantity || 1
            }];

            let returnedCount = 0;
            for (const item of itemsToReturn) {
                let product = products.find(p => p.id === item.productId);
                if (!product) product = products.find(p => p.name === (item.article || item.name));

                if (product) {
                    await addPendingReturn(product.id, item.quantity || 1);
                    returnedCount += (item.quantity || 1);
                }
            }
            if (returnedCount > 0) {
                toast.custom((t) => (
                    <div className="bg-orange-100 border border-orange-200 text-orange-800 px-4 py-2 rounded shadow-md flex items-center gap-2">
                        <RotateCcw size={16} />
                        <span>{returnedCount} produits marqués "En attente de retour"</span>
                    </div>
                ), { duration: 3000 });
            }
        }
        // Handle Cancel Return Logic (Stock)
        else if (previousStatus === 'Retour' && newStatus !== 'Retour') {
            const itemsToReturn = order.items || [{
                article: order.article,
                quantity: order.quantity || 1
            }];

            for (const item of itemsToReturn) {
                let product = products.find(p => p.id === item.productId);
                if (!product) product = products.find(p => p.name === (item.article || item.name));

                if (product) {
                    await cancelPendingReturn(product.id, item.quantity || 1);
                }
            }
            toast("Statut retour annulé (Stock retiré)", { icon: '↩️' });
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        await applyStatusUpdate(orderId, newStatus);

        // Suggest WhatsApp message if status is relevant
        if (order.phone) {
            const updatedOrder = { ...order, status: newStatus };
            setWhatsappOrder(updatedOrder);
            setIsWhatsAppModalOpen(true);
            toast.success(`Statut mis à jour. WhatsApp prêt.`);
        } else {
            toast.success("Statut mis à jour.");
        }
    };

    const handleSendToSendit = async (order) => {
        if (!window.confirm(`Envoyer la commande #${order.displayId || order.id} à Sendit ?`)) return;

        const toastId = toast.loading("Envoi vers Sendit...");
        try {
            const result = await senditService.createPackage(order);
            await updateOrder(order.id, {
                status: 'Ramassage',
                deliveryValues: {
                    provider: 'sendit',
                    trackingID: result.trackingID,
                    status: result.status || 'PENDING',
                    sentAt: new Date().toISOString(),
                    details: result
                }
            });
            toast.success("Commande envoyée à Sendit !", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error(`Erreur Sendit: ${error.message}`, { id: toastId });
        }
    };

    const handleSendToDelivery = async (order) => {
        if (!window.confirm(`Envoyer la commande #${order.displayId || order.id} à Olivraison ?`)) return;

        const toastId = toast.loading("Envoi vers Olivraison...");
        try {
            const result = await olivraisonService.createPackage(order);
            await updateOrder(order.id, {
                status: 'Ramassage',
                deliveryValues: {
                    provider: 'olivraison',
                    trackingID: result.trackingID,
                    status: result.status,
                    sentAt: new Date().toISOString()
                }
            });
            toast.success("Commande envoyée à Olivraison !", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error(`Erreur Olivraison: ${error.message}`, { id: toastId });
        }
    };

    const handleSyncStatus = async (order) => {
        if (!order.deliveryValues?.trackingID) return;
        const provider = order.deliveryValues.provider || 'olivraison';

        const toastId = toast.loading(`Sync ${provider}...`);
        try {
            let result;
            let deliveryStatus;

            if (provider === 'sendit') {
                result = await senditService.getPackageStatus(order.deliveryValues.trackingID);
                deliveryStatus = result.data?.status || result.status;

                // Automatic status mapping for Sendit
                const mappedStatus = mapSenditStatus(deliveryStatus);
                if (mappedStatus && mappedStatus !== order.status) {
                    await applyStatusUpdate(order.id, mappedStatus);
                }
            } else {
                result = await olivraisonService.getPackageStatus(order.deliveryValues.trackingID);
                deliveryStatus = result.status;
            }

            await updateOrder(order.id, {
                deliveryValues: {
                    ...order.deliveryValues,
                    status: deliveryStatus,
                    lastSync: new Date().toISOString()
                },
            });
            toast.success(`Statut: ${deliveryStatus}`, { id: toastId });
        } catch (error) {
            toast.error("Erreur de synchronisation", { id: toastId });
        }
    };

    const handleSenditBulkPickup = async () => {
        if (selectedOrders.length === 0) return;

        const selectedDocs = orders.filter(o => selectedOrders.includes(o.id));
        const senditOrders = selectedDocs.filter(o => o.deliveryValues?.provider === 'sendit' && o.deliveryValues?.trackingID);

        if (senditOrders.length === 0) {
            toast.error("Aucune commande Sendit valide sélectionnée.");
            return;
        }

        if (!window.confirm(`Confirmer la demande de ramassage pour ${senditOrders.length} colis Sendit ?`)) return;

        const toastId = toast.loading("Demande de ramassage en cours...");
        try {
            // 1. Get Pickup Contact Info from Settings
            const settingsSnap = await getDoc(doc(db, 'settings', 'delivery'));
            if (!settingsSnap.exists()) throw new Error("Paramètres de livraison introuvables.");

            const senditSettings = settingsSnap.data().sendit;
            if (!senditSettings?.pickup_name || !senditSettings?.pickup_phone) {
                throw new Error("Veuillez configurer les informations de ramassage dans les Paramètres.");
            }

            // 2. Prepare Payload
            const trackingCodes = senditOrders.map(o => o.deliveryValues.trackingID).join(',');
            const pickupData = {
                district_id: senditSettings.pickup_district_id || 1,
                name: senditSettings.pickup_name,
                phone: senditSettings.pickup_phone,
                address: senditSettings.pickup_address,
                deliveries: trackingCodes
            };

            // 3. Call API
            await senditService.requestPickup(pickupData);

            // 4. Update Orders
            for (const order of senditOrders) {
                await updateOrder(order.id, {
                    status: 'Ramassage',
                    deliveryValues: {
                        ...order.deliveryValues,
                        pickupRequested: true,
                        pickupRequestedAt: new Date().toISOString()
                    }
                });
            }

            setSelectedOrders([]);
            toast.success("Demande de ramassage envoyée avec succès !", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error(`Erreur: ${error.message}`, { id: toastId });
        }
    };

    const handleSenditBulkReturn = async () => {
        if (selectedOrders.length === 0) return;

        const selectedDocs = orders.filter(o => selectedOrders.includes(o.id));
        const senditOrders = selectedDocs.filter(o => o.deliveryValues?.provider === 'sendit' && o.deliveryValues?.trackingID);

        if (senditOrders.length === 0) {
            toast.error("Aucune commande Sendit valide sélectionnée.");
            return;
        }

        if (!window.confirm(`Confirmer la demande de RETOUR pour ${senditOrders.length} colis Sendit ?`)) return;

        const toastId = toast.loading("Demande de retour en cours...");
        try {
            // 1. Get Pickup Contact Info (Same as pickup since it's where the rider picks up the return)
            const settingsSnap = await getDoc(doc(db, 'settings', 'delivery'));
            if (!settingsSnap.exists()) throw new Error("Paramètres de livraison introuvables.");

            const senditSettings = settingsSnap.data().sendit;
            if (!senditSettings?.pickup_name || !senditSettings?.pickup_phone) {
                throw new Error("Veuillez configurer les informations de contact dans les Paramètres.");
            }

            // 2. Prepare Payload
            const trackingCodes = senditOrders.map(o => o.deliveryValues.trackingID).join(',');
            const returnData = {
                district_id: senditSettings.pickup_district_id || 1,
                name: senditSettings.pickup_name,
                phone: senditSettings.pickup_phone,
                address: senditSettings.pickup_address,
                deliveries: trackingCodes
            };

            // 3. Call API
            await senditService.requestReturn(returnData);

            // 4. Update Orders
            for (const order of senditOrders) {
                await updateOrder(order.id, {
                    status: 'Retour',
                    deliveryValues: {
                        ...order.deliveryValues,
                        pickupRequested: true,
                        pickupRequestedAt: new Date().toISOString(),
                        isReturn: true
                    }
                });
            }

            setSelectedOrders([]);
            toast.success("Demande de retour envoyée avec succès !", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error(`Erreur: ${error.message}`, { id: toastId });
        }
    };

    const handleSenditBulkLabels = async () => {
        if (selectedOrders.length === 0) return;

        const selectedDocs = orders.filter(o => selectedOrders.includes(o.id));
        const senditOrders = selectedDocs.filter(o => o.deliveryValues?.provider === 'sendit' && o.deliveryValues?.trackingID);

        if (senditOrders.length === 0) {
            toast.error("Aucune commande Sendit valide sélectionnée.");
            return;
        }

        const toastId = toast.loading("Génération des étiquettes...");
        try {
            const trackingCodes = senditOrders.map(o => o.deliveryValues.trackingID).join(',');
            // Default to thermal format (1) as requested by most sellers
            const result = await senditService.getLabels(trackingCodes, 1);

            if (result.url) {
                window.open(result.url, '_blank');
                toast.success("Étiquettes prêtes !", { id: toastId });
            } else {
                throw new Error("URL du PDF non trouvée dans la réponse");
            }
        } catch (error) {
            console.error(error);
            toast.error(`Erreur: ${error.message}`, { id: toastId });
        }
    };

    const handleSenditGlobalSync = async () => {
        const toastId = toast.loading("Synchronisation globale Sendit...");
        try {
            const results = await senditService.syncAllDeliveries();
            const deliveries = results.data || results;

            if (!Array.isArray(deliveries)) {
                throw new Error("Format de réponse invalide");
            }

            let updatedCount = 0;
            let linkedCount = 0;

            for (const item of deliveries) {
                const trackingID = item.code || item.trackingID;
                const deliveryStatus = item.status;
                const reference = item.reference; // Reference sent to Sendit (usually order.displayId or order.id)

                // 1. Find local order by Tracking ID (Priority)
                let localOrder = orders.find(o => o.deliveryValues?.trackingID === trackingID);

                // 2. If not found, Try Smart Link by Reference
                // Only if the local order is NOT already linked to another tracking ID
                if (!localOrder && reference) {
                    localOrder = orders.find(o =>
                        (o.displayId === reference || o.id === reference) &&
                        !o.deliveryValues?.trackingID
                    );

                    if (localOrder) {
                        console.log(`🔗 Auto-Link: Commande ${localOrder.displayId || localOrder.id} liée au Tracking ${trackingID}`);

                        // Link immediately
                        await updateOrder(localOrder.id, {
                            deliveryValues: {
                                provider: 'sendit',
                                trackingID: trackingID,
                                status: deliveryStatus,
                                lastSync: new Date().toISOString(),
                                autoLinked: true
                            }
                        });
                        linkedCount++;
                        // Update local object to allow status update in next block
                        localOrder = { ...localOrder, deliveryValues: { ...localOrder.deliveryValues, trackingID, status: deliveryStatus } };
                    }
                }

                // 3. Update Status if matched (either previously or just now)
                if (localOrder) {
                    const mappedStatus = mapSenditStatus(deliveryStatus);
                    let shouldUpdateMainStatus = mappedStatus && mappedStatus !== localOrder.status;
                    let shouldUpdateDeliveryStatus = deliveryStatus !== localOrder.deliveryValues?.status;

                    if (shouldUpdateMainStatus) {
                        await applyStatusUpdate(localOrder.id, mappedStatus);
                    }

                    if (shouldUpdateMainStatus || shouldUpdateDeliveryStatus) {
                        // Avoid double update if we just linked it, but ensure status is fresh
                        await updateOrder(localOrder.id, {
                            deliveryValues: {
                                ...localOrder.deliveryValues,
                                status: deliveryStatus,
                                lastSync: new Date().toISOString()
                            }
                        });
                        updatedCount++;
                    }
                }
            }

            let msg = `${updatedCount} commandes mises à jour.`;
            if (linkedCount > 0) msg += ` ${linkedCount} nouvelles liaisons auto !`;

            toast.success(msg, { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error(`Erreur Sync: ${error.message}`, { id: toastId });
        }
    };


    const handleManualLink = async (order) => {
        const trackingId = window.prompt("Entrez le Code de Suivi Sendit (ex: DH... ou SNDT...) :");
        if (!trackingId) return;

        const toastId = toast.loading("Liaison en cours...");
        try {
            const orderRef = doc(db, 'orders', order.id);
            await updateDoc(orderRef, {
                'deliveryValues.provider': 'sendit',
                'deliveryValues.trackingID': trackingId,
                'deliveryValues.status': 'En attente',
                'deliveryValues.lastSync': new Date().toISOString()
            });
            toast.success("Commande liée manuellement !", { id: toastId });
        } catch (e) {
            console.error(e);
            toast.error("Erreur lors de la liaison : " + e.message, { id: toastId });
        }
    };

    return (
        <div className="orders-page">
            <MessagePreviewModal
                isOpen={isWhatsAppModalOpen}
                onClose={() => setIsWhatsAppModalOpen(false)}
                order={whatsappOrder}
                initialLang={whatsappLang}
            />

            <TrackingTimelineModal
                isOpen={isTrackingModalOpen}
                onClose={() => setIsTrackingModalOpen(false)}
                trackingData={trackingData}
                provider={trackingProvider}
            />

            <div className="page-header">
                <div>
                    <h1>Orders</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage new, pending and delivered orders</p>
                </div>
                <div className="flex gap-2">
                    {activeProviders.sendit && (
                        <button
                            className="px-4 py-2 rounded-lg flex items-center gap-2 bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 transition-colors shadow-sm font-medium"
                            onClick={handleSenditGlobalSync}
                            title="Synchroniser tous les statuts Sendit"
                        >
                            <RefreshCw size={18} />
                            Sync Sendit
                        </button>
                    )}
                    <button
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 border transition-colors ${showTrash ? 'bg-red-100 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        onClick={() => setShowTrash(!showTrash)}
                    >
                        <Trash2 size={18} />
                        {showTrash ? 'Hide Trash' : 'Trash'}
                    </button>
                    {!showTrash && (
                        <button className="btn-primary" onClick={() => { setEditingOrder(null); setIsModalOpen(true); }}>
                            <Plus size={18} />
                            Create Order
                        </button>
                    )}
                </div>
            </div>

            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {/* Language Toggle Global Preference */}
                <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                    <button
                        onClick={() => setWhatsappLang('fr')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${whatsappLang === 'fr' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        title="Langue par défaut pour WhatsApp"
                    >
                        🇫🇷 FR
                    </button>
                    <button
                        onClick={() => setWhatsappLang('darija')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${whatsappLang === 'darija' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        title="Langue par défaut pour WhatsApp"
                    >
                        🇲🇦 DAR
                    </button>
                </div>
                <div className="filter-group">
                    <Filter size={18} />
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option value="All">All Status</option>
                        <option value="Packing">Packing</option>
                        <option value="Ramassage">Ramassage</option>
                        <option value="Livraison">Livraison</option>
                        <option value="Livré">Livré</option>
                        <option value="Pas de réponse client">Pas de réponse</option>
                        <option value="Retour">Retour</option>
                    </select>
                </div>

                {/* Advanced Filters */}
                <div className="flex gap-2 flex-wrap items-center">
                    <input
                        type="text"
                        placeholder="City"
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        className="p-2 border rounded text-sm w-32"
                    />
                    <input
                        type="text"
                        placeholder="Product"
                        value={productFilter}
                        onChange={(e) => setProductFilter(e.target.value)}
                        className="p-2 border rounded text-sm w-32"
                    />
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="p-2 border rounded text-sm w-auto"
                    />
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            placeholder="Min Price"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            className="p-2 border rounded text-sm w-24"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="number"
                            placeholder="Max Price"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            className="p-2 border rounded text-sm w-24"
                        />
                    </div>
                    {/* Clear Filters Button */}
                    {(cityFilter || productFilter || dateFilter || minPrice || maxPrice || filter !== 'All' || searchTerm) && (
                        <button
                            onClick={() => {
                                setCityFilter('');
                                setProductFilter('');
                                setDateFilter('');
                                setMinPrice('');
                                setMaxPrice('');
                                setFilter('All');
                                setSearchTerm('');
                            }}
                            className="text-sm text-red-500 hover:text-red-700 underline"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            <div className="card orders-table-container">
                {/* Bulk Actions Bar */}
                {selectedOrders.length > 0 && (
                    <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center justify-between animate-fade-in">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-indigo-700 bg-white px-3 py-1 rounded-full border border-indigo-200 shadow-sm">
                                {selectedOrders.length} sélectionné{selectedOrders.length > 1 ? 's' : ''}
                            </span>
                            <button
                                onClick={() => setSelectedOrders([])}
                                className="text-xs text-indigo-400 hover:text-indigo-600 underline"
                            >
                                Tout désélectionner
                            </button>
                        </div>
                        <div className="flex gap-2">
                            {activeProviders.sendit && (
                                <>
                                    <button
                                        onClick={handleSenditBulkPickup}
                                        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors shadow-sm"
                                    >
                                        <Truck size={16} /> Demander Ramassage (Sendit)
                                    </button>
                                    <button
                                        onClick={handleSenditBulkReturn}
                                        className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-rose-600 transition-colors shadow-sm"
                                    >
                                        <RotateCcw size={16} /> Demander Retour (Sendit)
                                    </button>
                                    <button
                                        onClick={handleSenditBulkLabels}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                                    >
                                        <FileText size={16} /> Imprimer Étiquettes
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <table className="orders-table">
                    <thead>
                        <tr>
                            <th className="w-10">
                                <input
                                    type="checkbox"
                                    checked={selectedOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                                    onChange={toggleAllSelection}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </th>
                            <th>N° Commande</th>
                            <th>Date</th>
                            <th>Client</th>
                            <th>Téléphone</th>
                            <th>Ville</th>
                            <th>Adresse</th>
                            <th>Article</th>
                            <th>Taille</th>
                            <th>Couleur</th>
                            <th>Qté</th>
                            <th>Prix (DH)</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length > 0 ? (
                            filteredOrders.map(order => {
                                // Backward compatibility helper
                                const items = order.items || [{
                                    article: order.article,
                                    size: order.size,
                                    color: order.color,
                                    quantity: order.quantity
                                }];

                                return (
                                    <tr key={order.id} style={{ verticalAlign: 'top' }} className={selectedOrders.includes(order.id) ? 'bg-indigo-50/30' : ''}>
                                        <td className="w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedOrders.includes(order.id)}
                                                onChange={() => toggleOrderSelection(order.id)}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </td>
                                        <td className="font-medium">{order.displayId || order.id}</td>
                                        <td>{order.date}</td>
                                        <td>{order.customer}</td>
                                        <td>{order.phone}</td>
                                        <td>{order.city || '-'}</td>
                                        <td>{order.address}</td>

                                        {/* Multi-item Columns */}
                                        <td>
                                            {items.map((item, i) => (
                                                <div key={i} style={{ marginBottom: '4px' }}>{item.article || '-'}</div>
                                            ))}
                                        </td>
                                        <td>
                                            {items.map((item, i) => (
                                                <div key={i} style={{ marginBottom: '4px' }}>{item.size || '-'}</div>
                                            ))}
                                        </td>
                                        <td>
                                            {items.map((item, i) => (
                                                <div key={i} style={{ marginBottom: '4px' }}>{item.color || '-'}</div>
                                            ))}
                                        </td>
                                        <td>
                                            {items.map((item, i) => (
                                                <div key={i} style={{ marginBottom: '4px' }}>{item.quantity || 1}</div>
                                            ))}
                                        </td>

                                        <td>{order.amount ? `${order.amount.toFixed(2)} DH` : '-'}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                {!showTrash ? (
                                                    <>
                                                        <select
                                                            value={order.status}
                                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                            className="status-select"
                                                        >
                                                            <option value="Packing">Packing</option>
                                                            <option value="Ramassage">Ramassage</option>
                                                            <option value="Livraison">Livraison</option>
                                                            <option value="Livré">Livré</option>
                                                            <option value="Pas de réponse client">Pas de réponse</option>
                                                            <option value="Retour">Retour</option>
                                                        </select>
                                                        <button className="icon-btn-sm" onClick={() => openEditModal(order)} title="Modifier">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                                        </button>
                                                        <button className="icon-btn-sm text-blue-500 hover:bg-blue-50" onClick={() => generateInvoice(order)} title="Télécharger Facture">
                                                            <FileText size={16} />
                                                        </button>

                                                        {/* Delivery Integration */}
                                                        {!order.deliveryValues?.trackingID ? (
                                                            <div className="flex gap-1">
                                                                {activeProviders.olivraison && (
                                                                    <button
                                                                        className="icon-btn-sm text-indigo-500 hover:bg-indigo-50"
                                                                        onClick={() => handleSendToDelivery(order)}
                                                                        title="Envoyer à Olivraison"
                                                                    >
                                                                        <Truck size={16} />
                                                                    </button>
                                                                )}
                                                                {activeProviders.sendit && (
                                                                    <button
                                                                        className="icon-btn-sm text-orange-500 hover:bg-orange-50 font-bold"
                                                                        onClick={() => handleSendToSendit(order)}
                                                                        title="Envoyer à Sendit"
                                                                    >
                                                                        S
                                                                    </button>
                                                                )}

                                                                {/* Manual Link Button */}
                                                                <button
                                                                    className="icon-btn-sm text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                                                    onClick={() => handleManualLink(order)}
                                                                    title="Lier manuellement un Tracking ID"
                                                                >
                                                                    <Link2 size={16} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    className={`icon-btn-sm hover:bg-green-50 ${order.deliveryValues.provider === 'sendit' ? 'text-orange-600' : 'text-green-600'}`}
                                                                    onClick={() => handleSyncStatus(order)}
                                                                    title={`Sync avec ${order.deliveryValues.provider}`}
                                                                >
                                                                    <RefreshCw size={16} />
                                                                </button>
                                                                <button
                                                                    className="icon-btn-sm text-blue-500 hover:bg-blue-100"
                                                                    onClick={() => handleOpenTracking(order)}
                                                                    title="Voir l'historique détaillé"
                                                                >
                                                                    <MapPin size={16} />
                                                                </button>
                                                            </>
                                                        )}

                                                        <button
                                                            className="icon-btn-sm text-red-500 hover:bg-red-50 ml-8"
                                                            onClick={async () => {
                                                                if (order.deliveryValues?.trackingID) {
                                                                    if (window.confirm(`Annuler cette commande chez ${order.deliveryValues.provider || 'le transporteur'} ?`)) {
                                                                        const toastId = toast.loading("Annulation...");
                                                                        try {
                                                                            if (order.deliveryValues.provider === 'sendit') {
                                                                                await senditService.cancelPackage(order.deliveryValues.trackingID);
                                                                            } else {
                                                                                await olivraisonService.cancelPackage(order.deliveryValues.trackingID);
                                                                            }
                                                                            toast.success("Annulé !", { id: toastId });
                                                                        } catch (e) {
                                                                            toast.error("Erreur annulation: " + e.message, { id: toastId });
                                                                            if (!window.confirm("Forcer la suppression locale ?")) return;
                                                                        }
                                                                    }
                                                                }
                                                                deleteOrder(order.id);
                                                            }}
                                                            title="Supprimer">
                                                            <Trash2 size={16} />
                                                        </button>

                                                        {/* WhatsApp Button */}
                                                        {order.phone && (
                                                            <button
                                                                onClick={() => handleOpenWhatsApp(order)}
                                                                className="icon-btn-sm text-green-600 hover:bg-green-50 ml-1"
                                                                title={`Envoyer message WhatsApp (${order.status}) - ${whatsappLang.toUpperCase()}`}
                                                            >
                                                                <MessageCircle size={16} />
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button className="icon-btn-sm text-green-500 hover:bg-green-50" onClick={() => restoreOrder(order.id)} title="Restaurer">
                                                            <RotateCcw size={16} />
                                                        </button>
                                                        <button className="icon-btn-sm text-red-500 hover:bg-red-50" onClick={() => permanentDeleteOrder(order.id)} title="Supprimer définitivement">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="12" className="text-center p-6">Aucune commande trouvée.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div >

            <CreateOrderModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingOrder(null); }}
                onSave={handleSaveOrder}
                initialData={editingOrder}
            />
        </div >
    );
};

export default Orders;
