import React from 'react';
import { useOrders } from '../context/OrderContext';
import KPICard from '../components/KPICard';
import { DollarSign, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import '../styles/orders.css';

const Dashboard = () => {
    const { orders, updateOrderStatus } = useOrders();

    // Calculate Metrics
    // Calculate Metrics
    // Revenue: Livré (+) - Retour (-) 
    // Note: This logic duplicates Finances.jsx. Ideally move to Context.
    const totalRevenue = orders.reduce((sum, order) => {
        if (order.status === 'Livré') return sum + (parseFloat(order.amount) || 0);
        return sum;
    }, 0);

    const totalOrders = orders.length;
    // Active orders: everything not delivered, returned or cancelled (simplification)
    const activeOrders = orders.filter(o => ['Packing', 'Ramassage', 'Livraison'].includes(o.status)).length;

    // Calculate AOV (based on delivered orders only to be accurate with revenue)
    const deliveredOrdersCount = orders.filter(o => o.status === 'Livré').length;
    const averageOrderValue = deliveredOrdersCount > 0 ? (totalRevenue / deliveredOrdersCount) : 0;

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
                    title="Total Commandes"
                    value={totalOrders}
                    change="-"
                    trend="up"
                    icon={ShoppingBag}
                />
                <KPICard
                    title="Panier Moyen"
                    value={`${averageOrderValue.toFixed(2)} DH`}
                    change="-"
                    trend="down"
                    icon={TrendingUp}
                />
                <KPICard
                    title="Commandes en cours"
                    value={activeOrders}
                    change="-"
                    trend="up"
                    icon={Users}
                />
            </div>

            <div className="card p-6">
                <h3 className="font-bold mb-4" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Toutes les Commandes</h3>
                <div className="orders-table-container">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Client</th>
                                <th>Article</th>
                                <th>Montant</th>
                                <th>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => {
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
