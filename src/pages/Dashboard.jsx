import React, { useState } from 'react';
import { useOrders } from '../context/OrderContext';
import KPICard from '../components/KPICard';
import { DollarSign, ShoppingBag, TrendingUp, Users, Activity, FileText } from 'lucide-react';
import { generateInvoice } from '../utils/generateInvoice';
import '../styles/orders.css';
import MessagePreviewModal from '../components/MessagePreviewModal';
import { useNavigate } from 'react-router-dom';
import { getStatusColor } from '../utils/statusStyles';

const Dashboard = () => {
    const { orders } = useOrders();
    const navigate = useNavigate();
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [whatsappOrder, setWhatsappOrder] = useState(null);

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

            <h1 className="text-2xl font-bold mb-6" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Tableau de Bord</h1>

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
