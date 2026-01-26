import React from 'react';
import { useOrders } from '../context/OrderContext';
import KPICard from '../components/KPICard';
import { DollarSign, ShoppingBag, TrendingUp, Users, Activity, FileText } from 'lucide-react';
import { generateInvoice } from '../utils/generateInvoice';
import '../styles/orders.css';

const Dashboard = () => {
    const { orders, updateOrderStatus } = useOrders();

    // Filter out deleted orders for all metrics and display
    const activeOrdersList = orders.filter(o => !o.deleted);

    // Calculate Metrics
    // Revenue: Livré (+) - Retour (-) 
    // Note: This logic duplicates Finances.jsx. Ideally move to Context.
    const totalRevenue = activeOrdersList.reduce((sum, order) => {
        if (order.status === 'Livré') {
            const amount = parseFloat(order.amount) || 0;
            const delivery = parseFloat(order.deliveryFee) || 0;
            return sum + Math.max(0, amount - delivery);
        }
        return sum;
    }, 0);

    const totalOrders = activeOrdersList.length;
    // Active orders: everything not delivered, returned or cancelled (simplification)
    const activeOrdersCount = activeOrdersList.filter(o => ['Packing', 'Ramassage', 'Livraison'].includes(o.status)).length;

    // Total Pending Revenue
    const totalPendingRevenue = activeOrdersList.reduce((sum, o) => {
        if (['Packing', 'Ramassage', 'Livraison'].includes(o.status)) {
            const amount = parseFloat(o.amount) || 0;
            const delivery = parseFloat(o.deliveryFee) || 0;
            return sum + Math.max(0, amount - delivery);
        }
        return sum;
    }, 0);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Dashboard Overview</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <KPICard
                    title="Chiffre d'Affaires (Net)"
                    value={`${totalRevenue.toFixed(2)} DH`}
                    change="-"
                    trend="up"
                    icon={DollarSign}
                />
                <KPICard
                    title="Pending Total"
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
                            {activeOrdersList.slice(0, 10).map(order => { // Limit to recent 10 for better dashboard view? or show all non-deleted? Original showed all. keeping logic similar but filtered.
                                const items = order.items || [{ article: order.article }];
                                const displayArticle = items[0]?.article || '-';
                                const moreCount = items.length > 1 ? ` (+${items.length - 1})` : '';

                                return (
                                    <tr key={order.id}>
                                        <td className="text-gray-500">{order.date || '-'}</td>
                                        <td className="font-medium">{order.customer}</td>
                                        <td>{displayArticle}{moreCount}</td>
                                        <td>{order.amount ? order.amount.toFixed(2) : '0.00'} DH</td>
                                        <td>
                                            <select
                                                value={order.status}
                                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                className="status-select"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="Packing">Packing</option>
                                                <option value="Ramassage">Ramassage</option>
                                                <option value="Livraison">Livraison</option>
                                                <option value="Livré">Livré</option>
                                                <option value="Pas de réponse client">Pas de réponse</option>
                                                <option value="Retour">Retour</option>
                                            </select>
                                        </td>
                                        <td>
                                            <button
                                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                                onClick={() => generateInvoice(order)}
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
