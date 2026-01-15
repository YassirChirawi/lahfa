import React from 'react';
import { useOrders } from '../context/OrderContext';
import KPICard from '../components/KPICard';
import { DollarSign, ShoppingBag, TrendingUp, Users } from 'lucide-react';

const Dashboard = () => {
    const { orders } = useOrders();

    // Calculate Metrics
    // Revenue is only sum of "Livré" orders
    const totalRevenue = orders.reduce((sum, order) => sum + (order.status === 'Livré' ? order.amount : 0), 0);
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
                    title="Chiffre d'Affaires (Livré)"
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
                    title="Panier Moyen (Livré)"
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
                <h3 className="font-bold mb-4" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Commandes Récentes</h3>
                <div className="orders-table-container">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Article</th>
                                <th>Montant</th>
                                <th>Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.slice(0, 5).map(order => (
                                <tr key={order.id}>
                                    <td className="font-medium">{order.customer}</td>
                                    <td>{order.article}</td>
                                    <td>{order.amount ? order.amount.toFixed(2) : '0.00'} DH</td>
                                    <td>
                                        <span className={`status-badge`}>{order.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
