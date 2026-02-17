import React, { useState, useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import KPICard from '../components/KPICard';
import { DollarSign, ShoppingBag, TrendingUp, Users, Activity, FileText, AlertTriangle, ArrowRight, Bell } from 'lucide-react';
import { generateInvoice } from '../utils/generateInvoice';
import '../styles/orders.css';
import MessagePreviewModal from '../components/MessagePreviewModal';
import { useNavigate } from 'react-router-dom';
import { getStatusColor } from '../utils/statusStyles';
import senditService from '../services/senditService';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const Dashboard = () => {
    const { orders } = useOrders();
    const navigate = useNavigate();
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [whatsappOrder, setWhatsappOrder] = useState(null);

    // --- ALERTS STATE ---
    const [pendingInvoices, setPendingInvoices] = useState([]);
    const [ordersToChange, setOrdersToChange] = useState([]);

    useEffect(() => {
        // 1. Check Orders 'À changer'
        const toChange = orders.filter(o => o.status === 'À changer');
        setOrdersToChange(toChange);

        // 2. Check Sendit Invoices (> 48h)
        const checkInvoices = async () => {
            const snap = await getDoc(doc(db, 'settings', 'delivery'));
            if (snap.exists() && snap.data().sendit?.active) {
                try {
                    const res = await senditService.getInvoices();
                    const invs = res.data || res;
                    const now = new Date();
                    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

                    const alerts = invs.filter(inv => {
                        const invDate = new Date(inv.created_at || inv.date);
                        // TODO: Check if locally validated. For now, show all old ones.
                        return invDate < fortyEightHoursAgo;
                    });
                    setPendingInvoices(alerts);
                } catch (e) {
                    console.error("Dashboard Invoice Check Error:", e);
                }
            }
        };
        checkInvoices();
    }, [orders]);

    // Filter out deleted orders
    const validOrders = orders.filter(o => !o.deleted);

    // 1. Total Revenue (Net after delivery fee) -- Only 'Livré' counts as real money
    const totalRevenue = validOrders.reduce((sum, order) => {
        if (order.status === 'Livré' || (order.status === 'Livré Partiellement')) {
            const amount = parseFloat(order.amount) || 0;
            const delivery = parseFloat(order.deliveryFee) || 0;
            return sum + Math.max(0, amount - delivery);
        }
        return sum;
    }, 0);

    const totalOrders = validOrders.length;

    // 2. Pending / Active Logic
    // Everything that is NOT final (Livré, Retour, Annulé...) is considered "Pending/Active"
    // This catches 'En transit', 'À préparer', 'Ramassage', etc.
    const finalStatuses = ['Livré', 'Livré Partiellement', 'Retour', 'Annulé', 'Refusé', 'À changer'];
    const activeOrdersList = validOrders.filter(o => !finalStatuses.includes(o.status));

    const activeOrdersCount = activeOrdersList.length;

    // 3. Pending Potential Revenue
    const totalPendingRevenue = activeOrdersList.reduce((sum, o) => {
        const amount = parseFloat(o.amount) || 0;
        const delivery = parseFloat(o.deliveryFee) || 0;
        return sum + Math.max(0, amount - delivery);
    }, 0);

    const handleRowClick = (orderId) => {
        navigate('/orders', { state: { highlightId: orderId } });
    };

    return (
        <div>
            <MessagePreviewModal
                isOpen={isWhatsAppModalOpen}
                onClose={() => setIsWhatsAppModalOpen(false)}
                order={whatsappOrder}
                initialLang='fr'
            />

            <div className="flex items-center gap-3 mb-6">
                <h1 className="text-2xl font-bold" style={{ margin: 0 }}>Tableau de Bord</h1>
                {(pendingInvoices.length > 0 || ordersToChange.length > 0) && (
                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                        Actions Requises
                    </span>
                )}
            </div>

            {/* --- ACTION CENTER --- */}
            {(pendingInvoices.length > 0 || ordersToChange.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {/* Invoice Alert */}
                    {pendingInvoices.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-amber-900 text-sm">Factures Sendit en attente</h3>
                                    <p className="text-xs text-amber-700">
                                        {pendingInvoices.length} facture(s) &gt; 48h. Vérifiez encaissement.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/finances')}
                                className="text-amber-700 hover:text-amber-900 font-medium text-sm flex items-center gap-1"
                            >
                                Voir <ArrowRight size={14} />
                            </button>
                        </div>
                    )}

                    {/* Status Alert */}
                    {ordersToChange.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-blue-900 text-sm">Commandes "À changer"</h3>
                                    <p className="text-xs text-blue-700">
                                        {ordersToChange.length} commande(s) nécessitent un changement.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/orders')}
                                className="text-blue-700 hover:text-blue-900 font-medium text-sm flex items-center gap-1"
                            >
                                Traiter <ArrowRight size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}


            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <KPICard
                    title="Chiffre d'Affaires (Net)"
                    value={`${totalRevenue.toFixed(2)} DH`}
                    change="-"
                    trend="up"
                    icon={DollarSign}
                />
                <KPICard
                    title="Montant en cours (Estimé)"
                    value={`${totalPendingRevenue.toFixed(2)} DH`}
                    change="-"
                    trend="up"
                    icon={Activity}
                />
                <KPICard
                    title="Total Commandes"
                    value={totalOrders}
                    change="-"
                    trend="up"
                    icon={ShoppingBag}
                />
                <KPICard
                    title="Commandes en cours"
                    value={activeOrdersCount}
                    change="-"
                    trend="up"
                    icon={Users}
                />
            </div>

            <div className="card p-6">
                <h3 className="font-bold mb-4" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Commandes Récentes</h3>
                <div className="orders-table-container">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Client</th>
                                <th>Article</th>
                                <th>Montant</th>
                                <th>Statut</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {validOrders.slice(0, 10).map(order => {
                                const items = order.items || [{ article: order.article }];
                                const displayArticle = items[0]?.article || '-';
                                const moreCount = items.length > 1 ? ` (+${items.length - 1})` : '';

                                return (
                                    <tr
                                        key={order.id}
                                        onClick={() => handleRowClick(order.id)}
                                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="text-gray-500">{order.date || '-'}</td>
                                        <td className="font-medium">{order.customer}</td>
                                        <td>{displayArticle}{moreCount}</td>
                                        <td>{order.amount ? order.amount.toFixed(2) : '0.00'} DH</td>
                                        <td>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    generateInvoice(order);
                                                }}
                                                title="Télécharger Facture"
                                            >
                                                <FileText size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
